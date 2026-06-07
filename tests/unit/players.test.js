import { describe, it, expect, vi } from 'vitest'
import { validateDisc, getDiscColor, loadPlayers, fullName } from '../../js/data/players.js'

function makeValidDisc(overrides = {}) {
	return {
		id: 'p1',
		nameFirst: 'Test',
		nameLast: 'Player',
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

	it('missing nameFirst → invalid', () => {
		const disc = makeValidDisc({ nameFirst: '' })
		const result = validateDisc(disc)
		expect(result.valid).toBe(false)
		expect(result.errors.some(e => e.includes('nameFirst'))).toBe(true)
	})

	it('missing nameLast → invalid', () => {
		const disc = makeValidDisc({ nameLast: '' })
		const result = validateDisc(disc)
		expect(result.valid).toBe(false)
		expect(result.errors.some(e => e.includes('nameLast'))).toBe(true)
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

	it('missing id → invalid', () => {
		const disc = makeValidDisc({ id: '' })
		const result = validateDisc(disc)
		expect(result.valid).toBe(false)
		expect(result.errors.some(e => e.includes('id'))).toBe(true)
	})

	it('non-string id → invalid', () => {
		const disc = makeValidDisc({ id: 123 })
		const result = validateDisc(disc)
		expect(result.valid).toBe(false)
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

	it('second-base → grey, third-base → grey', () => {
		expect(getDiscColor('second-base')).toBe('grey')
		expect(getDiscColor('third-base')).toBe('grey')
	})

	it('unknown position → grey', () => {
		expect(getDiscColor('designated-hitter')).toBe('grey')
	})
})

describe('fullName', () => {
	it('combines first and last name', () => {
		expect(fullName({ nameFirst: 'Willie', nameLast: 'Mays' })).toBe('Willie Mays')
	})
})

describe('loadPlayers', () => {
	const validPlayer = {
		id: 'p1', nameFirst: 'Test', nameLast: 'Player', position: 'pitcher',
		sectors: [
			{ number: 1, size: 30 }, { number: 2, size: 30 },
			{ number: 3, size: 25 }, { number: 4, size: 25 },
			{ number: 5, size: 25 }, { number: 6, size: 25 },
			{ number: 7, size: 25 }, { number: 8, size: 25 },
			{ number: 9, size: 25 }, { number: 10, size: 25 },
			{ number: 11, size: 25 }, { number: 12, size: 25 },
			{ number: 13, size: 25 }, { number: 14, size: 25 },
		]
	}

	it('fetches and returns valid players from array', async () => {
		globalThis.fetch = vi.fn(() => Promise.resolve({
			ok: true,
			json: () => Promise.resolve([validPlayer])
		}))
		const result = await loadPlayers('test.json')
		expect(result).toHaveLength(1)
		expect(result[0].id).toBe('p1')
	})

	it('fetches from data.players object format', async () => {
		globalThis.fetch = vi.fn(() => Promise.resolve({
			ok: true,
			json: () => Promise.resolve({ players: [validPlayer] })
		}))
		const result = await loadPlayers('test.json')
		expect(result).toHaveLength(1)
	})

	it('throws on HTTP error', async () => {
		globalThis.fetch = vi.fn(() => Promise.resolve({
			ok: false, status: 404
		}))
		await expect(loadPlayers('test.json')).rejects.toThrow('404')
	})

	it('skips invalid discs and returns only valid ones', async () => {
		const invalid = { ...validPlayer, id: 'p2', nameFirst: '', position: 'pitcher' }
		globalThis.fetch = vi.fn(() => Promise.resolve({
			ok: true,
			json: () => Promise.resolve([validPlayer, invalid])
		}))
		const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
		const result = await loadPlayers('test.json')
		expect(result).toHaveLength(1)
		expect(consoleSpy).toHaveBeenCalled()
		consoleSpy.mockRestore()
	})
})
