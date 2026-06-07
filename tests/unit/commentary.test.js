import { describe, it, expect, beforeEach } from 'vitest'
import {
	pick, resetPicker,
	commentBatterUp,
	commentImmediate,
	commentKoSetup,
	commentKoResult,
	commentStrategySetup,
	commentStrategyResult,
} from '../../js/ui/commentary.js'

beforeEach(() => resetPicker())

// ---- pick() ----

describe('pick', () => {
	it('returns empty string for empty array', () => {
		expect(pick('x', [])).toBe('')
	})

	it('returns the only template for single-element array', () => {
		expect(pick('x', ['solo'])).toBe('solo')
	})

	it('returns a template from the array', () => {
		const templates = ['a', 'b', 'c']
		const result = pick('test', templates)
		expect(templates).toContain(result)
	})

	it('uses all templates before repeating heavily', () => {
		const templates = ['a', 'b', 'c']
		const seen = new Set()
		for (let i = 0; i < 20; i++) seen.add(pick('variety', templates))
		expect(seen.size).toBe(3)
	})

	it('weights against recently used templates', () => {
		const templates = ['a', 'b']
		// rand() returning 0.99 always picks last weighted slot
		// After picking 'b', its weight drops so 'a' becomes more likely
		const r1 = pick('decay', templates, () => 0.99)
		expect(r1).toBe('b')
		const r2 = pick('decay', templates, () => 0.99)
		// 'b' now has weight 0.5, 'a' has 1.0 — total 1.5, r=1.485
		// subtract 1.0 (a) → 0.485, subtract 0.5 (b) → -0.015, picks 'b' again
		// but with rand() = 0.5: r = 0.75, subtract 1.0 → picks 'a'
		const r3 = pick('decay2', templates, () => 0.99)
		const r4 = pick('decay2', templates, () => 0.5)
		expect(r3).toBe('b')
		expect(r4).toBe('a')
	})

	it('resets counts when all templates used at least twice', () => {
		const templates = ['a', 'b']
		// Use each twice — should trigger reset
		for (let i = 0; i < 4; i++) pick('reset', templates)
		// After reset, both should have equal weight again
		const result = pick('reset', templates, () => 0)
		expect(templates).toContain(result)
	})

	it('keeps separate counts per category', () => {
		const templates = ['a', 'b']
		pick('cat1', templates, () => 0)
		pick('cat1', templates, () => 0)
		// cat2 should be unaffected
		const result = pick('cat2', templates, () => 0)
		expect(result).toBe('a')
	})
})

// ---- commentBatterUp() ----

describe('commentBatterUp', () => {
	const batter = { id: 'p1', nameFirst: 'Mike', nameLast: 'Trout' }

	it('returns text containing the batter name', () => {
		const { text } = commentBatterUp(batter)
		expect(text).toContain('Trout')
	})

	it('returns highlight: false', () => {
		const { highlight } = commentBatterUp(batter)
		expect(highlight).toBe(false)
	})

	it('returns different results over multiple calls', () => {
		const results = new Set()
		for (let i = 0; i < 20; i++) results.add(commentBatterUp(batter).text)
		expect(results.size).toBeGreaterThan(1)
	})
})

// ---- commentImmediate() ----

