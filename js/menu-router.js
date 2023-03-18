'use strict'

let menu = document.querySelector('.header__menu');
let serverPathReg = new RegExp('.+(?=/)');
let serverPath = location.pathname.match(serverPathReg) || '';
let routs = {
	'/': '/pages/resume.html',
	'/markup': {
		route: '/pages/markup.html',
		scriptLinks: [
			'js/touch-control.js',
			'js/preview-mode.js',
			'js/global.js',
		],
		scriptsAdded: false,
	},
	'/react': '/pages/react.html',
	'/empty': '/pages/react.html',
}

function addServerPathProxy(obj) {
	return new Proxy(obj, {
		get(target, property) {
			let value = target[property];
			if (typeof value == 'object') {
				return addServerPathProxy(value);
			} else if (typeof value == 'string') {
				return serverPath + value;
			} else {
				return value;
			}
		}
	});
}

routs = addServerPathProxy(routs);

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

function route(event) {
	let link = event.target.closest('.header__menu-link');
	if (!link) return;

	event.preventDefault();
	window.history.pushState({}, '', link.href);
	handleLocation();
}

async function handleLocation() {
	let path = window.location.pathname;
	path = path.replace(serverPathReg, '');
	let route = routs[path].route || routs[path] || routs['/'];
	console.log(route);

	let html = await fetch(route)
		.catch(err => console.log('before' + err))
		.then(response => response.text())
		.catch(err => console.log('after' + err));
	document.querySelector('.main').innerHTML = html;

	let scriptLinks = routs[path].scriptLinks;
	if (scriptLinks && !routs[path].scriptsAdded) {
		let promises = [];
		scriptLinks.forEach(link => promises.push(loadScript(link)));
		routs[path].scriptsAdded = true;
		/* 		await Promise.all(promises);
				console.log('all scripts load'); */
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



