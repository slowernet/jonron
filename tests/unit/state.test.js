import { describe, it, expect } from 'vitest'
import {
	createGame,
	getCurrentBatter,
	recordResult,
	recordGameLine,
	getGameLine,
	setPhase,
	isGameOver,
	getScore
} from '../../js/game/state.js'

const makeLineup = (prefix) => Array.from({ length: 9 }, (_, i) => ({
	id: `${prefix}-${i}`,
	nameFirst: prefix,
	nameLast: `${i}`,
	sectors: [{ number: 10, size: 360 }]
}))

const strikeout = () => ({
	type: 'strikeout',
	outs: 1,
	runsScored: 0,
	newBases: { first: null, second: null, third: null },
	events: []
})

const homeRun = (bases = { first: null, second: null, third: null }) => {
	let runsScored = 1
	if (bases.first) runsScored++
	if (bases.second) runsScored++
	if (bases.third) runsScored++
	return {
		type: 'home-run',
		outs: 0,
		runsScored,
		newBases: { first: null, second: null, third: null },
		events: []
	}
}

function recordNStrikeouts(game, n) {
	for (let i = 0; i < n; i++) {
		recordResult(game, strikeout())
	}
}

describe('createGame', () => {
	it('starts at top of 1st, 0 outs, empty bases, phase batting', () => {
		const game = createGame(makeLineup('home'), makeLineup('visitor'))
		expect(game.inning).toBe(1)
		expect(game.halfInning).toBe('top')
		expect(game.outs).toBe(0)
		expect(game.bases).toEqual({ first: null, second: null, third: null })
		expect(game.phase).toBe('batting')
		expect(game.score.home).toEqual([])
		expect(game.score.visitor).toEqual([0])
	})

	it('initializes stats with zero hits and errors for both teams', () => {
		const game = createGame(makeLineup('home'), makeLineup('visitor'))
		expect(game.stats).toEqual({
			home: { hits: 0, errors: 0 },
			visitor: { hits: 0, errors: 0 }
		})
	})
})

describe('getCurrentBatter', () => {
	it('returns first player in visitor lineup at start', () => {
		const visitors = makeLineup('visitor')
		const game = createGame(makeLineup('home'), visitors)
		const batter = getCurrentBatter(game)
		expect(batter.id).toBe('visitor-0')
		expect(batter.nameFirst).toBe('visitor')
		expect(batter.nameLast).toBe('0')
	})
})

describe('recordResult', () => {
	it('1 strikeout: outs becomes 1, bases unchanged, batter advances', () => {
		const game = createGame(makeLineup('home'), makeLineup('visitor'))
		recordResult(game, strikeout())
		expect(game.outs).toBe(1)
		expect(game.bases).toEqual({ first: null, second: null, third: null })
		expect(game.visitorBatterIndex).toBe(1)
	})

	it('3 strikeouts: flips to bottom of 1st, outs reset to 0', () => {
		const game = createGame(makeLineup('home'), makeLineup('visitor'))
		recordNStrikeouts(game, 3)
		expect(game.halfInning).toBe('bottom')
		expect(game.outs).toBe(0)
		expect(game.inning).toBe(1)
		expect(game.bases).toEqual({ first: null, second: null, third: null })
	})

	it('after top and bottom of 1st (6 strikeouts): inning advances to 2, top', () => {
		const game = createGame(makeLineup('home'), makeLineup('visitor'))
		recordNStrikeouts(game, 6)
		expect(game.inning).toBe(2)
		expect(game.halfInning).toBe('top')
	})

	it('home run with empty bases: 1 run added to current inning score', () => {
		const game = createGame(makeLineup('home'), makeLineup('visitor'))
		recordResult(game, homeRun())
		expect(game.score.visitor[0]).toBe(1)
		const totals = getScore(game)
		expect(totals.visitor).toBe(1)
	})

	it('records hits for the batting team', () => {
		const game = createGame(makeLineup('home'), makeLineup('visitor'))
		recordResult(game, { ...homeRun(), isHit: true })
		expect(game.stats.visitor.hits).toBe(1)
		expect(game.stats.home.hits).toBe(0)
	})

	it('records errors for the fielding team', () => {
		const game = createGame(makeLineup('home'), makeLineup('visitor'))
		recordResult(game, {
			outs: 0, runsScored: 0, isError: true,
			newBases: { first: 'b', second: null, third: null },
			events: []
		})
		expect(game.stats.home.errors).toBe(1)
		expect(game.stats.visitor.errors).toBe(0)
	})

	it('does not count non-hit results as hits', () => {
		const game = createGame(makeLineup('home'), makeLineup('visitor'))
		recordResult(game, strikeout())
		expect(game.stats.visitor.hits).toBe(0)
	})
})

