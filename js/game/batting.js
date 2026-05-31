import { BATTING_KEY, RESULT_TYPES_NEEDING_KO } from './rules.js'

export function resolveBatting(sectorNumber) {
	const type = BATTING_KEY[sectorNumber]
	if (!type) {
		throw new Error(`Invalid sector number: ${sectorNumber}`)
	}
	return {
		type,
		needsKoDial: RESULT_TYPES_NEEDING_KO.has(type)
	}
}

export function spin(disc) {
	const angle = Math.random() * 360
	let cumulative = 0
	for (const sector of disc.sectors) {
		cumulative += sector.size
		if (angle < cumulative) {
			return sector.number
		}
	}
	// Floating-point edge case: return the last sector
	return disc.sectors[disc.sectors.length - 1].number
}
