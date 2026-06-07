# Plan: Stats-based roster generation pipeline

Closes #9.

## Design decisions

- **Data source**: Lahman database CSVs from `chadwickbureau/baseballdatabank` on GitHub
- **Download model**: Separate `npm run fetch-lahman` step downloads CSVs into `data/lahman/`. Generation reads local files. `.gitignore` the CSVs.
- **All-star roster**: Regenerate from real stats using each player's peak OPS season. Replaces current hand-authored data.
- **Team-year rosters**: Pre-generate one standout team per decade (8-10 rosters) plus the all-star roster.
- **AL pitchers post-1973**: Omit from roster entirely (no batting disc for DH-era AL pitchers).
- **App UI**: Mode selector on start screen — "All-Stars" vs "Classic Teams" — before draft.
- **Commit generated rosters**: The JSON output is committed so the app works without running the pipeline.

## Architecture

```
scripts/
  fetch-lahman.js          # downloads Lahman CSVs to data/lahman/
  generate-roster.js       # CLI: reads CSVs, outputs roster JSON
  lib/
    csv.js                 # minimal CSV parser (no deps)
    sectors.js             # rate-to-sector sizing algorithm
    qualify.js             # player qualification + position assignment
data/
  lahman/                  # downloaded CSVs (gitignored)
    Batting.csv
    People.csv
    Appearances.csv
    Pitching.csv
    Teams.csv
  rosters/                 # generated roster files (committed)
    all-stars.json          # peak OPS season for 20 classic players
    1927-NYA.json
    ...
  players.json             # replaced by all-stars.json (or kept as alias)
```

## Sector sizing algorithm

### Input stats per player-season

```
PA = AB + BB + HBP + SF + SH
1B = H - 2B - 3B - HR
```

### Outcome rates

```
hr_rate  = HR / PA
3b_rate  = 3B / PA
2b_rate  = 2B / PA
1b_rate  = 1B / PA
bb_rate  = (BB + HBP) / PA
so_rate  = SO / PA
out_rate = 1 - (hr_rate + 3b_rate + 2b_rate + 1b_rate + bb_rate + so_rate)
```

### Rate to degrees

Multiply each rate by 360. Apply a minimum floor of 2 degrees for any non-zero outcome. After flooring, re-normalize so the total is exactly 360.

### Singles split

Sector 7 gets 60% of single degrees, sector 13 gets 40%.

### GB/FB split for outs

Use GIDP rate as ground-ball proxy:

```
league_avg_gidp_rate = player's league-year average GIDP rate
gidp_factor = player_gidp_rate / league_avg_gidp_rate
adjusted_gb_pct = 0.43 * gidp_factor    # clamp to [0.30, 0.60]
fb_pct = 1.0 - adjusted_gb_pct
```

If GIDP data is missing (pre-1933), use flat 43/57 split.

Distribute GB degrees across sectors 2, 6, 12 (as evenly as possible).
Distribute FB degrees across sectors 3, 4, 8, 14 (as evenly as possible).

### Omitting zero-size sectors

If a player has zero triples (common for catchers/1B), sector 5 is omitted entirely from the sectors array. The disc rendering already handles missing sector numbers.

## Player qualification

### Position players
- Minimum 3.1 PA per team game (502 PA for 162-game season, prorated for shorter seasons)
- If fewer than 9 qualify, lower threshold until we have 9
- Position: most games at that position from Appearances.csv
- Map Lahman position codes to our position strings: `C` -> `catcher`, `1B` -> `first-base`, `SS` -> `shortstop`, `2B` -> `second-base`, `3B` -> `third-base`, `OF/LF/CF/RF` -> `outfield`, `P` -> `pitcher`

### Pitchers
- Minimum 1.0 IP per team game (162 IP for 162-game season, prorated)
- If fewer than 2 qualify, take top 2 by IP
- **AL post-1973**: Omit pitchers entirely (DH rule means no meaningful batting stats)
- **NL and pre-1973 AL**: Generate disc from their batting stats

## All-star roster generation

For the 20 current all-star players:

1. Look up each player in People.csv by name match (`nameFirst` + `nameLast`)
2. Find all their season batting lines in Batting.csv
3. For seasons with multiple stints (traded mid-season), aggregate stats across stints
4. Compute OPS for each season: `OBP + SLG` where:
   - `OBP = (H + BB + HBP) / (AB + BB + HBP + SF)`
   - `SLG = (1B + 2*2B + 3*3B + 4*HR) / AB`
5. Pick the season with the highest OPS (minimum 400 PA)
6. Generate sectors from that season's stats
7. Preserve existing `id`, `nameFirst`, `nameLast`, `nameGiven`, `team` fields
8. Add `year` and `stats` fields

## Pre-generated classic rosters

One standout team per decade:

| Decade | Team | Why |
|--------|------|-----|
| 1920s | 1927 NYA (Yankees) | "Murderers' Row" — Ruth, Gehrig |
| 1930s | 1934 SLN (Cardinals) | "Gas House Gang" — Medwick, Dean |
| 1940s | 1941 NYA (Yankees) | DiMaggio's 56-game streak |
| 1950s | 1955 BRO (Dodgers) | First WS title — Campanella, Snider |
| 1960s | 1961 NYA (Yankees) | Maris 61 HR, Mantle |
| 1970s | 1975 CIN (Reds) | "Big Red Machine" — Bench, Morgan, Rose |
| 1980s | 1986 NYN (Mets) | 108 wins — Strawberry, Gooden, Carter |
| 1990s | 1998 NYA (Yankees) | 114 wins — Jeter, Williams, Rivera |
| 2000s | 2001 SEA (Mariners) | 116 wins — Ichiro, Edgar, Boone |

## CLI interface

