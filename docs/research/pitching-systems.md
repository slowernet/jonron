# Pitching in Cadaco All-Star Baseball — Complete Scheme Reference
### Compiled & verified from the CadacoAllStarBaseball groups.io archive (files + message threads)

---

## 1. The Core Problem

All-Star Baseball (Ethan Allen, 1941) resolves each plate appearance with a **single spin of the batter's disc** — wedge sizes drawn from the player's real stats — and models **batting only** (no pitching, fielding, or baserunning). Batting discs implicitly assume **league-average pitching**, so individual batting lines self-correct over a full season.

The community's enduring design question: let an individual pitcher matter **without** discarding the beloved Cadaco batting discs or sliding into the "Strat-O-Matic trap" (a pitcher card dominating ~50% of outcomes). Every system below is a different answer. Guiding ethos (Gene Newman): ASB's beauty is its simplicity, which invites modification to taste.

## 2. Two Broad Families

- **Rating systems** — pitcher reduced to a *grade* that reinterprets the batter's existing spin via a chart. No second spin. Fast; preserves disc compatibility; but every pitcher of a given grade behaves identically.
- **Disc / modifier systems** — pitcher gets his *own* spinner (or die), interacting with the batter spin. Restores individuality; costs an extra step and risks re-spins.

---

## 3. Rating Systems

### 3a. John Rose 7-Level System + Thompson Batting Key
*(Files: `RATINGS ON THE JOHN ROSE DISCS.doc`, `Thompson Batting Key.doc`, `Thompson Batting Key 2006.doc`)*

Pitchers graded **1 (best) → 7 (worst)**. The **Thompson Batting Key** is a master chart that re-maps all 14 batter-disc numbers by the pitcher's grade. The pitcher's rating lives in a **center rectangle** on his disc:
- **Left half:** the single rating number (1–7) used with the Key.
- **Right half, upper — "G#":** start frequency (e.g. **G5** = can start every 5th game).
- **Right half, lower — "E#":** effective innings (e.g. **E6** = sharp for 6 innings, after which the rating **drops to 7**, the worst).
- **Bottom row — P-x / F-x / B-x:** P = throws L or R, F = fielding ability, B = bats from which side.

Strength: trivially fast. Weakness: deterministic (a "14 fly out" is *always* a DP vs a grade-1 pitcher).

### 3b. Condensed 3-Level System
*(File: `3-level pitcher ratings.doc` — full results chart verified)*

A slimmed Rose variant with three grades. Verified examples of the same spin yielding different results by grade:
- **HR spin:** #1 → Double Play (lead runner out) · #2 → Double Play (runner out at second) · #3 → Ground Out (runners advance 1, runner on 1st out).
- **Error spin:** scales from batter-safe-with-runners-advancing toward more limited advancement as grade worsens.
- **Fly out / pop out, triple, ground out, single:** each remapped per grade, generally converting good outcomes into outs/DPs for grade-1 and granting more advancement for grade-3.

### 3c. TAL "P-Z Disc" Variant
TransAmerica League: pitchers graded **1–5**, triggering only on the **9 and 3 spins**, resolved by a re-spin on a dedicated **P-Z Disc** chart. Minimal disruption — most plate appearances need no extra step.

### 3d. Kilbride "Perfect Pitchers Disc"
*(File: `Perfect pitchers disc.doc` — methodology verified)*

Larry Kilbride graded pitchers **1–7** (4 = average, disc unused). High grades convert **singles/walks → outs**; low grades convert **outs → singles**; **extra-base hits never affected**. Notably empirical: Kilbride documents studying **91,000+ MLB games (1900–1976)** and ~2,000 test games / ~35,000 simulated innings to calibrate it. Drawback: ignoring XBH/DP tendencies under-differentiates pitchers.

---

## 4. Disc / Modifier Systems

### 4a. Nick Panos System (1975, copyrighted) — suppression arcs
*(Folders: `Discs by Nick Panos`, yearly All-Star sets; `Simplified Method...doc`)*

Widely held as the **most statistically accurate**. Defining feature: **compatibility** — Panos pitcher discs spin *alongside unmodified Cadaco batting discs*. Built by comparing a pitcher's season stats to league average.

Notation: **lettered codes**, with a **line above a code (overbar / "Not-")** meaning that outcome is **suppressed**. Verified-in-play symbols: **Not-HR** (homer nullified → out/downgrade), **Not-W** (walk → out), **K** (auto strikeout), **H** (forces a re-spin), plus **F/G** out results and wild pitch. Strong/weak pitchers get overlapping arcs, so one arc may carry two labels (e.g. `Not-W Not-HR`).

