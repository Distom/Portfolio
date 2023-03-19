'use strict'

let menu = document.querySelector('.header__menu');
let isSwitchingTabs = false;
let transitionTime = 300;
let markupScriptsLoaded;
let addedTouchControl = false;

let serverPathReg = new RegExp('.+(?=/)');
let serverPath = location.pathname.match(serverPathReg) || '';
let routes = {
	'/': {
		route: '/pages/resume.html',
		cacheHTML: null,
	},
	'/markup': {
		route: '/pages/markup.html',
		cacheHTML: null,
		scriptLinks: [
			'/js/touch-control.js',
			'/js/preview-mode.js',
			'/js/global.js',
		],
		scriptsAdded: false,
	},
	'/react': {
		route: '/pages/react.html',
		cacheHTML: null,
	},
	'/empty': {
		route: '/pages/react.html',
		cacheHTML: null,
	},
}

routes = addServerPathProxy(routes);

menu.addEventListener('click', route);
window.addEventListener('popstate', handleLocation);
window.addEventListener('load', async () => {
	let originalRoute = localStorage.getItem('originalRoute');

	if (originalRoute) {
		window.history.pushState({}, '', originalRoute);
		localStorage.removeItem('originalRoute');
	}

	handleLocation(false);

	let currentPath = getCurrentPath();
	document.querySelector('.main').innerHTML = await routes[currentPath].cacheHTML;
	loadScripts(currentPath);

	let currentMenuBtn = document.querySelector(`.header__menu-link[href="${currentPath}"]`);

	currentMenuBtn.style.transition = 'all 0s';
	await render();
	currentMenuBtn.classList.add('header__menu-link_selected');
	await render();
	currentMenuBtn.style.transition = '';
});

function addServerPathProxy(obj) {
	return new Proxy(obj, {
		get(target, property) {
			let value = target[property];
			if (property == 'cacheHTML') {
				return value;
			} else if (typeof value == 'object' && value != null) {
				return addServerPathProxy(value);
			} else if (typeof value == 'string') {
				return serverPath + value;
			} else {
				return value;
			}
		},
	});
}

function route(event) {
	let link = event.target.closest('.header__menu-link');
	if (!link) return;

	event.preventDefault();
	if (isSwitchingTabs) return;

	window.history.pushState({}, '', serverPath + link.getAttribute('href'));
	handleLocation();
}

function handleLocation(switchTabs = true) {
	if (isSwitchingTabs) return;
	let path = getCurrentPath();
	let route = getRoute(path);
	if (switchTabs) {
		switchingTabsAnim();
	}

	if (!routes[path].cacheHTML) {
		routes[path].cacheHTML = fetch(route)
			.then(response => response.text())
			.catch(err => console.warn('page load error' + err));
	}
}

function getRoute(path = getCurrentPath()) {
	let route = routes[path].route || routes[path];
	return route;
}

function getCurrentPath() {
	let path = window.location.pathname;
	path = path.replace(serverPathReg, '');
	if (!routes[path]) path = '/';
	return path;
}

function loadScripts(routesKey) {
	let scriptLinks = routes[routesKey].scriptLinks;
	if (scriptLinks && !routes[routesKey].scriptsAdded) {
		let promises = [];
		scriptLinks.forEach(link => promises.push(loadScript(link)));
		routes[routesKey].scriptsAdded = true;
		markupScriptsLoaded = Promise.all(promises);
		//Сделать чтоб кнопки на карточках были неактивны до
		//загрузки скриптов
	}
}

function loadScript(url) {
	let script = document.createElement('script');
	script.src = url;
	script.async = false;

	document.body.append(script);
	return new Promise(resolve => {
		let script = document.body.lastElementChild;
		script.addEventListener('load', () => resolve());
	});
}

async function setTabHTML() {
	let tabContent = await routes[getCurrentPath()].cacheHTML;
	document.querySelector('.main').innerHTML = tabContent;
	return render();
}

async function switchingTabsAnim() {
	let currentPath = getCurrentPath();
	let link = document.querySelector(`.header__menu-link[href="${currentPath}"]`);
	let main = document.querySelector('.main');

	if (isSwitchingTabs) return;

	let prevSelectedLink = menu.querySelector('.header__menu-link_selected');
	if (prevSelectedLink == link) return;

	isSwitchingTabs = true;
	prevSelectedLink.classList.remove('header__menu-link_selected');
	link.classList.add('header__menu-link_selected');

	await hideTab();
	if (addedTouchControl) {
		removeTouchControl();
	}
	await setTabHTML();
	let event = new CustomEvent('newTabOpened', { bubbles: true });
	document.dispatchEvent(event);
	loadScripts(currentPath);
	await showTab();

	isSwitchingTabs = false;

	async function hideTab() {
		let prevSelectedTab = main.querySelector('section');
		prevSelectedTab.style.transition = `opacity ${transitionTime / 1000}s`;
		prevSelectedTab.style.opacity = 0;

		await render(transitionTime);

		prevSelectedTab.style.display = 'none';
		prevSelectedTab.style.transition = '';
		prevSelectedTab.style.opacity = '';
	}

	async function showTab() {
		let selectedTab = main.querySelector(`section`);

		selectedTab.style.opacity = 0;

		await render();
		selectedTab.style.transition = `opacity ${transitionTime / 1000}s`;
		await render();
		selectedTab.style.opacity = '';

		await render(transitionTime);
		selectedTab.style.transition = '';
	}
}

function render(time) {
	if (!time && time !== 0) return new Promise(resolve => requestAnimationFrame(resolve));
	return new Promise(resolve => setTimeout(() => resolve(), time));
}