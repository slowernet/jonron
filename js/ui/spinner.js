import { svgEl, polarToCartesian, describeSector } from './svg-utils.js'
import { STRATEGY_SECTORS_AE, STRATEGY_SECTORS_FJ } from '../constants.js'

const KO_RING_INNER_RATIO = 0.82
const MIN_SPIN_DEGREES = 720
const MAX_SPIN_DEGREES = 1800
const SPIN_DURATION = 2.5

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
	const innerRadius = radius * KO_RING_INNER_RATIO

	// K-O outer ring
	const koRing = svgEl('g', { class: 'ko-ring' })
	let currentAngle = 0
	KO_SECTORS.forEach((sector) => {
		const endAngle = currentAngle + sector.angle
		koRing.appendChild(svgEl('path', {
			d: describeSector(0, 0, outerRadius, currentAngle, endAngle),
			class: 'ko-sector',
			fill: sector.kind === 'strike' ? 'var(--ko-strike)' : 'var(--ko-field)'
		}))
		const midAngle = currentAngle + sector.angle / 2
		const labelPos = polarToCartesian(0, 0, (outerRadius + innerRadius) / 2, midAngle)
		const lbl = svgEl('text', {
			x: labelPos.x, y: labelPos.y,
			class: sector.angle < 35 ? 'ko-label ko-label-sm' : 'ko-label',
			'text-anchor': 'middle', 'dominant-baseline': 'central'
		})
		lbl.textContent = sector.letter
		koRing.appendChild(lbl)
		const ls = polarToCartesian(0, 0, innerRadius, currentAngle)
		const le = polarToCartesian(0, 0, outerRadius, currentAngle)
		koRing.appendChild(svgEl('line', {
			x1: ls.x, y1: ls.y, x2: le.x, y2: le.y,
			class: 'ko-divider'
		}))
		currentAngle = endAngle
	})
	g.appendChild(koRing)

	// inner core background behind the disc
	g.appendChild(svgEl('circle', {
		cx: 0, cy: 0, r: innerRadius, class: 'spinner-core'
	}))

	const discContainer = svgEl('g', { class: 'disc-container' })
	g.appendChild(discContainer)

	// pointer — teardrop shape with equal mass behind pivot
	const arrowLen = outerRadius * 0.88
	const tailLen = outerRadius * 0.46
	const arrowGroup = svgEl('g', { class: 'spinner-arrow' })
	const tipHw = 5
	const bulbR = 14
	// tip (narrow diamond point) -> waist -> bulb tail (wide rounded end)
	arrowGroup.appendChild(svgEl('path', {
		d: [
			`M 0 ${-arrowLen}`,
			`L ${tipHw} ${-arrowLen * 0.15}`,
			`C ${tipHw + 2} ${tailLen * 0.3} ${bulbR} ${tailLen * 0.55} ${bulbR} ${tailLen * 0.75}`,
			`A ${bulbR} ${bulbR} 0 1 1 ${-bulbR} ${tailLen * 0.75}`,
			`C ${-bulbR} ${tailLen * 0.55} ${-tipHw - 2} ${tailLen * 0.3} ${-tipHw} ${-arrowLen * 0.15}`,
			'Z'
		].join(' '),
		class: 'spinner-needle'
	}))
	// pivot rivet
	arrowGroup.appendChild(svgEl('circle', {
		cx: 0, cy: 0, r: 8, class: 'spinner-pivot'
	}))
	arrowGroup.appendChild(svgEl('circle', {
		cx: 0, cy: 0, r: 3, class: 'spinner-pivot-dot'
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
		hideKoRing() { koRing.style.opacity = '0.12' },
		showKoRing() { koRing.style.opacity = '0.85' },
		resetArrow() {
			this._rotation = 0
			arrowGroup.style.transform = 'rotate(0deg)'
		},
		getResult(angle) { return { koLetter: getKoLetter(angle) } }
	}
}

export function spinTo(spinner, targetAngle, duration = SPIN_DURATION) {
	const startRotation = spinner._rotation ?? 0
	const baseSpins = MIN_SPIN_DEGREES + Math.random() * (MAX_SPIN_DEGREES - MIN_SPIN_DEGREES)
	const currentRemainder = ((startRotation + baseSpins) % 360 + 360) % 360
	const adjust = ((targetAngle - currentRemainder) % 360 + 360) % 360
	const totalRotation = startRotation + baseSpins + adjust

	return new Promise((resolve) => {
		if (typeof gsap === 'undefined') {
			spinner.arrow.style.transform = `rotate(${totalRotation}deg)`
			spinner._rotation = totalRotation
			resolve()
			return
		}
		const proxy = { angle: startRotation }
		gsap.to(proxy, {
			angle: totalRotation, duration, ease: 'power4.out',
			onUpdate() { spinner.arrow.style.transform = `rotate(${proxy.angle}deg)` },
			onComplete() { spinner._rotation = totalRotation; resolve() }
		})
	})
}

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
