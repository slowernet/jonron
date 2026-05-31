export function createScoreboard(container) {
	const el = document.createElement('div')
	el.className = 'scoreboard'

	// Inning header row
	const maxInnings = 9
	let headerHtml = '<div class="scoreboard-row scoreboard-header"><span class="scoreboard-team"></span>'
	for (let i = 1; i <= maxInnings; i++) {
		headerHtml += `<span class="scoreboard-cell" data-inning="${i}">${i}</span>`
	}
	headerHtml += '<span class="scoreboard-cell scoreboard-total">R</span></div>'

	// Visitor row
	let visitorHtml = '<div class="scoreboard-row" data-team="visitor"><span class="scoreboard-team">VIS</span>'
	for (let i = 1; i <= maxInnings; i++) {
		visitorHtml += `<span class="scoreboard-cell" data-inning="${i}">-</span>`
	}
	visitorHtml += '<span class="scoreboard-cell scoreboard-total" data-total="visitor">0</span></div>'

	// Home row
	let homeHtml = '<div class="scoreboard-row" data-team="home"><span class="scoreboard-team">HOME</span>'
	for (let i = 1; i <= maxInnings; i++) {
		homeHtml += `<span class="scoreboard-cell" data-inning="${i}">-</span>`
	}
	homeHtml += '<span class="scoreboard-cell scoreboard-total" data-total="home">0</span></div>'

	el.innerHTML = headerHtml + visitorHtml + homeHtml

	// Game info bar
	const infoBar = document.createElement('div')
	infoBar.className = 'scoreboard-info'
	infoBar.innerHTML = `
		<div class="scoreboard-outs">
			<span class="outs-label">OUTS</span>
			<span class="out-dot" data-out="1"></span>
			<span class="out-dot" data-out="2"></span>
			<span class="out-dot" data-out="3"></span>
		</div>
		<div class="scoreboard-batter">
			<span class="batter-label">AT BAT:</span>
			<span class="batter-name">---</span>
		</div>
		<div class="scoreboard-inning">
			<span class="inning-label">INNING:</span>
			<span class="inning-value">Top 1</span>
		</div>
	`
	el.appendChild(infoBar)

	container.appendChild(el)

	return el
}

export function updateScoreboard(scoreboard, gameState) {
	if (!gameState) return

	const { inning, halfInning, outs, score, currentBatter } = gameState

	// Update outs
	const dots = scoreboard.querySelectorAll('.out-dot')
	dots.forEach((dot, i) => {
		dot.classList.toggle('active', i < (outs ?? 0))
	})

	// Update batter
	const batterName = scoreboard.querySelector('.batter-name')
	if (batterName) {
		batterName.textContent = currentBatter?.name ?? '---'
	}

	// Update inning display
	const inningValue = scoreboard.querySelector('.inning-value')
	if (inningValue && inning != null) {
		const half = halfInning === 'bottom' ? 'Bot' : 'Top'
		inningValue.textContent = `${half} ${inning}`
	}

	// Update score cells
	if (score) {
		for (const team of ['visitor', 'home']) {
			const row = scoreboard.querySelector(`[data-team="${team}"]`)
			if (!row || !score[team]) continue

			let total = 0
			const innings = score[team]

			// Add extra inning columns if needed
			const headerRow = scoreboard.querySelector('.scoreboard-header')
			const currentCols = headerRow.querySelectorAll('.scoreboard-cell:not(.scoreboard-total)').length

			if (innings.length > currentCols) {
				for (let i = currentCols + 1; i <= innings.length; i++) {
					// Add header cell
					const headerCell = document.createElement('span')
					headerCell.className = 'scoreboard-cell'
					headerCell.dataset.inning = i
					headerCell.textContent = i
					headerRow.insertBefore(headerCell, headerRow.querySelector('.scoreboard-total'))

					// Add cells to both rows
					for (const t of ['visitor', 'home']) {
						const r = scoreboard.querySelector(`[data-team="${t}"]`)
						const cell = document.createElement('span')
						cell.className = 'scoreboard-cell'
						cell.dataset.inning = i
						cell.textContent = '-'
						r.insertBefore(cell, r.querySelector('.scoreboard-total'))
					}
				}
			}

			innings.forEach((runs, idx) => {
				const cell = row.querySelector(`[data-inning="${idx + 1}"]`)
				if (cell) {
					cell.textContent = runs ?? '-'
					total += runs ?? 0
				}
			})

			const totalCell = scoreboard.querySelector(`[data-total="${team}"]`)
			if (totalCell) totalCell.textContent = total
		}

		// Highlight current inning
		const allCells = scoreboard.querySelectorAll('.scoreboard-cell')
		allCells.forEach(c => c.classList.remove('current'))
		if (inning) {
			scoreboard.querySelectorAll(`[data-inning="${inning}"]`).forEach(c => {
				c.classList.add('current')
			})
		}
	}
}
