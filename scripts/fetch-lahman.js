import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '..', 'data', 'lahman')
const BASE_URL = 'https://raw.githubusercontent.com/cbwinslow/baseballdatabank/master/core'

const FILES = [
	'Batting.csv',
	'People.csv',
	'Appearances.csv',
	'Pitching.csv',
	'Teams.csv'
]

async function fetchFile(name) {
	const url = `${BASE_URL}/${name}`
	console.log(`Fetching ${name}...`)
	const res = await fetch(url)
	if (!res.ok) throw new Error(`Failed to fetch ${name}: ${res.status}`)
	const text = await res.text()
	writeFileSync(join(DATA_DIR, name), text)
	console.log(`  ${name} saved (${(text.length / 1024).toFixed(0)} KB)`)
}

async function main() {
	if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true })
	console.log(`Downloading Lahman data to ${DATA_DIR}\n`)
	for (const file of FILES) {
		await fetchFile(file)
	}
	console.log('\nDone.')
}

main().catch(err => {
	console.error(err.message)
	process.exit(1)
})
