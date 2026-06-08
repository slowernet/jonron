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

	describe('isTagPlay flag', () => {
		it('grounds-out is not a tag play (force out)', () => {
			const result = resolveStrategy('squeeze', 'A', { first: null, second: null, third: 'p3' })
			expect(result.isTagPlay).toBe(false)
		})

		it('flies-out is a tag play', () => {
			const result = resolveStrategy('steal-1b', 'E', { first: 'p1', second: null, third: null })
			expect(result.isTagPlay).toBe(true)
		})

		it('pops-out is a tag play', () => {
			const result = resolveStrategy('squeeze', 'E', { first: null, second: null, third: 'p3' })
			expect(result.isTagPlay).toBe(true)
		})

		it('lines-out is a tag play', () => {
			const result = resolveStrategy('steal-2b', 'J', { first: null, second: 'p2', third: null })
			expect(result.isTagPlay).toBe(true)
		})

		it('singles is a tag play (no force)', () => {
			const result = resolveStrategy('hit-and-run', 'A', { first: 'p1', second: null, third: null })
			expect(result.isTagPlay).toBe(true)
		})

		it('batter stays results have no isTagPlay (undefined/falsy is fine)', () => {
			const result = resolveStrategy('steal-1b', 'A', { first: 'p1', second: null, third: null })
			expect(result.isTagPlay).toBeFalsy()
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

	describe('double-steal-1b-2b', () => {
		const bases = { first: 'p1', second: 'p2', third: null }

		it('F: takes-pitch, runners advance 1 → p2 to 3B, p1 to 2B', () => {
			const result = resolveStrategy('double-steal-1b-2b', 'F', bases)
			expect(result.batter.result).toBe('takes-pitch')
			expect(result.batter.out).toBe(false)
			expect(result.batterStays).toBe(true)
			expect(result.outs).toBe(0)
			expect(result.runners).toContainEqual({ from: 2, to: 3, out: false, scored: false })
			expect(result.runners).toContainEqual({ from: 1, to: 2, out: false, scored: false })
		})

		it('G: flies-out, runners hold → 1 out', () => {
			const result = resolveStrategy('double-steal-1b-2b', 'G', bases)
			expect(result.batter.result).toBe('flies-out')
			expect(result.batter.out).toBe(true)
			expect(result.batterStays).toBe(false)
			expect(result.outs).toBe(1)
			expect(result.runners).toContainEqual({ from: 2, to: 2, out: false, scored: false })
			expect(result.runners).toContainEqual({ from: 1, to: 1, out: false, scored: false })
		})

		it('H: takes-pitch, out at 3B, safe at 2B → p2 out, p1 to 2B', () => {
			const result = resolveStrategy('double-steal-1b-2b', 'H', bases)
			expect(result.batter.result).toBe('takes-pitch')
			expect(result.batterStays).toBe(true)
			expect(result.outs).toBe(1)
			expect(result.runners).toContainEqual({ from: 2, to: 3, out: true, scored: false })
			expect(result.runners).toContainEqual({ from: 1, to: 2, out: false, scored: false })
		})

		it('I: singles, runners advance 2 → p2 scores, p1 to 3B', () => {
			const result = resolveStrategy('double-steal-1b-2b', 'I', bases)
			expect(result.batter.result).toBe('singles')
			expect(result.batter.base).toBe(1)
			expect(result.isHit).toBe(true)
			expect(result.runsScored).toBe(1)
			expect(result.runners).toContainEqual({ from: 2, to: 4, out: false, scored: true })
			expect(result.runners).toContainEqual({ from: 1, to: 3, out: false, scored: false })
		})

		it('J: grounds-out, out at 2B DP, safe at 3B → batter out, p1 out, p2 to 3B', () => {
			const result = resolveStrategy('double-steal-1b-2b', 'J', bases)
			expect(result.batter.result).toBe('grounds-out')
			expect(result.batter.out).toBe(true)
			expect(result.outs).toBe(2)
			expect(result.runners).toContainEqual({ from: 1, to: 2, out: true, scored: false })
			expect(result.runners).toContainEqual({ from: 2, to: 3, out: false, scored: false })
		})
	})

	describe('sac-bunt-2b', () => {
		const bases = { first: null, second: 'p2', third: null }

		it('F: grounds-out, runner advances 1 → p2 to 3B', () => {
			const result = resolveStrategy('sac-bunt-2b', 'F', bases)
			expect(result.batter.result).toBe('grounds-out')
			expect(result.batter.out).toBe(true)
			expect(result.outs).toBe(1)
			expect(result.runners).toContainEqual({ from: 2, to: 3, out: false, scored: false })
		})

		it('G: safe-at-1b, out at 3B → batter at 1B, p2 out at 3B', () => {
			const result = resolveStrategy('sac-bunt-2b', 'G', bases)
			expect(result.batter.result).toBe('safe-at-1b')
			expect(result.batter.base).toBe(1)
			expect(result.batter.out).toBe(false)
			expect(result.outs).toBe(1)
			expect(result.runners).toContainEqual({ from: 2, to: 3, out: true, scored: false })
		})

		it('H: beats-out-bunt, runners advance 1 → batter at 1B, p2 to 3B', () => {
			const result = resolveStrategy('sac-bunt-2b', 'H', bases)
			expect(result.batter.result).toBe('beats-out-bunt')
			expect(result.batter.base).toBe(1)
			expect(result.batter.out).toBe(false)
			expect(result.isHit).toBe(true)
			expect(result.runners).toContainEqual({ from: 2, to: 3, out: false, scored: false })
		})

		it('I: pops-out, runners hold → p2 stays at 2B', () => {
			const result = resolveStrategy('sac-bunt-2b', 'I', bases)
			expect(result.batter.result).toBe('pops-out')
			expect(result.batter.out).toBe(true)
			expect(result.outs).toBe(1)
			expect(result.runners).toContainEqual({ from: 2, to: 2, out: false, scored: false })
		})

		it('J: misses-pitch, caught off 2B → p2 out at 2B', () => {
			const result = resolveStrategy('sac-bunt-2b', 'J', bases)
			expect(result.batter.result).toBe('misses-pitch')
			expect(result.batterStays).toBe(true)
			expect(result.outs).toBe(1)
			expect(result.runners).toContainEqual({ from: 2, to: 2, out: true, scored: false })
		})
	})

	describe('steal-1b missing letters', () => {
		const bases = { first: 'p1', second: null, third: null }

		it('B: grounds-out, runners advance 1 → 1 out', () => {
			const result = resolveStrategy('steal-1b', 'B', bases)
			expect(result.batter.result).toBe('grounds-out')
			expect(result.batter.out).toBe(true)
			expect(result.outs).toBe(1)
			expect(result.runners).toContainEqual({ from: 1, to: 2, out: false, scored: false })
		})

		it('C: singles, runners advance 2 → isHit true', () => {
			const result = resolveStrategy('steal-1b', 'C', bases)
			expect(result.batter.result).toBe('singles')
			expect(result.batter.base).toBe(1)
			expect(result.isHit).toBe(true)
			expect(result.runners).toContainEqual({ from: 1, to: 3, out: false, scored: false })
		})

		it('E: flies-out, runners hold → 1 out', () => {
			const result = resolveStrategy('steal-1b', 'E', bases)
			expect(result.batter.result).toBe('flies-out')
			expect(result.batter.out).toBe(true)
			expect(result.outs).toBe(1)
			expect(result.runners).toContainEqual({ from: 1, to: 1, out: false, scored: false })
		})
	})

	describe('hit-and-run missing letters', () => {
		const bases = { first: 'p1', second: null, third: null }

		it('B: flies-out, runners hold → 1 out', () => {
			const result = resolveStrategy('hit-and-run', 'B', bases)
			expect(result.batter.result).toBe('flies-out')
			expect(result.batter.out).toBe(true)
			expect(result.batterStays).toBe(false)
			expect(result.outs).toBe(1)
			expect(result.runners).toContainEqual({ from: 1, to: 1, out: false, scored: false })
		})

		it('D: grounds-out, runners advance 1 → 1 out', () => {
			const result = resolveStrategy('hit-and-run', 'D', bases)
			expect(result.batter.result).toBe('grounds-out')
			expect(result.batter.out).toBe(true)
			expect(result.outs).toBe(1)
			expect(result.runners).toContainEqual({ from: 1, to: 2, out: false, scored: false })
		})

		it('E: misses-ball, runner out at 2B → batterStays true', () => {
			const result = resolveStrategy('hit-and-run', 'E', bases)
			expect(result.batter.result).toBe('misses-ball')
			expect(result.batterStays).toBe(true)
			expect(result.outs).toBe(1)
			expect(result.runners).toContainEqual({ from: 1, to: 2, out: true, scored: false })
		})
	})

	describe('steal-2b missing letters', () => {
		const bases = { first: null, second: 'p2', third: null }

		it('F: takes-pitch, runner safe at 3B → batterStays true', () => {
			const result = resolveStrategy('steal-2b', 'F', bases)
			expect(result.batter.result).toBe('takes-pitch')
			expect(result.batterStays).toBe(true)
			expect(result.outs).toBe(0)
			expect(result.runners).toContainEqual({ from: 2, to: 3, out: false, scored: false })
		})

		it('H: takes-pitch, runner out at 3B → 1 out, batterStays true', () => {
			const result = resolveStrategy('steal-2b', 'H', bases)
			expect(result.batter.result).toBe('takes-pitch')
			expect(result.batterStays).toBe(true)
			expect(result.outs).toBe(1)
			expect(result.runners).toContainEqual({ from: 2, to: 3, out: true, scored: false })
		})

		it('I: grounds-out, runner safe at 3B → 1 out', () => {
			const result = resolveStrategy('steal-2b', 'I', bases)
			expect(result.batter.result).toBe('grounds-out')
			expect(result.batter.out).toBe(true)
			expect(result.outs).toBe(1)
			expect(result.runners).toContainEqual({ from: 2, to: 3, out: false, scored: false })
		})

		it('J: lines-out, runner caught off 2B (DP) → 2 outs', () => {
			const result = resolveStrategy('steal-2b', 'J', bases)
			expect(result.batter.result).toBe('lines-out')
			expect(result.batter.out).toBe(true)
			expect(result.outs).toBe(2)
			expect(result.runners).toContainEqual({ from: 2, to: 2, out: true, scored: false })
		})
	})

	describe('squeeze missing letters', () => {
		const bases = { first: null, second: null, third: 'p3' }

		it('B: misses-ball, runner out at plate → 1 out, batterStays true', () => {
			const result = resolveStrategy('squeeze', 'B', bases)
			expect(result.batter.result).toBe('misses-ball')
			expect(result.batterStays).toBe(true)
			expect(result.outs).toBe(1)
			expect(result.runsScored).toBe(0)
			expect(result.runners).toContainEqual({ from: 3, to: 4, out: true, scored: false })
		})

		it('D: safe-at-1b, runner out at plate → 1 out', () => {
			const result = resolveStrategy('squeeze', 'D', bases)
			expect(result.batter.result).toBe('safe-at-1b')
			expect(result.batter.base).toBe(1)
			expect(result.batter.out).toBe(false)
			expect(result.outs).toBe(1)
			expect(result.runsScored).toBe(0)
			expect(result.runners).toContainEqual({ from: 3, to: 4, out: true, scored: false })
		})
	})

	describe('sac-bunt-1b missing letters', () => {
		const bases = { first: 'p1', second: null, third: null }

		it('F: grounds-out, runner advances 1 → 1 out', () => {
			const result = resolveStrategy('sac-bunt-1b', 'F', bases)
			expect(result.batter.result).toBe('grounds-out')
			expect(result.batter.out).toBe(true)
			expect(result.outs).toBe(1)
			expect(result.runners).toContainEqual({ from: 1, to: 2, out: false, scored: false })
		})

		it('G: safe-at-1b, runner out at 2B → 1 out', () => {
			const result = resolveStrategy('sac-bunt-1b', 'G', bases)
			expect(result.batter.result).toBe('safe-at-1b')
			expect(result.batter.base).toBe(1)
			expect(result.batter.out).toBe(false)
			expect(result.outs).toBe(1)
			expect(result.runners).toContainEqual({ from: 1, to: 2, out: true, scored: false })
		})

		it('I: pops-out, runner holds → 1 out', () => {
			const result = resolveStrategy('sac-bunt-1b', 'I', bases)
			expect(result.batter.result).toBe('pops-out')
			expect(result.batter.out).toBe(true)
			expect(result.outs).toBe(1)
			expect(result.runners).toContainEqual({ from: 1, to: 1, out: false, scored: false })
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
