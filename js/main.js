import { loadPlayers } from './data/players.js'
import { createGame, getCurrentBatter, getScore, isGameOver, setPhase, recordResult } from './game/state.js'
import { resolveBatting, spin } from './game/batting.js'
import { resolveImmediate } from './game/baserunning.js'
import { resolveKoDial } from './game/ko-dial.js'
import { resolveStrategy, getAvailableStrategies } from './game/strategy.js'
import { STRATEGY_DISC } from './game/rules.js'
import { createLayout } from './ui/board.js'
import { createDiscSVG, createStrategyDiscSVG } from './ui/disc.js'
import { createSpinner, spinTo, getKoLetter, getStrategyLetter } from './ui/spinner.js'
import { createScoreboard, updateScoreboard } from './ui/scoreboard.js'
import { createNarrator, narrate } from './ui/narrator.js'
import { createControls } from './ui/controls.js'
import { startDraft, createQuickDraft } from './ui/lineup.js'

const RESULT_LABELS = {
	'home-run': 'Home Run', triple: 'Triple', double: 'Double', single: 'Single',
	walk: 'Walk', strikeout: 'Strikeout', 'fly-ball': 'Fly ball', 'ground-ball': 'Ground ball'
}
const POSITION_ABBR = {
	pitcher: 'P', catcher: 'C', 'first-base': '1B', 'second-base': '2B',
	shortstop: 'SS', 'third-base': '3B', outfield: 'OF'
}
const BATTERY = new Set(['pitcher', 'catcher'])
const OUTFIELD = new Set(['outfield'])
function posClass(position) {
	if (BATTERY.has(position)) return 'pos-battery'
	if (OUTFIELD.has(position)) return 'pos-outfield'
	return 'pos-infield'
}

// ---------- Theme ----------
// Committed to Night mode.
const THEME_KEY = 'jonron-theme'
function getTheme() { return 'night' }
function applyTheme(theme) {
	localStorage.setItem(THEME_KEY, theme)
	document.documentElement.setAttribute('data-theme', theme)
	document.querySelectorAll('.jr-overlay').forEach(o => o.setAttribute('data-theme', theme))
	window.__jrLayout?.setTheme(theme)
	document.querySelectorAll('[data-theme-toggle]').forEach(t => {
		t.querySelectorAll('button').forEach(b => b.classList.toggle('active', b.dataset.theme === theme))
	})
}

// Build a dimensional, angled baseball with paired chevron stitches along the seams
function baseballMarkup() {
	const cub = (t, a, b, c, d) => {
		const m = 1 - t
		return m * m * m * a + 3 * m * m * t * b + 3 * m * t * t * c + t * t * t * d
	}
	const cubD = (t, a, b, c, d) => {
		const m = 1 - t
		return 3 * m * m * (b - a) + 6 * m * t * (c - b) + 3 * t * t * (d - c)
	}
	// two seam curves framing the centre panel: left reads ")", right reads "("
	// (each seam's concave side faces the outer edge of the ball)
	const seams = [
		{ x: [26, 42, 42, 26], y: [13, 35, 65, 87] },
		{ x: [74, 58, 58, 74], y: [13, 35, 65, 87] }
	]
	let stitches = ''
	for (const s of seams) {
		for (let i = 0; i <= 14; i++) {
			const t = 0.06 + i * 0.062
			const px = cub(t, ...s.x)
			const py = cub(t, ...s.y)
			let dx = cubD(t, ...s.x)
			let dy = cubD(t, ...s.y)
			const len = Math.hypot(dx, dy) || 1
			const ux = dx / len, uy = dy / len
			const nx = -uy, ny = ux
			const ax = (px + ux * 1.6).toFixed(1), ay = (py + uy * 1.6).toFixed(1)
			const a1x = (px - ux * 2.1 + nx * 3.4).toFixed(1), a1y = (py - uy * 2.1 + ny * 3.4).toFixed(1)
			const a2x = (px - ux * 2.1 - nx * 3.4).toFixed(1), a2y = (py - uy * 2.1 - ny * 3.4).toFixed(1)
			stitches += `<path d="M${a1x} ${a1y} L${ax} ${ay} L${a2x} ${a2y}"/>`
		}
	}
	return `<svg viewBox="0 0 100 100" aria-hidden="true">
		<defs>
			<radialGradient id="jrBall" cx="37%" cy="33%" r="74%">
				<stop offset="0%" stop-color="#ffffff"/>
				<stop offset="54%" stop-color="#f3ece0"/>
				<stop offset="100%" stop-color="#e2d7c1"/>
			</radialGradient>
		</defs>
		<circle cx="50" cy="50" r="45" fill="url(#jrBall)" stroke="var(--navy)" stroke-width="2"/>
		<path d="M50 95 A45 45 0 0 0 93 64 A60 60 0 0 1 50 95 Z" fill="#15233f" opacity="0.07"/>
		<g transform="rotate(11 50 50)">
			<path d="M26 13 C42 35 42 65 26 87" fill="none" stroke="#c4382c" stroke-width="0.9" opacity="0.45"/>
			<path d="M74 13 C58 35 58 65 74 87" fill="none" stroke="#c4382c" stroke-width="0.9" opacity="0.45"/>
			<g fill="none" stroke="#cc3a2d" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${stitches}</g>
		</g>
	</svg>`
}

