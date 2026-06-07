# Plan: Split player name into first/last

## Motivation

1. **Commentary variety** — a radio broadcast alternates between "Willie Mays", "Mays", and occasionally just the first name. Our commentary currently uses the full name every time, which sounds robotic.
2. **Lahman compatibility** — the Lahman database uses `nameFirst`, `nameLast`, and `nameGiven`. Matching that schema now avoids a merge step when issue #9 (stats-based cards) pulls from Lahman data.

## Design decisions

- **Field names**: `nameFirst` and `nameLast` (matches Lahman). Drop `name` entirely — a computed getter or helper provides the full name.
- **Full-name helper**: Add a `fullName(player)` utility rather than a getter (game state must be serializable, no class instances). Used by all UI/commentary code that needs the full string.
- **Commentary name usage**: Each commentary function gets the batter object directly, so it can choose first, last, or full name per template. The `nameOf` callback returns full names for runners (last-name-only would be confusing for runners since there's less context).
- **Disc rendering**: `disc.js` already splits `name` on spaces to wrap across two lines. With `nameFirst`/`nameLast` this becomes trivial — line 1 is first name, line 2 is last name.
- **`nameGiven`**: Include for fun / Lahman parity. The formal birth name (e.g. "George Herman" for Babe Ruth, "Lawrence Peter" for Yogi Berra). Not used in commentary yet but available for future flavor text or trivia.

## Changes by file

### data/players.json

Replace `"name": "Willie Mays"` with `"nameFirst": "Willie", "nameLast": "Mays"` for all 20 players.

### js/data/players.js

- **`validateDisc()`**: Replace `name` validation with `nameFirst` and `nameLast` checks (both non-empty strings).
- **`loadPlayers()`**: Update the warn fallback from `disc.name` to `disc.nameFirst`/`disc.nameLast`.
- **New export**: `fullName(player)` — returns `${player.nameFirst} ${player.nameLast}`.

### js/main.js

- Import `fullName` from `players.js`.
- **`playerNames` map** (line 142): Store `fullName(p)` instead of `p.name`.
- **Nameplate** (line 185): `layout.nameplate.nameEl.textContent = fullName(batter)`.
- **Intentional walk** (line 355): `fullName(batter)`.

### js/ui/commentary.js

- Import `fullName` from `../data/players.js`.
- **`commentBatterUp()`**: Mix full name and last name across templates:
  - `"${fullName(batter)} steps in."` / `"${batter.nameLast} digs in."` / etc.
- **`commentImmediate()`**: Use full name for big moments (HR, triple), last name for routine (K, walk).
- **`commentKoSetup()`**: No change (no player names).
- **`commentKoResult()`**: Mix full/last name. Use `batter.nameLast` for shorter lines like ground outs.
- **`commentStrategySetup()`**: Last name for bunt setup ("Carew squares to bunt...").
- **`commentStrategyResult()`**: Mix by context.

### js/ui/disc.js

- Import `fullName` from `../data/players.js`.
- Replace `String(disc.name).split(' ')` with `disc.nameFirst` / `disc.nameLast` directly (line 95-97). Cleaner two-line rendering.

### js/ui/lineup.js

- Import `fullName` from `../data/players.js`.
- Replace `player.name` with `fullName(player)` at lines 61, 86, 212.

### tests/unit/players.test.js

- Update test fixtures: replace `name` with `nameFirst`/`nameLast`.
- Add test for `fullName()`.
- Update validation tests for the new field names.

### tests/unit/commentary.test.js

- Update test batter fixtures: replace `{ id: 'p1', name: 'Mike Trout' }` with `{ id: 'p1', nameFirst: 'Mike', nameLast: 'Trout' }`.
- Add tests verifying last-name-only usage in some templates.

### tests/unit/state.test.js

- Update `makeLineup()` fixture to use `nameFirst`/`nameLast`.

### docs/plans/2026-06-07-commentary.md

- Update code examples to reflect new name fields.

## Implementation tasks

### Task 1: Add `fullName` helper and update validation (TDD)

**Files**: `js/data/players.js`, `tests/unit/players.test.js`

1. Write test: `fullName({ nameFirst: 'Willie', nameLast: 'Mays' })` returns `'Willie Mays'`
2. Write test: `validateDisc()` rejects missing `nameFirst` or `nameLast`
3. Write test: `validateDisc()` accepts disc with `nameFirst`/`nameLast` (no `name`)
4. Implement `fullName()` and update `validateDisc()`
5. Update warn fallback in `loadPlayers()`
6. Run tests green

### Task 2: Update player data

**Files**: `data/players.json`

1. Replace all 20 `"name"` entries with `"nameFirst"` / `"nameLast"`
2. Verify with `npm test` (player loading tests should pass)

### Task 3: Update UI consumers

**Files**: `js/main.js`, `js/ui/disc.js`, `js/ui/lineup.js`

1. Import `fullName` in each file
2. Replace all `player.name` / `batter.name` / `disc.name` references
3. Simplify disc.js two-line name rendering
4. Run tests green

### Task 4: Update commentary for name variety

**Files**: `js/ui/commentary.js`, `tests/unit/commentary.test.js`

1. Update test fixtures to use `nameFirst`/`nameLast`
2. Add tests: some templates use last name only, some use full name
3. Import `fullName`, update templates with a mix:
   - Full name for highlight moments (HR, triple, first mention)
   - Last name for routine plays (ground out, fly out, strikeout)
4. Run tests green

### Task 5: Update remaining test fixtures

**Files**: `tests/unit/state.test.js`, any other test files with player fixtures

1. Replace `name` with `nameFirst`/`nameLast` in all test fixtures
2. Run full test suite green
