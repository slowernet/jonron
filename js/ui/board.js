const SVG_NS = 'http://www.w3.org/2000/svg'

function svgEl(tag, attrs = {}) {
	const el = document.createElementNS(SVG_NS, tag)
	for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v)
	return el
}

function h(tag, cls, html) {
	const el = document.createElement(tag)
	if (cls) el.className = cls
	if (html != null) el.innerHTML = html
	return el
}

// compact bases indicator: three rotated squares (1B/2B/3B)
function miniBases() {
	const svg = svgEl('svg', { viewBox: '0 0 32 24', class: 'tvbug-bases', width: '32', height: '24' })
	const mk = (x, y) => svgEl('rect', {
		x: x - 4.5, y: y - 4.5, width: 9, height: 9, rx: 1.5,
		transform: `rotate(45 ${x} ${y})`, class: 'base'
	})
	const second = mk(16, 7)
	const third = mk(8, 15)
	const first = mk(24, 15)
	svg.append(second, third, first)
	return { svg, bases: { first, second, third } }
}

export function createLayout(container) {
	container.textContent = ''
	const app = h('div', 'jr-app')

	// ---- Marquee / scoreboard bar ----
	const marquee = h('div', 'jr-marquee')
	const wordmark = h('div', 'jr-wordmark', '<b>JON<span>RÓN</span></b>')
	const right = h('div', 'jr-marquee-right')

	// Scorebug: situation only (inning + bases + out lights). Score lives in the linescore.
	const tvbug = h('div', 'jr-tvbug')
	const status = h('div', 'tvbug-status')
	const innEl = h('div', 'tvbug-inn', '<span class="caret" data-half>\u25B2</span><span data-inning>1</span>')
	const bs = h('div', 'tvbug-bs')
	const mb = miniBases()
	const outsEl = h('div', 'tvbug-outs')
	const outDots = []
	for (let i = 0; i < 2; i++) {
		const d = h('span', 'tvbug-dot')
		outsEl.appendChild(d)
		outDots.push(d)
	}
	bs.append(mb.svg, outsEl)
	status.append(innEl, bs)
	tvbug.appendChild(status)

	const scoreboardHost = h('div', 'jr-marquee-linescore')
	right.append(tvbug, scoreboardHost)
	marquee.append(wordmark, right)

	// ---- Main stage: two columns ----
	const board = h('div', 'jr-board')

	// left column: at-bat + play-by-play
	const colLeft = h('div', 'jr-stage-left')
	const nameplate = h('div', 'jr-nameplate')
	const posEl = h('div', 'pos', 'P')
	const meta = h('div', 'meta')
	const nameEl = h('div', 'name', '—')
	const teamEl = h('div', 'team', '')
	meta.append(h('div', 'lab', 'Now Batting'), nameEl, teamEl)
	nameplate.append(posEl, meta)

	const pbp = h('div', 'jr-pbp')
	const narratorHost = pbp
	colLeft.append(nameplate, pbp)

	// right column: spinner + controls
	const hero = h('div', 'jr-hero')
	const spinnerWrap = h('div', 'jr-spinner-wrap')
	const spinnerSvg = svgEl('svg', { viewBox: '0 0 360 360', preserveAspectRatio: 'xMidYMid meet' })
	spinnerWrap.appendChild(spinnerSvg)
	hero.appendChild(spinnerWrap)

	const controlsHost = h('div', '')
	hero.appendChild(controlsHost)

	board.append(colLeft, hero)
	app.append(marquee, board)
	container.appendChild(app)

	// Cap the left column to the spinner card's height so the play-by-play
	// scrolls internally instead of growing the layout. (Disabled when the
	// columns stack on narrow screens.)
	const syncLeftHeight = () => {
		if (window.matchMedia('(max-width: 820px)').matches) {
			colLeft.style.height = ''
		} else {
			colLeft.style.height = `${hero.offsetHeight}px`
		}
	}
	if (typeof ResizeObserver !== 'undefined') {
		new ResizeObserver(syncLeftHeight).observe(hero)
	}
	window.addEventListener('resize', syncLeftHeight)
	requestAnimationFrame(syncLeftHeight)

	return {
		scoreboardHost,
		syncHeight: syncLeftHeight,
		nameplate: { posEl, nameEl, teamEl },
		spinnerSvg, spinnerCenter: { cx: 180, cy: 180, r: 150 },
		controlsHost,
		narratorHost,
		setInning(text) {
			innEl.querySelector('[data-half]').textContent = text.startsWith('Bot') ? '\u25BC' : '\u25B2'
			innEl.querySelector('[data-inning]').textContent = (text.match(/\d+/) || ['1'])[0]
		},
		setScore() {},
		setOuts(n) { outDots.forEach((d, i) => d.classList.toggle('on', i < n)) },
		setBases(bases) {
			for (const b of ['first', 'second', 'third']) {
				mb.bases[b].classList.toggle('on', bases[b] != null)
			}
		},
		setBatting() {},
		setTheme() {}
	}
}
