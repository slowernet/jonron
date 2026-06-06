export const STRATEGY_LABELS = {
	'steal-1b': 'Steal 2nd (from 1B)',
	'steal-2b': 'Steal 3rd (from 2B)',
	'double-steal-1b-3b': 'Double Steal (1B & 3B)',
	'double-steal-1b-2b': 'Double Steal (1B & 2B)',
	'hit-and-run': 'Hit and Run',
	'squeeze': 'Squeeze Play',
	'sac-bunt-1b': 'Sacrifice Bunt (1B)',
	'sac-bunt-2b': 'Sacrifice Bunt (2B)'
}

export function createControls(container, callbacks) {
	const bar = document.createElement('div')
	bar.className = 'jr-controls'

	const spinBtn = document.createElement('button')
	spinBtn.className = 'jr-btn jr-btn-spin'
	spinBtn.textContent = 'Spin'
	spinBtn.addEventListener('click', () => callbacks.onSpin())

	const wrap = document.createElement('div')
	wrap.className = 'jr-strategy-wrap'
	const strategyBtn = document.createElement('button')
	strategyBtn.className = 'jr-btn jr-btn-strategy'
	strategyBtn.innerHTML = 'Strategy <span class="caret">&#9660;</span>'
	wrap.appendChild(strategyBtn)

	const menu = document.createElement('div')
	menu.className = 'jr-strategy-menu'
	menu.hidden = true
	wrap.appendChild(menu)

	strategyBtn.addEventListener('click', () => { menu.hidden = !menu.hidden })
	document.addEventListener('click', (e) => {
		if (!wrap.contains(e.target)) menu.hidden = true
	})

	// Strategy on the left, Spin (primary) on the right
	bar.append(wrap, spinBtn)
	container.appendChild(bar)

	return {
		element: bar,
		enable() {
			spinBtn.disabled = false
			strategyBtn.disabled = menu.children.length === 0
		},
		disable() {
			spinBtn.disabled = true
			strategyBtn.disabled = true
			menu.hidden = true
		},
		updateStrategies(availablePlays) {
			menu.textContent = ''
			for (const playType of (availablePlays ?? [])) {
				const opt = document.createElement('button')
				opt.textContent = STRATEGY_LABELS[playType] ?? playType
				opt.addEventListener('click', () => {
					menu.hidden = true
					callbacks.onStrategy(playType)
				})
				menu.appendChild(opt)
			}
			const ibb = document.createElement('button')
			ibb.textContent = 'Intentional Walk'
			ibb.addEventListener('click', () => {
				menu.hidden = true
				callbacks.onIntentionalWalk()
			})
			menu.appendChild(ibb)
			strategyBtn.disabled = false
		},
		setPhase(phase) {
			if (phase === 'batting') {
				spinBtn.disabled = false
				spinBtn.textContent = 'Spin'
				strategyBtn.disabled = menu.children.length === 0
			} else if (phase === 'strategy') {
				spinBtn.disabled = true
				strategyBtn.disabled = true
				menu.hidden = true
			}
		}
	}
}
