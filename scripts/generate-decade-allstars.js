import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseCSV } from './lib/csv.js'
import { computeSectors } from './lib/sectors.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '..', 'data', 'lahman')
const ROSTERS_DIR = join(__dirname, '..', 'data', 'rosters')

const MIN_DECADE_PA = 1500
const MIN_SEASON_PA = 200

const POSITION_MAP = {
	G_c: 'catcher',
	G_1b: 'first-base',
	G_2b: 'second-base',
	G_3b: 'third-base',
	G_ss: 'shortstop',
	G_lf: 'outfield',
	G_cf: 'outfield',
	G_rf: 'outfield'
}

const LINEUP_SLOTS = [
	{ position: 'catcher', count: 1 },
	{ position: 'first-base', count: 1 },
	{ position: 'second-base', count: 1 },
	{ position: 'third-base', count: 1 },
	{ position: 'shortstop', count: 1 },
	{ position: 'outfield', count: 3 }
]

const num = (v) => Number(v) || 0
const STAT_KEYS = ['AB', 'H', '2B', '3B', 'HR', 'BB', 'SO', 'HBP', 'SF', 'SH', 'GIDP']
const PA_KEYS = ['AB', 'BB', 'HBP', 'SF', 'SH']

const aggregateStats = (rows) => {
	const agg = {}
	for (const key of STAT_KEYS) agg[key] = rows.reduce((sum, r) => sum + num(r[key]), 0)
	return agg
}

const computePA = (stats) => PA_KEYS.reduce((sum, k) => sum + stats[k], 0)

const computeOPS = (stats) => {
	const pa = computePA(stats)
	if (pa === 0) return 0
	const obp = (stats.H + stats.BB + stats.HBP) / pa
	const slg = stats.AB > 0
		? (stats.H - stats['2B'] - stats['3B'] - stats.HR + 2 * stats['2B'] + 3 * stats['3B'] + 4 * stats.HR) / stats.AB
		: 0
	return obp + slg
}

const readCSV = (name) => parseCSV(readFileSync(join(DATA_DIR, name), 'utf-8'))

const loadAllData = () => ({
	batting: readCSV('Batting.csv'),
	people: readCSV('People.csv'),
	appearances: readCSV('Appearances.csv'),
	teams: readCSV('Teams.csv')
})

const decadeRange = (decade) => [decade, decade + 9]

const MIN_POSITION_GAMES = 50

const getEligiblePositions = (appearanceRows) => {
	const totals = {}
	for (const row of appearanceRows) {
		for (const [col, pos] of Object.entries(POSITION_MAP)) {
			totals[pos] = (totals[pos] || 0) + num(row[col])
		}
	}
	// Eligible if 50+ games at that position over the decade
	const eligible = Object.entries(totals)
		.filter(([, g]) => g >= MIN_POSITION_GAMES)
		.sort((a, b) => b[1] - a[1])
		.map(([pos]) => pos)
	return eligible.length > 0 ? eligible : ['outfield']
}

const computeLeagueAvgSlg = (batting, league, year) => {
	const rows = batting.filter(r => r.lgID === league && r.yearID === String(year))
	let totalBases = 0, totalAB = 0
	for (const r of rows) {
		const ab = num(r.AB), h = num(r.H)
		const doubles = num(r['2B']), triples = num(r['3B']), hr = num(r.HR)
		totalBases += (h - doubles - triples - hr) + 2 * doubles + 3 * triples + 4 * hr
		totalAB += ab
	}
	return totalAB > 0 ? totalBases / totalAB : 0.400
}

const lookupPerson = (people, playerID) => {
	const p = people.find(r => r.playerID === playerID)
	if (!p) return { nameFirst: playerID, nameLast: '', nameGiven: '' }
	return { nameFirst: p.nameFirst, nameLast: p.nameLast, nameGiven: p.nameGiven || '' }
}

