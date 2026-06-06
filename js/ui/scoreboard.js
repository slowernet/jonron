export function createScoreboard(container) {
	const el = document.createElement('div')
	el.className = 'jr-scoreboard'

	const table = document.createElement('table')
	table.className = 'jr-linescore'
	const maxInnings = 9

	let head = '<thead><tr><th class="team"></th>'
	for (let i = 1; i <= maxInnings; i++) head += `<th data-h="${i}">${i}</th>`
	head += '<th class="rhe first">R</th><th class="rhe">H</th><th class="rhe">E</th></tr></thead>'

	function bodyRow(team, label) {
		let r = `<tr data-team="${team}"><td class="team">${label}</td>`
		for (let i = 1; i <= maxInnings; i++) r += `<td data-inning="${i}">·</td>`
		r += `<td class="rhe first" data-total="${team}">0</td>`
		r += `<td class="rhe" data-hits="${team}">0</td>`
		r += `<td class="rhe" data-errors="${team}">0</td></tr>`
		return r
	}

	table.innerHTML = head + '<tbody>' +
		bodyRow('visitor', 'AWAY') + bodyRow('home', 'HOME') + '</tbody>'
	el.appendChild(table)
	container.appendChild(el)
	return el
}

export function updateScoreboard(scoreboard, gameState) {
	if (!gameState) return
	const { inning, halfInning, score, stats } = gameState

	if (score) {
		const headRow = scoreboard.querySelector('thead tr')
		const currentCols = headRow.querySelectorAll('th[data-h]').length

		for (const team of ['visitor', 'home']) {
			const row = scoreboard.querySelector(`tr[data-team="${team}"]`)
			if (!row || !score[team]) continue
			const innings = score[team]

			if (innings.length > currentCols) {
				for (let i = currentCols + 1; i <= innings.length; i++) {
					const th = document.createElement('th')
					th.dataset.h = i
					th.textContent = i
					headRow.insertBefore(th, headRow.querySelector('.rhe.first'))
					for (const t of ['visitor', 'home']) {
						const r = scoreboard.querySelector(`tr[data-team="${t}"]`)
						const td = document.createElement('td')
						td.dataset.inning = i
						td.textContent = '·'
						r.insertBefore(td, r.querySelector('.rhe.first'))
					}
				}
			}

			let total = 0
			innings.forEach((runs, idx) => {
				const cell = row.querySelector(`td[data-inning="${idx + 1}"]`)
				if (cell) { cell.textContent = runs ?? '·'; total += runs ?? 0 }
			})
			const totalCell = scoreboard.querySelector(`td[data-total="${team}"]`)
			if (totalCell) totalCell.textContent = total
		}

		scoreboard.querySelectorAll('td[data-inning]').forEach(c => c.classList.remove('active'))
		if (inning) {
			const activeTeam = halfInning === 'top' ? 'visitor' : 'home'
			const activeRow = scoreboard.querySelector(`tr[data-team="${activeTeam}"]`)
			const cell = activeRow?.querySelector(`td[data-inning="${inning}"]`)
			if (cell) cell.classList.add('active')
		}
	}

	if (stats) {
		for (const team of ['visitor', 'home']) {
			const h = scoreboard.querySelector(`td[data-hits="${team}"]`)
			if (h) h.textContent = stats[team]?.hits ?? 0
			const e = scoreboard.querySelector(`td[data-errors="${team}"]`)
			if (e) e.textContent = stats[team]?.errors ?? 0
		}
	}
}
