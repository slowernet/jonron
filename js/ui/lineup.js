import { track } from '../analytics.js'
import { POSITION_ABBREV } from '../constants.js'
import { fullName } from '../data/players.js'

const POSITION_LABELS = {
	pitcher: 'Pitchers', catcher: 'Catchers', 'first-base': '1st Base',
	'second-base': '2nd Base', shortstop: 'Shortstop', 'third-base': '3rd Base',
	outfield: 'Outfield', 'designated-hitter': 'Designated Hitter'
}
const POSITION_ORDER = ['catcher', 'pitcher', 'first-base', 'second-base', 'shortstop', 'third-base', 'outfield', 'designated-hitter']
const DRAFT_ORDER = {
	catcher: ['H', 'V', 'V', 'H'],
	pitcher: ['V', 'H', 'H', 'V', 'H', 'V', 'H', 'V'],
	'first-base': ['H', 'V', 'V', 'H'],
	'second-base': ['V', 'H', 'H', 'V'],
	shortstop: ['H', 'V', 'V', 'H'],
	'third-base': ['V', 'H', 'H', 'V'],
	outfield: ['H', 'V', 'V', 'H', 'H', 'V', 'V', 'H', 'H', 'V', 'V', 'H'],
	'designated-hitter': ['H', 'V', 'V', 'H']
}
const ROSTER_NEEDS = {
	pitcher: 1, catcher: 1, 'first-base': 1, 'second-base': 1,
	shortstop: 1, 'third-base': 1, outfield: 4, 'designated-hitter': 1
}

function el(tag, attrs = {}, children = []) {
	const node = document.createElement(tag)
	for (const [k, v] of Object.entries(attrs)) {
		if (k === 'className') node.className = v
		else if (k === 'textContent') node.textContent = v
		else if (k === 'html') node.innerHTML = v
		else if (k.startsWith('on')) node.addEventListener(k.slice(2).toLowerCase(), v)
		else node.setAttribute(k, v)
	}
	for (const child of children) {
		if (typeof child === 'string') node.appendChild(document.createTextNode(child))
		else if (child) node.appendChild(child)
	}
	return node
}

function getBiggestSector(disc) {
	const labels = { 1: 'HR', 5: '3B', 7: '1B', 9: 'BB', 10: 'K', 11: '2B', 13: '1B' }
	const notable = disc.sectors.filter(s => labels[s.number]).sort((a, b) => b.size - a.size)
	if (notable.length === 0) return '—'
	const top = notable[0]
	return `${labels[top.number]} ${Math.round(top.size / 3.6)}%`
}

function getHitSectors(disc) {
	const hitNums = new Set([1, 5, 7, 11, 13])
	const total = disc.sectors.filter(s => hitNums.has(s.number)).reduce((sum, s) => sum + s.size, 0)
	return Math.round(total / 3.6)
}

function createPlayerCard(player, onClick) {
	const card = el('div', { className: 'jr-card' }, [
		el('div', { className: 'jr-card-top' }, [
			el('span', { className: 'jr-card-pos', textContent: POSITION_ABBREV[player.position] }),
			el('span', { className: 'jr-card-team', textContent: player.team ?? '' })
		]),
		el('div', { className: 'jr-card-body' }, [
			el('div', { className: 'jr-card-name', textContent: fullName(player) }),
			el('div', { className: 'jr-card-stats' }, [
				el('div', { className: 'jr-stat', html: `<span class="k">On Base</span><span class="v">${getHitSectors(player)}%</span>` }),
				el('div', { className: 'jr-stat', html: `<span class="k">Power</span><span class="v">${getBiggestSector(player)}</span>` })
			])
		])
	])
	card.addEventListener('click', () => onClick(player, card))
	return card
}

function createRosterPanel(label, team) {
	return el('div', { className: 'jr-roster' }, [
		el('div', { className: 'jr-roster-title', textContent: label }),
		el('div', { className: 'jr-roster-list', id: `roster-${team}` })
	])
}

function updateRosterPanel(team, players) {
	const list = document.getElementById(`roster-${team}`)
	if (!list) return
	list.textContent = ''
	for (const p of players) {
		list.appendChild(el('div', { className: 'jr-roster-item' }, [
			el('span', { className: 'jr-roster-pos', textContent: POSITION_ABBREV[p.position] }),
			el('span', { textContent: fullName(p) })
		]))
	}
}

function createOverlay() {
	const overlay = el('div', { className: 'jr-overlay' })
	const theme = document.documentElement.getAttribute('data-theme') || 'program'
	overlay.setAttribute('data-theme', theme)
	document.body.appendChild(overlay)
	return overlay
}

