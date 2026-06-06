const SVG_NS = 'http://www.w3.org/2000/svg'

function svgEl(tag, attrs = {}) {
	const el = document.createElementNS(SVG_NS, tag)
	for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v)
	return el
}

function polarToCartesian(cx, cy, radius, angleDeg) {
	const rad = (angleDeg - 90) * Math.PI / 180
	return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) }
}

function describeSector(cx, cy, radius, startAngle, endAngle) {
	const start = polarToCartesian(cx, cy, radius, startAngle)
	const end = polarToCartesian(cx, cy, radius, endAngle)
	const largeArc = endAngle - startAngle > 180 ? 1 : 0
	return ['M', cx, cy, 'L', start.x, start.y,
		'A', radius, radius, 0, largeArc, 1, end.x, end.y, 'Z'].join(' ')
}

// K / O are "strike" cells (dark); L / M / N are field cells
const KO_SECTORS = [
	{ letter: 'K', angle: 26, kind: 'strike' },
	{ letter: 'N', angle: 32, kind: 'field' },
	{ letter: 'O', angle: 26, kind: 'strike' },
	{ letter: 'N', angle: 32, kind: 'field' },
	{ letter: 'K', angle: 26, kind: 'strike' },
	{ letter: 'L', angle: 48, kind: 'field' },
	{ letter: 'N', angle: 48, kind: 'field' },
	{ letter: 'M', angle: 26, kind: 'strike' },
	{ letter: 'N', angle: 48, kind: 'field' },
	{ letter: 'L', angle: 48, kind: 'field' }
]

export function createSpinner(svg, cx, cy, radius, label) {
	const g = svgEl('g', { id: 'spinner', transform: `translate(${cx}, ${cy})` })
	const outerRadius = radius
	const innerRadius = radius * 0.82

	// K-O outer ring
	const koRing = svgEl('g', { class: 'ko-ring' })
	let currentAngle = 0
	KO_SECTORS.forEach((sector) => {
		const endAngle = currentAngle + sector.angle
		koRing.appendChild(svgEl('path', {
			d: describeSector(0, 0, outerRadius, currentAngle, endAngle),
			fill: sector.kind === 'strike' ? 'var(--ko-strike)' : 'var(--ko-field)',
			stroke: 'var(--ko-line)', 'stroke-width': '1.5'
		}))
		const midAngle = currentAngle + sector.angle / 2
		const labelPos = polarToCartesian(0, 0, (outerRadius + innerRadius) / 2, midAngle)
		const lbl = svgEl('text', {
			x: labelPos.x, y: labelPos.y, class: 'jr-mono',
			'text-anchor': 'middle', 'dominant-baseline': 'central',
			'font-size': sector.angle < 35 ? '12' : '15', 'font-weight': '700',
			fill: 'var(--ko-letter)'
		})
		lbl.textContent = sector.letter
		koRing.appendChild(lbl)
		const ls = polarToCartesian(0, 0, innerRadius, currentAngle)
		const le = polarToCartesian(0, 0, outerRadius, currentAngle)
		koRing.appendChild(svgEl('line', {
			x1: ls.x, y1: ls.y, x2: le.x, y2: le.y,
			stroke: 'var(--ko-line)', 'stroke-width': '1.5'
		}))
		currentAngle = endAngle
	})
	g.appendChild(koRing)

	// inner core background behind the disc
	g.appendChild(svgEl('circle', {
		cx: 0, cy: 0, r: innerRadius,
		fill: 'var(--spin-core)', stroke: 'var(--spin-core-edge)', 'stroke-width': '2'
	}))

	const discContainer = svgEl('g', { class: 'disc-container' })
	g.appendChild(discContainer)

	// needle — slender pointer with a tail
	const arrowLen = outerRadius * 0.9
	const tailLen = outerRadius * 0.26
	const arrowGroup = svgEl('g', { class: 'spinner-arrow' })
	const hw = 5.5
	const tailHw = 4.5
	arrowGroup.appendChild(svgEl('path', {
		d: [`M ${-tailHw} ${tailLen}`,
			`A ${tailHw} ${tailHw} 0 0 1 ${tailHw} ${tailLen}`,
			`L ${hw} 0`, `L 0 ${-arrowLen}`, `L ${-hw} 0`, 'Z'].join(' '),
		fill: 'var(--needle)', stroke: 'var(--needle-edge)',
		'stroke-width': '1', 'stroke-linejoin': 'round'
	}))
	// brass pivot
	arrowGroup.appendChild(svgEl('circle', {
		cx: 0, cy: 0, r: 11, fill: 'var(--pivot)',
		stroke: 'var(--pivot-edge)', 'stroke-width': '2'
	}))
	arrowGroup.appendChild(svgEl('circle', {
		cx: 0, cy: 0, r: 4, fill: 'var(--pivot-edge)'
	}))
	g.appendChild(arrowGroup)

	svg.appendChild(g)

	return {
		element: g,
		arrow: arrowGroup,
		setDisc(discSvg) {
			discContainer.textContent = ''
			discContainer.appendChild(discSvg)
		},
		clearDisc() { discContainer.textContent = '' },
		setLabel() {},
		hideKoRing() { koRing.style.opacity = '0.18' },
		showKoRing() { koRing.style.opacity = '' },
		resetArrow() {
			this._rotation = 0
			arrowGroup.setAttribute('transform', 'rotate(0)')
		},
		getResult(angle) { return { koLetter: getKoLetter(angle) } }
	}
}

