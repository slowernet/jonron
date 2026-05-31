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

const KO_LETTERS = ['K', 'L', 'M', 'N', 'O']

export function createSpinner(svg, cx, cy, radius, side) {
	const g = svgEl('g', {
		id: `${side}-spinner`,
		transform: `translate(${cx}, ${cy})`
	})

	const outerRadius = radius
	const innerRadius = radius * 0.82

	// K-O outer ring sectors
	KO_LETTERS.forEach((letter, i) => {
		const startAngle = i * 72
		const endAngle = (i + 1) * 72

		const sectorPath = svgEl('path', {
			d: describeSector(0, 0, outerRadius, startAngle, endAngle),
			fill: 'var(--red)',
			stroke: '#222',
			'stroke-width': '1.5'
		})
		g.appendChild(sectorPath)

		// Letter label
		const midAngle = startAngle + 36
		const labelPos = polarToCartesian(0, 0, (outerRadius + innerRadius) / 2, midAngle)
		const label = svgEl('text', {
			x: labelPos.x,
			y: labelPos.y,
			'text-anchor': 'middle',
			'dominant-baseline': 'central',
			'font-size': '16',
			'font-weight': 'bold',
			fill: 'var(--yellow)',
			'font-family': 'system-ui, sans-serif'
		})
		label.textContent = letter
		g.appendChild(label)

		// Radial separator
		const lineStart = polarToCartesian(0, 0, innerRadius, startAngle)
		const lineEnd = polarToCartesian(0, 0, outerRadius, startAngle)
		const line = svgEl('line', {
			x1: lineStart.x,
			y1: lineStart.y,
			x2: lineEnd.x,
			y2: lineEnd.y,
			stroke: '#222',
			'stroke-width': '1.5'
		})
		g.appendChild(line)
	})

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

	// Arrow/pointer
	const arrowLen = outerRadius + 8
	const arrowGroup = svgEl('g', { class: 'spinner-arrow' })
	const arrow = svgEl('polygon', {
		points: `0,${-arrowLen} -5,-${arrowLen * 0.3} 0,-${arrowLen * 0.2} 5,-${arrowLen * 0.3}`,
		fill: '#444',
		stroke: '#222',
		'stroke-width': '1'
	})
	arrowGroup.appendChild(arrow)

	// Arrow center pivot
	const pivot = svgEl('circle', {
		cx: 0, cy: 0, r: 5,
		fill: '#444',
		stroke: '#222',
		'stroke-width': '1'
	})
	arrowGroup.appendChild(pivot)
	g.appendChild(arrowGroup)

	// Side label
	const sideLabel = svgEl('text', {
		x: 0,
		y: outerRadius + 22,
		'text-anchor': 'middle',
		'font-size': '12',
		'font-weight': 'bold',
		fill: 'var(--cream)',
		'font-family': 'system-ui, sans-serif'
	})
	sideLabel.textContent = side === 'visitor' ? 'VISITORS' : 'HOME'
	g.appendChild(sideLabel)

	svg.appendChild(g)

	return {
		element: g,
		arrow: arrowGroup,

		setDisc(discSvg) {
			discContainer.textContent = ''
			discContainer.appendChild(discSvg)
		},

		getResult(angle) {
			return {
				koLetter: getKoLetter(angle),
				// Sector number requires disc data — use getSectorNumber externally
			}
		}
	}
}

export function spinTo(spinner, targetAngle, duration = 2.5) {
	const fullSpins = (3 + Math.floor(Math.random() * 3)) * 360
	const totalRotation = fullSpins + targetAngle
	const startRotation = spinner._rotation ?? 0

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

export function getKoLetter(angle) {
	// Normalize to 0-360
	const normalized = ((angle % 360) + 360) % 360
	const index = Math.floor(normalized / 72)
	return KO_LETTERS[index]
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
