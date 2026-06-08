/**
 * Player qualification logic for roster generation.
 * Given batting/pitching/appearances data, determines which players
 * qualify for a team's roster and what position they play.
 */

const POSITION_MAP = {
  G_c: 'catcher',
  G_1b: 'first-base',
  G_2b: 'second-base',
  G_3b: 'third-base',
  G_ss: 'shortstop',
  G_lf: 'outfield',
  G_cf: 'outfield',
  G_rf: 'outfield',
  G_dh: 'designated-hitter',
  G_p: 'pitcher'
}

const STAT_KEYS = ['AB', 'H', '2B', '3B', 'HR', 'BB', 'SO', 'HBP', 'SF', 'SH', 'GIDP']
const PA_KEYS = ['AB', 'BB', 'HBP', 'SF', 'SH']

const num = (v) => Number(v) || 0

const aggregateStats = (rows) => {
  const agg = {}
  for (const key of STAT_KEYS) {
    agg[key] = rows.reduce((sum, r) => sum + num(r[key]), 0)
  }
  return agg
}

const computePA = (stats) => PA_KEYS.reduce((sum, k) => sum + stats[k], 0)

const assignPosition = (appearancesRow) => {
  if (!appearancesRow) return 'designated-hitter'

  let best = ''
  let max = -1
  for (const [col, pos] of Object.entries(POSITION_MAP)) {
    const g = num(appearancesRow[col])
    if (g > max) {
      max = g
      best = pos
    }
  }
  return best || 'designated-hitter'
}

const buildPlayerObj = (playerID, position, stats) => ({
  playerID,
  position,
  stats
})

/**
 * Determine which players qualify for a team's roster.
 *
 * @param {Object[]} battingRows - Parsed batting CSV rows
 * @param {Object[]} appearancesRows - Parsed appearances CSV rows
 * @param {Object[]} pitchingRows - Parsed pitching CSV rows
 * @param {number} teamGames - Number of games the team played
 * @param {string} league - 'AL' or 'NL'
 * @param {number} year - Season year
 * @returns {{ positionPlayers: Object[], pitchers: Object[] }}
 */
const qualifyPlayers = (battingRows, appearancesRows, pitchingRows, teamGames, league, year) => {
  // --- Position players ---
  // Group batting rows by playerID and aggregate
  const battingByPlayer = new Map()
  for (const row of battingRows) {
    const id = row.playerID
    if (!battingByPlayer.has(id)) battingByPlayer.set(id, [])
    battingByPlayer.get(id).push(row)
  }

  // Build appearances lookup
  const appearancesMap = new Map()
  for (const row of appearancesRows) {
    appearancesMap.set(row.playerID, row)
  }

  // Aggregate and compute PA for each player
  const playerEntries = []
  for (const [playerID, rows] of battingByPlayer) {
    const stats = aggregateStats(rows)
    const pa = computePA(stats)
    playerEntries.push({ playerID, stats, pa })
  }

  // Sort by PA descending
  playerEntries.sort((a, b) => b.pa - a.pa)

  // Apply threshold
  const paThreshold = 3.1 * teamGames
  let qualified = playerEntries.filter(e => e.pa >= paThreshold)

  // Fallback: ensure at least 9 if possible
  if (qualified.length < 9) {
    qualified = playerEntries.slice(0, Math.min(9, playerEntries.length))
  }

  const positionPlayers = qualified.map(({ playerID, stats }) => {
    const position = assignPosition(appearancesMap.get(playerID))
    return buildPlayerObj(playerID, position, stats)
  })

  // --- Pitchers ---
  let pitchers = []

  // AL post-1973: no pitcher batting
  if (league === 'AL' && year > 1973) {
    return { positionPlayers, pitchers }
  }

  // Group pitching rows by playerID and sum IPouts
  const pitchingByPlayer = new Map()
  for (const row of pitchingRows) {
    const id = row.playerID
    const current = pitchingByPlayer.get(id) || 0
    pitchingByPlayer.set(id, current + num(row.IPouts))
  }

  // Build pitcher entries sorted by IP
  const pitcherEntries = [...pitchingByPlayer.entries()]
    .map(([playerID, ipouts]) => ({ playerID, ip: ipouts / 3 }))
    .sort((a, b) => b.ip - a.ip)

  const ipThreshold = 1.0 * teamGames
  let qualifiedPitchers = pitcherEntries.filter(e => e.ip >= ipThreshold)

  // Fallback: ensure at least 2 if possible
  if (qualifiedPitchers.length < 2) {
    qualifiedPitchers = pitcherEntries.slice(0, Math.min(2, pitcherEntries.length))
  }

  // Look up batting stats for each qualifying pitcher
  pitchers = qualifiedPitchers.map(({ playerID }) => {
    const batRows = battingByPlayer.get(playerID) || []
    const stats = aggregateStats(batRows)
    return buildPlayerObj(playerID, 'pitcher', stats)
  })

  return { positionPlayers, pitchers }
}

export { qualifyPlayers }