```bash
# Download Lahman data (one-time)
npm run fetch-lahman

# Generate a team-year roster
npm run generate-roster -- --team NYA --year 1927

# Generate the all-star roster
npm run generate-roster -- --all-stars

# Generate all pre-configured classic rosters
npm run generate-roster -- --classics

# List available teams for a year
npm run generate-roster -- --list-teams --year 1927
```

## App integration: mode selector

### Start screen changes

Current: `[Draft Teams]  [Quick Start]`

New:
```
[All-Stars]       — Draft from 20 all-time greats
[Classic Teams]   — Pick a team-year, draft from their roster
[Quick Start]     — Random all-star matchup
```

"Classic Teams" opens a roster picker screen showing available team-year rosters. User picks two teams (home and visitor), then enters the draft with those rosters.

### Roster picker screen

- Grid or list of available team-years, grouped by decade
- Each entry shows: year, team name, key players
- User picks home team, then visitor team
- Proceeds to draft screen with those two rosters

### Loading flow

1. App fetches `data/rosters/index.json` — a manifest listing all available rosters with metadata
2. User picks two teams
3. App fetches the two roster JSON files
4. Draft screen shows players from each roster
5. Each team drafts 9-10 players from their roster

### Roster index format

`data/rosters/index.json`:
```json
{
  "rosters": [
    { "id": "all-stars", "label": "All-Time All-Stars", "year": null, "team": null },
    { "id": "1927-NYA", "label": "1927 New York Yankees", "year": 1927, "team": "NYA" },
    ...
  ]
}
```

## Implementation tasks

### Phase 1: Data pipeline

#### Task 1: Lahman fetch script
**Files**: `scripts/fetch-lahman.js`, `package.json`, `.gitignore`

1. Write script that downloads 5 CSV files from `chadwickbureau/baseballdatabank` master branch
2. Save to `data/lahman/`
3. Add `data/lahman/` to `.gitignore`
4. Add `npm run fetch-lahman` to package.json scripts
5. Test: run it, verify files downloaded

#### Task 2: CSV parser
**Files**: `scripts/lib/csv.js`, `tests/unit/csv.test.js`

1. Write test: parse a simple CSV string with headers
2. Write test: handle quoted fields, commas in values
3. Implement minimal CSV parser (returns array of objects keyed by header)
4. Tests green

#### Task 3: Sector sizing algorithm (TDD)
**Files**: `scripts/lib/sectors.js`, `tests/unit/sectors.test.js`

1. Write test: basic rate-to-degrees conversion
2. Write test: minimum floor of 2 degrees applied
3. Write test: total always equals 360 after normalization
4. Write test: singles split 60/40 across sectors 7 and 13
5. Write test: GB/FB split with GIDP estimation
6. Write test: zero triples omits sector 5
7. Write test: GB/FB fallback when no GIDP data
8. Implement `computeSectors(stats, leagueAvgGidpRate)`
9. Tests green

#### Task 4: Player qualification logic (TDD)
**Files**: `scripts/lib/qualify.js`, `tests/unit/qualify.test.js`

1. Write test: position player qualification by PA threshold
2. Write test: pitcher qualification by IP threshold
3. Write test: AL pitchers post-1973 omitted
4. Write test: position assignment from Appearances data
5. Write test: fallback when fewer than 9 qualify
6. Implement qualification functions
7. Tests green

#### Task 5: Roster generation CLI
**Files**: `scripts/generate-roster.js`, `package.json`

1. Wire together: read CSVs, qualify players, compute sectors, write JSON
2. Support `--team`/`--year`, `--all-stars`, `--classics`, `--list-teams` flags
3. Add `npm run generate-roster` to package.json scripts
4. Test: generate 1927-NYA roster, spot-check Babe Ruth's sectors against known stats

#### Task 6: Generate and commit rosters
**Files**: `data/rosters/*.json`, `data/rosters/index.json`

1. Run `npm run fetch-lahman`
2. Run `npm run generate-roster -- --all-stars`
3. Run `npm run generate-roster -- --classics`
4. Generate `index.json` manifest
5. Spot-check several rosters for sanity
6. Commit generated files

### Phase 2: App integration

#### Task 7: Roster loading
**Files**: `js/data/rosters.js`, `tests/unit/rosters.test.js`

1. Write test: `loadRosterIndex()` fetches and parses index.json
2. Write test: `loadRoster(id)` fetches a roster JSON file
3. Implement both functions
4. Tests green

#### Task 8: Mode selector UI
**Files**: `js/main.js`, `js/ui/roster-picker.js`, `css/styles.css`

1. Add mode selector to start screen: All-Stars, Classic Teams, Quick Start
2. "All-Stars" flows to existing draft (loads all-stars.json)
3. "Classic Teams" opens roster picker
4. "Quick Start" loads all-stars.json with random teams

#### Task 9: Roster picker UI
**Files**: `js/ui/roster-picker.js`, `css/styles.css`

1. Fetch roster index
2. Display available rosters grouped by decade
3. User picks home team, then visitor team
4. Proceed to draft with selected rosters

#### Task 10: Wire roster into draft and game
**Files**: `js/main.js`, `js/ui/lineup.js`

1. Draft screen receives roster players instead of the flat all-star pool
2. Each side drafts from their own roster
3. Game starts with drafted lineups as before
4. Update `nameOf` map to include all players from both rosters

### Phase 3: Polish

#### Task 11: Replace players.json
1. Point default all-star mode at `data/rosters/all-stars.json`
2. Remove or archive `data/players.json`
3. Verify all tests still pass

#### Task 12: Play-test and verify
1. Play full games with generated rosters
2. Verify sector sizes produce realistic game outcomes
3. Check that commentary works with new player data
4. Verify disc rendering looks right with real sector distributions
