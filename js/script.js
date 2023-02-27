'use strict'

let cards = document.querySelector('.markup__cards');
let markup = document.querySelector('.markup');
document.addEventListener('click', preview);

function preview(event) {
	let button = event.target;
	if (!button.classList.contains('preview-button')) return;

	markup.classList.toggle('markup_preview');
	markup.scrollIntoView({ block: 'start', behavior: 'smooth' });
	document.body.style.overflow = 'hidden';

	let card = button.closest('.card');

}

function getCardNumber(card) {
	return Array.from(cards).indexOf(card);
}

function 