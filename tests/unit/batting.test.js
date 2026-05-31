import { describe, it, expect } from 'vitest'
import { resolveBatting, spin } from '../../js/game/batting.js'

describe('resolveBatting', () => {
	it('sector 1 → home-run, no KO dial needed', () => {
		const result = resolveBatting(1)
		expect(result.type).toBe('home-run')
		expect(result.needsKoDial).toBe(false)
	})

	it('sector 7 → single, needs KO dial', () => {
		const result = resolveBatting(7)
		expect(result.type).toBe('single')
		expect(result.needsKoDial).toBe(true)
	})

	it('sector 10 → strikeout, no KO dial needed', () => {
		const result = resolveBatting(10)
		expect(result.type).toBe('strikeout')
		expect(result.needsKoDial).toBe(false)
	})

	it('all 14 sectors produce valid results', () => {
		const validTypes = new Set([
			'home-run', 'ground-ball', 'fly-ball', 'triple',
			'single', 'walk', 'strikeout', 'double'
		])
		for (let i = 1; i <= 14; i++) {
			const result = resolveBatting(i)
			expect(validTypes.has(result.type)).toBe(true)
			expect(typeof result.needsKoDial).toBe('boolean')
		}
	})

	it('throws for invalid sector number', () => {
		expect(() => resolveBatting(0)).toThrow('Invalid sector number')
		expect(() => resolveBatting(15)).toThrow('Invalid sector number')
	})
})

describe('spin', () => {
	it('disc with single 360° sector always returns that number', () => {
		const disc = { sectors: [{ number: 5, size: 360 }] }
		for (let i = 0; i < 100; i++) {
			expect(spin(disc)).toBe(5)
		}
	})

	it('disc with two equal 180° sectors returns each roughly 50%', () => {
		const disc = {
			sectors: [
				{ number: 1, size: 180 },
				{ number: 2, size: 180 }
			]
		}
		const counts = { 1: 0, 2: 0 }
		const trials = 10000
		for (let i = 0; i < trials; i++) {
			const result = spin(disc)
			counts[result]++
		}
		const ratio1 = counts[1] / trials
		const ratio2 = counts[2] / trials
		expect(ratio1).toBeGreaterThan(0.45)
		expect(ratio1).toBeLessThan(0.55)
		expect(ratio2).toBeGreaterThan(0.45)
		expect(ratio2).toBeLessThan(0.55)
	})

	it('result is always a valid sector number', () => {
		const disc = {
			sectors: [
				{ number: 3, size: 120 },
				{ number: 7, size: 120 },
				{ number: 11, size: 120 }
			]
		}
		const validNumbers = new Set([3, 7, 11])
		for (let i = 0; i < 1000; i++) {
			const result = spin(disc)
			expect(validNumbers.has(result)).toBe(true)
		}
	})
})
