'use strict'

let menu = document.querySelector('.header__menu');
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
window.addEventListener('load', () => {
	let originalRoute = localStorage.getItem('originalRoute');

	if (originalRoute) {
		window.history.pushState({}, '', originalRoute);
		localStorage.removeItem('originalRoute');
	}

	handleLocation();
});

function addServerPathProxy(obj) {
	return new Proxy(obj, {
		get(target, property) {
			let value = target[property];
			if (typeof value == 'object' && value != null) {
				return addServerPathProxy(value);
			} else if (typeof value == 'string' && property != 'cacheHTML') {
				return serverPath + value;
			} else {
				return value;
			}
		}
	});
}

function route(event) {
	let link = event.target.closest('.header__menu-link');
	if (!link) return;

	event.preventDefault();
	window.history.pushState({}, '', serverPath + link.getAttribute('href'));
	handleLocation();
}

async function handleLocation() {
	let path = window.location.pathname;
	path = path.replace(serverPathReg, '');
	if (!routes[path]) return;
	let route = routes[path].route || routes[path] || routes['/'];

	let html = routes[path].cacheHTML;
	if (!html) {
		html = await fetch(route)
			.then(response => response.text())
			.catch(err => console.warn('page load error' + err));
	}
	//routes[path].cacheHTML = html;
	document.querySelector('.main').innerHTML = html;

	let scriptLinks = routes[path].scriptLinks;
	if (scriptLinks && !routes[path].scriptsAdded) {
		let promises = [];
		scriptLinks.forEach(link => promises.push(loadScript(link)));
		routes[path].scriptsAdded = true;
		/* 		await Promise.all(promises);
				console.log('all scripts load'); */
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



