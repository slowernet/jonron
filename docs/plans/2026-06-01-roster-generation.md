# Implementation plan: Roster generation from historical stats

## Overview

Generate player disc data from real baseball statistics so users can play as any qualified team-season (e.g., "1990 Detroit Tigers"). Replaces the current hand-authored approximations in `data/players.json`.

## User flow

1. User runs CLI: `npm run generate-roster -- --team DET --year 1990`
2. Script reads Lahman CSV data, computes disc sectors for all qualified players
3. Outputs a roster JSON file to `data/rosters/1990-DET.json`
4. In-app, user picks from available team-year rosters
5. Each team-year roster has all qualified players (not a fixed 10)
6. User builds their lineup from the full roster (draft or manual selection)

The current "all-star draft from 20 players" mode remains as a separate option.

## Data source

Lahman database CSV files from `github.com/chadwickbureau/baseballdatabank`. Key files:

- `Batting.csv` — season batting lines (H, 2B, 3B, HR, BB, SO, AB, PA, GIDP, SF, SH)
- `People.csv` — player names, biographical info
- `Appearances.csv` — games played by position (for position assignment)
- `Pitching.csv` — innings pitched (for pitcher qualification)
- `Teams.csv` — team names/IDs by year

Store a trimmed snapshot in `data/lahman/` (only columns we need). Full Batting.csv is ~3MB, manageable.

## Qualification criteria

### Position players
- Minimum 3.1 PA per team game (502 PA for 162-game season, prorated for shorter seasons)
- If fewer than 9 qualify, lower threshold until we have enough for a lineup
- Position assigned by most games played at that position (from Appearances.csv)

