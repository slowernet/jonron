# The Nick Panos Pitching System for All-Star Baseball (ASB)
### A Reconstructed Reference Document

*Compiled from Panos's disc sheets in the [CadacoAllStarBaseball@groups.io Files area](https://groups.io/g/CadacoAllStarBaseball/files) and from contemporaneous explanations in the group's message archive (principally by Curt Young / "lyle13"). Some details are confirmed directly from the discs; others are documented by community explanation; a few remain genuinely undocumented and are flagged as such.*

---

## 1. Overview and Design Philosophy

All-Star Baseball, as invented by Ethan Allen in 1941, modeled **only the batter** -- each player is a spinner disc divided into numbered wedges, with no representation of pitching or defense. Nick Panos developed (and copyrighted, in the 1970s) a pitching system whose defining goal was **compatibility with the existing Cadaco-style batting discs**. Rather than replacing the batter disc (the "Strat-O-Matic trap" Panos explicitly wanted to avoid), his pitcher disc *overlays* the batter result, modifying it only in specific cases.

The system rests on the principle later popularized as the **"Three True Outcomes"** (Voros McCracken): a pitcher has meaningful control over essentially three results -- **strikeouts, walks (incl. HBP), and home runs** -- plus, in Panos's implementation, a hits component. Everything else is left to the batter disc.

---

## 2. Disc Inventory: Two Disc Types

**Batter discs** (the standard Cadaco-style disc) are color-filled (red for American League, green for National League).

**Pitcher discs** are drawn with a **white (unfilled) center** -- a consistent visual tell that distinguishes a pitcher disc from a batter disc at a glance, regardless of league.

---

## 3. The Batter Disc

### 3.1 Outcome wedges (the printed numeric key)

Each batter disc's outer ring is divided into numbered wedges. Panos prints this legend on every batter sheet:

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

The disc center carries: player name, season/team, **fielding rating(s)** by position (e.g. `2B-3`, `SS-5`, or multi-position like `RF-4 1B-1`), a **SAC** rating, a **bats** indicator (`BR` = bats right, `BL` = bats left), and **`R# J#`** (baserunning and "jump"/speed ratings), plus the AB/RBI/BA stat line.

### 3.3 Maximum rating values (printed on each sheet)

> C-4, P-2, 1B-2, 2B-4, SS-10, 3B-5, LF-2, CF-6, RF-4, SAC-3, R6, J6

These caps tell you the rating scale per fielding position and for SAC, R, and J.

---

## 4. The Pitcher Disc

### 4.1 Outcome wedges (letter codes)

Instead of numbers, the pitcher disc's outer ring uses **letters**:

| Code | Meaning |
|------|---------|
| K | Strikeout |
| B | Ball / Walk (BB) |
| HR | Home Run |
| H | Hit (single/double/triple) |
| G | Ground Out |
| F | Fly Out |
| W | Walk |
| WP | Wild Pitch |

### 4.2 The overbar = suppression ("NOT / cancels")

The single most important notation: **a line drawn above a code means "NOT" -- it cancels that outcome** if the batter spins it. This is how a pitcher *removes* outcomes (the defining ability of a good pitcher):

- **HR (overbar)** -- cancels a home run (cancels *only* homers, not other hits)
- **H (overbar)** -- cancels singles/doubles/triples (but *not* homers)
- **W (overbar)** -- cancels a walk
- **WK (overbar)**, **W HR (overbar)**, **WK HR (overbar)** -- overlap arcs where two suppression effects coincide (Panos double-labels the single arc)

The width of a suppression arc scales with how far the pitcher deviates from league average. Elite-control pitchers carry very wide arcs -- e.g. **Bartolo Colon (2013)** and **Clayton Kershaw (2016)** show large W (overbar) and W HR (overbar) arcs; high-strikeout or high-walk pitchers carry correspondingly wide K, WK (overbar), or additive arcs.

### 4.3 Center ratings

