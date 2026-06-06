import { describe, it, expect } from 'vitest'
import { getStrategyLetter, getKoLetter, getSectorNumber } from '../../js/ui/spinner.js'

// Sample the ring finely and return each letter's fraction of the circle.
function sampleProportions(ring) {
	const counts = {}
	const steps = 36000
	for (let i = 0; i < steps; i++) {
		const angle = (i / steps) * 360
		const letter = getStrategyLetter(angle, ring)
		counts[letter] = (counts[letter] ?? 0) + 1
	}
	const props = {}
	for (const [letter, n] of Object.entries(counts)) {
		props[letter] = n / steps
	}
	return props
}

describe('getStrategyLetter', () => {
	describe('A-E ring (12 unequal segments)', () => {
		it('returns only letters A-E', () => {
			const valid = new Set(['A', 'B', 'C', 'D', 'E'])
			for (let angle = 0; angle < 360; angle += 3) {
				expect(valid.has(getStrategyLetter(angle, 'A-E'))).toBe(true)
			}
		})

		it('D is favored (~27%); A, B, C, E tie (~18% each)', () => {
			const p = sampleProportions('A-E')
			expect(p.D).toBeCloseTo(0.273, 2)
			expect(p.A).toBeCloseTo(0.182, 2)
			expect(p.B).toBeCloseTo(0.182, 2)
			expect(p.C).toBeCloseTo(0.182, 2)
			expect(p.E).toBeCloseTo(0.182, 2)
		})
	})

	describe('F-J ring (12 unequal segments)', () => {
		it('returns only letters F-J', () => {
			const valid = new Set(['F', 'G', 'H', 'I', 'J'])
			for (let angle = 0; angle < 360; angle += 3) {
				expect(valid.has(getStrategyLetter(angle, 'F-J'))).toBe(true)
			}
		})

		it('F is heavily favored (~44%); G, H, I, J tie (~14% each)', () => {
			const p = sampleProportions('F-J')
			expect(p.F).toBeCloseTo(0.444, 2)
			expect(p.G).toBeCloseTo(0.139, 2)
			expect(p.H).toBeCloseTo(0.139, 2)
			expect(p.I).toBeCloseTo(0.139, 2)
			expect(p.J).toBeCloseTo(0.139, 2)
		})
	})

	it('handles negative angles', () => {
		const valid = new Set(['A', 'B', 'C', 'D', 'E'])
		expect(valid.has(getStrategyLetter(-30, 'A-E'))).toBe(true)
	})

	it('handles angles > 360', () => {
		const valid = new Set(['F', 'G', 'H', 'I', 'J'])
		expect(valid.has(getStrategyLetter(400, 'F-J'))).toBe(true)
	})
})

describe('getKoLetter', () => {
	it('returns a valid K-O letter for any angle', () => {
		const valid = new Set(['K', 'L', 'M', 'N', 'O'])
		for (let angle = 0; angle < 360; angle += 5) {
			expect(valid.has(getKoLetter(angle))).toBe(true)
		}
	})
})

describe('getSectorNumber', () => {
	const singleSector = { sectors: [{ number: 7, size: 360 }] }
	const twoEqual = { sectors: [{ number: 1, size: 180 }, { number: 2, size: 180 }] }
	const unequal = { sectors: [{ number: 10, size: 90 }, { number: 20, size: 270 }] }

	it('single sector disc always returns that sector number', () => {
		expect(getSectorNumber(singleSector, 0)).toBe(7)
		expect(getSectorNumber(singleSector, 180)).toBe(7)
		expect(getSectorNumber(singleSector, 359.9)).toBe(7)
	})

	it('angle 0 returns first sector', () => {
		expect(getSectorNumber(twoEqual, 0)).toBe(1)
	})

	it('two equal sectors: angle 0 returns first, angle 180 returns second', () => {
		expect(getSectorNumber(twoEqual, 0)).toBe(1)
		expect(getSectorNumber(twoEqual, 90)).toBe(1)
		expect(getSectorNumber(twoEqual, 180)).toBe(2)
		expect(getSectorNumber(twoEqual, 270)).toBe(2)
	})

	it('unequal sectors: boundary angles', () => {
		// First sector spans 0-90, second spans 90-360
		expect(getSectorNumber(unequal, 0)).toBe(10)
		expect(getSectorNumber(unequal, 89.9)).toBe(10)
		expect(getSectorNumber(unequal, 90)).toBe(20)
		expect(getSectorNumber(unequal, 359.9)).toBe(20)
	})

	it('negative angle wraps correctly', () => {
		// -90 wraps to 270, which is in the second sector (90-360)
		expect(getSectorNumber(twoEqual, -90)).toBe(2)
		// -10 wraps to 350, which is in the second sector
		expect(getSectorNumber(twoEqual, -10)).toBe(2)
		// -360 wraps to 0, which is in the first sector
		expect(getSectorNumber(twoEqual, -360)).toBe(1)
	})

	it('angle > 360 wraps correctly', () => {
		// 450 wraps to 90, which is in the first sector (0-180)
		expect(getSectorNumber(twoEqual, 450)).toBe(1)
		// 540 wraps to 180, which is in the second sector
		expect(getSectorNumber(twoEqual, 540)).toBe(2)
		// 720 wraps to 0, which is in the first sector
		expect(getSectorNumber(twoEqual, 720)).toBe(1)
	})

	it('edge: angle just below boundary vs at boundary', () => {
		// Boundary at 180 for equal sectors
		expect(getSectorNumber(twoEqual, 179.999)).toBe(1)
		expect(getSectorNumber(twoEqual, 180)).toBe(2)
	})
})
