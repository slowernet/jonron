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
const MIN_POSITION_PLAYERS = 13
const MIN_BY_POSITION = {
  catcher: 1, 'first-base': 1, 'second-base': 1, 'third-base': 1,
  shortstop: 1, outfield: 4, 'designated-hitter': 1
}

const qualifyPlayers = (battingRows, appearancesRows, pitchingRows, teamGames, league, year) => {
  // --- Position players ---
  const battingByPlayer = new Map()
  for (const row of battingRows) {
    const id = row.playerID
    if (!battingByPlayer.has(id)) battingByPlayer.set(id, [])
    battingByPlayer.get(id).push(row)
  }

  const appearancesMap = new Map()
  for (const row of appearancesRows) {
    appearancesMap.set(row.playerID, row)
  }

  const playerEntries = []
  for (const [playerID, rows] of battingByPlayer) {
    const stats = aggregateStats(rows)
    const pa = computePA(stats)
    const position = assignPosition(appearancesMap.get(playerID))
    playerEntries.push({ playerID, stats, pa, position })
  }

  playerEntries.sort((a, b) => b.pa - a.pa)

  // Start with PA-qualified players
  const paThreshold = 3.1 * teamGames
  const selected = new Set()
  const posCounts = {}

  for (const e of playerEntries) {
    if (e.pa >= paThreshold) {
      selected.add(e.playerID)
      posCounts[e.position] = (posCounts[e.position] || 0) + 1
    }
  }

  // Fill position minimums from remaining players (by PA)
  for (const [pos, need] of Object.entries(MIN_BY_POSITION)) {
    const have = posCounts[pos] || 0
    if (have < need) {
      const candidates = playerEntries.filter(e => e.position === pos && !selected.has(e.playerID))
      for (let i = 0; i < need - have && i < candidates.length; i++) {
        selected.add(candidates[i].playerID)
        posCounts[pos] = (posCounts[pos] || 0) + 1
      }
    }
  }

  // Fill to minimum roster size from remaining players by PA
  if (selected.size < MIN_POSITION_PLAYERS) {
    for (const e of playerEntries) {
      if (selected.size >= MIN_POSITION_PLAYERS) break
      if (!selected.has(e.playerID)) selected.add(e.playerID)
    }
  }

  const positionPlayers = playerEntries
    .filter(e => selected.has(e.playerID))
    .map(({ playerID, stats, position }) => buildPlayerObj(playerID, position, stats))

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
