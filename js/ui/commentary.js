import { fullName } from '../data/players.js'

const BASE_NAMES = { 1: 'first', 2: 'second', 3: 'third' }

// ---- Weighted decay picker ----
const _counts = new Map()

export function pick(category, templates, rand = Math.random) {
	if (templates.length === 0) return ''
	if (templates.length === 1) return templates[0]

	const weights = templates.map((_, i) => {
		const count = _counts.get(`${category}:${i}`) ?? 0
		return 1 / (1 + count)
	})
	const total = weights.reduce((a, b) => a + b, 0)
	let r = rand() * total
	let idx = 0
	for (let i = 0; i < weights.length; i++) {
		r -= weights[i]
		if (r <= 0) { idx = i; break }
	}

	const key = `${category}:${idx}`
	_counts.set(key, (_counts.get(key) ?? 0) + 1)

	// Reset when all in category used at least twice
	const allHigh = templates.every((_, i) =>
		(_counts.get(`${category}:${i}`) ?? 0) >= 2
	)
	if (allHigh) {
		templates.forEach((_, i) => _counts.delete(`${category}:${i}`))
	}

	return templates[idx]
}

export function resetPicker() {
	_counts.clear()
}

// ---- Helpers ----

function resolveRunnerName(fromBase, bases, nameOf) {
	const playerId = bases[BASE_NAMES[fromBase]]
	return playerId ? nameOf(playerId) : 'the runner'
}

function formatScorers(names) {
	if (names.length === 0) return ''
	if (names.length === 1) return ` ${names[0]} scores.`
	if (names.length === 2) return ` ${names[0]} and ${names[1]} score.`
	const last = names[names.length - 1]
	const rest = names.slice(0, -1)
	return ` ${rest.join(', ')}, and ${last} score.`
}

function narrateRunners(runners, bases, nameOf, { skipOuts = false } = {}) {
	const parts = []
	for (const r of runners) {
		const rName = resolveRunnerName(r.from, bases, nameOf)
		if (r.scored && !r.out) {
			parts.push(`${rName} scores.`)
		} else if (r.out && !skipOuts) {
			if (r.to === 4) {
				parts.push(`${rName} is out at the plate.`)
			} else if (r.to === r.from) {
				parts.push(`${rName} is doubled off.`)
			} else {
				parts.push(`${rName} is thrown out.`)
			}
		}
	}
	return parts.join(' ')
}

// ---- Public API ----

export function commentBatterUp(batter) {
	const name = fullName(batter)
	const last = batter.nameLast
	const text = pick('batter-up', [
		`${name} steps in.`,
		`${last} digs in.`,
		`${name} steps to the plate.`,
		`${name} comes up to bat.`,
	])
	return { text, highlight: false }
}

export function commentImmediate(type, result, batter, nameOf) {
	const name = fullName(batter)
	const last = batter.nameLast

	// Collect scorer names (exclude batter for HR — template covers it)
	const scorerNames = (result.events ?? [])
		.filter(e => e.type === 'score' && e.player !== batter.id)
		.map(e => nameOf?.(e.player) ?? 'a runner')
	const runs = formatScorers(scorerNames)

	if (type === 'home-run') {
		if (result.runsScored >= 4) {
			return { text: `Grand slam! ${name} clears the bases!`, highlight: true }
		}
		const text = pick('home-run', [
			`Jonrón! ${name} goes deep.${runs}`,
			`${name} sends it out! Home run!${runs}`,
			`${name} launches one! Jonrón!${runs}`,
			`Gone! ${name} goes yard!${runs}`,
		])
		return { text, highlight: true }
	}

	if (type === 'triple') {
		const text = pick('triple', [
			`Triple! ${name} slides into third.${runs}`,
			`${name} legs out a triple!${runs}`,
			`${name} rips one into the gap! Triple!${runs}`,
		])
		return { text, highlight: true }
	}

	if (type === 'double') {
		const text = pick('double', [
			`Double! ${name} pulls into second.${runs}`,
			`${name} lines one into the gap! Double!${runs}`,
			`${name} drives one to the wall! Double!${runs}`,
		])
		return { text, highlight: true }
	}

	if (type === 'walk') {
		const text = pick('walk', [
			`${name} draws a walk.${runs}`,
			`Ball four. ${last} takes first.${runs}`,
			`${name} works a walk.${runs}`,
		])
		return { text, highlight: false }
	}

	if (type === 'strikeout') {
		const text = pick('strikeout', [
			`${name} goes down swinging.`,
			`Struck him out.`,
			`${last} strikes out looking.`,
			`${last} whiffs. Strike three.`,
		])
		return { text, highlight: false }
	}

	return { text: `${name} bats.`, highlight: false }
}

