export function createGame(homeLineup, visitorLineup) {
	return {
		inning: 1,
		halfInning: 'top',
		outs: 0,
		bases: { first: null, second: null, third: null },
		score: { home: [0], visitor: [0] },
		homeLineup: [...homeLineup],
		visitorLineup: [...visitorLineup],
		homeBatterIndex: 0,
		visitorBatterIndex: 0,
		phase: 'batting',
		pendingResult: null,
		log: []
	}
}

export function getCurrentBatter(game) {
	if (game.halfInning === 'top') {
		return game.visitorLineup[game.visitorBatterIndex]
	}
	return game.homeLineup[game.homeBatterIndex]
}

export function getScore(game) {
	return {
		home: game.score.home.reduce((a, b) => a + b, 0),
		visitor: game.score.visitor.reduce((a, b) => a + b, 0)
	}
}

export function isGameOver(game) {
	if (game.inning < 9) return false

	const { home, visitor } = getScore(game)

	// After bottom of any inning 9+: game over if not tied
	if (game.halfInning === 'top' && game.outs === 0 && game.inning > 9) {
		// We just finished a complete inning (flipped to top of next)
		// Actually, check: if we're at top of inning N+1 with 0 outs, the previous
		// full inning just ended. But inning > 9 means inning >= 10, so inning 9
		// was completed.
		if (home !== visitor) return true
	}

	// Mid-inning checks for 9+:
	if (game.inning >= 9) {
		// After top of 9+ (halfInning just became 'bottom' or we're in bottom with 0 outs):
		// if home leads, they don't need to bat
		if (game.halfInning === 'bottom' && game.outs === 0 &&
			game.bases.first === null && game.bases.second === null && game.bases.third === null) {
			// Just flipped to bottom — check if home already leads
			if (home > visitor) return true
		}

		// Walk-off: bottom of 9+ and home takes the lead
		if (game.halfInning === 'bottom' && home > visitor) {
			return true
		}
	}

	return false
}

export function setPhase(game, phase) {
	game.phase = phase
	return game
}

export function recordResult(game, result) {
	// result is expected to have: outs, runsScored, newBases (from resolveImmediate)
	// or: outs, runsScored, runners, batter (from resolveKoDial / resolveStrategy)

	// Add outs
	game.outs += result.outs

	// Add runs to current inning score
	const inningIndex = game.inning - 1
	const side = game.halfInning === 'top' ? 'visitor' : 'home'

	// Ensure score array is large enough
	while (game.score[side].length <= inningIndex) {
		game.score[side].push(0)
	}

	game.score[side][inningIndex] += (result.runsScored || 0)

	// Update bases
	if (result.newBases) {
		// resolveImmediate format
		game.bases = { ...result.newBases }
	} else if (result.runners !== undefined && result.batter !== undefined) {
		// resolveKoDial / resolveStrategy format
		const newBases = { first: null, second: null, third: null }
		const baseNames = { 1: 'first', 2: 'second', 3: 'third' }

		// Place non-out runners at their destinations
		for (const r of result.runners) {
			if (!r.out && !r.scored && r.to >= 1 && r.to <= 3) {
				newBases[baseNames[r.to]] = r.playerId || game.bases[baseNames[r.from]] || null
			}
		}

		// Place batter
		if (!result.batter.out && result.batter.base != null && result.batter.base >= 1 && result.batter.base <= 3) {
			newBases[baseNames[result.batter.base]] = getCurrentBatter(game).id
		}

		game.bases = newBases
	}

	// Add log entry
	const batter = getCurrentBatter(game)
	game.log.push({
		inning: game.inning,
		halfInning: game.halfInning,
		batter: batter.id,
		result: result.description || result.type || 'unknown',
		outs: result.outs,
		runsScored: result.runsScored || 0
	})

	// Advance batter index
	if (game.halfInning === 'top') {
		game.visitorBatterIndex = (game.visitorBatterIndex + 1) % 9
	} else {
		game.homeBatterIndex = (game.homeBatterIndex + 1) % 9
	}

	// Check walk-off before flipping inning
	if (game.halfInning === 'bottom' && game.inning >= 9) {
		const { home, visitor } = getScore(game)
		if (home > visitor) {
			game.phase = 'game-over'
			return game
		}
	}

	// Check if 3 outs reached
	if (game.outs >= 3) {
		if (game.halfInning === 'top') {
			// Check if home doesn't need to bat (inning 9+ and home leads)
			if (game.inning >= 9) {
				const { home, visitor } = getScore(game)
				if (home > visitor) {
					game.phase = 'game-over'
					return game
				}
			}
			game.halfInning = 'bottom'
		} else {
			// End of bottom half
			if (game.inning >= 9) {
				const { home, visitor } = getScore(game)
				if (home !== visitor) {
					game.phase = 'game-over'
					return game
				}
			}
			game.inning++
			game.halfInning = 'top'
		}
		game.outs = 0
		game.bases = { first: null, second: null, third: null }
	}

	// Set phase back to batting (caller can override with setPhase)
	game.phase = 'batting'

	return game
}