export function spinTo(spinner, targetAngle, duration = 2.5) {
	const startRotation = spinner._rotation ?? 0
	const minSpins = 720
	const maxSpins = 1800
	const baseSpins = minSpins + Math.random() * (maxSpins - minSpins)
	const currentRemainder = ((startRotation + baseSpins) % 360 + 360) % 360
	const adjust = ((targetAngle - currentRemainder) % 360 + 360) % 360
	const totalRotation = startRotation + baseSpins + adjust

	return new Promise((resolve) => {
		if (typeof gsap === 'undefined') {
			spinner.arrow.setAttribute('transform', `rotate(${totalRotation})`)
			spinner._rotation = totalRotation
			resolve()
			return
		}
		const proxy = { angle: startRotation }
		gsap.to(proxy, {
			angle: totalRotation, duration, ease: 'power4.out',
			onUpdate() { spinner.arrow.setAttribute('transform', `rotate(${proxy.angle})`) },
			onComplete() { spinner._rotation = totalRotation; resolve() }
		})
	})
}

const AE_WIDE = 360 / 11
const AE_NARROW = AE_WIDE * 2 / 3
const STRATEGY_SECTORS_AE = [
	{ letter: 'E', angle: AE_NARROW }, { letter: 'C', angle: AE_WIDE },
	{ letter: 'D', angle: AE_WIDE }, { letter: 'A', angle: AE_WIDE },
	{ letter: 'E', angle: AE_NARROW }, { letter: 'B', angle: AE_WIDE },
	{ letter: 'D', angle: AE_WIDE }, { letter: 'C', angle: AE_WIDE },
	{ letter: 'E', angle: AE_NARROW }, { letter: 'B', angle: AE_WIDE },
	{ letter: 'D', angle: AE_WIDE }, { letter: 'A', angle: AE_WIDE }
]
const STRATEGY_SECTORS_FJ = [
	{ letter: 'H', angle: 25 }, { letter: 'G', angle: 25 }, { letter: 'F', angle: 40 },
	{ letter: 'J', angle: 25 }, { letter: 'F', angle: 40 }, { letter: 'I', angle: 25 },
	{ letter: 'H', angle: 25 }, { letter: 'G', angle: 25 }, { letter: 'F', angle: 40 },
	{ letter: 'J', angle: 25 }, { letter: 'F', angle: 40 }, { letter: 'I', angle: 25 }
]

export function getStrategyLetter(angle, ring) {
	const sectors = ring === 'A-E' ? STRATEGY_SECTORS_AE : STRATEGY_SECTORS_FJ
	const normalized = ((angle % 360) + 360) % 360
	let current = 0
	for (const sector of sectors) {
		current += sector.angle
		if (normalized < current) return sector.letter
	}
	return sectors[0].letter
}

export function getKoLetter(angle) {
	const normalized = ((angle % 360) + 360) % 360
	let current = 0
	for (const sector of KO_SECTORS) {
		current += sector.angle
		if (normalized < current) return sector.letter
	}
	return KO_SECTORS[0].letter
}

export function getSectorNumber(disc, angle) {
	const normalized = ((angle % 360) + 360) % 360
	const totalSize = disc.sectors.reduce((sum, s) => sum + s.size, 0)
	let currentAngle = 0
	for (const sector of disc.sectors) {
		const sectorAngle = (sector.size / totalSize) * 360
		if (normalized >= currentAngle && normalized < currentAngle + sectorAngle) return sector.number
		currentAngle += sectorAngle
	}
	return disc.sectors[0].number
}