export function startDraft(players, onComplete) {
	const overlay = createOverlay()
	const homeRoster = []
	const visitorRoster = []
	const drafted = new Set()
	const pickIndex = {}
	POSITION_ORDER.forEach(pos => { pickIndex[pos] = 0 })
	let currentPosition = 0

	const header = el('div', { className: 'jr-ov-head' }, [
		el('h1', { textContent: 'Draft Your Teams' }),
		el('div', { className: 'jr-turn', id: 'draft-turn' })
	])
	const main = el('div', { className: 'jr-ov-main' })
	const rosterArea = el('div', { className: 'jr-rosters' }, [
		createRosterPanel('Visitors', 'visitor'),
		createRosterPanel('Home', 'home')
	])
	overlay.append(header, main, rosterArea)

	const grouped = {}
	for (const pos of POSITION_ORDER) grouped[pos] = players.filter(p => p.position === pos)
	const activePositions = POSITION_ORDER.filter(pos => grouped[pos].length > 0)

	const getCurrentTeam = () => {
		const pos = POSITION_ORDER[currentPosition]
		const order = DRAFT_ORDER[pos]
		const idx = pickIndex[pos]
		return idx >= order.length ? null : order[idx]
	}
	const counts = (roster) => {
		const c = {}
		for (const pos of POSITION_ORDER) c[pos] = 0
		for (const p of roster) c[p.position]++
		return c
	}
	const isPositionDone = (pos) => {
		const need = ROSTER_NEEDS[pos]
		return counts(homeRoster)[pos] >= need && counts(visitorRoster)[pos] >= need
	}
	const allPositionsDone = () => activePositions.every(isPositionDone)

	function renderPositionGroup() {
		main.textContent = ''
		if (currentPosition >= activePositions.length) {
			if (allPositionsDone()) showBattingOrder(overlay, homeRoster, visitorRoster, onComplete)
			return
		}
		const pos = activePositions[currentPosition]
		if (isPositionDone(pos)) { currentPosition++; renderPositionGroup(); return }

		const team = getCurrentTeam()
		const turnEl = document.getElementById('draft-turn')
		if (turnEl) {
			turnEl.textContent = `${POSITION_LABELS[pos]} — ${team === 'H' ? 'Home' : 'Visitor'} picks`
			turnEl.className = `jr-turn ${team === 'H' ? 'jr-turn-home' : 'jr-turn-visitor'}`
		}
		const grid = el('div', { className: 'jr-draft-grid' })
		const available = grouped[pos].filter(p => !drafted.has(p.id))
		for (const player of available) {
			const card = createPlayerCard(player, (p, cardEl) => {
				drafted.add(p.id)
				;(team === 'H' ? homeRoster : visitorRoster).push(p)
				track('draft:pick', { round: pickIndex[pos] + 1, player_id: p.id })
				cardEl.classList.add('jr-card-picked')
				updateRosterPanel('home', homeRoster)
				updateRosterPanel('visitor', visitorRoster)
				pickIndex[pos]++
				if (isPositionDone(pos)) { currentPosition++; setTimeout(renderPositionGroup, 280) }
				else setTimeout(renderPositionGroup, 180)
			})
			grid.appendChild(card)
		}
		main.appendChild(grid)
	}

	updateRosterPanel('home', homeRoster)
	updateRosterPanel('visitor', visitorRoster)
	renderPositionGroup()
}

function pitcherLast(roster) {
	const order = roster.filter(p => p.position !== 'pitcher')
	const pitchers = roster.filter(p => p.position === 'pitcher')
	return [...order, ...pitchers]
}

function showBattingOrder(overlay, homeRoster, visitorRoster, onComplete) {
	overlay.textContent = ''
	const homeOrder = pitcherLast(homeRoster)
	const visitorOrder = pitcherLast(visitorRoster)
	let swapState = { team: null, index: null }

	const header = el('div', { className: 'jr-ov-head' }, [
		el('h1', { textContent: 'Set the Lineup' }),
		el('div', { className: 'sub', textContent: 'Tap two players on the same team to swap their spots in the order' })
	])
	const columns = el('div', { className: 'jr-lineup-cols' })

	function renderColumns() {
		columns.textContent = ''
		columns.appendChild(renderTeamOrder('Visitors', visitorOrder, 'visitor'))
		columns.appendChild(renderTeamOrder('Home', homeOrder, 'home'))
	}

	function renderTeamOrder(label, order, team) {
		const col = el('div', { className: 'jr-lineup-col' }, [el('h4', { textContent: label })])
		order.forEach((player, i) => {
			const isSel = swapState.team === team && swapState.index === i
			const isPitcher = player.position === 'pitcher'
			const row = el('div', {
				className: `jr-lineup-row${isPitcher ? ' pitcher' : ''}${isSel ? ' sel' : ''}`
			}, [
				el('span', { className: 'jr-lineup-num', textContent: `${i + 1}` }),
				el('span', { className: 'jr-lineup-name', textContent: fullName(player) }),
				el('span', { className: 'jr-lineup-pos', textContent: POSITION_ABBREV[player.position] })
			])
			row.addEventListener('click', () => {
				if (swapState.team === null) { swapState = { team, index: i }; renderColumns() }
				else if (swapState.team === team && swapState.index !== i) {
					const arr = team === 'home' ? homeOrder : visitorOrder
					;[arr[swapState.index], arr[i]] = [arr[i], arr[swapState.index]]
					swapState = { team: null, index: null }
					renderColumns()
				} else { swapState = { team: null, index: null }; renderColumns() }
			})
			col.appendChild(row)
		})
		return col
	}

	const playBtn = el('button', { className: 'jr-cta jr-cta-primary', textContent: 'Play Ball!' })
	playBtn.addEventListener('click', () => {
		overlay.remove()
		onComplete({ homeLineup: [...homeOrder], visitorLineup: [...visitorOrder] })
	})

	overlay.append(header, columns, el('div', { className: 'jr-ov-actions' }, [playBtn]))
	renderColumns()
}

