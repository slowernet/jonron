import { svgEl, polarToCartesian, describeSector } from './svg-utils.js'
import { BATTERY, OUTFIELD, POSITION_ABBREV, STRATEGY_SECTORS_AE, STRATEGY_SECTORS_FJ } from '../constants.js'

function hubVar(position) {
	const p = (position ?? '').toLowerCase()
	if (BATTERY.has(p)) return 'var(--hub-battery)'
	if (OUTFIELD.has(p)) return 'var(--hub-outfield)'
	return 'var(--hub-infield)'
}

function inkVar(position) {
	const p = (position ?? '').toLowerCase()
	if (BATTERY.has(p)) return 'var(--ink-on-battery)'
	if (OUTFIELD.has(p)) return 'var(--ink-on-outfield)'
	return 'var(--ink-on-infield)'
}

const SECTOR_LABELS = {
	1: 'HR', 2: 'GB', 3: 'FB', 4: 'FB', 5: '3B', 6: 'GB', 7: '1B',
	8: 'FB', 9: 'BB', 10: 'K', 11: '2B', 12: 'GB', 13: '1B', 14: 'FB'
}

// Outcome sectors get a small accent tick so hits read at a glance
const HIT_SECTORS = new Set([1, 5, 7, 11, 13])

export function createDiscSVG(disc, cx, cy, radius) {
	const g = svgEl('g', { 'data-disc-id': disc.id ?? disc.nameLast })
	const ink = inkVar(disc.position)
	const totalSize = disc.sectors.reduce((sum, s) => sum + s.size, 0)
	const centerRadius = radius * 0.5
	let currentAngle = 0

	disc.sectors.forEach((sector, i) => {
		const sectorAngle = (sector.size / totalSize) * 360
		const endAngle = currentAngle + sectorAngle
		const isHit = HIT_SECTORS.has(sector.number)

		const path = svgEl('path', {
			d: describeSector(cx, cy, radius, currentAngle, endAngle),
			class: 'disc-sector'
		})
		g.appendChild(path)

		// thin accent band on the rim for hit outcomes (graphic, flat)
		if (isHit) {
			const bandOuter = radius
			const bandInner = radius * 0.9
			const a = polarToCartesian(cx, cy, bandOuter, currentAngle)
			const b = polarToCartesian(cx, cy, bandOuter, endAngle)
			const c = polarToCartesian(cx, cy, bandInner, endAngle)
			const d = polarToCartesian(cx, cy, bandInner, currentAngle)
			const large = sectorAngle > 180 ? 1 : 0
			g.appendChild(svgEl('path', {
				d: ['M', a.x, a.y, 'A', bandOuter, bandOuter, 0, large, 1, b.x, b.y,
					'L', c.x, c.y, 'A', bandInner, bandInner, 0, large, 0, d.x, d.y, 'Z'].join(' '),
				class: 'disc-accent'
			}))
		}

		const labelAngle = currentAngle + sectorAngle / 2
		const labelPos = polarToCartesian(cx, cy, radius * 0.72, labelAngle)
		const label = svgEl('text', {
			x: labelPos.x, y: labelPos.y,
			class: sectorAngle < 15 ? 'disc-label disc-label-sm' : 'disc-label',
			'text-anchor': 'middle', 'dominant-baseline': 'central'
		})
		label.textContent = SECTOR_LABELS[sector.number] ?? sector.number
		g.appendChild(label)

		const lineStart = polarToCartesian(cx, cy, centerRadius, currentAngle)
		const lineEnd = polarToCartesian(cx, cy, radius, currentAngle)
		g.appendChild(svgEl('line', {
			x1: lineStart.x, y1: lineStart.y, x2: lineEnd.x, y2: lineEnd.y,
			class: 'disc-divider'
		}))
		currentAngle = endAngle
	})

	g.appendChild(svgEl('circle', {
		cx, cy, r: radius, class: 'disc-rim'
	}))

	// center hub
	g.appendChild(svgEl('circle', {
		cx, cy, r: centerRadius, class: 'disc-hub',
		fill: hubVar(disc.position)
	}))
	// inner keyline ring on the hub
	g.appendChild(svgEl('circle', {
		cx, cy, r: centerRadius - 5, class: 'disc-hub-keyline',
		stroke: ink
	}))

	const line1 = disc.nameFirst
	const line2 = disc.nameLast
	const nameFs = Math.max(11, Math.min(16, centerRadius * 0.34))

	const n1 = svgEl('text', {
		x: cx, y: line2 ? cy - nameFs * 1.18 : cy - 4,
		'text-anchor': 'middle', 'dominant-baseline': 'central', class: 'jr-disc-name',
		'font-size': nameFs, fill: ink
	})
	n1.textContent = line1
	g.appendChild(n1)

	if (line2) {
		const n2 = svgEl('text', {
			x: cx, y: cy + nameFs * 0.92,
			'text-anchor': 'middle', 'dominant-baseline': 'central', class: 'jr-disc-name',
			'font-size': nameFs, fill: ink
		})
		n2.textContent = line2
		g.appendChild(n2)
	}

	const posKey = (disc.position ?? '').toLowerCase()
	const posText = svgEl('text', {
		x: cx + centerRadius * 0.52, y: cy, class: 'disc-pos',
		'text-anchor': 'middle', 'dominant-baseline': 'central',
		fill: ink
	})
	posText.textContent = POSITION_ABBREV[posKey] ?? posKey.toUpperCase()
	g.appendChild(posText)

	return g
}

