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
		let card = event.target;
		card.classList.add('card_focused');

		let firstButton = card.querySelector('.card__button');
		firstButton.focus();

		card.setAttribute('tabindex', '');
		card.addEventListener('focusout', cardFocusOut);
		focusedCard = card;
	} else if (focusedCard && !event.target.closest('.markup__card')) {
		focusedCard.classList.remove('card_focused');
		focusedCard.removeEventListener('focusout', cardFocusOut);
		focusedCard.tabIndex = 0;
		focusedCard = null;
	}
}

async function cardFocusOut(event) {
	let card = event.target.closest('.markup__card');
	setTimeout(() => {
		if (card == focusedCard) return;
		card.classList.remove('card_focused');
		card.removeEventListener('focusout', cardFocusOut);
		card.tabIndex = 0;
	});
}

function cardFocusOn() {
	if (!checkScreenSize()) return;
	document.addEventListener('focusin', cardFocus);
	isActiveCardFocus = true;
}