const generateDecadeAllstars = (data, franchID, decade) => {
	const [startYear, endYear] = decadeRange(decade)

	// Find all teamIDs for this franchise in this decade
	const franchTeamRows = data.teams.filter(r =>
		r.franchID === franchID && +r.yearID >= startYear && +r.yearID <= endYear
	)
	if (franchTeamRows.length === 0) return null

	const teamIDs = [...new Set(franchTeamRows.map(r => r.teamID))]

	// Team identity: first year of the decade
	const firstRow = franchTeamRows.reduce((a, b) => +a.yearID < +b.yearID ? a : b)
	const teamName = firstRow.name
	const teamAbbr = firstRow.teamIDBR || firstRow.teamID
	const teamID = firstRow.teamID
	const league = firstRow.lgID

	// Collect all batting rows for this franchise in this decade
	const franchBatting = data.batting.filter(r =>
		teamIDs.includes(r.teamID) && +r.yearID >= startYear && +r.yearID <= endYear
	)

	// Collect all appearance rows
	const franchAppearances = data.appearances.filter(r =>
		teamIDs.includes(r.teamID) && +r.yearID >= startYear && +r.yearID <= endYear
	)

	// Step 1: Qualify — aggregate PA across the decade per player
	const playerDecadePA = new Map()
	const playerSeasons = new Map() // playerID -> [{year, teamID, stats}]

	for (const row of franchBatting) {
		const id = row.playerID
		const year = +row.yearID

		// Accumulate decade PA
		if (!playerDecadePA.has(id)) playerDecadePA.set(id, 0)
		const seasonStats = aggregateStats([row])
		playerDecadePA.set(id, playerDecadePA.get(id) + computePA(seasonStats))

		// Track individual seasons
		if (!playerSeasons.has(id)) playerSeasons.set(id, [])
		playerSeasons.get(id).push({ year, teamID: row.teamID, stats: seasonStats })
	}

	// Aggregate multi-stint seasons (same player, same year, same or different teamID within franchise)
	for (const [id, seasons] of playerSeasons) {
		const byYear = new Map()
		for (const s of seasons) {
			if (!byYear.has(s.year)) byYear.set(s.year, [])
			byYear.get(s.year).push(s)
		}
		const merged = []
		for (const [year, stints] of byYear) {
			if (stints.length === 1) {
				merged.push(stints[0])
			} else {
				const combined = {}
				for (const key of STAT_KEYS) combined[key] = stints.reduce((sum, s) => sum + s.stats[key], 0)
				merged.push({ year, teamID: stints[0].teamID, stats: combined })
			}
		}
		playerSeasons.set(id, merged)
	}

	// Filter to qualified players
	const qualifiedIDs = [...playerDecadePA.entries()]
		.filter(([, pa]) => pa >= MIN_DECADE_PA)
		.map(([id]) => id)

	if (qualifiedIDs.length === 0) return null

	// Build eligibility and best-season data for each qualified player
	const playerEligible = new Map()
	const playerBestSeason = new Map()
	for (const id of qualifiedIDs) {
		const appRows = franchAppearances.filter(r => r.playerID === id)
		playerEligible.set(id, getEligiblePositions(appRows))

		const seasons = (playerSeasons.get(id) || [])
			.filter(s => computePA(s.stats) >= MIN_SEASON_PA)
		let best = null
		let bestOPS = -1
		for (const s of seasons) {
			const ops = computeOPS(s.stats)
			if (ops > bestOPS) { bestOPS = ops; best = s }
		}
		if (best) {
			playerBestSeason.set(id, { ...best, ops: bestOPS })
		}
	}

	// Step 2: Greedy lineup construction
	// For each position slot, pick the best available OPS player eligible there.
	// Process scarce positions first (fewer eligible candidates) to avoid deadlocks.
	const selected = new Set()
	const lineup = []

	const slots = []
	for (const { position, count } of LINEUP_SLOTS) {
		for (let i = 0; i < count; i++) slots.push(position)
	}

	// Sort slots by scarcity: fewest eligible unselected players first
	const sortedSlots = [...slots].sort((a, b) => {
		const countA = [...playerBestSeason.keys()].filter(id =>
			!selected.has(id) && playerEligible.get(id)?.includes(a)).length
		const countB = [...playerBestSeason.keys()].filter(id =>
			!selected.has(id) && playerEligible.get(id)?.includes(b)).length
		return countA - countB
	})

	for (const position of sortedSlots) {
		const candidates = [...playerBestSeason.entries()]
			.filter(([id]) => !selected.has(id) && playerEligible.get(id)?.includes(position))
			.sort((a, b) => b[1].ops - a[1].ops)

		if (candidates.length > 0) {
			const [id, season] = candidates[0]
			selected.add(id)
			lineup.push({ playerID: id, position, season })
		}
	}

	// DH: best remaining qualified player by OPS
	const dhCandidates = [...playerBestSeason.entries()]
		.filter(([id]) => !selected.has(id))
		.sort((a, b) => b[1].ops - a[1].ops)

	if (dhCandidates.length > 0) {
		const [id, season] = dhCandidates[0]
		selected.add(id)
		lineup.push({ playerID: id, position: 'designated-hitter', season })
	}

	if (lineup.length < 9) return null

	// Build player records with disc sectors
	const players = lineup.map(({ playerID, position, season }) => {
		const person = lookupPerson(data.people, playerID)
		const stats = season.stats
		const pa = computePA(stats)
		if (pa === 0) return null

		const leagueSlg = computeLeagueAvgSlg(data.batting, league, season.year)
		let sectors
		try {
			sectors = computeSectors(stats, leagueSlg)
		} catch {
			return null
		}

		return {
			id: `${playerID}-${season.year}`,
			nameFirst: person.nameFirst,
			nameLast: person.nameLast,
			nameGiven: person.nameGiven,
			position,
			team: teamName,
			year: season.year,
			stats: {
				PA: pa,
				AB: stats.AB,
				H: stats.H,
				'2B': stats['2B'],
				'3B': stats['3B'],
				HR: stats.HR,
				BB: stats.BB,
				SO: stats.SO,
				HBP: stats.HBP,
				SF: stats.SF,
				SH: stats.SH,
				GIDP: stats.GIDP
			},
			sectors
		}
	}).filter(Boolean)

	if (players.length < 9) return null

	const decadeLabel = `${decade}s`
	return {
		team: teamID,
		teamAbbr,
		teamName,
		year: decade,
		decade: decadeLabel,
		league,
		players
	}
}

