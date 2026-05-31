import { loadPlayers } from './data/players.js'
import { createGame, getCurrentBatter, getScore, isGameOver, setPhase, recordResult } from './game/state.js'
import { resolveBatting, spin } from './game/batting.js'
import { resolveImmediate } from './game/baserunning.js'
import { resolveKoDial } from './game/ko-dial.js'
import { resolveStrategy, getAvailableStrategies } from './game/strategy.js'
import { STRATEGY_DISC } from './game/rules.js'
import { createBoard } from './ui/board.js'
import { createDiscSVG, createStrategyDiscSVG } from './ui/disc.js'
import { createSpinner, spinTo, getKoLetter, getStrategyLetter } from './ui/spinner.js'
import { createDiamond, updateRunners } from './ui/diamond.js'
import { createScoreboard, updateScoreboard } from './ui/scoreboard.js'
import { createNarrator, narrate } from './ui/narrator.js'
import { createControls } from './ui/controls.js'
import { startDraft, createQuickDraft } from './ui/lineup.js'

const RESULT_LABELS = {
	'home-run': 'Home Run',
	'triple': 'Triple',
	'double': 'Double',
	'single': 'Single',
	'walk': 'Walk',
	'strikeout': 'Strikeout',
	'fly-ball': 'Fly Ball',
	'ground-ball': 'Ground Ball'
}

document.addEventListener('DOMContentLoaded', async () => {
	const container = document.getElementById('game')

	// --- 1. Startup: load players and draft ---
	let players
	try {
		players = await loadPlayers('data/players.json')
	} catch (err) {
		container.textContent = `Failed to load players: ${err.message}`
		return
	}

	if (players.length < 18) {
		container.textContent = `Not enough players to form two teams (need 18, got ${players.length}).`
		return
	}

	// Show start screen with draft choice
	showStartScreen(container, players)
})

function showStartScreen(container, players) {
	const overlay = document.createElement('div')
	overlay.className = 'draft-overlay'
	overlay.style.justifyContent = 'center'
	overlay.style.alignItems = 'center'

	const content = document.createElement('div')
	content.style.textAlign = 'center'

	const title = document.createElement('h1')
	title.textContent = 'JONRÓN BASEBALL'
	title.style.color = 'var(--yellow)'
	title.style.fontSize = '36px'
	title.style.marginBottom = '48px'

	const draftBtn = document.createElement('button')
	draftBtn.className = 'draft-btn draft-btn-play'
	draftBtn.textContent = 'DRAFT TEAMS'
	draftBtn.style.display = 'block'
	draftBtn.style.width = '240px'
	draftBtn.style.marginBottom = '16px'
	draftBtn.addEventListener('click', () => {
		overlay.remove()
		startDraft(players, ({ homeLineup, visitorLineup }) => {
			startGame(container, homeLineup, visitorLineup)
		})
	})

	const quickBtn = document.createElement('button')
	quickBtn.className = 'draft-btn'
	quickBtn.textContent = 'QUICK START'
	quickBtn.style.display = 'block'
	quickBtn.style.width = '240px'
	quickBtn.style.background = 'var(--blue)'
	quickBtn.style.color = 'var(--cream)'
	quickBtn.addEventListener('click', () => {
		overlay.remove()
		createQuickDraft(players, ({ homeLineup, visitorLineup }) => {
			startGame(container, homeLineup, visitorLineup)
		})
	})

	content.appendChild(title)
	content.appendChild(draftBtn)
	content.appendChild(quickBtn)
	overlay.appendChild(content)
	document.body.appendChild(overlay)
}

