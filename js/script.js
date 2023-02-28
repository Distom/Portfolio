'use strict'

const activeCardMargin = 70;
let previewOn = false;
let isSwitchingCards = false;


document.addEventListener('click', preview);
document.addEventListener('click', switchActiveCard);

function preview(event) {
	let button = event.target;
	if (!button.classList.contains('preview-button')) return;

	document.querySelector('.card_selected')?.classList.remove('card_selected');
	let card = button.closest('.card');
	card.classList.add('card_selected');

	if (!previewOn) {
		let markup = document.querySelector('.markup');
		markup.classList.add('markup_preview');
		markup.scrollIntoView({ block: 'start', behavior: 'smooth' });
		document.body.style.overflow = 'hidden';

		let cards = document.querySelector('.markup__cards');
		cards.style.top = '';
		setCenterCard(card);

		previewOn = true;
	}
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
	}

	let newCardsTop = neededTop - currentTop;
	cards.style.top = newCardsTop + cardsTop + 'px';
	cards.addEventListener('transitionend', () => isSwitchingCards = false, { once: true });

	prevCard?.classList.remove('card_active');
	card.classList.add('card_active');

	updateButtons(card);
}

function switchActiveCard(event) {
	let button = event.target.closest('.markup__cards-button');
	if (!button) return;
	if (isSwitchingCards) return;

	isSwitchingCards = true;
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

let iframe = document.querySelector('.preview-block__iframe');

iframe.onload = function () {
	iframe.contentDocument.head.insertAdjacentHTML('beforeend', '<link rel="stylesheet" href="https://distom.github.io/Portfolio/css/macOSScrollbar.css">');
	iframe.contentDocument.body.classList.add('scrollbar');
}