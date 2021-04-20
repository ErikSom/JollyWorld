const easing = {
	linear: t => t,
	easeInQuad: t => t*t,
	easeOutQuad: t => t*(2-t),
	easeInOutQuad: t => t<.5 ? 2*t*t : -1+(4-2*t)*t,
	easeInCubic: t => t*t*t,
	easeOutCubic: t => (--t)*t*t+1,
	easeInOutCubic: t => t<.5 ? 4*t*t*t : (t-1)*(2*t-2)*(2*t-2)+1,
	easeInQuart: t => t*t*t*t,
	easeOutQuart: t => 1-(--t)*t*t*t,
	easeInOutQuart: t => t<.5 ? 8*t*t*t*t : 1-8*(--t)*t*t*t,
	easeInQuint: t => t*t*t*t*t,
	easeOutQuint: t => 1+(--t)*t*t*t*t,
	easeInOutQuint: t => t<.5 ? 16*t*t*t*t*t : 1+16*(--t)*t*t*t*t,
	easeInElastic: t => (.04 - .04 / t) * Math.sin(25 * t) + 1,
	easeOutElastic: t => .04 * t / (--t) * Math.sin(25 * t),
	easeInOutElastic: t => (t -= .5) < 0 ? (.02 + .01 / t) * Math.sin(50 * t) : (.02 - .01 / t) * Math.sin(50 * t) + 1
}

export default easing;
