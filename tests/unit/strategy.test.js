import { describe, it, expect } from 'vitest'
import { getAvailableStrategies, resolveStrategy } from '../../js/game/strategy.js'

describe('getAvailableStrategies', () => {
	it('empty bases → empty array', () => {
		const result = getAvailableStrategies({ first: null, second: null, third: null })
		expect(result).toEqual([])
	})

	it('runner on 1B only → steal-1b, hit-and-run, sac-bunt-1b', () => {
		const result = getAvailableStrategies({ first: 'p1', second: null, third: null })
		expect(result).toContain('steal-1b')
		expect(result).toContain('hit-and-run')
		expect(result).toContain('sac-bunt-1b')
		expect(result).not.toContain('steal-2b')
		expect(result).not.toContain('squeeze')
	})

	it('runner on 2B only → steal-2b, sac-bunt-2b', () => {
		const result = getAvailableStrategies({ first: null, second: 'p2', third: null })
		expect(result).toContain('steal-2b')
		expect(result).toContain('sac-bunt-2b')
		expect(result).not.toContain('steal-1b')
	})

	it('runner on 3B only → squeeze', () => {
		const result = getAvailableStrategies({ first: null, second: null, third: 'p3' })
		expect(result).toContain('squeeze')
		expect(result).toHaveLength(1)
	})

	it('runners on 1B+3B → includes steal-1b, double-steal-1b-3b, hit-and-run, squeeze', () => {
		const result = getAvailableStrategies({ first: 'p1', second: null, third: 'p3' })
		expect(result).toContain('steal-1b')
		expect(result).toContain('double-steal-1b-3b')
		expect(result).toContain('hit-and-run')
		expect(result).toContain('squeeze')
	})

	it('runners on 1B+2B → includes double-steal-1b-2b, plus individual steals', () => {
		const result = getAvailableStrategies({ first: 'p1', second: 'p2', third: null })
		expect(result).toContain('double-steal-1b-2b')
		expect(result).toContain('steal-1b')
		expect(result).toContain('steal-2b')
	})
})

