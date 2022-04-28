const bicycle = document.querySelector('.bicycle');
const scroll = document.querySelector('.scroll')
var old_scroll_top = 0;
document.body.onresize = updateBicycle;
scroll.onscroll = updateBicycle;
function updateBicycle() {
	if (event && event.type === 'scroll') {
		bicycle.style.transform = `scaleY(${(old_scroll_top > scroll.scrollTop) ? -1 : 1})`;
	}
	old_scroll_top = scroll.scrollTop;
	var offset = (window.innerHeight / (scroll.scrollHeight / window.innerHeight) - 82) / 2
	bicycle.style.top = scroll.scrollTop / scroll.scrollHeight * window.innerHeight + offset + 'px';
}
document.body.onload = updateBicycle;
updateBicycle()