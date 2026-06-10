import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseCSV } from './lib/csv.js'
import { computeSectors } from './lib/sectors.js'
import { qualifyPlayers } from './lib/qualify.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '..', 'data', 'lahman')
const ROSTERS_DIR = join(__dirname, '..', 'data', 'rosters')

const CLASSIC_TEAMS = [
	{ team: 'NYA', year: 1927, label: '1927 New York Yankees' },
	{ team: 'SLN', year: 1934, label: '1934 St. Louis Cardinals' },
	{ team: 'NYA', year: 1941, label: '1941 New York Yankees' },
	{ team: 'BRO', year: 1955, label: '1955 Brooklyn Dodgers' },
	{ team: 'NYA', year: 1961, label: '1961 New York Yankees' },
	{ team: 'CIN', year: 1975, label: '1975 Cincinnati Reds' },
	{ team: 'NYN', year: 1986, label: '1986 New York Mets' },
	{ team: 'NYA', year: 1998, label: '1998 New York Yankees' },
	{ team: 'SEA', year: 2001, label: '2001 Seattle Mariners' }
]

const readCSV = (name) => parseCSV(readFileSync(join(DATA_DIR, name), 'utf-8'))

const loadAllData = () => ({
	batting: readCSV('Batting.csv'),
	people: readCSV('People.csv'),
	appearances: readCSV('Appearances.csv'),
	pitching: readCSV('Pitching.csv'),
	teams: readCSV('Teams.csv')
})

const computeLeagueAvgSlg = (batting, league, year) => {
	const rows = batting.filter(r => r.lgID === league && r.yearID === String(year))
	let totalBases = 0
	let totalAB = 0
	for (const r of rows) {
		const ab = +r.AB
		const h = +r.H
		const doubles = +r['2B']
		const triples = +r['3B']
		const hr = +r.HR
		const singles = h - doubles - triples - hr
		totalBases += singles + 2 * doubles + 3 * triples + 4 * hr
		totalAB += ab
	}
	return totalAB > 0 ? totalBases / totalAB : 0.400
}

const findTeamInfo = (teams, teamID, year) => {
	const row = teams.find(r => r.teamID === teamID && r.yearID === String(year))
	if (!row) return null
	return { name: row.name, abbr: row.teamIDBR || teamID, league: row.lgID, games: +row.G }
}

const lookupPerson = (people, playerID) => {
	const p = people.find(r => r.playerID === playerID)
	if (!p) return { nameFirst: playerID, nameLast: '', nameGiven: '' }
	return { nameFirst: p.nameFirst, nameLast: p.nameLast, nameGiven: p.nameGiven || '' }
}

