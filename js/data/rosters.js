export async function loadRosterIndex(url = 'data/rosters/index.json') {
	const res = await fetch(url)
	if (!res.ok) throw new Error(`Failed to fetch roster index: ${res.status}`)
	const data = await res.json()
	return data.rosters
}

export async function loadRoster(id, baseUrl = 'data/rosters') {
	const res = await fetch(`${baseUrl}/${id}.json`)
	if (!res.ok) throw new Error(`Failed to fetch roster ${id}: ${res.status}`)
	return res.json()
}
