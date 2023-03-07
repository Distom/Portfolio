'use strict'

let focusedCard = null;
let isActiveCardFocus = false;

window.addEventListener('resize', onResize);
cardFocusOn();

function onResize() {
	if (previewOn) {
		setCenterCard(document.querySelector('.card_active'));

		if (!checkScreenSize()) {
			showModal('Your screen size is not large enough to use the preview mode.');
			endPreviewMode();
		}
	}

	if (!isActiveCardFocus && checkScreenSize()) {
		cardFocusOn();
	}
}

function cardFocus(event) {
	if (event.target.classList.contains('markup__card')) {
		removeOldFocus();

		let card = event.target;
		card.classList.add('card_focused');

		card.setAttribute('tabindex', '');
		focusedCard = card;
	} else if (focusedCard && !event.target.closest('.markup__card')) {
		removeOldFocus();
		focusedCard = null;
	}
}

function removeOldFocus() {
	let cards = Array.from(document.querySelectorAll('.card_focused'));
	cards.forEach(card => {
		card.classList.remove('card_focused');
		card.tabIndex = 0;
	});
}

function cardFocusOn() {
	if (!checkScreenSize()) return;
	document.addEventListener('focusin', cardFocus);
	isActiveCardFocus = true;
}