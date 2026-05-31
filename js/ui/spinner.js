const SVG_NS = 'http://www.w3.org/2000/svg'

function svgEl(tag, attrs = {}) {
	const el = document.createElementNS(SVG_NS, tag)
	for (const [k, v] of Object.entries(attrs)) {
		el.setAttribute(k, v)
	}
	return el
}

function polarToCartesian(cx, cy, radius, angleDeg) {
	const rad = (angleDeg - 90) * Math.PI / 180
	return {
		x: cx + radius * Math.cos(rad),
		y: cy + radius * Math.sin(rad)
	}
}

function describeSector(cx, cy, radius, startAngle, endAngle) {
	const start = polarToCartesian(cx, cy, radius, startAngle)
	const end = polarToCartesian(cx, cy, radius, endAngle)
	const largeArc = endAngle - startAngle > 180 ? 1 : 0

	return [
		'M', cx, cy,
		'L', start.x, start.y,
		'A', radius, radius, 0, largeArc, 1, end.x, end.y,
		'Z'
	].join(' ')
}

const KO_SECTORS = [
	{ letter: 'K', angle: 26, fill: '#111' },
	{ letter: 'N', angle: 32, fill: '#271f6b' },
	{ letter: 'O', angle: 26, fill: '#111' },
	{ letter: 'N', angle: 32, fill: '#271f6b' },
	{ letter: 'K', angle: 26, fill: '#111' },
	{ letter: 'L', angle: 48, fill: '#271f6b' },
	{ letter: 'N', angle: 48, fill: '#271f6b' },
	{ letter: 'M', angle: 26, fill: '#111' },
	{ letter: 'N', angle: 48, fill: '#271f6b' },
	{ letter: 'L', angle: 48, fill: '#271f6b' },
]

export function createSpinner(svg, cx, cy, radius, label) {
	const g = svgEl('g', {
		id: 'spinner',
		transform: `translate(${cx}, ${cy})`
	})

	const outerRadius = radius
	const innerRadius = radius * 0.82

	// K-O outer ring group
	const koRing = svgEl('g', { class: 'ko-ring' })
	let currentAngle = 0
	KO_SECTORS.forEach((sector) => {
		const endAngle = currentAngle + sector.angle

		const sectorPath = svgEl('path', {
			d: describeSector(0, 0, outerRadius, currentAngle, endAngle),
			fill: sector.fill,
			stroke: '#4a3fa0',
			'stroke-width': '1.5'
		})
		koRing.appendChild(sectorPath)

		// Letter label
		const midAngle = currentAngle + sector.angle / 2
		const labelR = (outerRadius + innerRadius) / 2
		const labelPos = polarToCartesian(0, 0, labelR, midAngle)
		const letterLabel = svgEl('text', {
			x: labelPos.x,
			y: labelPos.y,
			'text-anchor': 'middle',
			'dominant-baseline': 'central',
			'font-size': sector.angle < 35 ? '12' : '16',
			'font-weight': 'bold',
			fill: 'var(--cream)',
			'font-family': 'system-ui, sans-serif'
		})
		letterLabel.textContent = sector.letter
		koRing.appendChild(letterLabel)

		// Radial separator
		const lineStart = polarToCartesian(0, 0, innerRadius, currentAngle)
		const lineEnd = polarToCartesian(0, 0, outerRadius, currentAngle)
		const line = svgEl('line', {
			x1: lineStart.x,
			y1: lineStart.y,
			x2: lineEnd.x,
			y2: lineEnd.y,
			stroke: '#4a3fa0',
			'stroke-width': '1.5'
		})
		koRing.appendChild(line)

		currentAngle = endAngle
	})
	g.appendChild(koRing)

	// Inner circle background (blue like the original board)
	const innerBg = svgEl('circle', {
		cx: 0, cy: 0, r: innerRadius,
		fill: 'var(--blue)',
		stroke: '#222',
		'stroke-width': '1.5'
	})
	g.appendChild(innerBg)

	// Disc container group
	const discContainer = svgEl('g', { class: 'disc-container' })
	g.appendChild(discContainer)

	// Arrow/pointer — paddle with tail behind pivot
	const arrowLen = outerRadius * 0.88
	const tailLen = outerRadius * 0.25
	const arrowGroup = svgEl('g', { class: 'spinner-arrow' })
	const hw = 6
	const tailHw = 5
	const arrow = svgEl('path', {
		d: [
			`M ${-tailHw} ${tailLen}`,
			`A ${tailHw} ${tailHw} 0 0 1 ${tailHw} ${tailLen}`,
			`L ${hw} 0`,
			`L 0 ${-arrowLen}`,
			`L ${-hw} 0`,
			'Z'
		].join(' '),
		fill: '#222',
		stroke: '#111',
		'stroke-width': '1',
		'stroke-linejoin': 'round'
	})
	arrowGroup.appendChild(arrow)

	// Center pivot
	const pivot = svgEl('circle', {
		cx: 0, cy: 0, r: 10,
		fill: '#333',
		stroke: '#111',
		'stroke-width': '1.5'
	})
	arrowGroup.appendChild(pivot)
	g.appendChild(arrowGroup)

	// Label
	const labelEl = svgEl('text', {
		x: 0,
		y: outerRadius + 22,
		'text-anchor': 'middle',
		'font-size': '12',
		'font-weight': 'bold',
		fill: 'var(--cream)',
		'font-family': 'system-ui, sans-serif'
	})
	labelEl.textContent = label
	g.appendChild(labelEl)

	svg.appendChild(g)

	return {
		element: g,
		arrow: arrowGroup,

		setDisc(discSvg) {
			discContainer.textContent = ''
			discContainer.appendChild(discSvg)
		},

		clearDisc() {
			discContainer.textContent = ''
		},

		setLabel(text) {
			labelEl.textContent = text
		},

		hideKoRing() {
			koRing.style.opacity = '0.15'
		},

		showKoRing() {
			koRing.style.opacity = ''
		},

		getResult(angle) {
			return {
				koLetter: getKoLetter(angle),
			}
		}
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
		const proxy = { angle: startRotation }
		gsap.to(proxy, {
			angle: totalRotation,
			duration,
			ease: 'power4.out',
			onUpdate() {
				spinner.arrow.setAttribute('transform', `rotate(${proxy.angle})`)
			},
			onComplete() {
				spinner._rotation = totalRotation
				resolve()
			}
		})
	})
}

