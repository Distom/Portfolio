'use strict'

let menu = document.querySelector('.header__menu');
let main = document.querySelector('.main');
let isSwitchingTabs = false;
let transitionTime = 300;

menu.addEventListener('click', switchTabs);

async function switchTabs(event) {
	let link = event.target;
	if (!event.target.closest('.header__menu-link')) return;
	event.preventDefault();

	if (isSwitchingTabs) return;

	let prevSelectedLink = menu.querySelector('.header__menu-link_selected');
	if (prevSelectedLink == link) return;

	let tabName = link.dataset.tabName;
	if (!tabName) return;

	isSwitchingTabs = true;
	prevSelectedLink.classList.remove('header__menu-link_selected');
	link.classList.add('header__menu-link_selected');

	await hideTab();
	await showTab();

	isSwitchingTabs = false;

	async function showTab() {
		let selectedTab = main.querySelector(`[data-tab-body='${tabName}']`);

		selectedTab.style.opacity = 0;
		selectedTab.hidden = false;

		await render();
		selectedTab.style.transition = `opacity ${transitionTime / 1000}s`;
		await render();
		selectedTab.style.opacity = '';

		await render(transitionTime);
		selectedTab.style.transition = '';
	}

	async function hideTab() {
		let prevSelectedTab = main.querySelector('[data-tab-body]:not([hidden])');
		prevSelectedTab.style.transition = `opacity ${transitionTime / 1000}s`;
		prevSelectedTab.style.opacity = 0;

		await render(transitionTime);

		prevSelectedTab.hidden = true;
		prevSelectedTab.style.transition = '';
		prevSelectedTab.style.opacity = '';
	}
}

function render(time) {
	if (!time && time !== 0) return new Promise(resolve => requestAnimationFrame(resolve));
	return new Promise(resolve => setTimeout(() => resolve(), time));
}






