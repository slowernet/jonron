export function track(event, params = {}) {
	if (typeof gtag === 'undefined') return
	gtag('event', event, params)
}