describe('resolveStrategy', () => {
	it('steal-1b A: batter takes pitch, runner on 1B → 2B', () => {
		const result = resolveStrategy('steal-1b', 'A', { first: 'p1', second: null, third: null })
		expect(result.batter.result).toBe('takes-pitch')
		expect(result.batter.out).toBe(false)
		expect(result.outs).toBe(0)
		expect(result.runners).toEqual([
			{ from: 1, to: 2, out: false, scored: false }
		])
	})

	it('steal-1b D: batter takes pitch, runner on 1B out at 2B → 1 out', () => {
		const result = resolveStrategy('steal-1b', 'D', { first: 'p1', second: null, third: null })
		expect(result.batter.result).toBe('takes-pitch')
		expect(result.batter.out).toBe(false)
		expect(result.outs).toBe(1)
		expect(result.runners).toEqual([
			{ from: 1, to: 2, out: true, scored: false }
		])
	})

	it('squeeze A with runner on 3B: batter grounds out, runner scores → 1 run', () => {
		const result = resolveStrategy('squeeze', 'A', { first: null, second: null, third: 'p3' })
		expect(result.batter.result).toBe('grounds-out')
		expect(result.batter.out).toBe(true)
		expect(result.outs).toBe(1)
		expect(result.runsScored).toBe(1)
		expect(result.runners).toEqual([
			{ from: 3, to: 4, out: false, scored: true }
		])
	})

	it('squeeze E with runner on 3B: batter pops out, runner caught off 3B → 2 outs (DP)', () => {
		const result = resolveStrategy('squeeze', 'E', { first: null, second: null, third: 'p3' })
		expect(result.batter.result).toBe('pops-out')
		expect(result.batter.out).toBe(true)
		expect(result.outs).toBe(2)
		expect(result.runsScored).toBe(0)
		expect(result.runners).toEqual([
			{ from: 3, to: 3, out: true, scored: false }
		])
	})

	it('hit-and-run A: batter singles, runners advance 2', () => {
		const result = resolveStrategy('hit-and-run', 'A', { first: 'p1', second: null, third: null })
		expect(result.batter.result).toBe('singles')
		expect(result.batter.base).toBe(1)
		expect(result.batter.out).toBe(false)
		expect(result.runners).toEqual([
			{ from: 1, to: 3, out: false, scored: false }
		])
	})

	it('steal-2b G: batter singles, runner on 2B scores → 1 run', () => {
		const result = resolveStrategy('steal-2b', 'G', { first: null, second: 'p2', third: null })
		expect(result.batter.result).toBe('singles')
		expect(result.batter.base).toBe(1)
		expect(result.runsScored).toBe(1)
		expect(result.runners).toEqual([
			{ from: 2, to: 4, out: false, scored: true }
		])
	})

	it('sac-bunt-1b J: batter grounds out, runner out at 2B → 2 outs (DP)', () => {
		const result = resolveStrategy('sac-bunt-1b', 'J', { first: 'p1', second: null, third: null })
		expect(result.batter.result).toBe('grounds-out')
		expect(result.batter.out).toBe(true)
		expect(result.outs).toBe(2)
		expect(result.runners).toEqual([
			{ from: 1, to: 2, out: true, scored: false }
		])
	})

	describe('isHit flag', () => {
		it('hit-and-run A (singles) is a hit', () => {
			const result = resolveStrategy('hit-and-run', 'A', { first: 'p1', second: null, third: null })
			expect(result.isHit).toBe(true)
		})
		it('squeeze C (beats out bunt) is a hit', () => {
			const result = resolveStrategy('squeeze', 'C', { first: null, second: null, third: 'p3' })
			expect(result.isHit).toBe(true)
		})
		it('sac-bunt-1b H (beats out bunt) is a hit', () => {
			const result = resolveStrategy('sac-bunt-1b', 'H', { first: 'p1', second: null, third: null })
			expect(result.isHit).toBe(true)
		})
		it('steal-1b B (grounds out) is not a hit', () => {
			const result = resolveStrategy('steal-1b', 'B', { first: 'p1', second: null, third: null })
			expect(result.isHit).toBe(false)
		})
		it('steal-1b A (takes pitch) is not a hit', () => {
			const result = resolveStrategy('steal-1b', 'A', { first: 'p1', second: null, third: null })
			expect(result.isHit).toBe(false)
		})
	})

	describe('batterStays flag', () => {
		it('takes-pitch → batter stays', () => {
			const result = resolveStrategy('steal-1b', 'A', { first: 'p1', second: null, third: null })
			expect(result.batterStays).toBe(true)
		})
		it('misses-ball → batter stays', () => {
			const result = resolveStrategy('hit-and-run', 'C', { first: 'p1', second: null, third: null })
			expect(result.batterStays).toBe(true)
		})
		it('misses-pitch → batter stays', () => {
			const result = resolveStrategy('sac-bunt-2b', 'J', { first: null, second: 'p2', third: null })
			expect(result.batterStays).toBe(true)
		})
		it('grounds-out → batter does not stay', () => {
			const result = resolveStrategy('steal-1b', 'B', { first: 'p1', second: null, third: null })
			expect(result.batterStays).toBe(false)
		})
		it('singles → batter does not stay', () => {
			const result = resolveStrategy('hit-and-run', 'A', { first: 'p1', second: null, third: null })
			expect(result.batterStays).toBe(false)
		})
	})

	it('double-steal-1b-3b D: runner on 1B safe at 2B, runner on 3B out at home → 1 out', () => {
		const result = resolveStrategy('double-steal-1b-3b', 'D', { first: 'p1', second: null, third: 'p3' })
		expect(result.batter.result).toBe('takes-pitch')
		expect(result.batter.out).toBe(false)
		expect(result.outs).toBe(1)
		expect(result.runsScored).toBe(0)
		expect(result.runners).toContainEqual({ from: 3, to: 4, out: true, scored: false })
		expect(result.runners).toContainEqual({ from: 1, to: 2, out: false, scored: false })
	})
})