export function commentKoSetup(type) {
	if (type === 'fly-ball') {
		return { text: pick('ko-setup', ['Fly ball...', 'Fly ball to the outfield...']), highlight: false }
	}
	if (type === 'single') {
		return { text: pick('ko-setup', ['Base hit...', 'Single...']), highlight: false }
	}
	if (type === 'ground-ball') {
		return { text: pick('ko-setup', ['Ground ball...', 'Grounder to the infield...']), highlight: false }
	}
	return { text: `${type}...`, highlight: false }
}

export function commentKoResult(type, outcome, batter, bases, nameOf) {
	const name = fullName(batter)
	const last = batter.nameLast
	let text = ''
	let highlight = false

	// Batter part
	if (outcome.isError) {
		text = pick('ko-error', [
			`${name} reaches on an error.`,
			`Dropped! ${name} reaches on the error.`,
			`Error! ${name} is safe.`,
		])
	} else if (type === 'single' && !outcome.batter.out) {
		highlight = true
		if (outcome.batter.base === 2) {
			text = `${name} singles and stretches to second.`
		} else {
			text = pick('ko-single', [
				`${name} lines a single.`,
				`${name} singles.`,
				`${name} pokes a single.`,
			])
		}
	} else if (type === 'single' && outcome.batter.out) {
		text = `${name} singles but is thrown out trying to stretch.`
	} else if (type === 'fly-ball') {
		if (outcome.outs >= 2) {
			text = `${name} flies out.`
		} else {
			text = pick('ko-fly-out', [
				`${last} flies out.`,
				`${name} lifts a fly ball. Out.`,
				`${last} flies out to the outfield.`,
			])
		}
	} else if (type === 'ground-ball') {
		if (outcome.outs >= 2) {
			text = pick('ko-dp', [
				`${name} grounds into a double play.`,
				`Double play! ${name} grounds into the twin killing.`,
			])
		} else {
			text = pick('ko-ground-out', [
				`${last} grounds out.`,
				`${name} grounds to short. Out at first.`,
				`${last} bounces one to the infield. Out.`,
			])
		}
	}

	// Runner part — skip outs for ground-ball DPs (already implied)
	const skipOuts = type === 'ground-ball' && outcome.outs >= 2
	const runnerText = narrateRunners(outcome.runners, bases, nameOf, { skipOuts })
	if (runnerText) text += ' ' + runnerText

	if (outcome.runsScored > 0) highlight = true

	return { text, highlight }
}

export function commentStrategySetup(playType, batter, bases, nameOf) {
	const r1 = bases.first ? nameOf(bases.first) : null
	const r2 = bases.second ? nameOf(bases.second) : null

	const text = {
		'steal-1b': pick('strat-setup-steal1', [
			`${r1} takes off for second...`,
			`${r1} is going! Steal attempt...`,
		]),
		'steal-2b': pick('strat-setup-steal2', [
			`${r2} breaks for third...`,
			`${r2} takes off for third...`,
		]),
		'double-steal-1b-3b': 'Double steal! The runners are going...',
		'double-steal-1b-2b': 'Double steal! The runners are moving...',
		'hit-and-run': 'The hit and run is on...',
		'squeeze': 'Squeeze play!',
		'sac-bunt-1b': `${batter.nameLast} squares to bunt...`,
		'sac-bunt-2b': `${batter.nameLast} squares to bunt...`,
	}[playType] ?? 'Strategy in motion...'

	return { text, highlight: false }
}