const generateRoster = (data, teamID, year) => {
	const teamInfo = findTeamInfo(data.teams, teamID, year)
	if (!teamInfo) {
		throw new Error(`Team ${teamID} not found for year ${year}`)
	}

	const teamBatting = data.batting.filter(r => r.teamID === teamID && r.yearID === String(year))
	const teamAppearances = data.appearances.filter(r => r.teamID === teamID && r.yearID === String(year))
	const teamPitching = data.pitching.filter(r => r.teamID === teamID && r.yearID === String(year))

	const leagueAvgSlg = computeLeagueAvgSlg(data.batting, teamInfo.league, year)

	const { positionPlayers, pitchers } = qualifyPlayers(
		teamBatting, teamAppearances, teamPitching,
		teamInfo.games, teamInfo.league, year
	)

	const allPlayers = [...positionPlayers, ...pitchers]

	const players = allPlayers.map(p => {
		const person = lookupPerson(data.people, p.playerID)
		const stats = p.stats
		const pa = stats.AB + stats.BB + stats.HBP + stats.SF + stats.SH
		if (pa === 0) return null

		let sectors
		try {
			sectors = computeSectors(stats, leagueAvgSlg)
		} catch {
			return null
		}

		return {
			id: `${p.playerID}-${year}`,
			nameFirst: person.nameFirst,
			nameLast: person.nameLast,
			nameGiven: person.nameGiven,
			position: p.position,
			team: teamInfo.name,
			year,
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

	return {
		team: teamID,
		teamAbbr: teamInfo.abbr,
		teamName: teamInfo.name,
		year,
		league: teamInfo.league,
		players
	}
}

const listTeams = (data, year) => {
	const yearStr = String(year)
	return data.teams
		.filter(r => r.yearID === yearStr)
		.map(r => ({ teamID: r.teamID, name: r.name, league: r.lgID, games: +r.G }))
		.sort((a, b) => a.name.localeCompare(b.name))
}

const writeRoster = (roster) => {
	if (!existsSync(ROSTERS_DIR)) mkdirSync(ROSTERS_DIR, { recursive: true })
	const filename = `${roster.year}-${roster.team}.json`
	const path = join(ROSTERS_DIR, filename)
	writeFileSync(path, JSON.stringify(roster, null, '\t'))
	return { filename, path, playerCount: roster.players.length }
}

const writeIndex = (rosters) => {
	const index = {
		rosters: rosters.map(r => ({
			id: `${r.year}-${r.team}`,
			label: `${r.year} ${r.teamName}`,
			year: r.year,
			team: r.team,
			abbr: r.teamAbbr
		}))
	}
	const path = join(ROSTERS_DIR, 'index.json')
	writeFileSync(path, JSON.stringify(index, null, '\t'))
	return path
}

const printRosterSummary = (roster) => {
	console.log(`\n${roster.teamName} (${roster.year}) — ${roster.league}`)
	console.log(`${roster.players.length} players\n`)
	for (const p of roster.players) {
		const slg = p.stats.AB > 0
			? ((p.stats.H - p.stats['2B'] - p.stats['3B'] - p.stats.HR + 2 * p.stats['2B'] + 3 * p.stats['3B'] + 4 * p.stats.HR) / p.stats.AB).toFixed(3)
			: '.000'
		console.log(`  ${p.nameFirst} ${p.nameLast} (${p.position}) — ${p.stats.PA} PA, .${slg.slice(2)} SLG`)
	}
}

// CLI
const args = process.argv.slice(2)
const getArg = (flag) => {
	const i = args.indexOf(flag)
	return i >= 0 && i + 1 < args.length ? args[i + 1] : null
}
const hasFlag = (flag) => args.includes(flag)

try {
	if (hasFlag('--list-teams')) {
		const year = getArg('--year')
		if (!year) throw new Error('--list-teams requires --year')
		const data = loadAllData()
		const teams = listTeams(data, +year)
		console.log(`\nTeams for ${year}:\n`)
		for (const t of teams) {
			console.log(`  ${t.teamID}  ${t.name} (${t.league}, ${t.games}G)`)
		}
	} else if (hasFlag('--classics')) {
		const data = loadAllData()
		const rosters = []
		for (const c of CLASSIC_TEAMS) {
			console.log(`Generating ${c.label}...`)
			const roster = generateRoster(data, c.team, c.year)
			const result = writeRoster(roster)
			console.log(`  -> ${result.filename} (${result.playerCount} players)`)
			rosters.push(roster)
		}
		const indexPath = writeIndex(rosters)
		console.log(`\nIndex written to ${indexPath}`)
	} else {
		const team = getArg('--team')
		const year = getArg('--year')
		if (!team || !year) throw new Error('Usage: --team <ID> --year <YYYY> | --classics | --list-teams --year <YYYY>')

		const data = loadAllData()
		const roster = generateRoster(data, team, +year)
		const result = writeRoster(roster)
		printRosterSummary(roster)
		console.log(`\nWritten to ${result.path}`)
	}
} catch (err) {
	console.error(`Error: ${err.message}`)
	process.exit(1)
}