// ---- Strategy disc (two rings) ----
export function createStrategyDiscSVG(cx, cy, radius, activeRing) {
	const g = svgEl('g')
	const outerR = radius
	const midR = radius * 0.66
	const innerR = radius * 0.36

	function renderRing(sectors, rOuter, rInner, fillVar, isActive) {
		const opacity = isActive ? 1 : 0.3
		let currentAngle = 0
		sectors.forEach((sector, i) => {
			const endAngle = currentAngle + sector.angle
			const sRad = (currentAngle - 90) * Math.PI / 180
			const eRad = (endAngle - 90) * Math.PI / 180
			const oS = { x: cx + rOuter * Math.cos(sRad), y: cy + rOuter * Math.sin(sRad) }
			const oE = { x: cx + rOuter * Math.cos(eRad), y: cy + rOuter * Math.sin(eRad) }
			const iE = { x: cx + rInner * Math.cos(eRad), y: cy + rInner * Math.sin(eRad) }
			const iS = { x: cx + rInner * Math.cos(sRad), y: cy + rInner * Math.sin(sRad) }
			const large = sector.angle > 180 ? 1 : 0
			g.appendChild(svgEl('path', {
				d: ['M', oS.x, oS.y, 'A', rOuter, rOuter, 0, large, 1, oE.x, oE.y,
					'L', iE.x, iE.y, 'A', rInner, rInner, 0, large, 0, iS.x, iS.y, 'Z'].join(' '),
				class: 'strategy-sector', fill: fillVar, opacity
			}))
			const mid = currentAngle + sector.angle / 2
			const lRad = (mid - 90) * Math.PI / 180
			const lr = (rOuter + rInner) / 2
			const t = svgEl('text', {
				x: cx + lr * Math.cos(lRad), y: cy + lr * Math.sin(lRad),
				class: 'strategy-label',
				'text-anchor': 'middle', 'dominant-baseline': 'central',
				opacity
			})
			t.textContent = sector.letter
			g.appendChild(t)
			currentAngle = endAngle
		})
	}

	renderRing(STRATEGY_SECTORS_AE, outerR, midR, 'var(--hub-outfield)', activeRing === 'A-E')
	renderRing(STRATEGY_SECTORS_FJ, midR, innerR, 'var(--hub-battery)', activeRing === 'F-J')

	g.appendChild(svgEl('circle', {
		cx, cy, r: innerR, class: 'disc-hub',
		fill: 'var(--disc-a)'
	}))
	const title = svgEl('text', {
		x: cx, y: cy - 6, 'text-anchor': 'middle', 'dominant-baseline': 'central',
		class: 'strategy-title'
	})
	title.textContent = 'STRATEGY'
	g.appendChild(title)
	const ringT = svgEl('text', {
		x: cx, y: cy + 9, 'text-anchor': 'middle', 'dominant-baseline': 'central',
		class: 'strategy-ring-label'
	})
	ringT.textContent = activeRing
	g.appendChild(ringT)
	return g
}
