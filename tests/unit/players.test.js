import { describe, it, expect } from 'vitest'
import { validateDisc, getDiscColor } from '../../js/data/players.js'

function makeValidDisc(overrides = {}) {
	return {
		id: 'p1',
		name: 'Test Player',
		position: 'pitcher',
		sectors: [
			{ number: 1, size: 30 },
			{ number: 2, size: 30 },
			{ number: 3, size: 25 },
			{ number: 4, size: 25 },
			{ number: 5, size: 25 },
			{ number: 6, size: 25 },
			{ number: 7, size: 25 },
			{ number: 8, size: 25 },
			{ number: 9, size: 25 },
			{ number: 10, size: 25 },
			{ number: 11, size: 25 },
			{ number: 12, size: 25 },
			{ number: 13, size: 25 },
			{ number: 14, size: 25 },
		],
		...overrides,
	}
}

describe('validateDisc', () => {
	it('valid disc passes', () => {
		const result = validateDisc(makeValidDisc())
		expect(result.valid).toBe(true)
		expect(result.errors).toHaveLength(0)
	})

	it('sectors not summing to 360 → invalid with error message', () => {
		const disc = makeValidDisc({
			sectors: [
				{ number: 1, size: 100 },
				{ number: 2, size: 100 },
			],
		})
		const result = validateDisc(disc)
		expect(result.valid).toBe(false)
		expect(result.errors.some(e => e.includes('sum to 360'))).toBe(true)
	})

	it('missing name → invalid', () => {
		const disc = makeValidDisc({ name: '' })
		const result = validateDisc(disc)
		expect(result.valid).toBe(false)
		expect(result.errors.some(e => e.includes('name'))).toBe(true)
	})

	it('invalid position → invalid', () => {
		const disc = makeValidDisc({ position: 'goalkeeper' })
		const result = validateDisc(disc)
		expect(result.valid).toBe(false)
		expect(result.errors.some(e => e.includes('position'))).toBe(true)
	})

	it('duplicate sector numbers → invalid', () => {
		const sectors = []
		for (let i = 1; i <= 14; i++) {
			sectors.push({ number: i === 14 ? 13 : i, size: i === 14 ? 25 : (335 / 13) })
		}
		// Fix: make a proper duplicate case
		const disc = makeValidDisc({
			sectors: [
				{ number: 1, size: 30 },
				{ number: 1, size: 30 },
				{ number: 3, size: 25 },
				{ number: 4, size: 25 },
				{ number: 5, size: 25 },
				{ number: 6, size: 25 },
				{ number: 7, size: 25 },
				{ number: 8, size: 25 },
				{ number: 9, size: 25 },
				{ number: 10, size: 25 },
				{ number: 11, size: 25 },
				{ number: 12, size: 25 },
				{ number: 13, size: 25 },
				{ number: 14, size: 25 },
			],
		})
		const result = validateDisc(disc)
		expect(result.valid).toBe(false)
		expect(result.errors.some(e => e.includes('duplicate'))).toBe(true)
	})

	it('empty sectors array → invalid', () => {
		const disc = makeValidDisc({ sectors: [] })
		const result = validateDisc(disc)
		expect(result.valid).toBe(false)
		expect(result.errors.some(e => e.includes('non-empty'))).toBe(true)
	})

	it('sector number outside 1-14 → invalid', () => {
		const disc = makeValidDisc({
			sectors: [
				{ number: 0, size: 30 },
				{ number: 2, size: 30 },
				{ number: 3, size: 25 },
				{ number: 4, size: 25 },
				{ number: 5, size: 25 },
				{ number: 6, size: 25 },
				{ number: 7, size: 25 },
				{ number: 8, size: 25 },
				{ number: 9, size: 25 },
				{ number: 10, size: 25 },
				{ number: 11, size: 25 },
				{ number: 12, size: 25 },
				{ number: 13, size: 25 },
				{ number: 14, size: 25 },
			],
		})
		const result = validateDisc(disc)
		expect(result.valid).toBe(false)
		expect(result.errors.some(e => e.includes('between 1 and 14'))).toBe(true)
	})

	it('sector size <= 0 → invalid', () => {
		const disc = makeValidDisc({
			sectors: [
				{ number: 1, size: 0 },
				{ number: 2, size: 360 },
				{ number: 3, size: 0 },
				{ number: 4, size: 0 },
				{ number: 5, size: 0 },
				{ number: 6, size: 0 },
				{ number: 7, size: 0 },
				{ number: 8, size: 0 },
				{ number: 9, size: 0 },
				{ number: 10, size: 0 },
				{ number: 11, size: 0 },
				{ number: 12, size: 0 },
				{ number: 13, size: 0 },
				{ number: 14, size: 0 },
			],
		})
		const result = validateDisc(disc)
		expect(result.valid).toBe(false)
		expect(result.errors.some(e => e.includes('positive number'))).toBe(true)
	})

	it('sectors summing to 359.95 → valid (within tolerance)', () => {
		const disc = makeValidDisc({
			sectors: [
				{ number: 1, size: 29.95 },
				{ number: 2, size: 30 },
				{ number: 3, size: 25 },
				{ number: 4, size: 25 },
				{ number: 5, size: 25 },
				{ number: 6, size: 25 },
				{ number: 7, size: 25 },
				{ number: 8, size: 25 },
				{ number: 9, size: 25 },
				{ number: 10, size: 25 },
				{ number: 11, size: 25 },
				{ number: 12, size: 25 },
				{ number: 13, size: 25 },
				{ number: 14, size: 25 },
			],
		})
		const result = validateDisc(disc)
		expect(result.valid).toBe(true)
	})
})

describe('getDiscColor', () => {
	it('pitcher → white, catcher → white', () => {
		expect(getDiscColor('pitcher')).toBe('white')
		expect(getDiscColor('catcher')).toBe('white')
	})

	it('shortstop → grey, first-base → grey', () => {
		expect(getDiscColor('shortstop')).toBe('grey')
		expect(getDiscColor('first-base')).toBe('grey')
	})

	it('outfield → red', () => {
		expect(getDiscColor('outfield')).toBe('red')
	})
})
