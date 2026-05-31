import { describe, it, expect } from 'vitest'
import { getStrategyLetter, getKoLetter } from '../../js/ui/spinner.js'

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
