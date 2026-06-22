# Pitching in Cadaco All-Star Baseball — A Survey of the Mature Systems
### Compiled from the CadacoAllStarBaseball groups.io archive

---

## 1. The Core Problem

All-Star Baseball (designed by Ethan Allen, 1941) resolves a plate appearance with a **single spin of the batter's disc**; a pointer lands in a numbered wedge that maps to an outcome, with wedge sizes drawn from the player's real stats. The game models **only batting prowess** — no pitching, fielding, or baserunning. Ethan Allen's batting discs implicitly assume the hitter faces *league-average* pitching, so over a full season individual batting lines come out roughly right on their own.

The community's recurring question: how do you let an individual pitcher influence the game **without** discarding the existing Cadaco batting discs (the thing people love) or sliding into the "Strat-O-Matic trap" where a pitcher card dominates ~50% of plate appearances? Every mature system below is a different answer to that tension. The guiding ethos, repeated often, is Gene Newman's: ASB's beauty is its simplicity, which invites modification to taste.

## 2. The Two Broad Families

- **Rating systems** — the pitcher is reduced to a *grade* (e.g. 1–7, A–E) that reinterprets the batter's existing spin via a lookup chart. No second disc spin. Streamlines play, preserves disc compatibility, but suppresses pitcher individuality (every grade-1 pitcher behaves identically).
- **Disc/modifier systems** — the pitcher gets his *own* spinner (or die roll) that interacts with the batter spin. Restores individuality at the cost of an extra step and the risk of re-spins.

## 3. Rating Systems

### 3a. John Rose 7-Level System + Thompson Batting Key
Pitchers graded **1 (best) to 7 (worst)**. The **Thompson Batting Key** is a chart that re-maps all 14 batter-disc numbers according to the pitcher's grade — e.g. a "14 = fly out" becomes a double play against a grade-1 pitcher but a sac fly against a weaker one. Rose's pitcher discs also encode **endurance** in a center rectangle: a **"G#"** start-frequency rating (G5 = can start every 5th game) and an **"E#"** effective-innings rating (E6 = sharp for 6 innings, then the disc degrades to the worst tier). Also carries P (handedness), F (fielding), B (bats-from) codes. Strength: trivially fast. Weakness: deterministic — same grade always yields the same transformation.
Files: `THE ROSE PITCHER RATINGS.doc`, `Thompson Batting Key.doc`, `Thompson Batting Key 2006.doc`.

### 3b. Condensed 3-Level / TAL Variants
Bob Towson compressed Rose's seven grades into **three**. The TransAmerica League ("Oil Can John") uses a **1–5 grade** that only triggers on the **9 and 3 spins**, resolved via a re-spin on a dedicated **"P-Z Disc"** chart — fast once memorized, no extra discs for most plate appearances.
Files: `3-level pitcher ratings.doc`, `3-WEDGE RESULTS CHART.doc`.

### 3c. Kilbride System
Larry Kilbride's 1–7 grade with a twist: high-grade pitchers convert **singles/walks → outs**; low-grade pitchers convert **outs → singles**; **extra-base hits are never affected**; grade-4 = average (disc unused). Simple, but deliberately ignores XBH and DP tendencies.

## 4. Disc / Modifier Systems

### 4a. Nick Panos System (1975, copyrighted) — the suppression-arc approach
Panos (a retired SDSU electrical/computer-engineering professor) built the system widely regarded in the forum as the **most statistically accurate**. Its defining feature is **compatibility**: his pitcher discs spin *alongside* unmodified Cadaco batting discs. Discs are built by comparing a pitcher's season stats to league averages.

The pitcher disc uses a **lettered suppression notation**, with a **line above a code (overbar / "Not-")** meaning that outcome is *suppressed*. Observed symbols/effects: **Not-HR** (a homer is nullified — converted to a harmless out or downgraded), **Not-W** (a walk is converted to an out), **K** (automatic strikeout), **H** zone, plus **F/G** (fly/ground out) results and wild pitch. Where strong/weak pitchers diverge far from average, arcs overlap and a single arc may carry two labels (e.g. `Not-W Not-HR`).