describe('commentImmediate', () => {
	const batter = { id: 'p1', nameFirst: 'Babe', nameLast: 'Ruth' }
	const nameOf = (id) => ({ r1: 'Lou Gehrig', r2: 'Joe DiMaggio' }[id] ?? 'unknown')
	const baseResult = { events: [] }

	describe('home run', () => {
		it('returns highlight: true', () => {
			const { highlight } = commentImmediate('home-run', baseResult, batter, nameOf)
			expect(highlight).toBe(true)
		})

		it('mentions the batter name', () => {
			const { text } = commentImmediate('home-run', baseResult, batter, nameOf)
			expect(text).toContain('Babe Ruth')
		})

		it('uses grand slam template for 4+ runs', () => {
			const result = { runsScored: 4, events: [] }
			const { text } = commentImmediate('home-run', result, batter, nameOf)
			expect(text).toMatch(/grand slam/i)
		})

		it('includes runner names who scored', () => {
			const result = {
				events: [
					{ type: 'score', player: 'r1' },
					{ type: 'score', player: 'p1' },
				]
			}
			const { text } = commentImmediate('home-run', result, batter, nameOf)
			expect(text).toContain('Lou Gehrig')
			// Batter excluded from scorer list (HR template covers it)
			expect(text).not.toMatch(/Lou Gehrig.*Babe Ruth.*score/i)
		})
	})

	describe('triple', () => {
		it('returns highlight: true and mentions batter', () => {
			const c = commentImmediate('triple', baseResult, batter, nameOf)
			expect(c.highlight).toBe(true)
			expect(c.text).toContain('Babe Ruth')
		})
	})

	describe('double', () => {
		it('returns highlight: true and mentions batter', () => {
			const c = commentImmediate('double', baseResult, batter, nameOf)
			expect(c.highlight).toBe(true)
			expect(c.text).toContain('Babe Ruth')
		})
	})

	describe('walk', () => {
		it('returns highlight: false', () => {
			const c = commentImmediate('walk', baseResult, batter, nameOf)
			expect(c.highlight).toBe(false)
		})

		it('includes runner names who scored on walk', () => {
			const result = { events: [{ type: 'score', player: 'r1' }] }
			const { text } = commentImmediate('walk', result, batter, nameOf)
			expect(text).toContain('Lou Gehrig')
		})
	})

	describe('strikeout', () => {
		it('returns highlight: false', () => {
			const c = commentImmediate('strikeout', baseResult, batter, nameOf)
			expect(c.highlight).toBe(false)
		})

		it('has text', () => {
			const { text } = commentImmediate('strikeout', baseResult, batter, nameOf)
			expect(text.length).toBeGreaterThan(0)
		})
	})

	it('returns fallback for unknown type', () => {
		const c = commentImmediate('unknown', baseResult, batter, nameOf)
		expect(c.text).toContain('Babe Ruth')
		expect(c.highlight).toBe(false)
	})
})

// ---- commentKoSetup() ----

describe('commentKoSetup', () => {
	it('returns fly ball text for fly-ball', () => {
		const { text } = commentKoSetup('fly-ball')
		expect(text).toMatch(/fly ball/i)
	})

	it('returns single text for single', () => {
		const { text } = commentKoSetup('single')
		expect(text).toMatch(/single|base hit/i)
	})

	it('returns ground ball text for ground-ball', () => {
		const { text } = commentKoSetup('ground-ball')
		expect(text).toMatch(/ground/i)
	})

	it('returns fallback for unknown type', () => {
		const { text } = commentKoSetup('bloop')
		expect(text).toContain('bloop')
	})

	it('always returns highlight: false', () => {
		expect(commentKoSetup('fly-ball').highlight).toBe(false)
		expect(commentKoSetup('single').highlight).toBe(false)
		expect(commentKoSetup('ground-ball').highlight).toBe(false)
	})
})

// ---- commentKoResult() ----

