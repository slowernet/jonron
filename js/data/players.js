const VALID_POSITIONS = [
	'pitcher', 'catcher', 'first-base', 'second-base',
	'shortstop', 'third-base', 'outfield'
]

export function validateDisc(disc) {
	const errors = []

	if (typeof disc.id !== 'string' || disc.id.length === 0) {
		errors.push('id must be a non-empty string')
	}

	if (typeof disc.name !== 'string' || disc.name.length === 0) {
		errors.push('name must be a non-empty string')
	}

	if (!VALID_POSITIONS.includes(disc.position)) {
		errors.push(`position must be one of: ${VALID_POSITIONS.join(', ')}`)
	}

	if (!Array.isArray(disc.sectors) || disc.sectors.length === 0) {
		errors.push('sectors must be a non-empty array')
		return { valid: false, errors }
	}

	const seenNumbers = new Set()
	for (const sector of disc.sectors) {
		if (!Number.isInteger(sector.number) || sector.number < 1 || sector.number > 14) {
			errors.push(`sector number must be an integer between 1 and 14, got ${sector.number}`)
		} else if (seenNumbers.has(sector.number)) {
			errors.push(`duplicate sector number: ${sector.number}`)
		} else {
			seenNumbers.add(sector.number)
		}

		if (typeof sector.size !== 'number' || sector.size <= 0) {
			errors.push(`sector size must be a positive number, got ${sector.size}`)
		}
	}

	const totalSize = disc.sectors.reduce((sum, s) => sum + s.size, 0)
	if (Math.abs(totalSize - 360) > 0.1) {
		errors.push(`sector sizes must sum to 360, got ${totalSize}`)
	}

	return { valid: errors.length === 0, errors }
}

export async function loadPlayers(url) {
	const response = await fetch(url)
	if (!response.ok) {
		throw new Error(`Failed to fetch players: ${response.status}`)
	}

	const discs = await response.json()
	const valid = []

	for (const disc of discs) {
		const result = validateDisc(disc)
		if (result.valid) {
			valid.push(disc)
		} else {
			console.warn(`Skipping invalid disc "${disc.name || disc.id || '?'}": ${result.errors.join(', ')}`)
		}
	}

	return valid
}

export function getDiscColor(position) {
	if (position === 'pitcher' || position === 'catcher') return 'white'
	if (position === 'outfield') return 'red'
	return 'grey'
}