Pitcher center codes: `SAC`, **`B##`** (a pitcher value ranging roughly B1-B12 -- the larger the value, the more pronounced the effect), `R0`, `J0` (pitchers typically 0), and a **`P-#`** rating (observed P-0 through P-3). The stat line is **IP / W-L / ERA** for starters and **IP / HLD / SV / ERA** for relievers.

### 4.4 Role / handedness tag (bottom of disc)

| Tag | Meaning |
|-----|---------|
| S | Starter |
| R1 / R2 | Reliever (tiered) |
| S/R2 | Swingman (starter + reliever) |
| TR / TL | Throws Right / Throws Left |

---

## 5. How a Plate Appearance Is Resolved

Both discs are spun. The community-documented procedure (per Curt Young's usage note for the 2016 set):

1. **Spin the P (pitcher) disc, then the B (batter) disc.**
2. **Most of the time there is no interaction** -- the result simply comes off the batter disc.
3. An interaction occurs only on the "three true outcome" results (strikeout, walk, home run) plus the hits component, where the pitcher's arcs apply.

A **pre-defined interaction matrix** specifies the outcome for *every* combination of P-spin and B-spin, so that **no re-spins are ever required**. Worked principles from that matrix:

- If the pitcher spins a **HR (overbar)** and the batter spins a **1 (HR)** -> not a home run; the matrix dictates the downgraded result (no re-spin).
- A **HR (overbar) cancels only homers**; a **H (overbar) cancels only singles/doubles/triples** (never homers). This keeps the math clean and keeps batting average affected only when intended.
- Additive arcs (a weak pitcher who *gives up more* of an outcome) work the inverse way.
- **Caps:** suppression/additive arcs are capped (the community guideline was <=75% / 270 degrees) so that even an extreme pitcher (e.g. a Walter Johnson) never produces an automatic, inescapable outcome -- the batter always retains some chance.

The net statistical effect, over many plate appearances, is that a strong pitcher gets the edge over a strong hitter, pulling the batter's realized line slightly below his raw disc.

---

## 6. Provenance and Where the Discs Live

The genuine Panos pitcher discs were found across these locations in the Files area (all copyright Nicholas Panos):

- **[Discs by Nick Panos](https://groups.io/g/CadacoAllStarBaseball/files/Discs%20by%20Nick%20Panos)** folder -- 2012 MLB set; pitcher discs on [2012ExtraPitchers.jpg](https://groups.io/g/CadacoAllStarBaseball/files/Discs%20by%20Nick%20Panos/2012ExtraPitchers.jpg) and [2012NLPage7.jpg](https://groups.io/g/CadacoAllStarBaseball/files/Discs%20by%20Nick%20Panos/2012NLPage7.jpg).
- **[2013 All Star Game disc set](https://groups.io/g/CadacoAllStarBaseball/files/2013%20All%20Star%20Game%20disc%20set)** -- pitchers on [AL Page 7](https://groups.io/g/CadacoAllStarBaseball/files/2013%20All%20Star%20Game%20disc%20set/2013ALPage7.jpg) (Buchholz, Crain, Darvish, Iwakuma, Verlander, Colon) and [NL Page 6](https://groups.io/g/CadacoAllStarBaseball/files/2013%20All%20Star%20Game%20disc%20set/2013NLPage6.jpg) (Wainwright, Zimmermann).
- **[2014 All Star Game disc set](https://groups.io/g/CadacoAllStarBaseball/files/2014%20All%20Star%20Game%20disc%20set)** -- pitchers on [AL Page 7](https://groups.io/g/CadacoAllStarBaseball/files/2014%20All%20Star%20Game%20disc%20set/2014ALPage7.jpg), [NL Page 7](https://groups.io/g/CadacoAllStarBaseball/files/2014%20All%20Star%20Game%20disc%20set/2014NLPage7.jpg), and [OtherPlayers](https://groups.io/g/CadacoAllStarBaseball/files/2014%20All%20Star%20Game%20disc%20set/2014OtherPlayers.jpg) (Kluber, Keuchel, Porcello).
- **[2015 All Star Game disc set](https://groups.io/g/CadacoAllStarBaseball/files/2015%20All%20Star%20Game%20disc%20set)** -- pitchers on [AL Page 7](https://groups.io/g/CadacoAllStarBaseball/files/2015%20All%20Star%20Game%20disc%20set/2015ALPage7.jpg) and [NL Page 5](https://groups.io/g/CadacoAllStarBaseball/files/2015%20All%20Star%20Game%20disc%20set/2015NLPage5.jpg) (Wacha, Miller, Scherzer).
- **[2016 All Star Game disc set](https://groups.io/g/CadacoAllStarBaseball/files/2016%20All%20Star%20Game%20disc%20set)** -- pitchers on [AL Page 5](https://groups.io/g/CadacoAllStarBaseball/files/2016%20All%20Star%20Game%20disc%20set/2016ALPage5.jpg) (Colome, Davis, Kimbrel, Estrada, Salazar, Lewis) and [NL Page 5](https://groups.io/g/CadacoAllStarBaseball/files/2016%20All%20Star%20Game%20disc%20set/2016NLPage5.jpg) (Lester, Kershaw, Bumgarner, Teheran, Strasburg, Syndergaard).
- **[2008 All Star Game disc set](https://groups.io/g/CadacoAllStarBaseball/files/2008%20All%20Star%20Game%20disc%20set)** -- same content in legacy `.doc` format (graphics embedded; no extractable rules text).

Loose Panos files also include: [PanosBaseStealingUpdated.doc](https://groups.io/g/CadacoAllStarBaseball/files/PanosBaseStealingUpdated.doc) (his updated base-stealing disc & chart, adds two rating levels), [PercentageDisk 3.doc](https://groups.io/g/CadacoAllStarBaseball/files/PercentageDisk%203.doc) and [PercentageDisk 4.doc](https://groups.io/g/CadacoAllStarBaseball/files/PercentageDisk%204.doc), and [Simplified Method For Making Cadaco Style Batting Discs.doc](https://groups.io/g/CadacoAllStarBaseball/files/Simplified%20Method%20For%20Making%20Cadaco%20Style%20Batting%20Discs.doc) (a discmaking how-to -- note: batting, not pitching).

---

## 7. Known Gaps (Undocumented)

The following are *not* documented in any retrievable source and would need to be obtained from Panos or Curt Young directly, or reverse-engineered from the discs:

1. **No standalone written rules file exists.** Usage instructions are printed on the disc sheets themselves; there is no separate "Panos pitching rules" document anywhere in the Files area.
2. **Exact SAC and defensive (R/J) conversion.** How the `SAC-#`, `R#`, and `J#` ratings translate into specific game outcomes was asked by a forum member in 2016 and never answered publicly.
3. **The full interaction matrix cell-by-cell.** The *principles* are documented; the complete P-spin x B-spin lookup table is not published.
4. **Precise B## scaling.** The numeric meaning of the `B##` value and the exact arc-degree formulas were never posted.

---

## 8. Source Threads (Message Archive)

- [Pitcher discs (#6953)](https://groups.io/g/CadacoAllStarBaseball/message/6953) -- the definitive thread on the interaction matrix, the overbar/suppression meaning, and Panos's compatibility goal.
- [2016 All-Star discs by Nick Panos (#7712)](https://groups.io/g/CadacoAllStarBaseball/message/7712) -- confirms spin order (P disc, then B disc) and that usage info is printed on the sheets.
- [thought experiment #pitching_systems (#9410)](https://groups.io/g/CadacoAllStarBaseball/message/9410) -- the design principle that pre-specifying every P x B combination eliminates re-spins.

---

*Sources: Panos disc sheets (2012-2016 sets) and the group messages linked above. Direct quotations have been deliberately avoided; this is an original synthesis.*
