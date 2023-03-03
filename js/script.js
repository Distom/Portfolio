'use strict'

const activeCardMargin = 70;
const activeCardScale = 1.2;
const switchingCardDelay = 300;
let previewOn = false;
let isSwitchingCards = false;


document.addEventListener('click', preview);
document.addEventListener('click', switchActiveCard);
document.addEventListener('click', switchPreviewDevice);
document.addEventListener('click', rotateDevice);
document.addEventListener('wheel', scrollCards);
window.addEventListener('resize', onResize);

function preview(event) {
	let button = event.target;
	if (!button.classList.contains('card__button_preview')) return;

	if (!checkScreenSize()) {
		showModal('You need to use a device with a larger screen size to enter the preview mode. Also, if you have a large zoom setting, you can try to reduce it.');
		return;
	}

	document.querySelector('.card_selected')?.classList.remove('card_selected');
	let card = button.closest('.card');
	card.classList.add('card_selected');
	let iframe = document.querySelector('.preview-block__iframe');
	iframe.src = card.querySelector('.card__button_open').href;

	if (!previewOn) startPreviewMode(card);
}

function startPreviewMode(startCard) {
	let startCardsProperties = getCardsProperties();
	let cards = document.querySelector('.markup__cards');
	cards.style.top = '';
	cards.style.transition = startCard.style.transition = 'all 0s';

	let markup = document.querySelector('.markup');
	markup.classList.add('markup_preview');

	let userScrollY = scrollY;
	markup.scrollIntoView({ block: 'start' });
	setCenterCard(startCard);
	showCards(startCardsProperties, startCard);
	render().then(() => cards.style.transition = startCard.style.transition = '');
	scrollTo(0, userScrollY);
	markup.scrollIntoView({ block: 'start', behavior: 'smooth' });

	endScroll().then(() => document.body.style.overflow = 'hidden');
	showPreviewBlock();
	previewOn = true;
}

function endScroll() {
	let prevScrollY = null;
	let frequency = 50;
	return new Promise(resolve => {
		let interval = setInterval(() => {
			if (scrollY == prevScrollY) {
				resolve();
				clearInterval(interval);
			}
			prevScrollY = scrollY;
		}, frequency);
	});
}

function showCards(startCardsProperties, startCard) {
	let endCardsProperties = getCardsProperties();
	let cardsElem = document.querySelector('.markup__cards');
	let cards = document.querySelectorAll('.markup__card');

	Array.from(cards).forEach((card, index) => {
		document.body.append(card);
		card.style.position = 'absolute';
		let scale = card == startCard ? activeCardScale : 1;

		let animation = card.animate([
			{
				top: startCardsProperties.get(card).top + 'px',
				left: startCardsProperties.get(card).left + 'px',
				width: startCardsProperties.get(card).width + 'px',
				height: startCardsProperties.get(card).height + 'px',
				padding: '26px',
			},
			{
				top: endCardsProperties.get(card).top - endCardsProperties.get(card).height / 2 + 'px',
				left: endCardsProperties.get(card).left + 'px',
				width: endCardsProperties.get(card).width * scale + 'px',
				height: endCardsProperties.get(card).height * scale + 'px',
				padding: '4px',
			}
		],
			{
				duration: 500,
				easing: 'ease-in-out',
			});

		animation.addEventListener('finish', () => {
			cardsElem.append(card);
			card.style.position = '';
		}, { once: true });
	});
}

function getCardsProperties() {
	let cardsArr = Array.from(document.querySelectorAll('.markup__card'));
	let cardsProperties = new Map();

	cardsArr.forEach((card, index) => {
		let rect = getAbsoluteBoundingClientRect(card);
		cardsProperties.set(card, {
			top: rect.top + card.offsetHeight / 2,
			left: rect.left,
			width: card.offsetWidth,
			height: card.offsetHeight,
		});
	});

	return cardsProperties;
}

function getAbsoluteBoundingClientRect(elem) {
	let rect = elem.getBoundingClientRect();

	return {
		top: rect.top + scrollY,
		left: rect.left + scrollX,
		right: rect.right + scrollX,
		bottom: rect.bottom + scrollX,
	}
}

function showPreviewBlock() {
	let previewBlock = document.querySelector('.markup__preview-block');
	let top = previewBlock.getBoundingClientRect().top;
	let left = previewBlock.getBoundingClientRect().left;

	previewBlock.animate([
		{
			position: 'fixed',
			top: innerHeight + previewBlock.clientHeight / 2 + 'px',
			left: left + 'px',
		},
		{
			position: 'fixed',
			top: top + previewBlock.clientHeight / 2 + 'px',
			left: left + 'px',
		}
	], {
		duration: 300,
		easing: 'ease-out'
	});
}

function setCenterCard(card) {
	let cards = document.querySelector('.markup__cards');
	let prevCard = document.querySelector('.card_active');
	let cardsTop = cards.getBoundingClientRect().top;

	let currentTop = card.getBoundingClientRect().top;
	let neededTop = (innerHeight - (card.offsetHeight + activeCardMargin * 2)) / 2;

	if (prevCard?.nextElementSibling == card) {
		let compensationSize = activeCardMargin * 2;
		currentTop -= compensationSize;
	} else if (prevCard == card) {
		currentTop -= card.offsetHeight * activeCardScale - card.offsetHeight;
	}

	let newCardsTop = neededTop - currentTop;
	cards.style.top = newCardsTop + cardsTop + 'px';

	prevCard?.classList.remove('card_active');
	card.classList.add('card_active');

	updateButtons(card);
}

