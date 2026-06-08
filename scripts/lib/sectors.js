/**
 * Converts baseball stats into disc sectors for Cadaco All-Star Baseball.
 * Each sector maps to a game outcome; sizes are proportional to real stat rates.
 */

const SECTOR_OUTCOMES = {
  1: 'home-run',
  2: 'ground-ball',
  3: 'fly-ball',
  4: 'fly-ball',
  5: 'triple',
  6: 'ground-ball',
  7: 'single',
  8: 'fly-ball',
  9: 'walk',
  10: 'strikeout',
  11: 'double',
  12: 'ground-ball',
  13: 'single',
  14: 'fly-ball'
}

const MIN_DEGREES = 2
const TOTAL_DEGREES = 360

const computeSectors = (stats, leagueAvgSlg) => {
  const PA = stats.AB + stats.BB + stats.HBP + stats.SF + stats.SH
  const singles = stats.H - stats['2B'] - stats['3B'] - stats.HR

  // Step 1: compute rates
  const rates = {
    hr: stats.HR / PA,
    '3b': stats['3B'] / PA,
    '2b': stats['2B'] / PA,
    '1b': singles / PA,
    bb: (stats.BB + stats.HBP) / PA,
    so: stats.SO / PA
  }
  rates.out = 1 - (rates.hr + rates['3b'] + rates['2b'] + rates['1b'] + rates.bb + rates.so)

  // Step 2: convert to raw degrees
  const rawDegrees = {}
  for (const [key, rate] of Object.entries(rates)) {
    rawDegrees[key] = rate * TOTAL_DEGREES
  }

  // Step 3: apply minimum floor for non-zero outcomes, then round
  const rounded = {}
  for (const [key, deg] of Object.entries(rawDegrees)) {
    if (deg > 0) {
      rounded[key] = Math.max(MIN_DEGREES, Math.round(deg))
    } else {
      rounded[key] = 0
    }
  }

  // Re-normalize: adjust the largest sector so total = 360
  const currentTotal = Object.values(rounded).reduce((a, b) => a + b, 0)
  const diff = TOTAL_DEGREES - currentTotal
  if (diff !== 0) {
    const largest = Object.keys(rounded).reduce((a, b) =>
      rounded[a] >= rounded[b] ? a : b
    )
    rounded[largest] += diff
  }

  // Step 4: split singles 60/40 into sectors 7 and 13
  const sector7 = Math.round(rounded['1b'] * 0.6)
  const sector13 = rounded['1b'] - sector7

  // Step 5: GB/FB split for outs
  const playerSlg = (singles + 2 * stats['2B'] + 3 * stats['3B'] + 4 * stats.HR) / stats.AB
  const slgRatio = playerSlg / leagueAvgSlg
  const adjustedGbPct = Math.min(0.60, Math.max(0.30, 0.43 / slgRatio))
  const fbPct = 1.0 - adjustedGbPct

  const gbDegrees = Math.round(rounded.out * adjustedGbPct)
  const fbDegrees = rounded.out - gbDegrees

  // Distribute GB evenly across sectors 2, 6, 12
  const gbSectors = [2, 6, 12]
  const gbBase = Math.floor(gbDegrees / gbSectors.length)
  let gbRemainder = gbDegrees - gbBase * gbSectors.length
  const gbAlloc = {}
  for (const n of gbSectors) {
    gbAlloc[n] = gbBase + (gbRemainder > 0 ? 1 : 0)
    if (gbRemainder > 0) gbRemainder--
  }

  // Distribute FB evenly across sectors 3, 4, 8, 14
  const fbSectorNums = [3, 4, 8, 14]
  const fbBase = Math.floor(fbDegrees / fbSectorNums.length)
  let fbRemainder = fbDegrees - fbBase * fbSectorNums.length
  const fbAlloc = {}
  for (const n of fbSectorNums) {
    fbAlloc[n] = fbBase + (fbRemainder > 0 ? 1 : 0)
    if (fbRemainder > 0) fbRemainder--
  }

  // Step 6: build final sector array
  const sectorSizes = {
    1: rounded.hr,
    ...gbAlloc,
    ...fbAlloc,
    5: rounded['3b'],
    7: sector7,
    9: rounded.bb,
    10: rounded.so,
    11: rounded['2b'],
    13: sector13
  }

  // Omit sector 5 if zero triples
  const result = []
  for (const [numStr, size] of Object.entries(sectorSizes)) {
    const num = Number(numStr)
    if (num === 5 && stats['3B'] === 0) continue
    result.push({ number: num, size })
  }

  return result.sort((a, b) => a.number - b.number)
}

export { computeSectors }