document.addEventListener('DOMContentLoaded', async () => {
	document.documentElement.setAttribute('data-theme', getTheme())
	const container = document.getElementById('game')
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
	showStartScreen(container, players)
})

function showStartScreen(container, players) {
	const overlay = document.createElement('div')
	overlay.className = 'jr-overlay'
	overlay.setAttribute('data-theme', getTheme())

	const title = document.createElement('div')
	title.className = 'jr-title'
	title.innerHTML = `
		<div class="crest">${baseballMarkup()}</div>
		<h1>JON<span>RÓN</span></h1>
		<div class="jr-title-actions"></div>`
	const actions = title.querySelector('.jr-title-actions')

	const draftBtn = document.createElement('button')
	draftBtn.className = 'jr-cta jr-cta-primary'
	draftBtn.textContent = 'Draft Teams'
	draftBtn.addEventListener('click', () => {
		overlay.remove()
		startDraft(players, ({ homeLineup, visitorLineup }) => startGame(container, homeLineup, visitorLineup))
	})

	const quickBtn = document.createElement('button')
	quickBtn.className = 'jr-cta jr-cta-primary'
	quickBtn.textContent = 'Quick Start'
	quickBtn.addEventListener('click', () => {
		overlay.remove()
		createQuickDraft(players, ({ homeLineup, visitorLineup }) => startGame(container, homeLineup, visitorLineup))
	})

	actions.append(draftBtn, quickBtn)
	overlay.appendChild(title)
	document.body.appendChild(overlay)
}