function startGame(container, homeLineup, visitorLineup) {
	container.textContent = ''

	// --- 2. Game setup ---
	const game = createGame(homeLineup, visitorLineup)

	const scoreboard = createScoreboard(container)

	const board = createBoard(container)

	const diamond = createDiamond(board.svg, 190, 210, 155)
	const spinner = createSpinner(board.svg, 540, 210, 150, 'AT BAT')

	// Narrator + controls side by side
	const actionRow = document.createElement('div')
	actionRow.className = 'action-row'
	container.appendChild(actionRow)

	const narratorEl = createNarrator(actionRow)

	const controls = createControls(actionRow, {
		onSpin: () => handleSpin(),
		onStrategy: (playType) => handleStrategy(playType),
		onIntentionalWalk: () => handleIntentionalWalk()
	})

	// --- Helper: place current batter's disc on the spinner ---
	function placeBatterDisc() {
		const batter = getCurrentBatter(game)
		const discSvg = createDiscSVG(batter, 0, 0, 120)
		spinner.setDisc(discSvg)
	}

	// --- Helper: find the angle range for a given sector on the current batter's disc ---
	function getAngleForSector(disc, sectorNumber) {
		const totalSize = disc.sectors.reduce((sum, s) => sum + s.size, 0)
		let currentAngle = 0
		for (const sector of disc.sectors) {
			const sectorAngle = (sector.size / totalSize) * 360
			if (sector.number === sectorNumber) {
				return currentAngle + Math.random() * sectorAngle
			}
			currentAngle += sectorAngle
		}
		return Math.random() * 360
	}

	// --- Helper: refresh all UI ---
	function refreshUI() {
		const batter = getCurrentBatter(game)
		updateRunners(diamond, game.bases)
		updateScoreboard(scoreboard, {
			inning: game.inning,
			halfInning: game.halfInning,
			outs: game.outs,
			score: game.score,
			stats: game.stats,
			currentBatter: batter
		})
		const strategies = getAvailableStrategies(game.bases)
		controls.updateStrategies(strategies)
	}

	// --- Helper: ordinal word for innings ---
	function inningOrdinal(n) {
		const words = ['', 'first', 'second', 'third', 'fourth', 'fifth',
			'sixth', 'seventh', 'eighth', 'ninth']
		if (n >= 1 && n <= 9) return `the ${words[n]}`
		const s = ['th', 'st', 'nd', 'rd']
		const v = n % 100
		return `the ${n}${s[(v - 20) % 10] || s[v] || s[0]}`
	}

	// --- Helper: show game over overlay ---
	function showGameOver() {
		controls.disable()

		const { home, visitor } = getScore(game)
		const winner = home > visitor ? 'Home' : 'Visitors'

		const overlay = document.createElement('div')
		overlay.className = 'draft-overlay'
		overlay.style.display = 'flex'
		overlay.style.justifyContent = 'center'
		overlay.style.alignItems = 'center'

		const content = document.createElement('div')
		content.style.textAlign = 'center'

		const heading = document.createElement('h1')
		heading.textContent = 'GAME OVER'
		heading.style.color = 'var(--yellow)'
		heading.style.fontSize = '36px'
		heading.style.marginBottom = '16px'

		const result = document.createElement('div')
		result.style.fontSize = '24px'
		result.style.color = 'var(--cream)'
		result.style.marginBottom = '8px'
		result.textContent = `${winner} win!`

		const scoreDisplay = document.createElement('div')
		scoreDisplay.style.fontSize = '20px'
		scoreDisplay.style.color = 'var(--cream)'
		scoreDisplay.style.marginBottom = '32px'
		scoreDisplay.textContent = `Visitors ${visitor} — Home ${home}`

		const playAgain = document.createElement('button')
		playAgain.className = 'draft-btn draft-btn-play'
		playAgain.textContent = 'Play Again'
		playAgain.addEventListener('click', () => {
			overlay.remove()
			location.reload()
		})

		content.appendChild(heading)
		content.appendChild(result)
		content.appendChild(scoreDisplay)
		content.appendChild(playAgain)
		overlay.appendChild(content)
		document.body.appendChild(overlay)
	}

	// --- Helper: check for half-inning transition or game over after a result ---
	function afterResult(previousHalf, previousInning) {
		spinner.clearDisc()

		if (game.phase === 'game-over') {
			narrate(narratorEl, 'Game over!', { highlight: true })
			const { home, visitor } = getScore(game)
			narrate(narratorEl, `Final score — Visitors: ${visitor}, Home: ${home}`, { highlight: true })
			refreshUI()
			showGameOver()
			return
		}

		// Check if half-inning flipped (3 outs were recorded)
		if (game.halfInning !== previousHalf || game.inning !== previousInning) {
			const breakLabel = previousHalf === 'top' ? 'Middle' : 'End'
			const { home, visitor } = getScore(game)
			narrate(narratorEl, `3 outs. ${breakLabel} of ${inningOrdinal(previousInning)}. Visitors: ${visitor}, Home: ${home}`, { highlight: true })

			// Check if game is over after the flip
			if (isGameOver(game)) {
				game.phase = 'game-over'
				narrate(narratorEl, 'Game over!', { highlight: true })
				narrate(narratorEl, `Final score — Visitors: ${visitor}, Home: ${home}`, { highlight: true })
				refreshUI()
				showGameOver()
				return
			}

			// Brief delay before next at-bat
			refreshUI()
			updateRunners(diamond, game.bases)
			controls.disable()
			setTimeout(() => {
				placeBatterDisc()
				const batter = getCurrentBatter(game)
				narrate(narratorEl, `${batter.name} steps to the plate.`)
				refreshUI()
				controls.setPhase('batting')
				controls.enable()
			}, 1200)
			return
		}

		// Normal next at-bat (no inning change)
		placeBatterDisc()
		const batter = getCurrentBatter(game)
		narrate(narratorEl, `${batter.name} steps to the plate.`)
		refreshUI()
		controls.setPhase('batting')
		controls.enable()
	}

	// --- Helper: narrate the result of a play ---
	function narrateResult(resultType, result, batter) {
		const runs = result.runsScored || 0
		const label = RESULT_LABELS[resultType] || resultType
		const isHit = ['home-run', 'triple', 'double', 'single'].includes(resultType)
		const runsText = runs > 0 ? ` ${runs} run${runs !== 1 ? 's' : ''} score${runs === 1 ? 's' : ''}.` : ''

		if (resultType === 'home-run') {
			narrate(narratorEl, `${label}! ${batter.name} circles the bases.${runsText}`, { highlight: true })
		} else if (resultType === 'triple') {
			narrate(narratorEl, `${label}! ${batter.name} slides into third.${runsText}`, { highlight: isHit })
		} else if (resultType === 'double') {
			narrate(narratorEl, `${label}! ${batter.name} pulls into second.${runsText}`, { highlight: isHit })
		} else if (resultType === 'walk') {
			narrate(narratorEl, `${label}. ${batter.name} takes first.${runsText}`)
		} else if (resultType === 'strikeout') {
			narrate(narratorEl, `Strikeout! ${batter.name} goes down swinging.`)
		} else if (result.description) {
			narrate(narratorEl, `${result.description}`)
		} else {
			narrate(narratorEl, `${label}. ${result.outs} out${result.outs !== 1 ? 's' : ''}.`)
		}
	}

	// --- 3. Game loop: event-driven callbacks ---

	async function handleSpin() {
		if (game.phase !== 'batting') return
		controls.disable()

		const batter = getCurrentBatter(game)
		const sectorNumber = spin(batter)
		const targetAngle = getAngleForSector(batter, sectorNumber)

		await spinTo(spinner, targetAngle)

		const batting = resolveBatting(sectorNumber)
		const label = RESULT_LABELS[batting.type] || batting.type

		if (batting.needsKoDial) {
			narrate(narratorEl, `${sectorNumber} — ${label}...`)

			// Gray out the disc during K-O spin
			const discContainer = spinner.element.querySelector('.disc-container')
			if (discContainer) discContainer.style.opacity = '0.25'

			await new Promise(r => setTimeout(r, 1000))

			// Auto K-O spin — angle determines letter via sector layout
			const koAngle = Math.random() * 360
			const letter = getKoLetter(koAngle)

			await spinTo(spinner, koAngle)

			// Restore disc opacity
			if (discContainer) discContainer.style.opacity = ''

			const previousHalf = game.halfInning
			const previousInning = game.inning

			const hasRunners = game.bases.first || game.bases.second || game.bases.third
			const result = resolveKoDial(letter, batting.type, game.bases)
			const desc = hasRunners
				? result.description
				: result.description.replace(/,\s.+/, '')
			narrate(narratorEl, `${letter} — ${desc}`)

			recordResult(game, result)
			afterResult(previousHalf, previousInning)
		} else {
			const previousHalf = game.halfInning
			const previousInning = game.inning
			const result = resolveImmediate(batting.type, game.bases, batter.id)

			narrate(narratorEl, `${sectorNumber} — ${label}!`)
			narrateResult(batting.type, result, batter)
			recordResult(game, result)

			afterResult(previousHalf, previousInning)
		}
	}

	async function handleStrategy(playType) {
		controls.disable()
		setPhase(game, 'strategy')

		const ring = STRATEGY_DISC[playType]

		const strategyDisc = createStrategyDiscSVG(0, 0, 120, ring)
		spinner.setDisc(strategyDisc)
		spinner.setLabel('STRATEGY')
		spinner.hideKoRing()

		const targetAngle = Math.random() * 360
		narrate(narratorEl, `Strategy: ${playType.replace(/-/g, ' ')}...`)
		await spinTo(spinner, targetAngle)

		const letter = getStrategyLetter(targetAngle, ring)

		const previousHalf = game.halfInning
		const previousInning = game.inning

		const result = resolveStrategy(playType, letter, game.bases)
		narrate(narratorEl, `${letter} — ${result.description}`)

		recordResult(game, result)

		spinner.showKoRing()
		spinner.setLabel('AT BAT')
		afterResult(previousHalf, previousInning)
	}

	function handleIntentionalWalk() {
		controls.disable()

		const batter = getCurrentBatter(game)
		const previousHalf = game.halfInning
		const previousInning = game.inning

		const result = resolveImmediate('walk', game.bases, batter.id)
		narrate(narratorEl, `Intentional walk to ${batter.name}.`)
		recordResult(game, result)

		afterResult(previousHalf, previousInning)
	}

	// --- 4. Initialize first at-bat ---
	placeBatterDisc()
	const firstBatter = getCurrentBatter(game)
	narrate(narratorEl, 'Play ball!')
	narrate(narratorEl, `${firstBatter.name} steps to the plate.`)
	refreshUI()
	controls.setPhase('batting')
	controls.enable()
}
