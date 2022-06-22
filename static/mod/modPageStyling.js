function adjustBodySize() {
	let windowSize = 1;
	let globalSize = window.innerWidth;
	if (window.innerWidth < 600) {
		windowSize = 0.6;
		globalSize = 600;
	} else if (window.innerWidth < 800) {
		windowSize = 0.8;
		globalSize = 800;
	} else if (window.innerWidth < 1100) {
		globalSize = 1000;
	} else if (window.innerWidth < 1500) {
		globalSize = 1500;
	}
	const edge = 15;
	$('creatorwindow').style.transform = `scale(${windowSize})`;
	$('loadingwindow').style.transform = `scale(${windowSize})`;
	$('modwardrobewindow').style.width = globalSize + edge + "px";
	$('modwardrobewindow').style.height = (window.innerHeight + edge) * (globalSize / window.innerWidth) + "px"
	document.querySelectorAll('.fixed').forEach((elem) => elem.style.transform = 'scale(' + (globalSize + edge) / window.innerWidth + ')')
	if (!zip_editor_open) {
		document.body.style.width = globalSize + "px";
		document.body.style.transform = 'scale(' + window.innerWidth / (globalSize + edge) + ')'
	} else {
		document.body.style.width = "";
		document.body.style.transform = "";
	}
}
adjustBodySize();

document.body.onresize = adjustBodySize;

function toggleTheme() {
	var old_theme = document.documentElement.getAttribute('theme')
	var new_theme = (old_theme == 'dark' ? 'main' : 'dark')
	document.documentElement.setAttribute('theme', new_theme);
	localStorage.setItem('jwbpTheme', new_theme)
	$('darkmodebutton').innerText = old_theme.charAt(0).toUpperCase() + old_theme.slice(1) + " Theme";
}

document.documentElement.setAttribute('theme', 'main');
if (localStorage.getItem('jwbpTheme') == 'dark') {
	toggleTheme()
}

const mobile_view = ("ontouchstart" in document.documentElement);

if (mobile_view) {
	$('createbutton').onclick = openModWardrobe;
	$('importzipbutton').style.display = 'none';
	$('wardrobedownload').style.display = 'none';
	$('wardrobeimporteditor').style.display = 'none';
	$('currentModCharacters').id = 'currentModCharactersMobile'
	$('currentmodbutton').style.display = 'none';
} else {
	$('createbutton').onclick = openModEditor;
}