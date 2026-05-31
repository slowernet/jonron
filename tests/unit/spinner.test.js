import { describe, it, expect } from 'vitest'
import { getStrategyLetter, getKoLetter } from '../../js/ui/spinner.js'

describe('getStrategyLetter', () => {
	describe('A-E ring', () => {
		it('returns a letter A-E for any angle', () => {
			const valid = new Set(['A', 'B', 'C', 'D', 'E'])
			for (let angle = 0; angle < 360; angle += 10) {
				expect(valid.has(getStrategyLetter(angle, 'A-E'))).toBe(true)
			}
		})

		it('each letter covers 72 degrees total (two 36-degree sectors)', () => {
			const counts = { A: 0, B: 0, C: 0, D: 0, E: 0 }
			for (let angle = 0; angle < 360; angle += 1) {
				counts[getStrategyLetter(angle, 'A-E')]++
			}
			for (const letter of Object.keys(counts)) {
				expect(counts[letter]).toBe(72)
			}
		})
	})

	describe('F-J ring', () => {
		it('returns a letter F-J for any angle', () => {
			const valid = new Set(['F', 'G', 'H', 'I', 'J'])
			for (let angle = 0; angle < 360; angle += 10) {
				expect(valid.has(getStrategyLetter(angle, 'F-J'))).toBe(true)
			}
		})

		it('each letter covers 72 degrees total (two 36-degree sectors)', () => {
			const counts = { F: 0, G: 0, H: 0, I: 0, J: 0 }
			for (let angle = 0; angle < 360; angle += 1) {
				counts[getStrategyLetter(angle, 'F-J')]++
			}
			for (const letter of Object.keys(counts)) {
				expect(counts[letter]).toBe(72)
			}
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
