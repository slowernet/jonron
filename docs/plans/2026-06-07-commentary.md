# Plan: Improve play-by-play commentary

Closes #8 and #10.

## Design decisions

- **Tone**: Radio broadcast — conversational, vivid, varied phrasing
- **Player names**: Full names for batters and baserunners everywhere
- **Anti-repeat**: Weighted decay — recently used templates are less likely
- **Architecture**: New `js/ui/commentary.js` module that owns all text generation

## Current narration touch points in main.js

| Location | Text | Problem |
|----------|------|---------|
| `afterResult` (x2) | `"${name} steps in."` | Only one batter-up phrase |
| `narrateResult` | `"Jonrón! ${name} circles the bases."` | Single HR template |
| `narrateResult` | `"${name} slides into third."` | Single triple template |
| `narrateResult` | `"${name} pulls into second."` | Single double template |
| `narrateResult` | `"${name} takes first."` | Single walk template |
| `narrateResult` | `"${name} goes down swinging."` | Single K template |
| `narrateResult` | `"N runs score."` appended | Mechanical runs text |
| `handleSpin` | `"${label}..."` then `"${label}... ${desc}"` | K-O uses static description from rules.js (#10) |
| `handleSpin` | `hasRunners ? desc : desc.replace(...)` | Hacky trim of irrelevant runner text |
| `handleStrategy` | `"Strategy in motion..."` | Generic lead-in for all strategies |
| `handleStrategy` | `result.description` | Static strings from rules.js |
| `handleIntentionalWalk` | `"Intentional walk to ${name}."` | Fine as-is |
| `afterResult` | `"Three away. Middle/End of the N."` | Fine as-is |
| `startGame` | `"Play ball!"` | Fine as-is |

## Architecture

### New file: `js/ui/commentary.js`

Exports:
- `commentBatterUp(batter)` — returns text for next batter
- `commentImmediate(type, result, batter)` — returns text for HR/3B/2B/BB/K
- `commentKoSetup(type)` — returns suspense text ("Fly ball...")
- `commentKoResult(type, outcome, batter, bases, nameOf)` — returns complete standalone narration line (replaces setup line entirely via `replace: true`)
- `commentStrategySetup(playType, batter, bases, nameOf)` — returns play-specific lead-in
- `commentStrategyResult(result, batter, bases, nameOf)` — returns strategy outcome text (describes outcome only, not the action — setup already covered that)

`bases` is always the **pre-play** base state, used to resolve runner names via `nameOf(bases.first)` etc. The outcome objects from `resolveKoDial`/`resolveStrategy` have `from`/`to` base numbers but no player IDs.

All functions return `{ text, highlight }` so the caller just does `narrate(el, c.text, { highlight: c.highlight })`.

**Note**: Singles are exclusively K-O narrated — no single templates in `commentImmediate()`. Singles always go through the K-O dial per Cadaco rules.

### Weighted decay picker

```js
// Tracks usage counts per template category.
// Each pick: score = 1 / (1 + timesUsedRecently). Pick weighted random.
// Reset counts when they all reach threshold (e.g., 3).
function pick(category, templates, context) { ... }
```

Lives inside commentary.js as a private function. The `category` string (e.g., `'batter-up'`, `'home-run'`) keys a Map of recent usage counts.

### Runner name resolution

K-O and strategy outcomes reference runners by base position. The `bases` object has player IDs. We need a name lookup. Two options:

- **Option A**: Pass a `getPlayerName(id)` callback to commentary functions
- **Option B**: Pass the full bases-with-names object: `{ first: { id, name }, second: ... }`

Going with **Option A** — simpler signature, and main.js already has both lineups to build the lookup.

In main.js, build once at game start:
```js
const playerNames = new Map()
for (const p of [...homeLineup, ...visitorLineup]) playerNames.set(p.id, p.name)
const nameOf = (id) => playerNames.get(id) ?? 'the runner'
```

Pass `nameOf` to commentary functions that need runner names. Inside commentary functions, resolve runner names from the pre-play `bases` object: `nameOf(bases.first)`, `nameOf(bases.second)`, `nameOf(bases.third)`. The outcome objects only have base numbers (`from`/`to`), not player IDs.

## Template pools

### Batter up (4 variants)
```
"${name} steps in."
"${name} digs in."
"${name} steps to the plate."
"${name} comes up to bat."
```

### Home run (4 variants, all highlight: true)
```
"Jonrón! ${name} goes deep.${runs}"
"${name} sends it out! Home run!${runs}"
"${name} launches one! Jonrón!${runs}"
"Gone! ${name} goes yard!${runs}"
```

Grand slam special (when runsScored >= 4):
```
"Grand slam! ${name} clears the bases!"
```

### Triple (3 variants, highlight: true)
```
"Triple! ${name} slides into third.${runs}"
"${name} legs out a triple!${runs}"
"${name} rips one into the gap! Triple!${runs}"
```

### Double (3 variants, highlight: true)
```
"Double! ${name} pulls into second.${runs}"
"${name} lines one into the gap! Double!${runs}"
"${name} drives one to the wall! Double!${runs}"
```

### Single (exclusively K-O narrated — no templates here)

### Walk (3 variants)
```
"${name} draws a walk.${runs}"
"Ball four. ${name} takes first.${runs}"
"${name} works a walk.${runs}"
```

### Strikeout (4 variants)
```
"${name} goes down swinging."
"Struck him out."
"${name} strikes out looking."
"${name} whiffs. Strike three."
```

### Runs scored text
Instead of mechanical `"N runs score."`, generate from the events:

- 1 run: `" ${runnerName} scores."` or `" ${runnerName} comes home to score."`
- 2 runs: `" ${name1} and ${name2} score."`
- 3+ runs: `" ${name1}, ${name2}, and ${name3} all score."`
- Batter scores (HR): don't list batter separately — the HR template covers it

### Inning break
Keep current `"Three away. Middle/End of the Nth."` — it works well.

## Dynamic K-O narration (fixes #10)

Instead of displaying `result.description` (the static string from rules.js), generate text from the resolved outcome data. The outcome object has:

```js
{
  batter: { base, out },
  outs,
  runners: [{ from, to, out, scored }],
  runsScored,
  isHit, isError
}
```

### Generation logic

Build the narration in two parts: **batter outcome** + **runner outcomes**.

**Batter part** (merged with K-O setup line via `replace: true`):

| Condition | Example templates |
|-----------|-------------------|
| Single, safe at 1B | `"${name} lines a single."` / `"${name} singles to left."` |
| Single, safe at 2B | `"${name} singles, stretches to second."` |
| Single, batter out | `"${name} singles but is thrown out trying to stretch."` |
| Fly ball, batter out | `"${name} flies out to center."` / `"${name} lifts a fly ball."` |
| Fly ball, safe (error) | `"${name} reaches on an error."` / `"Dropped! ${name} reaches on the error."` |
| Ground ball, batter out | `"${name} grounds out."` / `"${name} grounds to short."` |
| Ground ball, safe (error) | `"${name} reaches on an error."` |
| Ground ball, DP (2+ outs) | `"${name} grounds into a double play."` |

**Runner part** (appended):

| Condition | Example |
|-----------|---------|
| Runner scores | `"${runnerName} scores from ${base}."` / `"${runnerName} comes home."` |
| Runner out (lead runner DP) | `"${runnerName} is doubled off."` / `"${runnerName} thrown out."` |
| Runner advances | `"${runnerName} moves to ${dest}."` (only mention when noteworthy) |
| Runners hold | Omit — not interesting enough to narrate |

Combine batter + runner parts into one line. Don't over-narrate routine runner movements (e.g., forced advance on groundout). Focus on: scoring, outs, and errors.

### Base name helper

```js
const BASE_NAMES = { 1: 'first', 2: 'second', 3: 'third' }
```

## Strategy narration

### Setup text (replaces "Strategy in motion...")

| Play type | Templates |
|-----------|-----------|
| `steal-1b` | `"${runner} takes off for second..."` |
| `steal-2b` | `"${runner} breaks for third..."` |
| `double-steal-1b-3b` | `"Double steal! The runners are going..."` |
| `double-steal-1b-2b` | `"Double steal! The runners are moving..."` |
| `hit-and-run` | `"The hit and run is on..."` |
| `squeeze` | `"Squeeze play!"` |
| `sac-bunt-1b` | `"${batter} squares to bunt..."` |
| `sac-bunt-2b` | `"${batter} squares to bunt..."` |

### Result text (replaces `result.description`)

Generate dynamically from the result object, same approach as K-O narration. The result has `batter.result`, `runners[]`, `runsScored`.

**Important**: Result text describes the *outcome*, not the action. The setup already covered what's happening — the result tells the audience how it turned out. Avoid re-stating the play type.

Examples:

- Steal safe: `"Safe! He beats the throw."` (not "Henderson steals second" — setup already said he took off)
- Steal caught: `"Out! Caught stealing."` / `"They nab him at second."`
- Sac bunt runner advances: `"${runner} moves to third."` / `"${runner} advances."`
- Hit and run single: `"${batter} lines a single! ${runner} motors to third."`
- Squeeze scores: `"${runner} scores! Safe at the plate."`
- Batter grounds out, runners advance: `"${batter} grounds out. ${runner} advances to second."`
- DP: `"Double play! ${runner} is caught off the bag."`

## Implementation tasks

### Task 1: Create commentary module with picker and batter-up (TDD)

**Files**: `js/ui/commentary.js`, `tests/unit/commentary.test.js`

1. Write test: `pick()` never returns same template twice in a row (with decay)
2. Write test: `commentBatterUp()` returns text containing the batter name
3. Write test: `commentBatterUp()` returns different results over multiple calls
4. Implement `pick()` with weighted decay
5. Implement `commentBatterUp(batter)` with template pool
6. Run tests green

### Task 2: Immediate result commentary (TDD)

**Files**: `js/ui/commentary.js`, `tests/unit/commentary.test.js`

1. Write tests for `commentImmediate()`:
   - HR returns text with highlight true, mentions batter name
   - Grand slam (4 runs) uses special template
   - Triple/double/single return text with highlight true
   - Walk returns text without highlight
   - Strikeout returns text without highlight
   - Runs scored text includes runner names when nameOf is provided
2. Implement `commentImmediate(type, result, batter, nameOf)`
3. Run tests green

### Task 3: Dynamic K-O narration (TDD, fixes #10)

**Files**: `js/ui/commentary.js`, `tests/unit/commentary.test.js`

1. Write tests for `commentKoSetup()` and `commentKoResult()`:
   - Setup returns suspense text matching result type
   - Result generates dynamic text from outcome, not static description
   - Runner names appear when present
   - DP outcomes mention double play
   - Error outcomes mention error
   - Empty bases produce clean output (no phantom runner text)
2. Implement both functions
3. Run tests green

### Task 4: Strategy narration (TDD)

**Files**: `js/ui/commentary.js`, `tests/unit/commentary.test.js`

1. Write tests for `commentStrategySetup()` and `commentStrategyResult()`:
   - Setup uses play-specific text (steal, bunt, hit-and-run, squeeze)
   - Setup includes runner/batter names
   - Result generates dynamic text from outcome
   - Scoring plays highlight correctly
2. Implement both functions
3. Run tests green

### Task 5: Wire commentary into main.js

**Files**: `js/main.js`

1. Import commentary module
2. Build `nameOf` lookup from lineups
3. Replace `narrateResult()` calls with `commentImmediate()`
4. Replace K-O narration block with `commentKoSetup()` / `commentKoResult()`
5. Replace strategy narration with `commentStrategySetup()` / `commentStrategyResult()`
6. Replace batter-up lines with `commentBatterUp()`
7. Remove `narrateResult()`, `RESULT_LABELS`, dead narration code
8. Manual play-test to verify feel

### Task 6: Review and polish

Play 2-3 full games and check for:

1. **Phantom runners** (#10): K-O and strategy text should never mention bases that are empty
2. **Awkward concatenation**: Runs-scored suffix reads naturally after every template variant
3. **Setup/result redundancy**: Strategy result text doesn't re-state what the setup said
4. **Repeat phrases**: Same template shouldn't appear twice in a single half-inning
5. **Grammatical issues**: Plural/singular agreement in runs-scored text, name possessives
6. **Highlight flags**: Hits and big plays highlighted, routine outs not
7. **Edge cases**: Grand slam, bases-loaded walk, DP with no runners, error with empty bases
