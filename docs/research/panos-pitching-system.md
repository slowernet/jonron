# The Nick Panos Pitching System & Disc Generation for All-Star Baseball (ASB)
### A Reconstructed Reference Document

*Compiled from disc sheets, discmaker files, and instruction documents in the [CadacoAllStarBaseball@groups.io Files area](https://groups.io/g/CadacoAllStarBaseball/files), plus contemporaneous explanations in the group's message archive. Items confirmed directly from source are noted; undocumented points are flagged.*

---

## 1. Overview and Design Philosophy

All-Star Baseball (Ethan Allen, 1941) models **only the batter** — each player is a spinner disc of numbered wedges, with no native pitching or defense. Nick Panos developed (and copyrighted, in the 1970s) a pitching system whose defining goal was **compatibility with existing Cadaco-style batting discs**. His pitcher disc *overlays* the batter result rather than replacing it (avoiding the "Strat-O-Matic trap").

The system rests on the **Three True Outcomes** principle (Voros McCracken): a pitcher meaningfully controls **strikeouts, walks (incl. HBP), and home runs** — plus a hits component in Panos's implementation. Everything else comes off the batter disc.

> **Note:** At least two parallel pitching systems circulated in this community — **Panos's** lettered-suppression-arc discs (the focus of this document) and **Gene Newman's** numbered results-chart discs (see §7).

---

## 2. Two Disc Types

- **Batter discs** — color-filled: red (American League), green (National League).
- **Pitcher discs** — white (unfilled) center, marked with a baseball symbol, to distinguish them at a glance regardless of league.

---

## 3. The Batter Disc

### 3.1 Outcome wedges (printed numeric key)

| # | Result | # | Result |
|---|--------|---|--------|
| 1 | Home Run | 8 | Long Fly Out |
| 2 | Double Play | 9 | Walk or HBP |
| 3 | Safe at 1B on Error | 10 | Strikeout |
| 4 | Deep Fly Out | 11 | Double |
| 5 | Triple | 12 | Ground Out (force out at 2B) |
| 6 | Ground Out (runners advance) | 13 | Long Single |
| 7 | Single | 14 | Fly Out |

### 3.2 Center ratings

Player name, season/team, **fielding rating(s)** by position (e.g. `2B-3`, `SS-5`, or multi-position `RF-4 1B-1`), **SAC** rating, **bats** indicator (`BR`/`BL`), **`R# J#`** (baserunning / jump-speed), and the AB/RBI/BA line.

### 3.3 Maximum rating values (printed on each sheet)

> C-4, P-2, 1B-2, 2B-4, SS-10, 3B-5, LF-2, CF-6, RF-4, SAC-3, R6, J6

---

## 4. The Pitcher Disc

### 4.1 Outcome wedges (letter codes)

| Code | Meaning | Code | Meaning |
|------|---------|------|---------|
| K | Strikeout | G | Ground Out |
| B | Ball / Walk | F | Fly Out |
| HR | Home Run | W | Walk |
| H | Hit (1B/2B/3B) | WP | Wild Pitch |

### 4.2 The overbar = suppression ("NOT / cancels")

A line above a code means **"NOT" — it cancels that outcome** if the batter spins it:

- **H̄R** — cancels a home run (only homers, not other hits)
- **~H** — cancels singles/doubles/triples (never homers)
- **W̄** — cancels a walk
- **W̄K**, **W̄ H̄R**, **W̄K H̄R** — overlap arcs (Panos double-labels a single arc where two effects coincide)

Arc width scales with how far the pitcher deviates from league average — elite-control pitchers (e.g. **Bartolo Colon 2013**, **Clayton Kershaw 2016**) carry wide `W̄` / `W̄ H̄R` arcs.

### 4.3 Center ratings

`SAC`, **`B##`** (pitcher value ~B1–B12; larger = stronger effect), `R0`, `J0` (pitchers typically 0), and a **`P-#`** rating (observed P-0 to P-3). Stat line: **IP / W-L / ERA** (starters) or **IP / HLD / SV / ERA** (relievers).

### 4.4 Role / handedness tag

| Tag | Meaning |
|-----|---------|
| S | Starter |
| R1 / R2 | Reliever (tiered) |
| S/R2 | Swingman |
| TR / TL | Throws Right / Left |

---

## 5. Resolving a Plate Appearance (Panos system)

1. **Spin the P disc, then the B disc.**
2. **Most plate appearances have no interaction** — result comes off the batter disc.
3. Interaction occurs only on the three true outcomes (K/BB/HR) plus the hits component.

A **pre-defined interaction matrix** specifies the result of every P×B combination, so **no re-spins are ever needed**. Key rules:

- Pitcher spins **H̄R**, batter spins **1 (HR)** → not a homer; matrix gives the downgraded result, no re-spin.
- **H̄R cancels only homers**; **~H cancels only 1B/2B/3B** (never homers) — keeps the math and batting average clean.
- Additive arcs (weak pitcher allowing *more* of an outcome) work inversely.
- **Caps:** suppression/additive arcs are limited (community guideline ≤75% / 270°) so even an extreme pitcher never forces an automatic outcome.

Net effect over many PAs: a strong pitcher edges a strong hitter, pulling the batter's realized line slightly below his raw disc.

---

## 6. Disc Generation

### 6.1 Core principle

Every outcome is a slice of 360° proportional to its rate:

> **wedge° = (outcome count ÷ PA) × 360**

Stats are sourced from Retrosheet/baseball-reference; degrees are rounded to whole numbers, with compensating adjustments so the disc sums to 360° ([Disc parameters #2035](https://groups.io/g/CadacoAllStarBaseball/message/2035); layout by protractor or Excel donut-chart, [K-O disc #4198](https://groups.io/g/CadacoAllStarBaseball/message/4198)).

### 6.2 Panos's batting-disc method (from [Simplified Method...doc](https://groups.io/g/CadacoAllStarBaseball/files/Simplified%20Method%20For%20Making%20Cadaco%20Style%20Batting%20Discs.doc))

1. **PA** = AB + BB. *(Modern refinement: PA = AB + BB − IBB + HBP, since IBB isn't "earned" and HBP plays like a walk.)*
2. **Singles:** 1B = H − 2B − 3B − HR.
3. Compute each zone as (count ÷ PA) × 360 for: singles, doubles (#11), triples (#5), **home runs (#1)**, **strikeouts (#10)**, **walks (#9)**.
4. **Safe on Error (ROE / #3):** fix at **4°** for Cadaco compatibility (deadball-era true value ~11°, but capped for compatibility).
5. **Strikeouts:** if SO data is incomplete, use a separate **PA(SO)** covering only the years with SO data. *(Ty Cobb example: 1913–1928 only → 7517 AB + 963 BB → PA(SO) = 8480.)*
6. **Double play (#2):** sized by runner speed — faster runner → smaller DP zone (use GIDP data if available); Cadaco-compatible floor ~18° even for the very fastest.
7. **Remaining degrees** become ground outs and fly outs.
8. **#14 fly-out zone** is the **balancing wedge** — adjust it so the total = 360°; reasonable range **30–70°**.
9. Lay out with a protractor (simplified) or computer (refined, using IBB/HBP/ROE/GO/FO/GIDP).

### 6.3 Pitcher-disc generation (Three True Outcomes)

Pitcher arcs are built from deviation against the league average. Documented walk formula (Gene Newman, [#6953](https://groups.io/g/CadacoAllStarBaseball/message/6953)):

> **BB arc = (BB/BF − LgBB/LgBF) × 216**, negatives set to 0

The [Pitching disc discmaker.xls](https://groups.io/g/CadacoAllStarBaseball/files/Pitching%20disc%20discmaker.xls) takes inputs **BF, HR, BB, SO** and outputs wedge percentages — confirming the TTO basis.

### 6.4 Generation tools (Files area)

- **Chris Rohan (rohanman99)** discmaker family — community favorite for batter discs:
  - [ASBB-Disc-Creator-103110.xls](https://groups.io/g/CadacoAllStarBaseball/files/ASBB-Disc-Creator-103110.xls), [-BOX](https://groups.io/g/CadacoAllStarBaseball/files/ASBB-Disc-Creator-103110-BOX.xls), [-port-BOX](https://groups.io/g/CadacoAllStarBaseball/files/ASBB-Disc-Creator-103110-port-BOX.xls)
  - [ASBB-2-ring-colored-discmaker-103110.xls](https://groups.io/g/CadacoAllStarBaseball/files/ASBB-2-ring-colored-discmaker-103110.xls)
  - Position-specific: [pitchers-catchers](https://groups.io/g/CadacoAllStarBaseball/files/ASBB-Original_discs_pitchers-catchers_103110.xls), [infielders](https://groups.io/g/CadacoAllStarBaseball/files/ASBB-Original_discs_infielders_103110.xls), [outfielders](https://groups.io/g/CadacoAllStarBaseball/files/ASBB-Original_discs_OUTFIELDERs_103110.xls)
  - [Stat-disc creator](https://groups.io/g/CadacoAllStarBaseball/files/ASBB-stat-disc-creator-103110-box.xls)
- Other tools: [2-ring discmaker.xls](https://groups.io/g/CadacoAllStarBaseball/files/2-ring%20discmaker.xls), [RED-CIRCLE DISC CREATOR.xls](https://groups.io/g/CadacoAllStarBaseball/files/RED-CIRCLE%20DISC%20CREATOR.xls), [Pitching disc discmaker.xls](https://groups.io/g/CadacoAllStarBaseball/files/Pitching%20disc%20discmaker.xls)
- Instructions / methods: [Discmaker instructions.doc](https://groups.io/g/CadacoAllStarBaseball/files/Discmaker%20instructions.doc), [pitching disc instructions.doc](https://groups.io/g/CadacoAllStarBaseball/files/pitching%20disc%20instructions.doc), [CREATING THE OLD STYLE CADACO DISCS.doc](https://groups.io/g/CadacoAllStarBaseball/files/CREATING%20THE%20OLD%20STYLE%20CADACO%20DISCS.doc), [Simplified Method...doc](https://groups.io/g/CadacoAllStarBaseball/files/Simplified%20Method%20For%20Making%20Cadaco%20Style%20Batting%20Discs.doc), [PICTURE DISC formatting.doc](https://groups.io/g/CadacoAllStarBaseball/files/PICTURE%20DISC%20formatting.doc)
- Missing-data aids: [Missing Stats - how to estimate.doc](https://groups.io/g/CadacoAllStarBaseball/files/Missing%20Stats%20-%20how%20to%20estimate.doc), [Missing stats - workbook.xls](https://groups.io/g/CadacoAllStarBaseball/files/Missing%20stats%20-%20workbook.xls)

---

## 7. Gene Newman's Alternative Pitcher System (for contrast)

Documented in [pitching disc instructions.doc](https://groups.io/g/CadacoAllStarBaseball/files/pitching%20disc%20instructions.doc). Unlike Panos's lettered arcs, Gene's pitcher disc is **numbered 1–14** and resolved via a printed **RESULTS CHART**:

- Pitcher disc spun **first**; numbered result checked against the chart.
- **9 = Walk, 10 = Strikeout**; several numbers map to **"Batter Disc"** (resolve with the hitter's disc — "classic" ASB); others to **Fly Out / Ground Ball** (use existing ASB charts).
- Pitcher discs carry a baseball symbol; not to be used as batter discs.

---

## 8. Known Gaps (Undocumented)

1. **Panos's full pitcher-arc formulas** (exact `B##` scaling, per-arc degree math) were never published — only the TTO principle and the BB example formula.
2. **Exact SAC and defensive (R/J) conversion** for Panos discs — asked in 2016, never answered publicly.
3. **The complete P×B interaction matrix** cell-by-cell — principles documented, full table not.

---

## 9. Source Threads (Message Archive)

- [Pitcher discs (#6953)](https://groups.io/g/CadacoAllStarBaseball/message/6953) — interaction matrix, overbar meaning, compatibility goal, Gene's BB formula.
- [2016 All-Star discs by Nick Panos (#7712)](https://groups.io/g/CadacoAllStarBaseball/message/7712) — spin order; usage info printed on sheets.
- [thought experiment #pitching_systems (#9410)](https://groups.io/g/CadacoAllStarBaseball/message/9410) — pre-specifying every P×B combination eliminates re-spins.
- [Disc parameters (#2035)](https://groups.io/g/CadacoAllStarBaseball/message/2035) — degrees-out-of-360 generation in practice.
- [K-O disc and fielding pct (#4198)](https://groups.io/g/CadacoAllStarBaseball/message/4198) — protractor/Excel layout.

---

## 10. Pitcher Discs by Set (provenance)

- **[Discs by Nick Panos](https://groups.io/g/CadacoAllStarBaseball/files/Discs%20by%20Nick%20Panos)** — [2012ExtraPitchers.jpg](https://groups.io/g/CadacoAllStarBaseball/files/Discs%20by%20Nick%20Panos/2012ExtraPitchers.jpg), [2012NLPage7.jpg](https://groups.io/g/CadacoAllStarBaseball/files/Discs%20by%20Nick%20Panos/2012NLPage7.jpg)
- **[2013 set](https://groups.io/g/CadacoAllStarBaseball/files/2013%20All%20Star%20Game%20disc%20set)** — [AL p7](https://groups.io/g/CadacoAllStarBaseball/files/2013%20All%20Star%20Game%20disc%20set/2013ALPage7.jpg), [NL p6](https://groups.io/g/CadacoAllStarBaseball/files/2013%20All%20Star%20Game%20disc%20set/2013NLPage6.jpg)
- **[2014 set](https://groups.io/g/CadacoAllStarBaseball/files/2014%20All%20Star%20Game%20disc%20set)** — [AL p7](https://groups.io/g/CadacoAllStarBaseball/files/2014%20All%20Star%20Game%20disc%20set/2014ALPage7.jpg), [NL p7](https://groups.io/g/CadacoAllStarBaseball/files/2014%20All%20Star%20Game%20disc%20set/2014NLPage7.jpg), [OtherPlayers](https://groups.io/g/CadacoAllStarBaseball/files/2014%20All%20Star%20Game%20disc%20set/2014OtherPlayers.jpg)
- **[2015 set](https://groups.io/g/CadacoAllStarBaseball/files/2015%20All%20Star%20Game%20disc%20set)** — [AL p7](https://groups.io/g/CadacoAllStarBaseball/files/2015%20All%20Star%20Game%20disc%20set/2015ALPage7.jpg), [NL p5](https://groups.io/g/CadacoAllStarBaseball/files/2015%20All%20Star%20Game%20disc%20set/2015NLPage5.jpg)
- **[2016 set](https://groups.io/g/CadacoAllStarBaseball/files/2016%20All%20Star%20Game%20disc%20set)** — [AL p5](https://groups.io/g/CadacoAllStarBaseball/files/2016%20All%20Star%20Game%20disc%20set/2016ALPage5.jpg), [NL p5](https://groups.io/g/CadacoAllStarBaseball/files/2016%20All%20Star%20Game%20disc%20set/2016NLPage5.jpg)
- **[2008 set](https://groups.io/g/CadacoAllStarBaseball/files/2008%20All%20Star%20Game%20disc%20set)** — legacy `.doc` format

---

*Original synthesis; direct quotation deliberately avoided.*
