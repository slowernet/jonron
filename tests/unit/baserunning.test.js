import { describe, it, expect } from 'vitest'
import { resolveImmediate } from '../../js/game/baserunning.js'

const empty = { first: null, second: null, third: null }
const loaded = { first: 'r1', second: 'r2', third: 'r3' }

describe('resolveImmediate', () => {
	describe('home-run', () => {
		it('bases empty → 1 run (batter), bases empty', () => {
			const result = resolveImmediate('home-run', empty, 'batter1')
			expect(result.runsScored).toBe(1)
			expect(result.newBases).toEqual(empty)
			expect(result.events).toContainEqual({ type: 'score', player: 'batter1', from: 0, to: 4 })
		})

		it('bases loaded → 4 runs, bases empty', () => {
			const result = resolveImmediate('home-run', loaded, 'batter1')
			expect(result.runsScored).toBe(4)
			expect(result.newBases).toEqual(empty)
		})
	})

	describe('triple', () => {
		it('runner on 2B → 1 run (runner scores), batter at 3B', () => {
			const bases = { first: null, second: 'r2', third: null }
			const result = resolveImmediate('triple', bases, 'batter1')
			expect(result.runsScored).toBe(1)
			expect(result.newBases).toEqual({ first: null, second: null, third: 'batter1' })
			expect(result.events).toContainEqual({ type: 'score', player: 'r2', from: 2, to: 4 })
		})

		it('bases loaded → 3 runs, batter at 3B', () => {
			const result = resolveImmediate('triple', loaded, 'batter1')
			expect(result.runsScored).toBe(3)
			expect(result.newBases).toEqual({ first: null, second: null, third: 'batter1' })
		})
	})

	describe('double', () => {
		it('runner on 1B → 1 run, batter at 2B', () => {
			const bases = { first: 'r1', second: null, third: null }
			const result = resolveImmediate('double', bases, 'batter1')
			expect(result.runsScored).toBe(1)
			expect(result.newBases).toEqual({ first: null, second: 'batter1', third: null })
		})

		it('bases empty → 0 runs, batter at 2B', () => {
			const result = resolveImmediate('double', empty, 'batter1')
			expect(result.runsScored).toBe(0)
			expect(result.newBases).toEqual({ first: null, second: 'batter1', third: null })
		})
	})

	describe('walk', () => {
		it('bases empty → 0 runs, batter at 1B', () => {
			const result = resolveImmediate('walk', empty, 'batter1')
			expect(result.runsScored).toBe(0)
			expect(result.newBases).toEqual({ first: 'batter1', second: null, third: null })
		})

		it('runner on 1B → 0 runs, runners on 1B and 2B', () => {
			const bases = { first: 'r1', second: null, third: null }
			const result = resolveImmediate('walk', bases, 'batter1')
			expect(result.runsScored).toBe(0)
			expect(result.newBases).toEqual({ first: 'batter1', second: 'r1', third: null })
		})

		it('runners on 1B and 2B → 0 runs, bases loaded', () => {
			const bases = { first: 'r1', second: 'r2', third: null }
			const result = resolveImmediate('walk', bases, 'batter1')
			expect(result.runsScored).toBe(0)
			expect(result.newBases).toEqual({ first: 'batter1', second: 'r1', third: 'r2' })
		})

		it('bases loaded → 1 run, bases loaded (runner from 3B scores)', () => {
			const result = resolveImmediate('walk', loaded, 'batter1')
			expect(result.runsScored).toBe(1)
			expect(result.newBases).toEqual({ first: 'batter1', second: 'r1', third: 'r2' })
			expect(result.events).toContainEqual({ type: 'score', player: 'r3', from: 3, to: 4 })
		})

		it('runner on 2B only → 0 runs, runners on 1B and 2B (2B not forced, stays)', () => {
			const bases = { first: null, second: 'r2', third: null }
			const result = resolveImmediate('walk', bases, 'batter1')
			expect(result.runsScored).toBe(0)
			expect(result.newBases).toEqual({ first: 'batter1', second: 'r2', third: null })
		})

		it('runner on 3B only → 0 runs, runners on 1B and 3B (3B not forced)', () => {
			const bases = { first: null, second: null, third: 'r3' }
			const result = resolveImmediate('walk', bases, 'batter1')
			expect(result.runsScored).toBe(0)
			expect(result.newBases).toEqual({ first: 'batter1', second: null, third: 'r3' })
		})
	})

	describe('strikeout', () => {
		it('1 out, bases unchanged', () => {
			const bases = { first: 'r1', second: null, third: 'r3' }
			const result = resolveImmediate('strikeout', bases, 'batter1')
			expect(result.outs).toBe(1)
			expect(result.runsScored).toBe(0)
			expect(result.newBases).toEqual({ first: 'r1', second: null, third: 'r3' })
		})
	})

	describe('isHit flag', () => {
		it('home-run is a hit', () => {
			expect(resolveImmediate('home-run', empty, 'b').isHit).toBe(true)
		})
		it('triple is a hit', () => {
			expect(resolveImmediate('triple', empty, 'b').isHit).toBe(true)
		})
		it('double is a hit', () => {
			expect(resolveImmediate('double', empty, 'b').isHit).toBe(true)
		})
		it('home-run isError is false', () => {
			expect(resolveImmediate('home-run', empty, 'b').isError).toBe(false)
		})
		it('walk is not a hit', () => {
			expect(resolveImmediate('walk', empty, 'b').isHit).toBe(false)
		})
		it('strikeout is not a hit', () => {
			expect(resolveImmediate('strikeout', empty, 'b').isHit).toBe(false)
		})
	})
})
