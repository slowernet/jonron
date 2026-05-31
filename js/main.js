import { createBoard } from './ui/board.js'
import { createDiscSVG } from './ui/disc.js'
import { createSpinner } from './ui/spinner.js'
import { createDiamond, updateRunners } from './ui/diamond.js'
import { createScoreboard } from './ui/scoreboard.js'
import { createNarrator, narrate } from './ui/narrator.js'

document.addEventListener('DOMContentLoaded', () => {
	const container = document.getElementById('game')

	// Create board
	const board = createBoard(container)

	// Test disc
	const testDisc = {
		id: 'test',
		name: 'Babe Ruth',
		position: 'outfield',
		sectors: [
			{ number: 1, size: 40 },
			{ number: 9, size: 35 },
			{ number: 10, size: 55 },
			{ number: 7, size: 30 },
			{ number: 14, size: 50 },
			{ number: 11, size: 25 },
			{ number: 2, size: 30 },
			{ number: 13, size: 20 },
			{ number: 6, size: 25 },
			{ number: 8, size: 20 },
			{ number: 5, size: 10 },
			{ number: 12, size: 20 }
		]
	}

	// Create spinner with disc
	const spinner = createSpinner(board.svg, 200, 400, 120, 'visitor')
	const discSvg = createDiscSVG(testDisc, 0, 0, 100)
	spinner.setDisc(discSvg)

	// Test diamond with runners
	const diamond = createDiamond(board.svg, 512, 250, 180)
	updateRunners(diamond, { first: 'test', second: null, third: 'test2' })

	// Test scoreboard
	const scoreboard = createScoreboard(container)

	// Test narrator
	const narratorEl = createNarrator(container)
	narrate(narratorEl, 'Welcome to Jonrón Baseball!')
	narrate(narratorEl, 'Ruth steps to the plate...')
})