// A-E ring: A/B/C/D wide (360/11deg), E narrow (2/3 of wide). 12 segments.
const AE_WIDE = 360 / 11
const AE_NARROW = AE_WIDE * 2 / 3
const STRATEGY_SECTORS_AE = [
	{ letter: 'E', angle: AE_NARROW },
	{ letter: 'C', angle: AE_WIDE },
	{ letter: 'D', angle: AE_WIDE },
	{ letter: 'A', angle: AE_WIDE },
	{ letter: 'E', angle: AE_NARROW },
	{ letter: 'B', angle: AE_WIDE },
	{ letter: 'D', angle: AE_WIDE },
	{ letter: 'C', angle: AE_WIDE },
	{ letter: 'E', angle: AE_NARROW },
	{ letter: 'B', angle: AE_WIDE },
	{ letter: 'D', angle: AE_WIDE },
	{ letter: 'A', angle: AE_WIDE },
]

// F-J ring: F wide (40deg, x4), G/H/I/J narrow (25deg). 12 segments.
const STRATEGY_SECTORS_FJ = [
	{ letter: 'H', angle: 25 },
	{ letter: 'G', angle: 25 },
	{ letter: 'F', angle: 40 },
	{ letter: 'J', angle: 25 },
	{ letter: 'F', angle: 40 },
	{ letter: 'I', angle: 25 },
	{ letter: 'H', angle: 25 },
	{ letter: 'G', angle: 25 },
	{ letter: 'F', angle: 40 },
	{ letter: 'J', angle: 25 },
	{ letter: 'F', angle: 40 },
	{ letter: 'I', angle: 25 },
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
		if (normalized >= currentAngle && normalized < currentAngle + sectorAngle) {
			return sector.number
		}
		currentAngle += sectorAngle
	}
	// Edge case: exactly 360 maps to first sector
	return disc.sectors[0].number
}
