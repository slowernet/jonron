# The Nick Panos Pitching System for Cadaco All-Star Baseball
### A Reference Compilation (compiled from the CadacoAllStarBaseball groups.io archive)

---

## 1. Overview & Design Philosophy

All-Star Baseball resolves a plate appearance by spinning a player's circular disc; a pointer lands in a numbered wedge that maps to an outcome. The classic game used **batter discs only** — pitching was abstracted. Nick Panos's contribution was a parallel family of **pitcher discs** that let a real pitcher modify the result, so a plate appearance becomes an interaction between two discs rather than a single batter spin.

The core idea: the batter disc represents the hitter's *baseline* outcome distribution; the pitcher disc represents how a given pitcher *suppresses or shifts* those outcomes. A dominant pitcher's disc removes or downgrades hits; a weak pitcher's disc leaves the batter's distribution largely intact.

## 2. The Two Disc Types

- **Batter discs** — numbered wedges, each mapping to a discrete outcome (1B, 2B, 3B, HR, BB, SO, ground out, fly out, etc.), sized in proportion to that player's real statistics.
- **Pitcher discs (Panos)** — use a **lettered / suppression-arc notation** rather than a second numbered results chart. Certain outcome segments carry a **line above the code (an "overbar")**.

## 3. The Overbar Notation (Suppression)

The overbar is the interpretive key to Panos's pitcher discs. A code **with a line above it denotes suppression**: when the pitcher's spin lands on an overbarred segment, the corresponding batter outcome is **negated or downgraded** rather than allowed to stand. Un-barred segments pass the batter's result through. This is how a strong pitcher's disc mechanically "eats" hits that the batter disc would otherwise grant.

> **Known gap:** The exact, published rule for *how* the two spins combine — the full pitcher-spin × batter-spin interaction matrix — is **not documented** in the archive. The overbar = suppression reading is well supported by the disc images and the instruction docs, but the precise per-segment resolution order was never laid out in a single authoritative post.

## 4. Resolving a Plate Appearance

The supported sequence (per the "Pitcher discs" definitive thread and the printed disc keys):

1. **Spin the pitcher (P) disc first.**
2. **Spin the batter (B) disc.**
3. If the pitcher lands on a **suppression (overbarred)** segment, the pitcher's result takes precedence and the batter's hit is negated/downgraded.
4. Otherwise the **batter's** result stands.
5. Segments handing resolution back to the batter (e.g., "Batter GO/1B/2B/3B" wedges on Newman-style pitcher discs) defer to the batter disc for the final outcome.

## 5. The Panos "Simplified Method" (Batting)

Panos also authored a **Simplified Method** document describing a streamlined batting-resolution approach — a faster way to read batter outcomes without the full chart lookup. It is a batting aid, distinct from the pitcher-disc suppression mechanic above.

## 6. How the Discs Were Generated (Verified Formulas)

The archive contains working spreadsheet "discmakers" whose **live cell formulas** were extracted and verified. These show exactly how real stats were converted into wedge sizes.

### 6a. Batter discmaker — Chris Rohan (`ASBB-Disc-Creator-103110.xls`)

- **Plate appearances:** `PA = AB + BB`
- **Per-outcome fractions of the disc:**
  - 2B = 2B / PA
  - 3B = 3B / PA
  - HR = HR / PA
  - BB = BB / PA
  - SO = SO / PA
  - **Singles** = (H − 2B − 3B − HR) / PA
  - **In-play outs** = (AB − H − SO) / PA
- **Checksum:** all fractions sum to a cell labeled *"Should = 1"*.
- **SETUP-sheet tunable rules:**
  - Strikeout split into **3 slices** if SO% > 0.10, **2 slices** if > 0.045.
  - Walk split into **2 slices** if BB% > 0.07.
  - **Error wedge** derived from league fielding average (0.955), ≈ **4.5%** of the disc.
  - **Ground-out split** ≈ 33.3 / 33.3 / 33.4% across wedges #2 / #6 / #12.
  - **GB/FB ratio** clamped to a **50–75%** range.

