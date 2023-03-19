'use strict'

window.addEventListener('resize', onResize);

function onResize() {
	if (previewOn) {
		setCenterCard(document.querySelector('.card_active'));

		if (!checkScreenSize()) {
			showModal('Your screen size is not large enough to use the preview mode.');
			endPreviewMode();
		}
	}
}