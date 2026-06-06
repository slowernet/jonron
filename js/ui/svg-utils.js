const SVG_NS = 'http://www.w3.org/2000/svg'

export function svgEl(tag, attrs = {}) {
	const el = document.createElementNS(SVG_NS, tag)
	for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v)
	return el
}

export function polarToCartesian(cx, cy, radius, angleDeg) {
	const rad = (angleDeg - 90) * Math.PI / 180
	return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) }
}

export function describeSector(cx, cy, radius, startAngle, endAngle) {
	const start = polarToCartesian(cx, cy, radius, startAngle)
	const end = polarToCartesian(cx, cy, radius, endAngle)
	const largeArc = endAngle - startAngle > 180 ? 1 : 0
	return ['M', cx, cy, 'L', start.x, start.y,
		'A', radius, radius, 0, largeArc, 1, end.x, end.y, 'Z'].join(' ')
}