describe('batterStays', () => {
	it('does not advance batter index when batterStays is true', () => {
		const game = createGame(makeLineup('home'), makeLineup('visitor'))
		expect(game.visitorBatterIndex).toBe(0)
		recordResult(game, {
			batter: { result: 'takes-pitch', base: null, out: false },
			outs: 0,
			runners: [{ from: 1, to: 2, out: false, scored: false }],
			runsScored: 0,
			description: 'Takes pitch, runner safe at 2B',
			isHit: false,
			isError: false,
			batterStays: true
		})
		expect(game.visitorBatterIndex).toBe(0)
	})

	it('advances batter index when batterStays is false', () => {
		const game = createGame(makeLineup('home'), makeLineup('visitor'))
		recordResult(game, {
			batter: { result: 'grounds-out', base: null, out: true },
			outs: 1,
			runners: [{ from: 1, to: 2, out: false, scored: false }],
			runsScored: 0,
			description: 'Grounds out, runners advance',
			isHit: false,
			isError: false,
			batterStays: false
		})
		expect(game.visitorBatterIndex).toBe(1)
	})
})

describe('game lines', () => {
	it('returns null when no PAs recorded', () => {
		const game = createGame(makeLineup('home'), makeLineup('visitor'))
		expect(getGameLine(game, 'visitor-0')).toBeNull()
	})

	it('formats a single hit correctly', () => {
		const game = createGame(makeLineup('home'), makeLineup('visitor'))
		recordGameLine(game, 'visitor-0', 'HR')
		expect(getGameLine(game, 'visitor-0')).toBe('1-1, HR')
	})

	it('formats multiple outcomes correctly', () => {
		const game = createGame(makeLineup('home'), makeLineup('visitor'))
		recordGameLine(game, 'visitor-0', '2B')
		recordGameLine(game, 'visitor-0', 'K')
		recordGameLine(game, 'visitor-0', 'BB')
		recordGameLine(game, 'visitor-0', '1B')
		expect(getGameLine(game, 'visitor-0')).toBe('2-3, 2B, K, BB, 1B')
	})

	it('excludes walks from AB count', () => {
		const game = createGame(makeLineup('home'), makeLineup('visitor'))
		recordGameLine(game, 'visitor-0', 'BB')
		recordGameLine(game, 'visitor-0', 'BB')
		expect(getGameLine(game, 'visitor-0')).toBe('0-0, BB, BB')
	})
})

describe('batter index wrapping', () => {
	it('after 9 at-bats, index returns to 0', () => {
		const game = createGame(makeLineup('home'), makeLineup('visitor'))
		// 9 at-bats for visitor (3 outs per half, but we just need 9 total PAs)
		for (let i = 0; i < 9; i++) {
			recordResult(game, strikeout())
		}
		// After 9 strikeouts: 3 in top 1st (flip), 3 in bottom 1st (flip), 3 in top 2nd (flip)
		// visitorBatterIndex went 0->1->2->3(flip) then 3->4->5(bottom, home batters)
		// then 3->4->5(top2, flip)... actually let's just check visitor specifically
		// 3 visitor at-bats in top 1st: index goes 0,1,2 -> after = 3
		// 3 home at-bats in bottom 1st
		// 3 visitor at-bats in top 2nd: index goes 3,4,5 -> after = 6
		expect(game.visitorBatterIndex).toBe(6)

		// Do 3 more visitor at-bats (need to get back to top)
		// Currently at bottom 2nd, so 3 more home, then 3 visitor
		recordNStrikeouts(game, 3) // bottom 2nd -> top 3rd
		recordNStrikeouts(game, 3) // top 3rd: visitor index 6,7,8 -> wraps to 0
		expect(game.visitorBatterIndex).toBe(0)
	})
})

describe('getScore', () => {
	it('returns correct totals across multiple innings', () => {
		const game = createGame(makeLineup('home'), makeLineup('visitor'))
		// Top 1st: HR then 3 Ks
		recordResult(game, homeRun())
		recordNStrikeouts(game, 3)
		// Bottom 1st: 3 Ks
		recordNStrikeouts(game, 3)
		// Top 2nd: 2 HRs then 3 Ks
		recordResult(game, homeRun())
		recordResult(game, homeRun())
		recordNStrikeouts(game, 3)

		const totals = getScore(game)
		expect(totals.visitor).toBe(3)
		expect(totals.home).toBe(0)
	})
})

