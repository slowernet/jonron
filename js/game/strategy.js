import { STRATEGY, STRATEGY_REQUIREMENTS } from './rules.js'

const BATTER_OUT = new Set(['grounds-out', 'flies-out', 'pops-out', 'lines-out'])
const BATTER_SAFE_1B = new Set(['singles', 'beats-out-bunt', 'safe-at-1b'])
const BATTER_HIT = new Set(['singles', 'beats-out-bunt'])

export function getAvailableStrategies(bases) {
	const available = []
	for (const [playType, reqs] of Object.entries(STRATEGY_REQUIREMENTS)) {
		let met = true
		for (const [base, needed] of Object.entries(reqs)) {
			if (needed && !bases[base]) {
				met = false
				break
			}
		}
		if (met) available.push(playType)
	}
	return available
}

export function resolveStrategy(playType, letter, bases) {
	const entry = STRATEGY[playType]?.[letter]
	if (!entry) {
		throw new Error(`Invalid strategy: ${playType} ${letter}`)
	}

	const batterCode = entry.batter
	const runnerCode = entry.runners

	// Resolve batter
	const batterOut = BATTER_OUT.has(batterCode)
	let batterBase = null
	if (BATTER_SAFE_1B.has(batterCode)) {
		batterBase = 1
	}

	let outs = batterOut ? 1 : 0
	const runners = []
	let runsScored = 0

	const r1 = bases.first || null
	const r2 = bases.second || null
	const r3 = bases.third || null

	switch (runnerCode) {
		case 'advance-1': {
			if (r3) {
				runners.push({ from: 3, to: 4, out: false, scored: true })
				runsScored++
			}
			if (r2) {
				runners.push({ from: 2, to: 3, out: false, scored: false })
			}
			if (r1) {
				runners.push({ from: 1, to: 2, out: false, scored: false })
			}
			break
		}
		case 'advance-2': {
			if (r3) {
				runners.push({ from: 3, to: 4, out: false, scored: true })
				runsScored++
			}
			if (r2) {
				runners.push({ from: 2, to: 4, out: false, scored: true })
				runsScored++
			}
			if (r1) {
				runners.push({ from: 1, to: 3, out: false, scored: false })
			}
			break
		}
		case 'hold': {
			if (r3) runners.push({ from: 3, to: 3, out: false, scored: false })
			if (r2) runners.push({ from: 2, to: 2, out: false, scored: false })
			if (r1) runners.push({ from: 1, to: 1, out: false, scored: false })
			break
		}
		case 'safe-at-2b-hold-3b': {
			if (r3) runners.push({ from: 3, to: 3, out: false, scored: false })
			if (r1) runners.push({ from: 1, to: 2, out: false, scored: false })
			break
		}
		case 'out-at-2b-hold-3b': {
			if (r3) runners.push({ from: 3, to: 3, out: false, scored: false })
			if (r1) {
				runners.push({ from: 1, to: 2, out: true, scored: false })
				outs++
			}
			break
		}
		case 'safe-at-2b-out-at-home': {
			if (r3) {
				runners.push({ from: 3, to: 4, out: true, scored: false })
				outs++
			}
			if (r1) runners.push({ from: 1, to: 2, out: false, scored: false })
			break
		}
		case 'out-at-plate-others-advance-1': {
			if (r3) {
				runners.push({ from: 3, to: 4, out: true, scored: false })
				outs++
			}
			if (r2) runners.push({ from: 2, to: 3, out: false, scored: false })
			if (r1) runners.push({ from: 1, to: 2, out: false, scored: false })
			break
		}
		case 'caught-off-3b-dp': {
			if (r3) {
				runners.push({ from: 3, to: 3, out: true, scored: false })
				outs++
			}
			break
		}
		case 'safe-at-3b': {
			if (r2) runners.push({ from: 2, to: 3, out: false, scored: false })
			break
		}
		case 'out-at-3b': {
			if (r2) {
				runners.push({ from: 2, to: 3, out: true, scored: false })
				outs++
			}
			break
		}
		case 'runner-scores': {
			if (r2) {
				runners.push({ from: 2, to: 4, out: false, scored: true })
				runsScored++
			}
			break
		}
		case 'caught-off-2b-dp': {
			if (r2) {
				runners.push({ from: 2, to: 2, out: true, scored: false })
				outs++
			}
			break
		}
		case 'out-at-3b-safe-at-2b': {
			if (r2) {
				runners.push({ from: 2, to: 3, out: true, scored: false })
				outs++
			}
			if (r1) runners.push({ from: 1, to: 2, out: false, scored: false })
			break
		}
		case 'out-at-2b-dp-safe-at-3b': {
			if (r2) runners.push({ from: 2, to: 3, out: false, scored: false })
			if (r1) {
				runners.push({ from: 1, to: 2, out: true, scored: false })
				outs++
			}
			break
		}
		case 'out-at-2b': {
			if (r1) {
				runners.push({ from: 1, to: 2, out: true, scored: false })
				outs++
			}
			break
		}
		case 'out-at-2b-dp': {
			if (r1) {
				runners.push({ from: 1, to: 2, out: true, scored: false })
				outs++
			}
			break
		}
		case 'caught-off-2b-hold-1b': {
			if (r2) {
				runners.push({ from: 2, to: 2, out: true, scored: false })
				outs++
			}
			if (r1) runners.push({ from: 1, to: 1, out: false, scored: false })
			break
		}
		default:
			throw new Error(`Unknown runner outcome code: ${runnerCode}`)
	}

	return {
		batter: { result: batterCode, base: batterBase, out: batterOut },
		outs,
		runners,
		runsScored,
		description: entry.description,
		isHit: BATTER_HIT.has(batterCode),
		isError: false
	}
}
