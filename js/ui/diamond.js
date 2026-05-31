const SVG_NS = 'http://www.w3.org/2000/svg'

function svgEl(tag, attrs = {}) {
	const el = document.createElementNS(SVG_NS, tag)
	for (const [k, v] of Object.entries(attrs)) {
		el.setAttribute(k, v)
	}
	return el
}

export function createDiamond(svg, cx, cy, size) {
	const g = svgEl('g', { id: 'diamond' })

	const half = size / 2

	// Base positions (diamond orientation: home at bottom, 2B at top)
	const home = { x: cx, y: cy + half }
	const first = { x: cx + half, y: cy }
	const second = { x: cx, y: cy - half }
	const third = { x: cx - half, y: cy }

	// Infield dirt — arc behind baselines from foul line to foul line
	const dirtColor = '#a0784a'
	const dirtR = half * 1.2
	const dirtArc = svgEl('path', {
		d: [
			`M ${home.x},${home.y}`,
			`L ${third.x},${third.y}`,
			`A ${dirtR} ${dirtR} 0 0 1 ${first.x},${first.y}`,
			'Z'
		].join(' '),
		fill: dirtColor
	})
	g.appendChild(dirtArc)

	// Home plate dirt circle
	const homeDirt = svgEl('circle', {
		cx: home.x, cy: home.y, r: half * 0.25,
		fill: dirtColor
	})
	g.appendChild(homeDirt)

	// Infield grass (inside the diamond) — inset from baselines
	const gi = half * 0.28
	const gHome = { x: home.x, y: home.y - gi * 0.5 }
	const gFirst = { x: first.x - gi, y: first.y }
	const gSecond = { x: second.x, y: second.y + gi }
	const gThird = { x: third.x + gi, y: third.y }
	const grassPath = svgEl('polygon', {
		points: `${gHome.x},${gHome.y} ${gFirst.x},${gFirst.y} ${gSecond.x},${gSecond.y} ${gThird.x},${gThird.y}`,
		fill: 'var(--green)'
	})
	g.appendChild(grassPath)

	// Diamond shape (baselines)
	const diamondPath = svgEl('polygon', {
		points: `${home.x},${home.y} ${first.x},${first.y} ${second.x},${second.y} ${third.x},${third.y}`,
		fill: 'none',
		stroke: '#ffffff',
		'stroke-width': '2',
		'stroke-opacity': '0.9'
	})
	g.appendChild(diamondPath)

	// Pitcher's mound (60.5ft from home on a 127.3ft diagonal = ~47.5% from home)
	const mound = svgEl('circle', {
		cx: cx,
		cy: cy + half * 0.05,
		r: 7,
		fill: '#c4a265',
		stroke: '#8a7040',
		'stroke-width': '1.5'
	})
	g.appendChild(mound)

	// Home plate (pentagon)
	const hpSize = 12
	const homePlate = svgEl('polygon', {
		points: [
			`${home.x},${home.y + hpSize}`,
			`${home.x - hpSize},${home.y + 2}`,
			`${home.x - hpSize * 0.7},${home.y - hpSize * 0.5}`,
			`${home.x + hpSize * 0.7},${home.y - hpSize * 0.5}`,
			`${home.x + hpSize},${home.y + 2}`
		].join(' '),
		fill: '#ffffff',
		stroke: '#ccc',
		'stroke-width': '1.5'
	})
	g.appendChild(homePlate)

	// Base markers (1B, 2B, 3B)
	const baseSize = 11
	const baseMarkers = {}

	const basePositions = { first, second, third }
	for (const [name, pos] of Object.entries(basePositions)) {
		const marker = svgEl('rect', {
			x: pos.x - baseSize / 2,
			y: pos.y - baseSize / 2,
			width: baseSize,
			height: baseSize,
			transform: `rotate(45, ${pos.x}, ${pos.y})`,
			fill: '#ffffff',
			stroke: '#888',
			'stroke-width': '1'
		})
		g.appendChild(marker)
		baseMarkers[name] = marker
	}

	// Base labels
	const labelOffset = 18
	const labelData = [
		{ text: '1B', x: first.x + labelOffset, y: first.y + 4 },
		{ text: '2B', x: second.x, y: second.y - labelOffset },
		{ text: '3B', x: third.x - labelOffset, y: third.y + 4 }
	]
	for (const ld of labelData) {
		const label = svgEl('text', {
			x: ld.x,
			y: ld.y,
			'text-anchor': 'middle',
			'font-size': '11',
			'font-weight': 'bold',
			fill: 'var(--cream)',
			'font-family': 'system-ui, sans-serif'
		})
		label.textContent = ld.text
		g.appendChild(label)
	}

	// Runner pegs (initially hidden)
	const runners = {}
	for (const [name, pos] of Object.entries(basePositions)) {
		const peg = svgEl('circle', {
			cx: pos.x,
			cy: pos.y,
			r: 7,
			fill: 'var(--yellow)',
			stroke: '#8a6d00',
			'stroke-width': '1.5',
			opacity: '0'
		})
		g.appendChild(peg)
		runners[name] = peg
	}

	svg.appendChild(g)

	return {
		element: g,
		baseMarkers,
		runners,
		positions: { home, first, second, third }
	}
}

export function updateRunners(diamond, bases) {
	const mapping = {
		first: bases.first,
		second: bases.second,
		third: bases.third
	}

	for (const [base, playerId] of Object.entries(mapping)) {
		const peg = diamond.runners[base]
		const show = playerId != null

		if (typeof gsap !== 'undefined') {
			gsap.to(peg, {
				attr: { opacity: show ? 1 : 0 },
				duration: 0.25,
				ease: 'power2.out'
			})
			if (show) {
				gsap.fromTo(peg,
					{ attr: { r: 0 } },
					{ attr: { r: 7 }, duration: 0.3, ease: 'back.out(2)' }
				)
			}
		} else {
			peg.setAttribute('opacity', show ? '1' : '0')
		}
	}
}