const writeRoster = (roster) => {
	if (!existsSync(ROSTERS_DIR)) mkdirSync(ROSTERS_DIR, { recursive: true })
	const filename = `${roster.decade}-${roster.team}.json`
	const path = join(ROSTERS_DIR, filename)
	writeFileSync(path, JSON.stringify(roster, null, '\t'))
	return { filename, path, playerCount: roster.players.length }
}

const printRoster = (roster) => {
	console.log(`\n${roster.decade} ${roster.teamName} (${roster.teamAbbr}) — ${roster.league}`)
	for (const p of roster.players) {
		const ops = computeOPS(p.stats).toFixed(3)
		console.log(`  ${p.year} ${p.nameFirst} ${p.nameLast} (${p.position}) — ${p.stats.PA} PA, ${ops} OPS`)
	}
}

// CLI
const DECADES = [1940, 1950, 1960, 1970, 1980, 1990, 2000, 2010]

try {
	const data = loadAllData()

	// Get all unique franchises active in our decade range
	const allFranchises = new Map()
	for (const row of data.teams) {
		const year = +row.yearID
		if (year < 1940) continue
		const fid = row.franchID
		if (!allFranchises.has(fid)) allFranchises.set(fid, new Set())
		allFranchises.get(fid).add(year)
	}

	const rosters = []
	let skipped = 0

	for (const decade of DECADES) {
		const [startYear, endYear] = decadeRange(decade)
		const activeFranchises = [...allFranchises.entries()]
			.filter(([, years]) => [...years].some(y => y >= startYear && y <= endYear))
			.map(([fid]) => fid)
			.sort()

		for (const franchID of activeFranchises) {
			const roster = generateDecadeAllstars(data, franchID, decade)
			if (roster) {
				const result = writeRoster(roster)
				console.log(`${roster.decade} ${roster.teamName} (${roster.teamAbbr}) -> ${result.filename} (${result.playerCount} players)`)
				rosters.push(roster)
			} else {
				skipped++
			}
		}
	}

	// Update index.json: merge decade all-stars with existing classic rosters
	const indexPath = join(ROSTERS_DIR, 'index.json')
	let existingIndex = { rosters: [] }
	if (existsSync(indexPath)) {
		existingIndex = JSON.parse(readFileSync(indexPath, 'utf-8'))
	}

	// Keep non-decade entries (classic rosters), replace all decade entries
	const classicEntries = existingIndex.rosters.filter(r => !r.decade)
	const decadeEntries = rosters.map(r => ({
		id: `${r.decade}-${r.team}`,
		label: `${r.decade} ${r.teamName}`,
		year: r.year,
		team: r.team,
		abbr: r.teamAbbr,
		decade: r.decade
	}))

	const mergedIndex = { rosters: [...classicEntries, ...decadeEntries] }
	writeFileSync(indexPath, JSON.stringify(mergedIndex, null, '\t'))

	console.log(`\nGenerated ${rosters.length} decade all-star rosters (${skipped} skipped — insufficient qualified players)`)
	console.log(`Index updated: ${classicEntries.length} classic + ${decadeEntries.length} decade = ${mergedIndex.rosters.length} total`)

	if (process.argv.includes('--verbose')) {
		for (const r of rosters) printRoster(r)
	}
} catch (err) {
	console.error(`Error: ${err.message}`)
	process.exit(1)
}
