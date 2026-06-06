import { describe, it, expect } from 'vitest'
import { BATTING_KEY, RESULT_TYPES_NEEDING_KO, IMMEDIATE_RESULTS, KO_DIAL, STRATEGY, STRATEGY_REQUIREMENTS, STRATEGY_DISC } from '../../js/game/rules.js'
import { STRATEGY_SECTORS_AE, STRATEGY_SECTORS_FJ } from '../../js/constants.js'

describe('BATTING_KEY', () => {
	it('has every sector 1-14 defined', () => {
		for (let i = 1; i <= 14; i++) {
			expect(BATTING_KEY[i]).toBeDefined()
		}
	})

	it('every value is a string', () => {
		for (const value of Object.values(BATTING_KEY)) {
			expect(typeof value).toBe('string')
		}
	})

	it('has no extra keys beyond 1-14', () => {
		const keys = Object.keys(BATTING_KEY).map(Number)
		expect(keys).toHaveLength(14)
		for (const k of keys) {
			expect(k).toBeGreaterThanOrEqual(1)
			expect(k).toBeLessThanOrEqual(14)
		}
	})
})

describe('RESULT_TYPES_NEEDING_KO + IMMEDIATE_RESULTS', () => {
	it('are disjoint (no overlap)', () => {
		for (const type of RESULT_TYPES_NEEDING_KO) {
			expect(IMMEDIATE_RESULTS.has(type)).toBe(false)
		}
	})

	it('together cover all result types in BATTING_KEY', () => {
		const allTypes = new Set(Object.values(BATTING_KEY))
		for (const type of allTypes) {
			const inKo = RESULT_TYPES_NEEDING_KO.has(type)
			const inImmediate = IMMEDIATE_RESULTS.has(type)
			expect(inKo || inImmediate).toBe(true)
		}
	})
})

describe('KO_DIAL', () => {
	const koLetters = ['K', 'L', 'M', 'N', 'O']

	it('has an entry for every result type in RESULT_TYPES_NEEDING_KO', () => {
		for (const type of RESULT_TYPES_NEEDING_KO) {
			expect(KO_DIAL[type]).toBeDefined()
		}
	})

	it('every entry has all 5 letters K, L, M, N, O', () => {
		for (const type of RESULT_TYPES_NEEDING_KO) {
			for (const letter of koLetters) {
				expect(KO_DIAL[type][letter]).toBeDefined()
			}
		}
	})

	it('every outcome has batter.base, batter.out, and description', () => {
		for (const type of RESULT_TYPES_NEEDING_KO) {
			for (const letter of koLetters) {
				const outcome = KO_DIAL[type][letter]
				expect(outcome.batter).toBeDefined()
				expect(outcome.batter).toHaveProperty('base')
				expect(outcome.batter).toHaveProperty('out')
				expect(typeof outcome.description).toBe('string')
			}
		}
	})
})

describe('STRATEGY', () => {
	const aeLetters = ['A', 'B', 'C', 'D', 'E']
	const fjLetters = ['F', 'G', 'H', 'I', 'J']

	it('every strategy type has all required letters based on its disc', () => {
		for (const [strategyType, entries] of Object.entries(STRATEGY)) {
			const disc = STRATEGY_DISC[strategyType]
			const expectedLetters = disc === 'A-E' ? aeLetters : fjLetters
			for (const letter of expectedLetters) {
				expect(entries[letter]).toBeDefined()
			}
		}
	})

	it('every entry has batter, runners, and description fields', () => {
		for (const [, entries] of Object.entries(STRATEGY)) {
			for (const [, outcome] of Object.entries(entries)) {
				expect(outcome).toHaveProperty('batter')
				expect(outcome).toHaveProperty('runners')
				expect(outcome).toHaveProperty('description')
			}
		}
	})

	it('STRATEGY, STRATEGY_REQUIREMENTS, and STRATEGY_DISC have the same keys', () => {
		const strategyKeys = new Set(Object.keys(STRATEGY))
		const requirementKeys = new Set(Object.keys(STRATEGY_REQUIREMENTS))
		const discKeys = new Set(Object.keys(STRATEGY_DISC))
		expect(strategyKeys).toEqual(requirementKeys)
		expect(strategyKeys).toEqual(discKeys)
	})
})

describe('STRATEGY_SECTORS', () => {
	it('STRATEGY_SECTORS_AE angles sum to 360', () => {
		const sum = STRATEGY_SECTORS_AE.reduce((s, sector) => s + sector.angle, 0)
		expect(sum).toBeCloseTo(360, 5)
	})

	it('STRATEGY_SECTORS_FJ angles sum to 360', () => {
		const sum = STRATEGY_SECTORS_FJ.reduce((s, sector) => s + sector.angle, 0)
		expect(sum).toBeCloseTo(360, 5)
	})
})
