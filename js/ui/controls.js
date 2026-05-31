const STRATEGY_LABELS = {
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
	bar.className = 'control-bar'

	// Strategy wrapper (button + dropdown)
	const strategyWrapper = document.createElement('div')
	strategyWrapper.className = 'control-strategy-wrapper'

	const strategyBtn = document.createElement('button')
	strategyBtn.className = 'control-btn control-strategy'
	strategyBtn.textContent = 'STRATEGY'
	strategyWrapper.appendChild(strategyBtn)

	const dropdown = document.createElement('div')
	dropdown.className = 'control-strategy-dropdown'
	dropdown.hidden = true
	strategyWrapper.appendChild(dropdown)

	strategyBtn.addEventListener('click', () => {
		dropdown.hidden = !dropdown.hidden
	})

	bar.appendChild(strategyWrapper)

	// Spin button
	const spinBtn = document.createElement('button')
	spinBtn.className = 'control-btn control-spin'
	spinBtn.textContent = 'SPIN'
	spinBtn.addEventListener('click', () => callbacks.onSpin())
	bar.appendChild(spinBtn)

	// Message area
	const messageEl = document.createElement('div')
	messageEl.className = 'control-message'
	bar.appendChild(messageEl)

	// Close dropdown on outside click
	document.addEventListener('click', (e) => {
		if (!strategyWrapper.contains(e.target)) {
			dropdown.hidden = true
		}
	})

	container.appendChild(bar)

	const api = {
		element: bar,

		enable() {
			spinBtn.disabled = false
			strategyBtn.disabled = dropdown.children.length === 0
		},

		disable() {
			spinBtn.disabled = true
			strategyBtn.disabled = true
			dropdown.hidden = true
		},

		updateStrategies(availablePlays) {
			dropdown.textContent = ''

			for (const playType of (availablePlays ?? [])) {
				const option = document.createElement('button')
				option.className = 'control-strategy-option'
				option.textContent = STRATEGY_LABELS[playType] ?? playType
				option.addEventListener('click', () => {
					dropdown.hidden = true
					callbacks.onStrategy(playType)
				})
				dropdown.appendChild(option)
			}

			// IBB is always available
			const ibbOption = document.createElement('button')
			ibbOption.className = 'control-strategy-option'
			ibbOption.textContent = 'Intentional Walk'
			ibbOption.addEventListener('click', () => {
				dropdown.hidden = true
				callbacks.onIntentionalWalk()
			})
			dropdown.appendChild(ibbOption)

			strategyBtn.disabled = false
		},

		showMessage(text) {
			messageEl.textContent = text
			messageEl.classList.remove('control-message-fade')
			// Force reflow to restart animation
			void messageEl.offsetWidth
			messageEl.classList.add('control-message-fade')
		},

		setPhase(phase) {
			switch (phase) {
				case 'batting':
					spinBtn.disabled = false
					spinBtn.textContent = 'SPIN'
					strategyBtn.disabled = dropdown.children.length === 0
					break
				case 'ko-dial':
					spinBtn.disabled = false
					spinBtn.textContent = 'K-O SPIN'
					strategyBtn.disabled = true
					dropdown.hidden = true
					break
				case 'strategy':
					spinBtn.disabled = true
					strategyBtn.disabled = true
					dropdown.hidden = true
					break
				default:
					break
			}
		}
	}

	return api
}
