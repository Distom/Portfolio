'use strict'


let areaValue = localStorage.getItem('area');

if (areaValue) area.value = areaValue;
area.oninput = function () {
	localStorage.setItem('area', area.value);
}