function startGame(container, homeLineup, visitorLineup) {
	const game = createGame(homeLineup, visitorLineup)

	const layout = createLayout(container, {
		theme: getTheme(),
		onTheme: applyTheme
	})
	window.__jrLayout = layout

	const scoreboard = createScoreboard(layout.scoreboardHost)
	const { cx: scx, cy: scy, r: sr } = layout.spinnerCenter
	const spinner = createSpinner(layout.spinnerSvg, scx, scy, sr, 'AT BAT')
	const narratorEl = createNarrator(layout.narratorHost)
	const controls = createControls(layout.controlsHost, {
		onSpin: () => handleSpin(),
		onStrategy: (playType) => handleStrategy(playType),
		onIntentionalWalk: () => handleIntentionalWalk()
	})

	function placeBatterDisc() {
		const batter = getCurrentBatter(game)
		spinner.setDisc(createDiscSVG(batter, 0, 0, 120))
	}

	function getAngleForSector(disc, sectorNumber) {
		const totalSize = disc.sectors.reduce((sum, s) => sum + s.size, 0)
		let currentAngle = 0
		for (const sector of disc.sectors) {
			const sectorAngle = (sector.size / totalSize) * 360
			if (sector.number === sectorNumber) return currentAngle + Math.random() * sectorAngle
			currentAngle += sectorAngle
		}
		return Math.random() * 360
	}

	function refreshUI() {
		const batter = getCurrentBatter(game)
		updateScoreboard(scoreboard, {
			inning: game.inning, halfInning: game.halfInning, outs: game.outs,
			score: game.score, stats: game.stats, currentBatter: batter
		})
		const { home, visitor } = getScore(game)
		layout.setInning(`${game.halfInning === 'bottom' ? 'Bot' : 'Top'} ${game.inning}`)
		layout.setScore(visitor, home)
		layout.setOuts(game.outs)
		layout.setBases(game.bases)
		layout.setBatting(game.halfInning === 'top' ? 'away' : 'home')
		layout.nameplate.posEl.textContent = POSITION_ABBR[batter.position] ?? '—'
		layout.nameplate.posEl.className = `pos ${posClass(batter.position)}`
		layout.nameplate.nameEl.textContent = batter.name
		controls.updateStrategies(getAvailableStrategies(game.bases))
	}

	function inningOrdinal(n) {
		const words = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth']
		if (n >= 1 && n <= 9) return `the ${words[n]}`
		const s = ['th', 'st', 'nd', 'rd']
		const v = n % 100
		return `the ${n}${s[(v - 20) % 10] || s[v] || s[0]}`
	}

	function showGameOver() {
		controls.disable()
		const { home, visitor } = getScore(game)
		const homeWins = home > visitor
		const overlay = document.createElement('div')
		overlay.className = 'jr-overlay'
		overlay.setAttribute('data-theme', getTheme())
		const final = document.createElement('div')
		final.className = 'jr-final'
		final.innerHTML = `
			<div class="kicker">Final</div>
			<h1>Ballgame</h1>
			<div class="winner">${homeWins ? 'Home' : 'Visitors'} win it!</div>
			<div class="jr-final-box">
				<div class="jr-final-team ${homeWins ? '' : 'win'}"><div class="t">Visitors</div><div class="r">${visitor}</div></div>
				<div class="jr-final-team ${homeWins ? 'win' : ''}"><div class="t">Home</div><div class="r">${home}</div></div>
			</div>
			<div class="jr-title-actions"></div>`
		const again = document.createElement('button')
		again.className = 'jr-cta jr-cta-primary'
		again.textContent = 'Play Again'
		again.addEventListener('click', () => location.reload())
		final.querySelector('.jr-title-actions').appendChild(again)
		overlay.appendChild(final)
		document.body.appendChild(overlay)
	}

	function afterResult(previousHalf, previousInning) {
		spinner.clearDisc()
		if (game.phase === 'game-over') {
			narrate(narratorEl, 'Game over!', { highlight: true })
			const { home, visitor } = getScore(game)
			narrate(narratorEl, `Final — Visitors ${visitor}, Home ${home}`, { highlight: true })
			refreshUI()
			showGameOver()
			return
		}
		if (game.halfInning !== previousHalf || game.inning !== previousInning) {
			const breakLabel = previousHalf === 'top' ? 'Middle' : 'End'
			const { home, visitor } = getScore(game)
			narrate(narratorEl, `Three away. ${breakLabel} of ${inningOrdinal(previousInning)}. Visitors ${visitor}, Home ${home}.`, { highlight: true })
			if (isGameOver(game)) {
				game.phase = 'game-over'
				narrate(narratorEl, 'Game over!', { highlight: true })
				narrate(narratorEl, `Final — Visitors ${visitor}, Home ${home}`, { highlight: true })
				refreshUI()
				showGameOver()
				return
			}
			refreshUI()
			controls.disable()
			setTimeout(() => {
				placeBatterDisc()
				narrate(narratorEl, `${getCurrentBatter(game).name} steps in.`)
				refreshUI()
				controls.setPhase('batting')
				controls.enable()
			}, 1200)
			return
		}
		placeBatterDisc()
		narrate(narratorEl, `${getCurrentBatter(game).name} steps in.`)
		refreshUI()
		controls.setPhase('batting')
		controls.enable()
	}

	function narrateResult(resultType, result, batter) {
		const runs = result.runsScored || 0
		const label = RESULT_LABELS[resultType] || resultType
		const isHit = ['home-run', 'triple', 'double', 'single'].includes(resultType)
		const runsText = runs > 0 ? ` ${runs} run${runs !== 1 ? 's' : ''} score${runs === 1 ? 's' : ''}.` : ''
		if (resultType === 'home-run') narrate(narratorEl, `Jonrón! ${batter.name} circles the bases.${runsText}`, { highlight: true })
		else if (resultType === 'triple') narrate(narratorEl, `${label}! ${batter.name} slides into third.${runsText}`, { highlight: isHit })
		else if (resultType === 'double') narrate(narratorEl, `${label}! ${batter.name} pulls into second.${runsText}`, { highlight: isHit })
		else if (resultType === 'walk') narrate(narratorEl, `${label}. ${batter.name} takes first.${runsText}`)
		else if (resultType === 'strikeout') narrate(narratorEl, `Strikeout! ${batter.name} goes down swinging.`)
		else if (result.description) narrate(narratorEl, `${result.description}`)
		else narrate(narratorEl, `${label}. ${result.outs} out${result.outs !== 1 ? 's' : ''}.`)
	}

	async function handleSpin() {
		if (game.phase !== 'batting') return
		controls.disable()
		const batter = getCurrentBatter(game)
		const sectorNumber = spin(batter)
		const targetAngle = getAngleForSector(batter, sectorNumber)
		spinner.hideKoRing()
		await spinTo(spinner, targetAngle)
		const batting = resolveBatting(sectorNumber)
		const label = RESULT_LABELS[batting.type] || batting.type
		if (batting.needsKoDial) {
			narrate(narratorEl, `${label}...`)
			const discContainer = spinner.element.querySelector('.disc-container')
			if (discContainer) discContainer.style.opacity = '0.25'
			spinner.showKoRing()
			await new Promise(r => setTimeout(r, 1000))
			const koAngle = Math.random() * 360
			const letter = getKoLetter(koAngle)
			await spinTo(spinner, koAngle)
			if (discContainer) discContainer.style.opacity = ''
			const previousHalf = game.halfInning
			const previousInning = game.inning
			const hasRunners = game.bases.first || game.bases.second || game.bases.third
			const result = resolveKoDial(letter, batting.type, game.bases)
			const desc = hasRunners ? result.description : result.description.replace(/,\s.+/, '')
			narrate(narratorEl, `${label}... ${desc}`, { replace: true })
			recordResult(game, result)
			afterResult(previousHalf, previousInning)
		} else {
			spinner.showKoRing()
			const previousHalf = game.halfInning
			const previousInning = game.inning
			const result = resolveImmediate(batting.type, game.bases, batter.id)
			narrateResult(batting.type, result, batter)
			recordResult(game, result)
			afterResult(previousHalf, previousInning)
		}
	}

	async function handleStrategy(playType) {
		controls.disable()
		setPhase(game, 'strategy')
		const ring = STRATEGY_DISC[playType]
		spinner.setDisc(createStrategyDiscSVG(0, 0, 120, ring))
		spinner.hideKoRing()
		const targetAngle = Math.random() * 360
		narrate(narratorEl, `Strategy in motion...`)
		await spinTo(spinner, targetAngle)
		const letter = getStrategyLetter(targetAngle, ring)
		const previousHalf = game.halfInning
		const previousInning = game.inning
		const result = resolveStrategy(playType, letter, game.bases)
		narrate(narratorEl, result.description)
		recordResult(game, result)
		spinner.showKoRing()
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

	placeBatterDisc()
	narrate(narratorEl, 'Play ball!')
	narrate(narratorEl, `${getCurrentBatter(game).name} steps in.`)
	refreshUI()
	controls.setPhase('batting')
	controls.enable()
	layout.syncHeight()
}