Resolution (from Panos's own game narratives): spin pitcher + batter; a suppression arc cancels **only its own outcome class** so batting average isn't distorted elsewhere. The **H zone is double-edged** — a forced re-spin can turn a batter's walk into an out *or* an out into a hit. Drawback: historically **limited availability** (full sets mainly for teams/seasons Panos made personally).

### 4b. Newman / "Three True Outcomes" normalized discs
*(Files: `Pitching disc discmaker.xls`, `pitching disc instructions.doc`)*

Building on McCracken's TTO and Brock Hanke's ~1980 method: a pitcher disc from the three things a pitcher truly controls — **HR, BB, SO** — each a margin that can *raise or lower* the batter's rate (color/notation-coded). Spin the pitcher disc only when relevant. Hard **75% / 270° cap** so even Walter Johnson can't make a batter never put the ball in play. Later version uses **2-ring, 8-sector** discs (outer letters F/G/K/W/BS/sK/S). Trade-off Panos flagged: normalizing pitchers *forces* re-normalizing batting discs — breaking Cadaco compatibility. Sample BB formula: `(BB/BF − LgBB/LgBF) × 216`, negatives → 0.

### 4c. Interaction-Matrix refinement (Young / Weiser)
The key idea that **eliminates re-spins**: pre-agree a full **(pitcher-spin × batter-spin) matrix**. Convention: Not-HR cancels *only* homers; Not-hit cancels *only* singles/doubles/triples (never homers). Simpler math than Panos, near-identical results — but never universally adopted (a coordination problem, not a math one).

### 4d. Commercial / cross-over systems
- **Nine Inning Classic** (Dave Volk) — standalone dice game; pitchers **A–E** (C avg) + PK/MK strikeout flags, graded largely from ERA; **Fred McShea** extended it (HR/SO/BB adjustments). Dice, not spinners.
- **Avalon Hill Superstar Baseball** (Tom Neff, mid-1970s) — "funky" 1–39 dice, pitcher-first resolution, includes **team defense** (some rolls = automatic outs by fielder quality). Often cited best non-Panos option for arbitrary teams.

---

## 5. Disc-Generation Math (verified from spreadsheets)

**Batter discmaker — Chris Rohan (`ASBB-Disc-Creator-103110.xls`):** PA = AB+BB; outcomes as fractions of PA (2B/PA, 3B/PA, HR/PA, BB/PA, SO/PA; singles = (H−2B−3B−HR)/PA; in-play outs = (AB−H−SO)/PA), summing to a "Should = 1" checksum. SETUP rules: SO → 3 slices if SO%>0.10 / 2 if >0.045; BB → 2 slices if >0.07; error wedge ≈4.5% from league fielding avg 0.955; ground-out split 33.3/33.3/33.4% across wedges #2/#6/#12; GB/FB clamped 50–75%.

**Pitcher discmaker — Gene Newman (`Pitching disc discmaker.xls`):** inputs BF/H/HR/BB/SO; HR/BF, BB/BF (above ~0.09), SO/BF with same thresholds; non-HR hits split in thirds, outs split /7; "Batter (GO/1B/2B/3B)" wedges defer to the batter disc.

**Panos's exact suppression-arc sizing formulas remain unpublished** — we have his discs and the overbar legend, not his per-arc recipe.

---

## 6. Strategy & Realism Layers Beyond Raw Outcomes

- **Endurance / fatigue:** Rose's **E#** effective-innings cliff (disc degrades to grade 7); house rules dropping a grade after X innings or X earned runs; a literal spin-able **fatigue disc** (TIRED result).
- **Rest factor (cross-game):** Panos tracks a numeric **rest factor** per reliever (e.g. a closer at 1.32 who'd exceed 2.0 — and become unavailable next game — if used today), forcing genuine bullpen husbandry across a series.
- **Pitch count:** desired but rejected — not present in historical box scores.
- **Handedness / platoon:** light **line-rule** (same-handed matchup → pitcher wins ties / picks better adjacent result on a line) and/or **dedicated L/R batter discs** (2-ring split discs). Platoon differential ≈ **10%** of a batter's offense. *This is what prevents riding one ace all game* — an opposite-handed reliever flips the advantage.
- **Baserunning / steals:** **`Stolen base disc explained.doc`** (Gene Newman) — a 5%-increment disc; spin lands ≤ player's success% = safe, else caught. Speed rated by SB/162 (~36 = top) and success% (~80% = top). Crucially, **Panos pitcher discs carry R/J steal-hold ratings** — a holder like `R−3 J−1` suppresses a fast runner; a poor holder `R+2` boosts him — so stealing is only viable against certain pitchers/relievers.
- **Defense / fielding:** position split into **fielding% + range** vs era-normalized league average; catchers add caught-stealing%. Good defense converts hits / starts DPs. Modeled in some house systems, ignored on hits in others. Auxiliary **hit-robber discs** exist (`ROBBER-50%.xls`, `ROBBER-91%.xls`).
- **Ballpark factor:** debated (Kluszewski/Crosley Field example) but the prevailing recommendation is **not to model it** — park and roster changes are too entangled to separate cleanly.
- **Weather/wind/rain:** **not modeled anywhere** in the community.
- **Extra-inning / quick-play:** **`Sudden death disc explained.doc`** — a 10-wedge disc randomly picks the 10th-inning leadoff hitter *after* lineups are set, removing slugger-stacking bias.
- **Flavor:** **`Rare Plays.doc`** — 162 freak plays from Retrosheet, used for optional color, not a core mechanic.

---

## 7. Known Gaps & Open Questions
- Panos's exact per-arc suppression formulas: **unpublished**.
- The full pitcher×batter **interaction matrix**: proposed, never universally agreed.
- R/J steal-hold and defensive ratings → precise probabilities: **house-specific**, not standardized.
- **"Star Power"** does **not** exist as a pitching system in the archive (only a later hashtag); **Nine Inning Classic** is real (above).

---

## 8. Sources

**Message threads**
- System survey: [#2825](https://groups.io/g/CadacoAllStarBaseball/message/2825) · Panos reply [#2833](https://groups.io/g/CadacoAllStarBaseball/message/2833) · Newman [#2830](https://groups.io/g/CadacoAllStarBaseball/message/2830)
- Panos design rationale + TTO: [#6953](https://groups.io/g/CadacoAllStarBaseball/message/6953)
- Two-spin tradeoffs: [#9410](https://groups.io/g/CadacoAllStarBaseball/message/9410)
- Rose ratings / fatigue: [#2783](https://groups.io/g/CadacoAllStarBaseball/message/2783) · pitch count [#6457](https://groups.io/g/CadacoAllStarBaseball/message/6457)
- Lefty/righty: [#9495](https://groups.io/g/CadacoAllStarBaseball/message/9495), [#9671](https://groups.io/g/CadacoAllStarBaseball/message/9671) · platoon value [#450](https://groups.io/g/CadacoAllStarBaseball/message/450)
- Steals / defense: [#3821](https://groups.io/g/CadacoAllStarBaseball/message/3821)
- Panos game narrative (R/J, rest factor, Not-HR/Not-W, H-zone): [#6100](https://groups.io/g/CadacoAllStarBaseball/message/6100)
- Ballpark factor: [#7391](https://groups.io/g/CadacoAllStarBaseball/message/7391), [#7397](https://groups.io/g/CadacoAllStarBaseball/message/7397)

**Files**
- [RATINGS ON THE JOHN ROSE DISCS.doc](https://groups.io/g/CadacoAllStarBaseball/files/RATINGS%20ON%20THE%20JOHN%20ROSE%20DISCS.doc) · [3-level pitcher ratings.doc](https://groups.io/g/CadacoAllStarBaseball/files/3-level%20pitcher%20ratings.doc) · [3-WEDGE RESULTS CHART.doc](https://groups.io/g/CadacoAllStarBaseball/files/3-WEDGE%20RESULTS%20CHART.doc)
- [Perfect pitchers disc.doc (Kilbride)](https://groups.io/g/CadacoAllStarBaseball/files/Perfect%20pitchers%20disc.doc)
- [Pitching disc discmaker.xls](https://groups.io/g/CadacoAllStarBaseball/files/Pitching%20disc%20discmaker.xls) · [pitching disc instructions.doc](https://groups.io/g/CadacoAllStarBaseball/files/pitching%20disc%20instructions.doc)
- [ASBB-Disc-Creator-103110.xls](https://groups.io/g/CadacoAllStarBaseball/files/ASBB-Disc-Creator-103110.xls) · [2-ring discmaker.xls](https://groups.io/g/CadacoAllStarBaseball/files/2-ring%20discmaker.xls)
- [Simplified Method For Making Cadaco Style Batting Discs.doc](https://groups.io/g/CadacoAllStarBaseball/files/Simplified%20Method%20For%20Making%20Cadaco%20Style%20Batting%20Discs.doc)
- [Stolen base disc explained.doc](https://groups.io/g/CadacoAllStarBaseball/files/Stolen%20base%20disc%20explained.doc) · [Sudden death disc explained.doc](https://groups.io/g/CadacoAllStarBaseball/files/Sudden%20death%20disc%20explained.doc)
- [ROBBER-50%.xls](https://groups.io/g/CadacoAllStarBaseball/files/ROBBER-50%25.xls) · [ROBBER-91%.xls](https://groups.io/g/CadacoAllStarBaseball/files/ROBBER-91%25.xls)
- [Discs by Nick Panos (folder)](https://groups.io/g/CadacoAllStarBaseball/files/Discs%20by%20Nick%20Panos)

*No files downloaded; .doc text read by in-page byte extraction, .xls formulas read live via SheetJS, discs rendered in-page for reading. The Thompson Batting Key.doc is a legacy binary Word file not safely text-extractable; its structure is documented via the Rose ratings file that references it.*