function switchActiveCard(event) {
	let button = event.target.closest('.markup__cards-button');
	if (!button) return;
	if (isSwitchingCards) return;

	isSwitchingCards = true;
	setTimeout(() => isSwitchingCards = false, switchingCardDelay);
	let direction = button.classList.contains('markup__cards-button_bottom') ? 'bottom' : 'top';
	let activeCard = document.querySelector('.card_active');

	if (direction == 'bottom') {
		setCenterCard(activeCard.nextElementSibling);
	} else if (direction == 'top') {
		setCenterCard(activeCard.previousElementSibling);
	}
}

function updateButtons(card) {
	let cards = document.querySelector('.markup__cards');

	let isFirstCard = card == cards.firstElementChild;
	let isLastCard = card == cards.lastElementChild;

	let topButton = document.querySelector('.markup__cards-button_top');
	let bottomButton = document.querySelector('.markup__cards-button_bottom');
	topButton.hidden = bottomButton.hidden = false;

	if (isFirstCard) {
		topButton.hidden = true;
	} else if (isLastCard) {
		bottomButton.hidden = true;
	}
}

function onResize() {
	if (previewOn) {
		setCenterCard(document.querySelector('.card_active'));

		if (!checkScreenSize()) {
			showModal('Your screen size is not large enough to use the preview mode.');
			// ДОБАВИТЬ ВЫХОД ИЗ ПРЕВЬЮ РЕЖИМА
		}
	}
}


async function switchPreviewDevice(event) {
	let button = event.target.closest('.preview-block__button');
	let buttonWrapper = event.target.closest('.preview-block__button-wrapper');
	if (!buttonWrapper || !button || button.classList.contains('preview-block__button_rotate')) return;

	let prevSelectedButton = document.querySelector('.preview-block__button-wrapper_selected');
	prevSelectedButton.classList.remove('preview-block__button-wrapper_selected');
	buttonWrapper.classList.add('preview-block__button-wrapper_selected');

	let deviceBlock = document.querySelector('.preview-block__device');
	deviceBlock.classList.remove(`preview-block__device_${prevSelectedButton.dataset.device}`);
	deviceBlock.classList.add(`preview-block__device_${buttonWrapper.dataset.device}`);

	// remove rotate transition on switching devices
	deviceBlock.style.transition = 'none';
	await render();
	deviceBlock.classList.remove('preview-block__device_rotated');
	await render();
	deviceBlock.style.transition = '';
}

function rotateDevice(event) {
	let button = event.target.closest('.preview-block__button_rotate');
	if (!button) return;

	let deviceBlock = document.querySelector('.preview-block__device');
	let iframeWrapper = document.querySelector('.preview-block__iframe-wrapper');
	let buttonWrapper = button.closest('.preview-block__button-wrapper');

	if (buttonWrapper.dataset.device == 'ipad' && innerHeight < 725) {
		console.log('stop-rotate');
		showModal("Your device's screen height is not high enough to use this feature. If you have a large zoom setting, you can try to reduce it.");
		return;
	}

	let iframe = document.querySelector('.preview-block__iframe');

	// add rotation delay for screen content
	iframe.style.transition = iframeWrapper.style.transition = 'all 0s 0.3s';
	deviceBlock.classList.toggle('preview-block__device_rotated');
	deviceBlock.addEventListener('transitionend', () => {
		iframe.style.transition = iframeWrapper.style.transition = '';
	}, { once: true });
}

function scrollCards(event) {
	if (!previewOn) return;
	if (!(event.target.closest('.markup__cards') || event.target.closest('.markup__cards-buttons'))) return;

	let nextBtn = document.querySelector('.markup__cards-button_bottom');
	let prevBtn = document.querySelector('.markup__cards-button_top');
	let click = new CustomEvent('click', { bubbles: true });

	if (event.deltaY > 0 && nextBtn.clientHeight) {
		nextBtn.dispatchEvent(click);
	} else if (event.deltaY < 0 && prevBtn.clientHeight) {
		prevBtn?.dispatchEvent(click);
	}
}

function checkScreenSize() {
	let height = document.documentElement.clientHeight;
	let width = document.documentElement.clientWidth;
	return height >= 610 && width >= 1260;
}

function showModal(innerHTML) {
	let modal = document.querySelector('.modal');
	if (modal.open) return;
	document.querySelector('.modal__text').innerHTML = innerHTML;
	let scrollWidth = window.innerWidth - document.documentElement.clientWidth;
	modal.showModal();

	let isHidden = document.body.style.overflow;
	document.body.style.paddingRight = scrollWidth + 'px';
	if (!isHidden) document.body.style.overflow = 'hidden';
	modal.addEventListener('close', () => {
		if (!isHidden) document.body.style.overflow = '';
		document.body.style.paddingRight = '';
	}, { once: true });
}

let iframe = document.querySelector('.preview-block__iframe');

iframe.onload = function () {
	iframe.contentDocument.head.insertAdjacentHTML('afterbegin', '<link rel="stylesheet" href="https://distom.github.io/Portfolio/css/macOSScrollbar.css">');
	iframe.contentDocument.body.classList.add('scrollbar');
}