describe('game over conditions', () => {
	it('after 9 full innings with visitor leading, game ends', () => {
		const game = createGame(makeLineup('home'), makeLineup('visitor'))
		// Top 1st: HR then 3 Ks → visitor scores 1
		recordResult(game, homeRun())
		recordNStrikeouts(game, 3)
		// Bottom 1st through rest: all Ks
		// Need to play through 9 full innings: that's 1 bottom + 8 full innings = 1 + 16 half-innings
		// We already did top 1, need bottom 1 thru bottom 9 = 17 half-innings = 51 strikeouts
		recordNStrikeouts(game, 51)

		expect(game.phase).toBe('game-over')
		const totals = getScore(game)
		expect(totals.visitor).toBe(1)
		expect(totals.home).toBe(0)
	})

	it('walk-off: bottom of 9th, home team takes the lead → game over', () => {
		const game = createGame(makeLineup('home'), makeLineup('visitor'))
		// Play 8 full innings of Ks = 48 strikeouts
		recordNStrikeouts(game, 48)
		expect(game.inning).toBe(9)
		expect(game.halfInning).toBe('top')

		// Top 9th: 3 Ks
		recordNStrikeouts(game, 3)
		expect(game.halfInning).toBe('bottom')
		expect(game.inning).toBe(9)

		// Bottom 9th: home run = walk-off
		recordResult(game, homeRun())
		expect(game.phase).toBe('game-over')
		const totals = getScore(game)
		expect(totals.home).toBe(1)
		expect(totals.visitor).toBe(0)
	})

	it('extra innings: tied after 9 → game continues to 10th', () => {
		const game = createGame(makeLineup('home'), makeLineup('visitor'))
		// Play 9 full innings of Ks = 54 strikeouts → tied 0-0
		recordNStrikeouts(game, 54)
		expect(game.phase).not.toBe('game-over')
		expect(game.inning).toBe(10)
		expect(game.halfInning).toBe('top')
	})
})

describe('setPhase', () => {
	it('transitions game phase', () => {
		const game = createGame(makeLineup('home'), makeLineup('visitor'))
		setPhase(game, 'ko-dial')
		expect(game.phase).toBe('ko-dial')
		setPhase(game, 'strategy')
		expect(game.phase).toBe('strategy')
	})
})

