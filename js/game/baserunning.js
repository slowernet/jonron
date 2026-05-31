import { IMMEDIATE_RESULTS } from './rules.js'

export function resolveImmediate(type, bases, batterId) {
	if (!IMMEDIATE_RESULTS.has(type)) {
		throw new Error(`Not an immediate result type: ${type}`)
	}

	const result = {
		newBases: { first: null, second: null, third: null },
		runsScored: 0,
		outs: 0,
		events: []
	}

	const runners = []
	if (bases.third) runners.push({ base: 3, player: bases.third })
	if (bases.second) runners.push({ base: 2, player: bases.second })
	if (bases.first) runners.push({ base: 1, player: bases.first })

	if (type === 'home-run') {
		for (const r of runners) {
			result.events.push({ type: 'score', player: r.player, from: r.base, to: 4 })
			result.runsScored++
		}
		result.events.push({ type: 'score', player: batterId, from: 0, to: 4 })
		result.runsScored++
		return result
	}

	if (type === 'triple') {
		for (const r of runners) {
			result.events.push({ type: 'score', player: r.player, from: r.base, to: 4 })
			result.runsScored++
		}
		result.newBases.third = batterId
		result.events.push({ type: 'advance', player: batterId, from: 0, to: 3 })
		return result
	}

	if (type === 'double') {
		for (const r of runners) {
			result.events.push({ type: 'score', player: r.player, from: r.base, to: 4 })
			result.runsScored++
		}
		result.newBases.second = batterId
		result.events.push({ type: 'advance', player: batterId, from: 0, to: 2 })
		return result
	}

	if (type === 'walk') {
		// Determine force chain starting from 1B
		const occupied = {
			1: bases.first,
			2: bases.second,
			3: bases.third
		}

		// Walk: batter goes to 1B, forced runners advance
		// A runner is forced only if every base from 1B up to their base is occupied
		if (occupied[1]) {
			if (occupied[2]) {
				if (occupied[3]) {
					// Bases loaded: 3B runner scores
					result.events.push({ type: 'score', player: occupied[3], from: 3, to: 4 })
					result.runsScored++
				}
				// 2B runner forced to 3B
				result.newBases.third = occupied[2]
				result.events.push({ type: 'advance', player: occupied[2], from: 2, to: 3 })
			} else {
				// 2B not occupied by force chain, keep 3B runner if any
				result.newBases.third = occupied[3] || null
			}
			// 1B runner forced to 2B
			result.newBases.second = occupied[1]
			result.events.push({ type: 'advance', player: occupied[1], from: 1, to: 2 })
		} else {
			// 1B not occupied, no one is forced
			result.newBases.second = occupied[2] || null
			result.newBases.third = occupied[3] || null
		}

		// Batter to 1B
		result.newBases.first = batterId
		result.events.push({ type: 'advance', player: batterId, from: 0, to: 1 })
		return result
	}

	if (type === 'strikeout') {
		result.outs = 1
		result.events.push({ type: 'out', player: batterId, from: 0, to: null })
		result.newBases = { ...bases }
		return result
	}

	return result
}