### Pitchers
- Minimum 1.0 IP per team game (162 IP for 162-game season, prorated)
- If fewer than 2 qualify, take top 2 by IP
- Use batting stats from that season for their disc (will be bad, that's the point)
- **Open question**: AL pitchers post-DH (1973+) have near-zero PA. Options:
  - Generate a generic "weak hitter" disc for pitchers with < 30 PA
  - Use a fixed pitcher disc template
  - Omit pitchers from AL rosters entirely
  - Revisit when/if we model pitching mechanics

## Disc sector algorithm

### Sector mapping

| Sector | Outcome | Source stat |
|--------|---------|-------------|
| 1 | Home run | HR |
| 5 | Triple | 3B |
| 7 | Single (A) | 1B (split across 7 and 13) |
| 9 | Walk | BB + HBP |
| 10 | Strikeout | SO |
| 11 | Double | 2B |
| 13 | Single (B) | 1B (remainder) |
| 2, 6, 12 | Ground-ball out | estimated |
| 3, 4, 8, 14 | Fly-ball out | estimated |

### Sizing algorithm

Total disc = 360 degrees. Each sector size is proportional to the rate of that outcome per plate appearance.

```
PA = AB + BB + HBP + SF + SH
1B = H - 2B - 3B - HR

hr_rate  = HR / PA
3b_rate  = 3B / PA
2b_rate  = 2B / PA
1b_rate  = 1B / PA
bb_rate  = (BB + HBP) / PA
so_rate  = SO / PA
out_rate = 1 - (hr_rate + 3b_rate + 2b_rate + 1b_rate + bb_rate + so_rate)
```

Convert rates to degrees (multiply by 360). Apply minimum sector size of 2 degrees for any non-zero outcome.

### Splitting singles across sectors 7 and 13

Original Cadaco discs split singles into two sectors on opposite sides of the disc. Split proportionally: sector 7 gets 60%, sector 13 gets 40% (approximating original disc layouts).

### Splitting outs into GB and FB

This is the hardest part. Three tiers of data quality:

**Tier 1 — 2002+ (BIS batted ball data available)**
If we integrate FanGraphs data (future enhancement), use actual GB% and FB%.

**Tier 2 — any era (GIDP-based estimation)**
Use GIDP rate as a ground-ball proxy:

```
league_avg_gb_rate = 0.43
gidp_factor = player_gidp_rate / league_avg_gidp_rate
adjusted_gb_rate = league_avg_gb_rate * gidp_factor
```

Clamp to [0.30, 0.60] to avoid extreme values. Remaining outs are fly balls.

**Tier 3 — fallback**
If GIDP data is missing (very early eras), use a flat 43/57 GB/FB split.

### Distributing out sectors

Ground-ball degrees split across sectors 2, 6, 12 (3 sectors):
- Distribute roughly evenly: `gb_total / 3` each, +-1 for rounding

Fly-ball degrees split across sectors 3, 4, 8, 14 (4 sectors):
- Distribute roughly evenly: `fb_total / 4` each, +-1 for rounding

### Sector ordering on disc

Cadaco discs interleave hit and out sectors around the disc. Follow the canonical sector number order: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14. The rendering code already handles this layout.

## Output format

`data/rosters/1990-DET.json`:

```json
{
  "team": "DET",
  "teamName": "Detroit Tigers",
  "year": 1990,
  "league": "AL",
  "players": [
    {
      "id": "trammell-alan-1990",
      "name": "Alan Trammell",
      "position": "shortstop",
      "team": "Tigers",
      "year": 1990,
      "stats": {
        "PA": 559, "AB": 449, "H": 170, "2B": 37,
        "3B": 1, "HR": 14, "BB": 68, "SO": 55,
        "HBP": 2, "GIDP": 12
      },
      "sectors": [
        { "number": 1, "size": 9 },
        { "number": 2, "size": 28 },
        ...
      ]
    }
  ]
}
```

Include raw `stats` for display/verification. The `sectors` array is what the game engine uses.

## File structure

```
data/
  lahman/                    # trimmed Lahman CSV snapshots
    Batting.csv
    People.csv
    Appearances.csv
    Pitching.csv
    Teams.csv
  rosters/                   # generated roster files
    1990-DET.json
    1927-NYA.json
    ...
  players.json               # legacy all-star roster (keep for now)
scripts/
  generate-roster.js         # Node.js CLI script
```

## Implementation tasks

### Phase 1: Data pipeline (CLI generation)

1. **Add Lahman data** — download and trim CSV files to needed columns, store in `data/lahman/`
2. **CSV parser** — simple Node.js CSV reader (no dependencies, or use a lightweight one)
3. **Player qualification** — filter by PA/IP thresholds, assign positions from Appearances.csv
4. **Sector sizing** — implement the rate-to-degrees algorithm with GB/FB estimation
5. **JSON output** — write roster files to `data/rosters/`
6. **CLI interface** — `npm run generate-roster -- --team DET --year 1990`
7. **Validation** — sector sizes sum to 360, all required sectors present, sanity checks
8. **Tests** — unit tests for sector sizing algorithm, edge cases (low PA, zero triples, etc.)

### Phase 2: App integration

9. **Roster picker UI** — screen to browse/select team-year rosters
10. **Flexible lineup builder** — select N players from a full roster instead of fixed 10v10 draft
11. **Roster loading** — fetch roster JSON, validate format, feed into game
12. **Backwards compatibility** — keep legacy all-star mode working alongside team-year mode

### Phase 3: Polish

13. **Pre-generate classic rosters** — batch generate notable team-years (1927 Yankees, 1975 Reds, etc.)
14. **Player card display** — show stats alongside disc visualization
15. **Pitcher handling** — decide on AL pitcher disc approach based on playtesting

## Open questions

- **AL pitchers post-1973**: generate from their (tiny) batting stats, use a template, or skip?
- **Lineup size**: stick with 10 (current), or allow 9 (no DH) vs 10 (DH) based on league/era?
- **Platoon players**: some players split time. Include all who qualify, even if same position?
- **Multi-position players**: assign primary position only, or allow flexibility?
- **Pinch hitters/bench**: include sub-qualifying players as bench options?
