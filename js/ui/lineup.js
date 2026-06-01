const POSITION_LABELS = {
	pitcher: 'Pitchers',
	catcher: 'Catchers',
	'first-base': '1st Base',
	'second-base': '2nd Base',
	shortstop: 'Shortstop',
	'third-base': '3rd Base',
	outfield: 'Outfield'
}

const POSITION_ABBR = {
	pitcher: 'P',
	catcher: 'C',
	'first-base': '1B',
	'second-base': '2B',
	shortstop: 'SS',
	'third-base': '3B',
	outfield: 'OF'
}

const POSITION_ORDER = [
	'catcher', 'pitcher', 'first-base', 'second-base',
	'shortstop', 'third-base', 'outfield'
]

// From the box lid rules: which picks go to home (H) vs visitor (V)
// For positions with 2 players, only picks 1-2 matter
// For outfield with 8 players, picks 1-8 matter
const DRAFT_ORDER = {
	catcher:      ['H', 'V', 'V', 'H'],
	pitcher:      ['V', 'H', 'H', 'V', 'H', 'V', 'H', 'V'],
	'first-base': ['H', 'V', 'V', 'H'],
	'second-base':['V', 'H', 'H', 'V'],
	shortstop:    ['H', 'V', 'V', 'H'],
	'third-base': ['V', 'H', 'H', 'V'],
	outfield:     ['H', 'V', 'V', 'H', 'H', 'V', 'V', 'H', 'H', 'V', 'V', 'H']
}

// How many each team drafts per position (half the available pool)
const ROSTER_NEEDS = {
	pitcher: 1,
	catcher: 1,
	'first-base': 1,
	'second-base': 1,
	shortstop: 1,
	'third-base': 1,
	outfield: 4
}