describe('isGameOver', () => {
	it('returns false during early innings', () => {
		const game = createGame(makeLineup('home'), makeLineup('visitor'))
		expect(isGameOver(game)).toBe(false)
	})

	it('returns true when home leads after top of 9th', () => {
		const game = createGame(makeLineup('home'), makeLineup('visitor'))
		// Play 8 full innings
		recordNStrikeouts(game, 48)
		// Top 9th: 3 Ks
		recordNStrikeouts(game, 3)
		// Now bottom 9th. Home already scored? No, 0-0.
		// Give home a lead: we need home to have scored earlier.
		// Let's do it differently — build a game where home leads.
		const game2 = createGame(makeLineup('home'), makeLineup('visitor'))
		// 8 full innings of Ks
		recordNStrikeouts(game2, 48)
		expect(game2.inning).toBe(9)
		expect(game2.halfInning).toBe('top')
		// Top 9th: 3 Ks
		recordNStrikeouts(game2, 3)
		// Bottom 9th: HR then wait — this would be walk-off
		// Actually, home needs to already lead. Let's score in bottom 1st.
		const game3 = createGame(makeLineup('home'), makeLineup('visitor'))
		// Top 1st: 3 Ks
		recordNStrikeouts(game3, 3)
		// Bottom 1st: HR then 3 Ks
		recordResult(game3, homeRun())
		recordNStrikeouts(game3, 3)
		// Innings 2-8: all Ks (14 half-innings = 42 Ks)
		recordNStrikeouts(game3, 42)
		expect(game3.inning).toBe(9)
		expect(game3.halfInning).toBe('top')
		// Top 9th: 3 Ks → home leads 1-0, game should end
		recordNStrikeouts(game3, 3)
		expect(game3.phase).toBe('game-over')
	})

	it('home trailing in bottom 9: game is NOT over', () => {
		const game = createGame(makeLineup('home'), makeLineup('visitor'))
		// Top 1st: HR + 3 Ks (visitor leads 1-0)
		recordResult(game, homeRun())
		recordNStrikeouts(game, 3)
		// Bottom 1st through top 9th: all Ks (16 half-innings = 48 Ks)
		recordNStrikeouts(game, 48)
		// Now in bottom 9th, visitor leads 1-0, home still batting
		expect(game.inning).toBe(9)
		expect(game.halfInning).toBe('bottom')
		expect(isGameOver(game)).toBe(false)
		expect(game.phase).toBe('batting')
	})

	describe('3rd-out run suppression', () => {
		it('no run scores on 3rd-out ground ball force play', () => {
			const game = createGame(makeLineup('home'), makeLineup('visitor'))
			game.outs = 2
			game.bases = { first: null, second: null, third: 'r3' }
			recordResult(game, {
				batter: { base: null, out: true },
				outs: 1,
				runners: [{ from: 3, to: 4, out: false, scored: true, playerId: 'r3' }],
				runsScored: 1,
				description: 'Grounds out',
				isHit: false,
				isError: false
			})
			expect(game.score.visitor[0]).toBe(0)
		})

		it('no run scores on 3rd-out fly ball (batter out before reaching 1B)', () => {
			const game = createGame(makeLineup('home'), makeLineup('visitor'))
			game.outs = 2
			game.bases = { first: null, second: null, third: 'r3' }
			recordResult(game, {
				batter: { base: null, out: true },
				outs: 1,
				runners: [{ from: 3, to: 4, out: false, scored: true, playerId: 'r3' }],
				runsScored: 1,
				description: 'Flies out, runner scores',
				isHit: false,
				isError: false,
				isTagPlay: true
			})
			expect(game.score.visitor[0]).toBe(0)
		})

		it('run scores normally when fewer than 3 outs on ground ball', () => {
			const game = createGame(makeLineup('home'), makeLineup('visitor'))
			game.outs = 1
			game.bases = { first: null, second: null, third: 'r3' }
			recordResult(game, {
				batter: { base: null, out: true },
				outs: 1,
				runners: [{ from: 3, to: 4, out: false, scored: true, playerId: 'r3' }],
				runsScored: 1,
				description: 'Grounds out',
				isHit: false,
				isError: false
			})
			expect(game.score.visitor[0]).toBe(1)
		})

		it('suppresses runner scored flags on 3rd-out force play', () => {
			const game = createGame(makeLineup('home'), makeLineup('visitor'))
			game.outs = 2
			game.bases = { first: null, second: null, third: 'r3' }
			const result = {
				batter: { base: null, out: true },
				outs: 1,
				runners: [{ from: 3, to: 4, out: false, scored: true, playerId: 'r3' }],
				runsScored: 1,
				description: 'Grounds out',
				isHit: false,
				isError: false
			}
			recordResult(game, result)
			expect(result.runners[0].scored).toBe(false)
			expect(result.runsScored).toBe(0)
		})
	})

	it('recordResult resets phase to batting', () => {
		const game = createGame(makeLineup('home'), makeLineup('visitor'))
		setPhase(game, 'strategy')
		expect(game.phase).toBe('strategy')
		recordResult(game, strikeout())
		expect(game.phase).toBe('batting')
	})

	it('recordResult with KO-dial runner format updates bases', () => {
		const game = createGame(makeLineup('home'), makeLineup('visitor'))
		game.bases = { first: 'r1', second: null, third: null }
		recordResult(game, {
			batter: { base: 1, out: false },
			outs: 0,
			runners: [{ from: 1, to: 2, out: false, scored: false, playerId: 'r1' }],
			runsScored: 0,
			description: 'Safe at 1B',
			isHit: true,
			isError: false
		})
		expect(game.bases.first).toBe('visitor-0')
		expect(game.bases.second).toBe('r1')
		expect(game.bases.third).toBeNull()
	})

	it('recordResult with KO-dial runner scoring updates score and bases', () => {
		const game = createGame(makeLineup('home'), makeLineup('visitor'))
		game.bases = { first: 'r1', second: null, third: 'r3' }
		recordResult(game, {
			batter: { base: 1, out: false },
			outs: 0,
			runners: [
				{ from: 3, to: 4, out: false, scored: true, playerId: 'r3' },
				{ from: 1, to: 2, out: false, scored: false, playerId: 'r1' }
			],
			runsScored: 1,
			description: 'Single, run scores',
			isHit: true,
			isError: false
		})
		expect(game.score.visitor[0]).toBe(1)
		expect(game.bases.first).toBe('visitor-0')
		expect(game.bases.second).toBe('r1')
		expect(game.bases.third).toBeNull()
	})
})