describe('commentKoResult', () => {
	const batter = { id: 'b1', nameFirst: 'Willie', nameLast: 'Mays' }
	const nameOf = (id) => ({ r1: 'Hank Aaron', r2: 'Ernie Banks' }[id] ?? 'unknown')

	it('mentions error for isError outcome', () => {
		const outcome = { isError: true, batter: { out: false }, runners: [], runsScored: 0, outs: 0 }
		const { text } = commentKoResult('fly-ball', outcome, batter, {}, nameOf)
		expect(text).toMatch(/error/i)
	})

	it('handles single safe at first', () => {
		const outcome = { batter: { base: 1, out: false }, runners: [], runsScored: 0, outs: 0 }
		const { text, highlight } = commentKoResult('single', outcome, batter, {}, nameOf)
		expect(text).toMatch(/single/i)
		expect(highlight).toBe(true)
	})

	it('handles single stretch to second', () => {
		const outcome = { batter: { base: 2, out: false }, runners: [], runsScored: 0, outs: 0 }
		const { text } = commentKoResult('single', outcome, batter, {}, nameOf)
		expect(text).toMatch(/second/i)
	})

	it('handles single batter thrown out', () => {
		const outcome = { batter: { out: true }, runners: [], runsScored: 0, outs: 1 }
		const { text } = commentKoResult('single', outcome, batter, {}, nameOf)
		expect(text).toMatch(/thrown out/i)
	})

	it('handles fly ball out', () => {
		const outcome = { batter: { out: true }, runners: [], runsScored: 0, outs: 1 }
		const { text } = commentKoResult('fly-ball', outcome, batter, {}, nameOf)
		expect(text).toMatch(/flies out|fly ball/i)
	})

	it('handles ground ball out', () => {
		const outcome = { batter: { out: true }, runners: [], runsScored: 0, outs: 1 }
		const { text } = commentKoResult('ground-ball', outcome, batter, {}, nameOf)
		expect(text).toMatch(/grounds|bounces/i)
	})

	it('handles double play', () => {
		const outcome = { batter: { out: true }, runners: [{ from: 1, to: 2, out: true, scored: false }], runsScored: 0, outs: 2 }
		const bases = { first: 'r1' }
		const { text } = commentKoResult('ground-ball', outcome, batter, bases, nameOf)
		expect(text).toMatch(/double play/i)
	})

	it('narrates runner scoring', () => {
		const outcome = { batter: { base: 1, out: false }, runners: [{ from: 3, to: 4, out: false, scored: true }], runsScored: 1, outs: 0 }
		const bases = { third: 'r1' }
		const { text, highlight } = commentKoResult('single', outcome, batter, bases, nameOf)
		expect(text).toContain('Hank Aaron')
		expect(text).toMatch(/scores/i)
		expect(highlight).toBe(true)
	})

	it('narrates runner thrown out', () => {
		const outcome = { batter: { base: 1, out: false }, runners: [{ from: 2, to: 3, out: true, scored: false }], runsScored: 0, outs: 1 }
		const bases = { second: 'r2' }
		const { text } = commentKoResult('single', outcome, batter, bases, nameOf)
		expect(text).toContain('Ernie Banks')
		expect(text).toMatch(/thrown out/i)
	})

	it('narrates runner out at plate', () => {
		const outcome = { batter: { base: 1, out: false }, runners: [{ from: 3, to: 4, out: true, scored: false }], runsScored: 0, outs: 1 }
		const bases = { third: 'r1' }
		const { text } = commentKoResult('single', outcome, batter, bases, nameOf)
		expect(text).toContain('Hank Aaron')
		expect(text).toMatch(/out at the plate/i)
	})

	it('narrates runner doubled off', () => {
		const outcome = { batter: { out: true }, runners: [{ from: 2, to: 2, out: true, scored: false }], runsScored: 0, outs: 2 }
		const bases = { second: 'r2' }
		const { text } = commentKoResult('fly-ball', outcome, batter, bases, nameOf)
		expect(text).toContain('Ernie Banks')
		expect(text).toMatch(/doubled off/i)
	})

	it('produces clean output with empty bases', () => {
		const outcome = { batter: { out: true }, runners: [], runsScored: 0, outs: 1 }
		const { text } = commentKoResult('fly-ball', outcome, batter, {}, nameOf)
		expect(text).not.toContain('the runner')
		expect(text).toMatch(/flies out|fly ball/i)
	})
})

// ---- commentStrategySetup() ----

describe('commentStrategySetup', () => {
	const batter = { id: 'b1', nameFirst: 'Rod', nameLast: 'Carew' }
	const nameOf = (id) => ({ r1: 'Rickey Henderson', r2: 'Tim Raines' }[id] ?? 'unknown')

	it('uses runner name for steal-1b', () => {
		const bases = { first: 'r1' }
		const { text } = commentStrategySetup('steal-1b', batter, bases, nameOf)
		expect(text).toContain('Rickey Henderson')
		expect(text).toMatch(/second|steal|going/i)
	})

	it('uses runner name for steal-2b', () => {
		const bases = { second: 'r2' }
		const { text } = commentStrategySetup('steal-2b', batter, bases, nameOf)
		expect(text).toContain('Tim Raines')
		expect(text).toMatch(/third/i)
	})

	it('mentions double steal', () => {
		const { text } = commentStrategySetup('double-steal-1b-3b', batter, {}, nameOf)
		expect(text).toMatch(/double steal/i)
	})

	it('mentions hit and run', () => {
		const { text } = commentStrategySetup('hit-and-run', batter, {}, nameOf)
		expect(text).toMatch(/hit and run/i)
	})

	it('mentions squeeze', () => {
		const { text } = commentStrategySetup('squeeze', batter, {}, nameOf)
		expect(text).toMatch(/squeeze/i)
	})

	it('uses batter name for sac bunt', () => {
		const { text } = commentStrategySetup('sac-bunt-1b', batter, {}, nameOf)
		expect(text).toContain('Carew')
		expect(text).toMatch(/bunt/i)
	})

	it('returns fallback for unknown type', () => {
		const { text } = commentStrategySetup('unknown', batter, {}, nameOf)
		expect(text.length).toBeGreaterThan(0)
	})

	it('always returns highlight: false', () => {
		expect(commentStrategySetup('steal-1b', batter, { first: 'r1' }, nameOf).highlight).toBe(false)
		expect(commentStrategySetup('squeeze', batter, {}, nameOf).highlight).toBe(false)
	})
})

// ---- commentStrategyResult() ----

