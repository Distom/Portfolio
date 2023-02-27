'use strict'

let cards = document.querySelector('.markup__cards');
let currentCardScale = 1.2;
let markup = document.querySelector('.markup');
document.addEventListener('click', preview);

function preview(event) {
	let button = event.target;
	if (!button.classList.contains('preview-button')) return;

	document.querySelector('.card_selected')?.classList.remove('card_selected');

	markup.classList.add('markup_preview');
	markup.scrollIntoView({ block: 'start', behavior: 'smooth' });
	document.body.style.overflow = 'hidden';

	let card = button.closest('.card');
	card.classList.add('card_selected');
	setCenterCard(card);
}

function setCenterCard(card) {
	cards.style.top = '';
	let prevCard = document.querySelector('.card_active');
	if (prevCard) prevCard.classList.remove('card_active');
	card.classList.add('card_active');

	let currentTop = card.getBoundingClientRect().top;
	let neededTop = (innerHeight - (card.offsetHeight * currentCardScale)) / 2;
	let newCardsTop = neededTop - currentTop + 'px';
	cards.style.top = newCardsTop;
}