Resolution in practice (from Panos's own game narratives): you spin the pitcher disc and the batter disc; suppression arcs cancel only their *own* outcome class so batting average isn't distorted where it shouldn't be. The **H zone is double-edged** — Panos describes a case where a batter spun a walk, the pitcher's H forced a re-spin, and the batter then made an out (H helped the pitcher); but an H can also turn an out into a hit. Drawback: historically **limited availability** — full sets existed mainly for teams/seasons Panos personally made (some given free in the Files; others sold directly).

### 4b. Gene Newman / "Three True Outcomes" normalized discs
Newman (building on Voros McCracken's TTO and Brock Hanke's ~1980 method) makes a pitcher disc from the three things a pitcher truly controls — **HR, BB, SO** — each as a margin that can *raise or lower* the batter's rate (color/notation-coded for "more" vs "fewer"). Spin the pitcher disc only when the batter spin produced (or, for "more" margins, failed to produce) the relevant outcome. A hard **75% / 270° cap** stops even Walter Johnson from making a batter literally never put the ball in play. Newman's later version uses **2-ring, 8-sector normalized discs** (outer letters F/G/K/W/BS/sK/S). Trade-off Panos flagged: normalizing pitchers *forces* re-normalizing the batting discs — which breaks Cadaco compatibility and re-enters the Strat trap. BB formula example: `(BB/BF − LgBB/LgBF) × 216`, negatives → 0.
Files: `Pitching disc discmaker.xls`, `pitching disc instructions.doc`.

### 4c. The Interaction-Matrix refinement (Curt Young / Lyle Weiser)
The key insight that **eliminates re-spins**: agree in advance on a full **interaction matrix** specifying the result of every (pitcher-spin × batter-spin) combination. Convention: a Not-HR cancels *only* homers, a Not-hit cancels *only* singles/doubles/triples (never homers), keeping the math simple and BA stable. Mathematically simpler than Panos's method, near-identical results — but requires universal agreement on the matrix, which never fully happened.

### 4d. Commercial / cross-over systems
- **Nine Inning Classic** (Dave Volk) — a standalone dice game whose pitching layer can be bolted onto ASB; pitchers graded **A–E** (C = average) plus PK/MK strikeout flags, graded largely from ERA; **Fred McShea** extended it with HR/SO/BB adjustments. Uses dice, not spinners.
- **Avalon Hill Superstar Baseball** (Tom Neff, mid-1970s) — "funky" 1–39 dice, pitcher-first resolution, includes **team defense** (certain rolls become automatic outs by fielder quality). Often cited as the best non-Panos option for arbitrary teams.

## 5. Disc-Generation Math (verified from the spreadsheets)

**Batter discmaker — Chris Rohan (`ASBB-Disc-Creator-103110.xls`):** PA = AB+BB; each outcome as a fraction of PA (2B/PA, 3B/PA, HR/PA, BB/PA, SO/PA; singles = (H−2B−3B−HR)/PA; in-play outs = (AB−H−SO)/PA), summing to a "Should = 1" checksum. SETUP rules: SO split into 3 slices if SO%>0.10 / 2 if >0.045; BB into 2 slices if >0.07; error wedge ≈4.5% from league fielding avg 0.955; ground-out split 33.3/33.3/33.4% across wedges #2/#6/#12; GB/FB clamped 50–75%.

**Pitcher discmaker — Gene Newman (`Pitching disc discmaker.xls`):** inputs BF/H/HR/BB/SO; HR/BF, BB/BF (above ~0.09), SO/BF with the same thresholds; non-HR hits split in thirds, outs split /7; "Batter (GO/1B/2B/3B)" wedges hand resolution back to the batter disc.

**Panos's exact suppression-arc sizing formulas remain unpublished** — we have his discs and the overbar legend, but not his per-arc recipe.

## 6. Strategy Layers Beyond Raw Outcomes

- **Endurance / fatigue:** Rose's E# effective-innings cliff; house rules dropping a grade after X innings or X earned runs; a literal spin-able **fatigue disc** (TIRED result); **rest factor** — Panos tracks a numeric rest factor per reliever (e.g. a closer at 1.32 who would exceed 2.0 and become unavailable for the next game if used), which genuinely constrains bullpen sequencing.
- **Pitch count:** raised as desirable but rejected as unworkable — pitch counts aren't in historical box scores.
- **Handedness / platoon:** a light **line-rule** (in same-handed matchups the pitcher wins ties / picks the better adjacent result on a line) and a heavier option of **dedicated lefty/righty batter discs** (or 2-ring split discs). Platoon differential ≈10% of a batter's offense. This is what stops you from riding one ace all game — an opposite-handed reliever can flip the advantage.
- **Baserunning / steals:** rated by attempts-per-game and success% (≈36 SB and ≈80% as high-water marks). Critically, **Panos pitcher discs carry R and J steal-hold ratings** — a pitcher's `R−3 J−1` *lowers* a fast runner's effective steal rating, while a poor holder like `R+2` *raises* it, so base-stealing as a weapon is only available against certain pitchers.
- **Defense / fielding:** position fielding split into **fielding% and range** vs league average (era-normalized); catchers add caught-stealing%; good defense can convert hits/erase runners. Integrated in some house systems, ignored on hits in others.

## 7. Known Gaps & Open Questions
- Panos's exact per-arc suppression formulas: **unpublished**.
- The full pitcher×batter **interaction matrix** was proposed but never universally agreed.
- The conversion from R/J steal-hold ratings and defensive ratings into precise probabilities is **house-specific**, not standardized.
- "Star Power" and "Nine Inning Classic" as comparison labels: Nine Inning Classic is documented (above); **"Star Power" does not appear as a pitching system** in the archive (it surfaces only as a hashtag on later game write-ups).

## 8. Sources
- Review of Pitching Options (system survey): [#2825](https://groups.io/g/CadacoAllStarBaseball/message/2825), Panos reply [#2833](https://groups.io/g/CadacoAllStarBaseball/message/2833), Newman [#2830](https://groups.io/g/CadacoAllStarBaseball/message/2830)
- Pitcher discs (Panos design rationale + TTO): [#6953](https://groups.io/g/CadacoAllStarBaseball/message/6953)
- Thought experiment (two-spin tradeoffs): [#9410](https://groups.io/g/CadacoAllStarBaseball/message/9410)
- Rose ratings / fatigue notation: [#2783](https://groups.io/g/CadacoAllStarBaseball/message/2783); pitch count [#6457](https://groups.io/g/CadacoAllStarBaseball/message/6457)
- Lefty/righty: [#9495](https://groups.io/g/CadacoAllStarBaseball/message/9495), [#9671](https://groups.io/g/CadacoAllStarBaseball/message/9671); platoon value [#450](https://groups.io/g/CadacoAllStarBaseball/message/450)
- Steals / defense ratings: [#3821](https://groups.io/g/CadacoAllStarBaseball/message/3821)
- Panos game narrative (R/J, rest factor, Not-HR/Not-W, H-zone in play): [#6100](https://groups.io/g/CadacoAllStarBaseball/message/6100)
- Files: [Pitching disc discmaker.xls](https://groups.io/g/CadacoAllStarBaseball/files/Pitching%20disc%20discmaker.xls), [ASBB-Disc-Creator-103110.xls](https://groups.io/g/CadacoAllStarBaseball/files/ASBB-Disc-Creator-103110.xls), [Discs by Nick Panos](https://groups.io/g/CadacoAllStarBaseball/files/Discs%20by%20Nick%20Panos)

*No files downloaded; discs rendered in-page for reading, spreadsheet formulas read live from workbook cells.*