export function createQuickDraft(players, onComplete) {
	const overlay = createOverlay()
	const grouped = {}
	for (const pos of POSITION_ORDER) grouped[pos] = [...players.filter(p => p.position === pos)]
	const homeRoster = []
	const visitorRoster = []
	const shuffle = (arr) => {
		for (let i = arr.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1))
			;[arr[i], arr[j]] = [arr[j], arr[i]]
		}
		return arr
	}
	for (const pos of POSITION_ORDER.filter(p => grouped[p].length > 0)) {
		const pool = shuffle(grouped[pos])
		const need = ROSTER_NEEDS[pos]
		for (let i = 0; i < need && i < pool.length; i++) homeRoster.push(pool[i])
		for (let i = need; i < need * 2 && i < pool.length; i++) visitorRoster.push(pool[i])
	}
	shuffle(homeRoster)
	shuffle(visitorRoster)
	showBattingOrder(overlay, homeRoster, visitorRoster, onComplete)
}

export function editLineups(homeRoster, visitorRoster, onComplete) {
	const overlay = createOverlay()
	showBattingOrder(overlay, homeRoster, visitorRoster, onComplete)
}

export function startTeamDraft(homePlayers, visitorPlayers, onComplete) {
	const overlay = createOverlay()
	const homeRoster = []
	const visitorRoster = []

	const header = el('div', { className: 'jr-ov-head' }, [
		el('h1', { textContent: 'Build Your Lineups' }),
		el('div', { className: 'jr-turn', id: 'team-draft-turn' })
	])
	const main = el('div', { className: 'jr-ov-main' })
	const rosterArea = el('div', { className: 'jr-rosters' }, [
		createRosterPanel('Visitors', 'visitor'),
		createRosterPanel('Home', 'home')
	])
	overlay.append(header, main, rosterArea)

	let pickingTeam = 'visitor'
	const LINEUP_SIZE = 9

	function currentPool() {
		const roster = pickingTeam === 'home' ? homeRoster : visitorRoster
		const pool = pickingTeam === 'home' ? homePlayers : visitorPlayers
		const picked = new Set(roster.map(p => p.id))
		return pool.filter(p => !picked.has(p.id))
	}

	function renderPick() {
		main.textContent = ''
		const roster = pickingTeam === 'home' ? homeRoster : visitorRoster

		if (roster.length >= LINEUP_SIZE) {
			if (pickingTeam === 'visitor') {
				pickingTeam = 'home'
				renderPick()
				return
			}
			showBattingOrder(overlay, homeRoster, visitorRoster, onComplete)
			return
		}

		const turnEl = document.getElementById('team-draft-turn')
		if (turnEl) {
			const label = pickingTeam === 'home' ? 'Home' : 'Visitors'
			turnEl.textContent = `${label} — pick ${roster.length + 1} of ${LINEUP_SIZE}`
			turnEl.className = `jr-turn ${pickingTeam === 'home' ? 'jr-turn-home' : 'jr-turn-visitor'}`
		}

		const grid = el('div', { className: 'jr-draft-grid' })
		for (const player of currentPool()) {
			const card = createPlayerCard(player, (p, cardEl) => {
				roster.push(p)
				track('draft:pick', { round: roster.length, player_id: p.id })
				cardEl.classList.add('jr-card-picked')
				updateRosterPanel('home', homeRoster)
				updateRosterPanel('visitor', visitorRoster)
				setTimeout(renderPick, 180)
			})
			grid.appendChild(card)
		}
		main.appendChild(grid)
	}

	updateRosterPanel('home', homeRoster)
	updateRosterPanel('visitor', visitorRoster)
	renderPick()
}