### 6b. Pitcher discmaker — Gene Newman (`Pitching disc discmaker.xls`)

- **Inputs:** BF (batters faced), H, HR, BB, SO.
- **Fractions:** HR/BF; BB/BF (when above ~0.09); SO/BF (same threshold logic as the batter maker).
- **Non-HR hits** split into thirds; **outs** split /7.
- Includes **"Batter (GO/1B/2B/3B)"** wedges that hand resolution back to the batter disc.

> **Important distinction:** Gene Newman's pitcher discmaker produces a **numbered results-chart** pitcher disc. This is a *different lineage* from Panos's **lettered suppression-arc** discs. They solve the same problem (adding pitching) two different ways; do not conflate them.

### 6c. Panos's own generation method

Panos's **exact per-arc / B## suppression formulas remain unpublished** in the archive. We can see the *output* (the suppression discs themselves and their overbar legends) and we have two *other* authors' discmaker math, but Panos's specific recipe for sizing the suppression arcs was never posted.

## 7. Gene Newman's Alternative System

Newman documented his own pitching-disc instructions and discmaker (see §6b). His approach keeps everything on a numbered chart rather than suppression arcs, making it a self-contained alternative to Panos's method for groups that prefer chart-style resolution.

## 8. Known Gaps & Open Questions

- The full **pitcher-spin × batter-spin interaction matrix** was never published.
- The **SAC rating and defensive (R/J) conversion** question was raised in the archive but **never publicly answered**.
- **Panos's exact suppression-arc sizing formulas** are not in any posted file.

## 9. Pitcher-Disc Provenance by Set

Genuine Panos pitcher/All-Star-Game disc sets located in the Files area:

- **Discs by Nick Panos** (folder, 14 files) — the core Panos collection.
- **2008 All Star Game disc set** (12 .doc files — binary/graphics, not text).
- **2013** All Star Game disc set (13 files).
- **2014** All Star Game disc set (15 files).
- **2015** All Star Game disc set (14 files).
- **2016** All Star Game disc set (14 files).
- Loose disc images examined: 2012ExtraPitchers, 2012 AL/NL pages, 2013 AL/NL pages, 2014 AL/NL/OtherPlayers, 2015 AL/NL pages, 2016 AL/NL pages.

> Note: **"Star Power"** and **"Nine Inning Classic"** — named as comparison systems in the original task — **do not appear anywhere** in the Files area. All located pitching material is either Panos (suppression-arc) or Newman (numbered-chart).

## 10. Sources

**Message threads**
- [#6953 — Pitcher discs (definitive)](https://groups.io/g/CadacoAllStarBaseball/message/6953)
- [#7712 — 2016 Panos discs](https://groups.io/g/CadacoAllStarBaseball/message/7712)
- [Topic 48764122 — 2016 Panos discs](https://groups.io/g/CadacoAllStarBaseball/topic/48764122)
- [#9410 — thought experiment](https://groups.io/g/CadacoAllStarBaseball/message/9410)
- [#3265 — Hall of Fame (Doug Curry)](https://groups.io/g/CadacoAllStarBaseball/message/3265)
- [#2035 — Disc parameters](https://groups.io/g/CadacoAllStarBaseball/message/2035)

**Files & folders**
- [Discs by Nick Panos (folder)](https://groups.io/g/CadacoAllStarBaseball/files/Discs%20by%20Nick%20Panos)
- [Pitching disc discmaker.xls](https://groups.io/g/CadacoAllStarBaseball/files/Pitching%20disc%20discmaker.xls)
- [ASBB-Disc-Creator-103110.xls](https://groups.io/g/CadacoAllStarBaseball/files/ASBB-Disc-Creator-103110.xls)
- [Pitching disc instructions.doc (Gene Newman)](https://groups.io/g/CadacoAllStarBaseball/files/pitching%20disc%20instructions.doc)
- [Files area (top level)](https://groups.io/g/CadacoAllStarBaseball/files)

---

*Compiled from the CadacoAllStarBaseball groups.io archive. No files were downloaded. Disc images were rendered in-page for reading only; spreadsheet formulas were read live from the workbook cells.*
