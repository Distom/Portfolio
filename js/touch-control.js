'use strict'

let touchModeOn = false;
let addedTouchControl = false;

let startScroll = 0;
let startY = 0;

let cursorSpeed = 0;
let lastCursorSpeedUpdateTime = 0;
let lastCursorY = 0;
let cursorMonitoringFrequency = 17;
let scrollDirection = 0;
let lastScrollAnim = null;

let startTouchChords = [0, 0];

let runCursorMonitoringThrottled = throttle(runCursorMonitoring, cursorMonitoringFrequency);
let iframe = document.querySelector('.preview-block__iframe');


function addTouchControl() {
	addedTouchControl = true;

	if (iframe?.contentDocument.readyState == 'loading') {
		iframe.addEventListener('load', () => addListeners());
	} else {
		addListeners();
	}

	function addListeners() {
		iframe.addEventListener('pointerenter', startTouchMode);
		iframe.addEventListener('pointerleave', endTouchMode);
	}
}

function removeTouchControl() {
	iframe.removeEventListener('pointerenter', startTouchMode);
	iframe.removeEventListener('pointerleave', endTouchMode);
	iframe.contentDocument.removeEventListener('pointerdown', startTouch);
	iframe.contentDocument.removeEventListener('pointermove', runCursorMonitoringThrottled);
	iframe.contentDocument.removeEventListener('pointerup', endTouch);
	iframe.contentDocument.removeEventListener('dragstart', event => event.preventDefault());
	iframe.contentWindow.removeEventListener('keydown', stopScrollAnimOnKeyScroll);
	iframe.contentWindow.removeEventListener('wheel', stopScrollAnimOnWheel);
	iframe.contentDocument.removeEventListener('pointermove', scrollIframe);
	addedTouchControl = false;
	touchModeOn = false;
}

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
	if (checkIframeOverflow()) return;
	startTouchChords = [event.clientX, event.clientY];

	startScroll = iframe.contentWindow.scrollY;
	startY = event.clientY;
	iframe.contentDocument.addEventListener('pointermove', checkStartTouchScroll);
}

function checkStartTouchScroll(event) {
	let distance = Math.sqrt((startTouchChords[0] - event.clientX) ** 2 + (startTouchChords[1] - event.clientY) ** 2);
	if (distance < 5) return;
	iframe.contentDocument.removeEventListener('pointermove', checkStartTouchScroll);
	iframe.contentDocument.addEventListener('pointermove', scrollIframe);
}

function scrollIframe(event) {
	iframe.contentDocument.body.setPointerCapture(event.pointerId);
	let currentY = event.clientY;
	iframe.contentWindow.requestAnimationFrame(() => {
		iframe.contentWindow.scrollTo(0, startScroll + (startY - currentY));
	});
}

function endTouch(event) {
	if (cursorSpeed > 0.2 && !checkIframeOverflow()) {
		lastScrollAnim = runScroll(cursorSpeed);
	}
	iframe.contentDocument.removeEventListener('pointermove', checkStartTouchScroll);
	iframe.contentDocument.removeEventListener('pointermove', scrollIframe);
}

function endTouchMode() {
	touchModeOn = false;
}

function runCursorMonitoring(event) {
	let distanceY = Math.abs(lastCursorY - event.clientY);
	cursorSpeed = distanceY / cursorMonitoringFrequency;
	scrollDirection = event.clientY - lastCursorY != 0 ? event.clientY - lastCursorY : scrollDirection;

	lastCursorY = event.clientY;
}

function checkIframeOverflow() {
	let html = iframe.contentDocument;
	return isOverflowHidden(html.body) || isOverflowHidden(html.documentElement);

	function isOverflowHidden(elem) {
		return isHidden(getOverflow(elem));
	}

	function isHidden(value) {
		return value == 'hidden';
	}

	function getOverflow(elem) {
		return iframe.contentWindow.getComputedStyle(elem).overflow;
	}
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
	let to = cursorSpeed * 3 * direction;

	let pageHeight = Math.max(
		iframe.contentDocument.body.scrollHeight, iframe.contentDocument.documentElement.scrollHeight,
		iframe.contentDocument.body.offsetHeight, iframe.contentDocument.documentElement.offsetHeight,
		iframe.contentDocument.body.clientHeight, iframe.contentDocument.documentElement.clientHeight
	);
	let maxScroll = pageHeight - iframe.contentWindow.innerHeight;

	return new Animate({
		duration: 1000 * Math.sqrt(cursorSpeed),
		timing: makeEaseOut(circ),
		draw(progress) {
			console.log('draw');
			let onPageTop = isMinScroll() && direction > 0;
			let onPageDown = isMaxScroll() && direction < 0;
			if (onPageTop || onPageDown) lastScrollAnim.stop();

			iframe.contentWindow.scrollBy(0, progress - (to / progress));
		}
	});

	function isMaxScroll() {
		return iframe.contentWindow.scrollY >= maxScroll - 1;
	}

	function isMinScroll() {
		return iframe.contentWindow.scrollY == 0;
	}
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