export function commentStrategyResult(result, batter, bases, nameOf) {
	const parts = []
	let highlight = false
	const batterCode = result.batter.result

	if (result.batterStays) {
		// Exclamation prefix
		if (batterCode === 'misses-ball') parts.push('Swing and a miss!')
		else if (batterCode === 'misses-pitch') parts.push('Missed it!')
		else if (batterCode === 'takes-pitch') {
			const anyOut = result.runners.some(r => r.out)
			if (!anyOut && result.runners.some(r => r.to !== r.from)) parts.push('Safe!')
			else if (anyOut) parts.push('Out!')
		}

		// Runner details
		for (const r of result.runners) {
			const rName = resolveRunnerName(r.from, bases, nameOf)
			if (r.scored && !r.out) {
				parts.push(`${rName} scores!`)
				highlight = true
			} else if (r.out) {
				if (r.to === 4) parts.push(`${rName} is out at the plate.`)
				else if (r.to === r.from) parts.push(`${rName} is caught off the bag.`)
				else parts.push(`${rName} is thrown out at ${BASE_NAMES[r.to]}.`)
			} else if (r.to !== r.from) {
				parts.push(`${rName} takes ${BASE_NAMES[r.to]}.`)
			}
		}
	} else if (result.batter.out && result.outs >= 2) {
		// Double play
		switch (batterCode) {
			case 'grounds-out': parts.push(`${fullName(batter)} grounds into a double play.`); break
			case 'pops-out': parts.push(`${batter.nameLast} pops out. Double play!`); break
			case 'lines-out': parts.push(`${batter.nameLast} lines out. Double play!`); break
			case 'flies-out': parts.push(`${batter.nameLast} flies out. Double play!`); break
		}
		// Narrate non-out runners (some DPs have a runner who advances safely)
		for (const r of result.runners) {
			if (r.out) continue
			const rName = resolveRunnerName(r.from, bases, nameOf)
			if (r.scored) {
				parts.push(`${rName} scores!`)
				highlight = true
			} else if (r.to !== r.from) {
				parts.push(`${rName} takes ${BASE_NAMES[r.to]}.`)
			}
		}
	} else if (result.batter.out) {
		// Regular out
		switch (batterCode) {
			case 'grounds-out': parts.push(`${batter.nameLast} grounds out.`); break
			case 'flies-out': parts.push(`${batter.nameLast} flies out.`); break
			case 'pops-out': parts.push(`${batter.nameLast} pops it up. Out.`); break
			case 'lines-out': parts.push(`${batter.nameLast} lines out.`); break
		}
		for (const r of result.runners) {
			const rName = resolveRunnerName(r.from, bases, nameOf)
			if (r.scored && !r.out) {
				parts.push(`${rName} scores!`)
				highlight = true
			} else if (r.out) {
				if (r.to === 4) parts.push(`${rName} is out at the plate.`)
				else if (r.to === r.from) parts.push(`${rName} is caught off the bag.`)
				else parts.push(`${rName} is thrown out at ${BASE_NAMES[r.to]}.`)
			} else if (r.to !== r.from) {
				parts.push(`${rName} takes ${BASE_NAMES[r.to]}.`)
			}
		}
	} else {
		// Batter safe (singles, beats-out-bunt, safe-at-1b)
		switch (batterCode) {
			case 'singles':
				parts.push(`${fullName(batter)} lines a single!`)
				highlight = true
				break
			case 'beats-out-bunt':
				parts.push(`${batter.nameLast} beats it out!`)
				highlight = true
				break
			case 'safe-at-1b':
				parts.push(`${batter.nameLast} reaches.`)
				break
		}
		for (const r of result.runners) {
			const rName = resolveRunnerName(r.from, bases, nameOf)
			if (r.scored && !r.out) {
				parts.push(`${rName} scores!`)
				highlight = true
			} else if (r.out) {
				if (r.to === 4) parts.push(`${rName} is out at the plate.`)
				else parts.push(`${rName} is thrown out at ${BASE_NAMES[r.to]}.`)
			} else if (r.to !== r.from) {
				parts.push(`${rName} takes ${BASE_NAMES[r.to]}.`)
			}
		}
	}

	return { text: parts.join(' '), highlight }
}
