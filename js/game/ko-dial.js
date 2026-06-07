import { KO_DIAL } from './rules.js'

export function resolveKoDial(letter, resultType, bases) {
	const rule = KO_DIAL[resultType]?.[letter]
	if (!rule) {
		throw new Error(`Invalid KO dial lookup: ${resultType} / ${letter}`)
	}

	const isError = rule.isError ?? false
	const isHit = !isError && !rule.batter.out && rule.batter.base != null

	const outcome = {
		batter: { base: rule.batter.base, out: rule.batter.out },
		outs: rule.batter.out ? 1 : 0,
		runners: [],
		runsScored: 0,
		description: rule.description,
		isHit,
		isError,
		isTagPlay: resultType === 'fly-ball'
	}

	const occupied = []
	if (bases.third) occupied.push({ base: 3, playerId: bases.third })
	if (bases.second) occupied.push({ base: 2, playerId: bases.second })
	if (bases.first) occupied.push({ base: 1, playerId: bases.first })

	const rr = rule.runners

	// Find lead runner (highest base)
	const leadRunner = occupied.length > 0 ? occupied[0] : null

	// Batter's extra base on leadRunnerOut only applies with runners on
	if (rr.leadRunnerOut && !leadRunner && !rule.batter.out && rule.batter.base > 1) {
		outcome.batter.base = 1
	}

	if (rr.hold) {
		// All runners hold
		for (const r of occupied) {
			outcome.runners.push({ from: r.base, to: r.base, out: false, scored: false })
		}
	} else if (rr.leadRunnerOut) {
		// Lead runner is out (double play component)
		if (leadRunner) {
			const isBasesLoadedPlateOut = rr.basesLoadedPlateOut &&
				bases.first && bases.second && bases.third

			if (isBasesLoadedPlateOut) {
				// Bases loaded: lead runner out at plate
				outcome.runners.push({ from: leadRunner.base, to: 4, out: true, scored: false })
			} else {
				outcome.runners.push({ from: leadRunner.base, to: leadRunner.base, out: true, scored: false })
			}
			outcome.outs++

			// Handle remaining runners
			const others = occupied.slice(1)
			if (rr.othersHold) {
				for (const r of others) {
					outcome.runners.push({ from: r.base, to: r.base, out: false, scored: false })
				}
			} else if (rr.othersAdvance != null) {
				for (const r of others) {
					const dest = r.base + rr.othersAdvance
					if (dest >= 4) {
						outcome.runners.push({ from: r.base, to: 4, out: false, scored: true })
						outcome.runsScored++
					} else {
						outcome.runners.push({ from: r.base, to: dest, out: false, scored: false })
					}
				}
			}
		}
	} else if (rr.scoreFrom != null) {
		// Specific base scores, others hold
		for (const r of occupied) {
			if (r.base === rr.scoreFrom) {
				outcome.runners.push({ from: r.base, to: 4, out: false, scored: true })
				outcome.runsScored++
			} else {
				outcome.runners.push({ from: r.base, to: r.base, out: false, scored: false })
			}
		}
	} else if (rr.advanceFrom) {
		// Only runners from specific bases advance
		for (const r of occupied) {
			if (rr.advanceFrom.includes(r.base)) {
				const dest = r.base + rr.advance
				if (dest >= 4) {
					outcome.runners.push({ from: r.base, to: 4, out: false, scored: true })
					outcome.runsScored++
				} else {
					outcome.runners.push({ from: r.base, to: dest, out: false, scored: false })
				}
			} else {
				outcome.runners.push({ from: r.base, to: r.base, out: false, scored: false })
			}
		}
	} else if (rr.advanceIfForced) {
		// Only forced runners advance (batter is out at 1B, so runner on 1B is forced)
		// A runner is forced if all bases behind them (toward 1B) are occupied and the batter is coming
		const occupiedBases = new Set(occupied.map(r => r.base))
		for (const r of occupied) {
			if (isForced(r.base, occupiedBases)) {
				const dest = r.base + 1
				if (dest >= 4) {
					outcome.runners.push({ from: r.base, to: 4, out: false, scored: true })
					outcome.runsScored++
				} else {
					outcome.runners.push({ from: r.base, to: dest, out: false, scored: false })
				}
			} else {
				outcome.runners.push({ from: r.base, to: r.base, out: false, scored: false })
			}
		}
	} else if (rr.advance != null) {
		// All runners advance N bases
		for (const r of occupied) {
			const dest = r.base + rr.advance
			if (dest >= 4) {
				outcome.runners.push({ from: r.base, to: 4, out: false, scored: true })
				outcome.runsScored++
			} else {
				outcome.runners.push({ from: r.base, to: dest, out: false, scored: false })
			}
		}
	}

	return outcome
}

function isForced(base, occupiedBases) {
	// A runner is forced if every base from 1B up to their base is occupied
	// (the batter occupies home, forcing 1B, which forces 2B if 1B occupied, etc.)
	for (let b = 1; b < base; b++) {
		if (!occupiedBases.has(b)) return false
	}
	// Runner on 1B is always forced when batter puts ball in play
	return true
}