function el(tag, attrs = {}, children = []) {
	const node = document.createElement(tag)
	for (const [k, v] of Object.entries(attrs)) {
		if (k === 'className') node.className = v
		else if (k === 'textContent') node.textContent = v
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
	const labels = {
		1: 'HR', 5: '3B', 7: '1B', 9: 'BB',
		10: 'K', 11: '2B', 13: '1B'
	}
	const notable = disc.sectors
		.filter(s => labels[s.number])
		.sort((a, b) => b.size - a.size)
	if (notable.length === 0) return ''
	const top = notable[0]
	return `${labels[top.number]} ${Math.round(top.size / 3.6)}%`
}

function getHitSectors(disc) {
	const hitNums = new Set([1, 5, 7, 11, 13])
	const total = disc.sectors
		.filter(s => hitNums.has(s.number))
		.reduce((sum, s) => sum + s.size, 0)
	return Math.round(total / 3.6)
}

function createPlayerCard(player, onClick) {
	const hitPct = getHitSectors(player)
	const bigSector = getBiggestSector(player)

	const card = el('div', { className: 'draft-card' }, [
		el('div', { className: 'draft-card-name', textContent: player.name }),
		el('div', { className: 'draft-card-info' }, [
			el('span', { textContent: `${POSITION_ABBR[player.position]} / ${player.team}` }),
			el('span', { textContent: `Hit: ${hitPct}%` }),
		]),
		el('div', { className: 'draft-card-stat', textContent: bigSector }),
	])

	card.addEventListener('click', () => onClick(player, card))
	return card
}

function createRosterPanel(label, team) {
	const panel = el('div', { className: 'draft-roster' }, [
		el('div', { className: 'draft-roster-title', textContent: label }),
		el('div', { className: 'draft-roster-list', id: `roster-${team}` }),
	])
	return panel
}

function updateRosterPanel(team, players) {
	const list = document.getElementById(`roster-${team}`)
	if (!list) return
	list.textContent = ''
	for (const p of players) {
		list.appendChild(el('div', { className: 'draft-roster-item' }, [
			el('span', { className: 'draft-roster-pos', textContent: POSITION_ABBR[p.position] }),
			el('span', { textContent: p.name }),
		]))
	}
}

function createOverlay() {
	const overlay = el('div', { className: 'draft-overlay' })
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

	const header = el('div', { className: 'draft-header' }, [
		el('h1', { textContent: 'DRAFT YOUR TEAMS' }),
		el('div', { className: 'draft-turn', id: 'draft-turn' }),
	])

	const main = el('div', { className: 'draft-main' })

	const rosterArea = el('div', { className: 'draft-rosters' }, [
		createRosterPanel('VISITORS', 'visitor'),
		createRosterPanel('HOME', 'home'),
	])

	const actions = el('div', { className: 'draft-actions' })

	overlay.appendChild(header)
	overlay.appendChild(main)
	overlay.appendChild(rosterArea)
	overlay.appendChild(actions)

	const grouped = {}
	for (const pos of POSITION_ORDER) {
		grouped[pos] = players.filter(p => p.position === pos)
	}

	function getCurrentTeam() {
		const pos = POSITION_ORDER[currentPosition]
		const order = DRAFT_ORDER[pos]
		const idx = pickIndex[pos]
		if (idx >= order.length) return null
		return order[idx]
	}

	function getHomeCounts() {
		const counts = {}
		for (const pos of POSITION_ORDER) counts[pos] = 0
		for (const p of homeRoster) counts[p.position]++
		return counts
	}

	function getVisitorCounts() {
		const counts = {}
		for (const pos of POSITION_ORDER) counts[pos] = 0
		for (const p of visitorRoster) counts[p.position]++
		return counts
	}

	function isPositionDone(pos) {
		const homeCounts = getHomeCounts()
		const visitorCounts = getVisitorCounts()
		const need = ROSTER_NEEDS[pos]
		return homeCounts[pos] >= need && visitorCounts[pos] >= need
	}

	function allPositionsDone() {
		return POSITION_ORDER.every(isPositionDone)
	}

	function renderPositionGroup() {
		main.textContent = ''

		if (currentPosition >= POSITION_ORDER.length) {
			if (allPositionsDone()) {
				showBattingOrder(overlay, homeRoster, visitorRoster, onComplete)
			}
			return
		}

		const pos = POSITION_ORDER[currentPosition]

		// Skip positions that are already fully drafted
		if (isPositionDone(pos)) {
			currentPosition++
			renderPositionGroup()
			return
		}

		const team = getCurrentTeam()
		const teamLabel = team === 'H' ? 'HOME' : 'VISITOR'
		const turnEl = document.getElementById('draft-turn')
		if (turnEl) {
			turnEl.textContent = `${POSITION_LABELS[pos]} — ${teamLabel} picks`
			turnEl.className = `draft-turn ${team === 'H' ? 'draft-turn-home' : 'draft-turn-visitor'}`
		}

		const section = el('div', { className: 'draft-section' })
		const grid = el('div', { className: 'draft-grid' })

		const available = grouped[pos].filter(p => !drafted.has(p.id))

		for (const player of available) {
			const card = createPlayerCard(player, (p, cardEl) => {
				drafted.add(p.id)
				if (team === 'H') {
					homeRoster.push(p)
				} else {
					visitorRoster.push(p)
				}

				cardEl.classList.add('draft-card-picked')
				cardEl.style.pointerEvents = 'none'

				updateRosterPanel('home', homeRoster)
				updateRosterPanel('visitor', visitorRoster)

				pickIndex[pos]++

				// Check if this position group is done
				if (isPositionDone(pos)) {
					currentPosition++
					setTimeout(() => renderPositionGroup(), 300)
				} else {
					// More picks needed in this position
					setTimeout(() => renderPositionGroup(), 200)
				}
			})
			grid.appendChild(card)
		}

		section.appendChild(grid)
		main.appendChild(section)
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

	const header = el('div', { className: 'draft-header' }, [
		el('h1', { textContent: 'SET BATTING ORDER' }),
		el('div', { className: 'draft-subtitle', textContent: 'Click two players on the same team to swap their positions' }),
	])

	const columns = el('div', { className: 'lineup-columns' })

	function renderColumns() {
		columns.textContent = ''

		const visCol = renderTeamOrder('VISITORS', visitorOrder, 'visitor')
		const homeCol = renderTeamOrder('HOME', homeOrder, 'home')

		columns.appendChild(visCol)
		columns.appendChild(homeCol)
	}

	function renderTeamOrder(label, order, team) {
		const col = el('div', { className: 'lineup-column' }, [
			el('div', { className: 'lineup-column-title', textContent: label }),
		])

		order.forEach((player, i) => {
			const isSelected = swapState.team === team && swapState.index === i
			const row = el('div', {
				className: `lineup-row ${isSelected ? 'lineup-row-selected' : ''}`,
			}, [
				el('span', { className: 'lineup-num', textContent: `${i + 1}.` }),
				el('span', { className: 'lineup-name', textContent: player.name }),
				el('span', { className: 'lineup-pos', textContent: POSITION_ABBR[player.position] }),
			])

			row.addEventListener('click', () => {
				if (swapState.team === null) {
					swapState = { team, index: i }
					renderColumns()
				} else if (swapState.team === team && swapState.index !== i) {
					const arr = team === 'home' ? homeOrder : visitorOrder
					const tmp = arr[swapState.index]
					arr[swapState.index] = arr[i]
					arr[i] = tmp
					swapState = { team: null, index: null }
					renderColumns()
				} else {
					swapState = { team: null, index: null }
					renderColumns()
				}
			})

			col.appendChild(row)
		})

		return col
	}

	const playBtn = el('button', {
		className: 'draft-btn draft-btn-play',
		textContent: 'PLAY BALL!',
	})
	playBtn.addEventListener('click', () => {
		overlay.remove()
		onComplete({
			homeLineup: [...homeOrder],
			visitorLineup: [...visitorOrder],
		})
	})

	const actionsArea = el('div', { className: 'draft-actions' }, [playBtn])

	overlay.appendChild(header)
	overlay.appendChild(columns)
	overlay.appendChild(actionsArea)

	renderColumns()
}

export function createQuickDraft(players, onComplete) {
	const overlay = createOverlay()

	const grouped = {}
	for (const pos of POSITION_ORDER) {
		grouped[pos] = [...players.filter(p => p.position === pos)]
	}

	const homeRoster = []
	const visitorRoster = []

	for (const pos of POSITION_ORDER) {
		const pool = grouped[pos]
		// Shuffle
		for (let i = pool.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1))
			;[pool[i], pool[j]] = [pool[j], pool[i]]
		}

		const need = ROSTER_NEEDS[pos]
		for (let i = 0; i < need && i < pool.length; i++) {
			homeRoster.push(pool[i])
		}
		for (let i = need; i < need * 2 && i < pool.length; i++) {
			visitorRoster.push(pool[i])
		}
	}

	// Shuffle batting orders
	const shuffle = (arr) => {
		for (let i = arr.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1))
			;[arr[i], arr[j]] = [arr[j], arr[i]]
		}
		return arr
	}

	shuffle(homeRoster)
	shuffle(visitorRoster)

	showBattingOrder(overlay, homeRoster, visitorRoster, onComplete)
}
