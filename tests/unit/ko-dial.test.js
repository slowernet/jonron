import { describe, it, expect } from 'vitest'
import { resolveKoDial } from '../../js/game/ko-dial.js'

const empty = { first: null, second: null, third: null }

describe('resolveKoDial', () => {
	describe('fly-ball', () => {
		it('K: batter safe at 2B, runner on 1B advances to 3B', () => {
			const result = resolveKoDial('K', 'fly-ball', { first: 'p1', second: null, third: null })
			expect(result.batter.base).toBe(2)
			expect(result.batter.out).toBe(false)
			expect(result.outs).toBe(0)
			const r1 = result.runners.find(r => r.from === 1)
			expect(r1.to).toBe(3)
			expect(r1.scored).toBe(false)
		})

		it('L: batter out, runner on 3B scores, runner on 1B holds', () => {
			const result = resolveKoDial('L', 'fly-ball', { first: 'p1', second: null, third: 'p3' })
			expect(result.batter.out).toBe(true)
			expect(result.outs).toBe(1)
			const r3 = result.runners.find(r => r.from === 3)
			expect(r3.scored).toBe(true)
			expect(r3.to).toBe(4)
			const r1 = result.runners.find(r => r.from === 1)
			expect(r1.to).toBe(1)
			expect(r1.scored).toBe(false)
			expect(result.runsScored).toBe(1)
		})

		it('N: batter out, all runners hold', () => {
			const result = resolveKoDial('N', 'fly-ball', { first: 'p1', second: 'p2', third: 'p3' })
			expect(result.batter.out).toBe(true)
			expect(result.outs).toBe(1)
			expect(result.runsScored).toBe(0)
			for (const r of result.runners) {
				expect(r.to).toBe(r.from)
				expect(r.scored).toBe(false)
			}
		})

		it('O with runners on 2B and 3B: batter out, lead runner (3B) doubled off, 2B holds', () => {
			const result = resolveKoDial('O', 'fly-ball', { first: null, second: 'p2', third: 'p3' })
			expect(result.batter.out).toBe(true)
			expect(result.outs).toBe(2)
			const r3 = result.runners.find(r => r.from === 3)
			expect(r3.out).toBe(true)
			const r2 = result.runners.find(r => r.from === 2)
			expect(r2.to).toBe(2)
			expect(r2.out).toBe(false)
			expect(result.runsScored).toBe(0)
		})

		it('O with runner on 2B only: batter out, runner on 2B doubled off', () => {
			const result = resolveKoDial('O', 'fly-ball', { first: null, second: 'p2', third: null })
			expect(result.batter.out).toBe(true)
			expect(result.outs).toBe(2)
			const r2 = result.runners.find(r => r.from === 2)
			expect(r2.out).toBe(true)
			expect(result.runsScored).toBe(0)
		})
	})

	describe('single', () => {
		it('K: batter out, runner on 2B scores (advances 2)', () => {
			const result = resolveKoDial('K', 'single', { first: null, second: 'p2', third: null })
			expect(result.batter.out).toBe(true)
			expect(result.outs).toBe(1)
			const r2 = result.runners.find(r => r.from === 2)
			expect(r2.to).toBe(4)
			expect(r2.scored).toBe(true)
			expect(result.runsScored).toBe(1)
		})

		it('L: batter at 1B, runner on 1B to 2B', () => {
			const result = resolveKoDial('L', 'single', { first: 'p1', second: null, third: null })
			expect(result.batter.base).toBe(1)
			expect(result.batter.out).toBe(false)
			expect(result.outs).toBe(0)
			const r1 = result.runners.find(r => r.from === 1)
			expect(r1.to).toBe(2)
			expect(result.runsScored).toBe(0)
		})

		it('N: batter at 1B, runners advance 2 (2B scores, 1B to 3B)', () => {
			const result = resolveKoDial('N', 'single', { first: 'p1', second: 'p2', third: null })
			expect(result.batter.base).toBe(1)
			expect(result.batter.out).toBe(false)
			const r2 = result.runners.find(r => r.from === 2)
			expect(r2.to).toBe(4)
			expect(r2.scored).toBe(true)
			const r1 = result.runners.find(r => r.from === 1)
			expect(r1.to).toBe(3)
			expect(result.runsScored).toBe(1)
		})

		it('O: batter at 2B, runner on 2B out, runner on 1B advances 2 to 3B', () => {
			const result = resolveKoDial('O', 'single', { first: 'p1', second: 'p2', third: null })
			expect(result.batter.base).toBe(2)
			expect(result.batter.out).toBe(false)
			expect(result.outs).toBe(1)
			const r2 = result.runners.find(r => r.from === 2)
			expect(r2.out).toBe(true)
			const r1 = result.runners.find(r => r.from === 1)
			expect(r1.to).toBe(3)
			expect(r1.out).toBe(false)
			expect(result.runsScored).toBe(0)
		})

		it('O with no runner on 2B but runner on 1B: batter at 2B, runner on 1B out at 3B', () => {
			const result = resolveKoDial('O', 'single', { first: 'p1', second: null, third: null })
			expect(result.batter.base).toBe(2)
			expect(result.batter.out).toBe(false)
			expect(result.outs).toBe(1)
			const r1 = result.runners.find(r => r.from === 1)
			expect(r1.out).toBe(true)
			expect(result.runsScored).toBe(0)
		})
	})

	describe('ground-ball', () => {
		it('K: batter safe at 1B on error, runners advance 1', () => {
			const result = resolveKoDial('K', 'ground-ball', { first: 'p1', second: null, third: null })
			expect(result.batter.base).toBe(1)
			expect(result.batter.out).toBe(false)
			expect(result.outs).toBe(0)
			const r1 = result.runners.find(r => r.from === 1)
			expect(r1.to).toBe(2)
		})

		it('L with runner on 1B only: batter out, runner forced to 2B', () => {
			const result = resolveKoDial('L', 'ground-ball', { first: 'p1', second: null, third: null })
			expect(result.batter.out).toBe(true)
			expect(result.outs).toBe(1)
			const r1 = result.runners.find(r => r.from === 1)
			expect(r1.to).toBe(2)
			expect(result.runsScored).toBe(0)
		})

		it('L with runner on 2B only: batter out, runner NOT forced so holds', () => {
			const result = resolveKoDial('L', 'ground-ball', { first: null, second: 'p2', third: null })
			expect(result.batter.out).toBe(true)
			expect(result.outs).toBe(1)
			const r2 = result.runners.find(r => r.from === 2)
			expect(r2.to).toBe(2)
			expect(result.runsScored).toBe(0)
		})

		it('M: batter out, lead runner out at 2B (DP)', () => {
			const result = resolveKoDial('M', 'ground-ball', { first: 'p1', second: null, third: null })
			expect(result.batter.out).toBe(true)
			expect(result.outs).toBe(2)
			const r1 = result.runners.find(r => r.from === 1)
			expect(r1.out).toBe(true)
			expect(result.runsScored).toBe(0)
		})

		it('O with bases loaded: batter out, runner out at plate (not 2B)', () => {
			const result = resolveKoDial('O', 'ground-ball', { first: 'p1', second: 'p2', third: 'p3' })
			expect(result.batter.out).toBe(true)
			expect(result.outs).toBe(2)
			const r3 = result.runners.find(r => r.from === 3)
			expect(r3.out).toBe(true)
			expect(r3.to).toBe(4)
			expect(r3.scored).toBe(false)
			expect(result.runsScored).toBe(0)
			// Other runners advance 1
			const r2 = result.runners.find(r => r.from === 2)
			expect(r2.to).toBe(3)
			expect(r2.out).toBe(false)
			const r1 = result.runners.find(r => r.from === 1)
			expect(r1.to).toBe(2)
			expect(r1.out).toBe(false)
		})
	})

	describe('all 15 combinations with empty bases', () => {
		const letters = ['K', 'L', 'M', 'N', 'O']
		const types = ['single', 'fly-ball', 'ground-ball']

		for (const type of types) {
			for (const letter of letters) {
				it(`${type} ${letter} with empty bases produces valid output`, () => {
					const result = resolveKoDial(letter, type, empty)
					expect(result.batter).toBeDefined()
					expect(typeof result.batter.out).toBe('boolean')
					expect(typeof result.outs).toBe('number')
					expect(Array.isArray(result.runners)).toBe(true)
					expect(result.runners.length).toBe(0)
					expect(typeof result.runsScored).toBe('number')
					expect(result.runsScored).toBe(0)
					expect(typeof result.description).toBe('string')
				})
			}
		}
	})
})