describe('commentStrategyResult', () => {
	const batter = { id: 'b1', nameFirst: 'Pete', nameLast: 'Rose' }
	const nameOf = (id) => ({ r1: 'Joe Morgan', r2: 'Johnny Bench' }[id] ?? 'unknown')
	const bases = { first: 'r1', second: 'r2' }

	describe('batterStays', () => {
		it('handles swing and a miss with runner advance', () => {
			const result = {
				batterStays: true,
				batter: { result: 'misses-ball' },
				runners: [{ from: 1, to: 2, out: false, scored: false }],
				outs: 0,
			}
			const { text } = commentStrategyResult(result, batter, bases, nameOf)
			expect(text).toMatch(/swing and a miss/i)
			expect(text).toContain('Joe Morgan')
		})

		it('handles takes-pitch with runner safe', () => {
			const result = {
				batterStays: true,
				batter: { result: 'takes-pitch' },
				runners: [{ from: 1, to: 2, out: false, scored: false }],
				outs: 0,
			}
			const { text } = commentStrategyResult(result, batter, bases, nameOf)
			expect(text).toMatch(/safe/i)
		})

		it('handles takes-pitch with runner out', () => {
			const result = {
				batterStays: true,
				batter: { result: 'takes-pitch' },
				runners: [{ from: 1, to: 2, out: true, scored: false }],
				outs: 1,
			}
			const { text } = commentStrategyResult(result, batter, bases, nameOf)
			expect(text).toMatch(/out/i)
		})

		it('handles runner scoring', () => {
			const result = {
				batterStays: true,
				batter: { result: 'takes-pitch' },
				runners: [{ from: 3, to: 4, out: false, scored: true }],
				outs: 0,
			}
			const { text, highlight } = commentStrategyResult(result, batter, { third: 'r1' }, nameOf)
			expect(text).toContain('Joe Morgan')
			expect(text).toMatch(/scores/i)
			expect(highlight).toBe(true)
		})
	})

	describe('batter out', () => {
		it('handles grounds-out', () => {
			const result = {
				batter: { result: 'grounds-out', out: true },
				runners: [],
				outs: 1,
			}
			const { text } = commentStrategyResult(result, batter, bases, nameOf)
			expect(text).toMatch(/grounds out/i)
		})

		it('handles double play', () => {
			const result = {
				batter: { result: 'grounds-out', out: true },
				runners: [{ from: 1, to: 2, out: true, scored: false }],
				outs: 2,
			}
			const { text } = commentStrategyResult(result, batter, bases, nameOf)
			expect(text).toMatch(/double play/i)
		})

		it('handles flies-out', () => {
			const result = {
				batter: { result: 'flies-out', out: true },
				runners: [],
				outs: 1,
			}
			const { text } = commentStrategyResult(result, batter, bases, nameOf)
			expect(text).toMatch(/flies out/i)
		})

		it('narrates runner scoring on batter out', () => {
			const result = {
				batter: { result: 'flies-out', out: true },
				runners: [{ from: 3, to: 4, out: false, scored: true }],
				outs: 1,
			}
			const { text, highlight } = commentStrategyResult(result, batter, { third: 'r1' }, nameOf)
			expect(text).toContain('Joe Morgan')
			expect(text).toMatch(/scores/i)
			expect(highlight).toBe(true)
		})
	})

	describe('batter safe', () => {
		it('handles singles', () => {
			const result = {
				batter: { result: 'singles', out: false },
				runners: [{ from: 1, to: 3, out: false, scored: false }],
				outs: 0,
			}
			const { text, highlight } = commentStrategyResult(result, batter, bases, nameOf)
			expect(text).toMatch(/single/i)
			expect(highlight).toBe(true)
		})

		it('handles beats-out-bunt', () => {
			const result = {
				batter: { result: 'beats-out-bunt', out: false },
				runners: [{ from: 1, to: 2, out: false, scored: false }],
				outs: 0,
			}
			const { text, highlight } = commentStrategyResult(result, batter, bases, nameOf)
			expect(text).toMatch(/beats it out/i)
			expect(highlight).toBe(true)
		})

		it('handles safe-at-1b', () => {
			const result = {
				batter: { result: 'safe-at-1b', out: false },
				runners: [],
				outs: 0,
			}
			const { text } = commentStrategyResult(result, batter, bases, nameOf)
			expect(text).toContain('Rose')
		})

		it('narrates runner thrown out at base', () => {
			const result = {
				batter: { result: 'singles', out: false },
				runners: [{ from: 2, to: 4, out: true, scored: false }],
				outs: 1,
			}
			const { text } = commentStrategyResult(result, batter, bases, nameOf)
			expect(text).toContain('Johnny Bench')
			expect(text).toMatch(/out at the plate/i)
		})
	})
})
