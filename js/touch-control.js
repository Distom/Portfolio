'use strict'

let touchModeOn = false;

let startScroll = 0;
let startY = 0;

let cursorSpeed = 0;
let lastCursorSpeedUpdateTime = 0;
let lastCursorY = 0;
let cursorMonitoringFrequency = 17;
let scrollDirection = 0;
let lastScrollAnim = null;
let runCursorMonitoringThrottled = throttle(runCursorMonitoring, cursorMonitoringFrequency);

iframe.addEventListener('pointerenter', startTouchMode);
iframe.addEventListener('pointerleave', endTouchMode);

function startTouchMode() {
	iframe.contentDocument.addEventListener('pointerdown', startTouch);
	iframe.contentDocument.addEventListener('pointermove', runCursorMonitoringThrottled);
	iframe.contentDocument.addEventListener('pointerup', endTouch);
	iframe.contentDocument.addEventListener('dragstart', event => event.preventDefault());
	iframe.contentWindow.addEventListener('keydown', stopScrollAnimOnKeyScroll);
	iframe.contentWindow.addEventListener('wheel', stopScrollAnimOnWheel);
	touchModeOn = true;
}

function stopScrollAnimOnKeyScroll(event) {
	let key = event.code;
	if (key == 'PageUp' || key == 'PageDown') lastScrollAnim?.stop();
}

function stopScrollAnimOnWheel() {
	lastScrollAnim?.stop();
}

function startTouch(event) {
	lastScrollAnim?.stop();
	startScroll = iframe.contentWindow.scrollY;
	startY = event.clientY;
	iframe.contentDocument.addEventListener('pointermove', scrollIframe);
}

function scrollIframe(event) {
	iframe.contentDocument.body.setPointerCapture(event.pointerId);
	let currentY = event.clientY;
	iframe.contentWindow.requestAnimationFrame(() => {
		iframe.contentWindow.scrollTo(0, startScroll + (startY - currentY));
	});
}

function endTouch() {
	console.log(cursorSpeed);
	if (cursorSpeed > 0.2) {
		lastScrollAnim = runScroll(cursorSpeed);
	}
	iframe.contentDocument.removeEventListener('pointermove', scrollIframe);
}

function endTouchMode() {
	touchModeOn = false;
}

function runCursorMonitoring(event) {
	let distance = Math.abs(lastCursorY - event.clientY);
	cursorSpeed = distance / cursorMonitoringFrequency;
	scrollDirection = event.clientY - lastCursorY != 0 ? event.clientY - lastCursorY : scrollDirection;

	lastCursorY = event.clientY;
}

function throttle(func, ms) {
	let isThrottled = false,
		savedArgs,
		savedThis;

	return function wrapper() {
		if (isThrottled) {
			savedArgs = arguments;
			savedThis = this;
			return;
		}

		func.apply(this, arguments);
		isThrottled = true;

		setTimeout(function () {
			isThrottled = false;
			if (savedArgs) {
				wrapper.apply(savedThis, savedArgs);
				savedArgs = savedThis = null;
			}
		}, ms);
	}
}

function runScroll(cursorSpeed) {
	cursorSpeed = Math.min(cursorSpeed, 20);
	let direction = scrollDirection > 0 ? 1 : -1;
	let to = cursorSpeed * 2 * direction;
	return new Animate({
		duration: 1000 * Math.sqrt(cursorSpeed),
		timing: makeEaseOut(circ),
		draw(progress) {
			iframe.contentWindow.scrollBy(0, progress - (to / progress));
		}
	});
}

class Animate {
	static lastAnimationId = 0;
	static getLastAnimationId = () => this.lastAnimationId - 1;

	constructor({ timing, draw, duration }) {
		this.timing = timing;
		this.draw = draw;
		this.duration = duration;
		this.start = performance.now();
		this.id = Animate.lastAnimationId++;
		requestAnimationFrame(this.animate.bind(this));
	}

	animate(time) {
		if (!this.getAnimationStatus() || this.stopAnimation) {
			return;
		}

		let timeFraction = (time - this.start) / this.duration;
		if (timeFraction > 1) timeFraction = 1;

		let progress = this.timing(timeFraction);

		this.draw(progress);

		if (timeFraction < 1) {
			requestAnimationFrame(this.animate.bind(this));
		}
	}

	stop() {
		this.stopAnimation = true;
	}

	getAnimationStatus() {
		return Animate.getLastAnimationId() == this.id;
	}
}

function makeEaseOut(timing) {
	return function (timeFraction) {
		return 1 - timing(1 - timeFraction);
	}
}

function circ(timeFraction) {
	return 1 - Math.sin(Math.acos(timeFraction));
}
