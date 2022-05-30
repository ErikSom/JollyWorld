let mobile_view = false;
if ("ontouchstart" in document.documentElement) {
	mobile_view = true;
}

const url = new URLSearchParams(window.location.search);
const autoInstallMod = url.get('install');

const folderName = 'jollymod';
let filesToStore = 0;
let filesStored = 0;
let wearing_mask = 0;

const {get, set, keys, del} = window.idbKeyval;

function $(element) {
	return document.getElementById(element)
}

function adjustBodySize() {
	let windowSize = 1;
	let globalSize = 2000;
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
	$('creatorwindow').style.transform = `scale(${windowSize})`;
	$('loadingwindow').style.transform = `scale(${windowSize})`;
	$('modwardrobewindow').style.width = (globalSize + 25) + "px";
	$('modwardrobewindow').style.height = window.innerHeight * (globalSize + 25) + "px"
	document.querySelectorAll('.fixed').forEach((elem) => elem.style.transform = 'scale(' + (globalSize + 25) / window.innerWidth + ')')
	if (!zip_editor_open) {
		document.body.style.width = globalSize + "px";
		document.body.style.transform = 'scale(' + window.innerWidth / (globalSize + 25) + ')'
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

function closeModWindow() {
	if (window.self !== window.top) {
		var message = {type: 'jollyCloseCharacterSelect'}
		window.parent.postMessage(message, '*')
	} else {
		window.location = "/"
	}
}

function showLoadingScreen() {
	lockScrolling();
	$('loadingbackground').style.pointerEvents = 'all';
	$('loadingbackground').style.opacity = 1;
	$('loadingbarprogress').style.width = "0%"
}
function hideLoadingScreen() {
	unlockScrolling();
	$('loadingbackground').style.pointerEvents = 'none';
	$('loadingbackground').style.opacity = 0;
}

function blobToImage(blob) {
	const url = URL.createObjectURL(blob);
	const image = new Image();
	image.src = url;
	return image;
}

function updateModName(){
	try {
		document.querySelector('.singleModItemSelected').classList.remove('singleModItemSelected')
	} catch (err) {}
	let modName = localStorage.getItem('jollyModName');
	if (modName === null) {
		modName = 'Billy Joel';
	}
	$('installedMod').innerText = modName;
	if (allDefaultCharacters.includes(modName)) {
		$('currentModThumbCvs').innerHTML = `<img class="previewModCanvas" src="mod/thumbs/${modName.replace(' ','%20')}.png">`;
	} else {
		generateModPreviewFromIDB();
		const selectedModElement = $(modName);
		if (selectedModElement) {
			selectedModElement.classList.add('singleModItemSelected')
		}
	}
}

function setModNameManually() {
	const input = document.createElement('input');
	input.type = 'text'
	input.setAttribute('placeholder', $('installedMod').innerHTML);
	$('installedMod').innerHTML = '';
	$('installedMod').appendChild(input);
	$('installedMod').onclick = null;
	input.onkeydown = function() {
		if (event.key === 'Enter') {
			$('installedMod').innerHTML = input.value;
			$('installedMod').onclick = setModNameManually;
		}
	}
	input.select()
}
$('installedMod').onclick = setModNameManually;

function handleFileSelect() {
	event.stopPropagation();
	event.preventDefault();

	const files = event.dataTransfer ? event.dataTransfer.files : event.target.files;

	for (let i = 0, f; f = files[i]; i++) {
		const zip = new JSZip();
		zip.loadAsync(f).then(function (zip) {
			showLoadingScreen();
			const modName = f.name.replace('.zip','');
			localStorage.setItem('jollyModName', modName);
			$('installedMod').innerText = modName;
			processFiles(zip.files);

			try {
				document.querySelector('.singleModItemSelected').classList.remove('singleModItemSelected')
			} catch (err) {}
			sendDefaultChar(0);
		}, function () {
			alert("Not a valid zip file")
		});
	}
}

function sendDefaultChar(id = 0) {
	localStorage.setItem('jollyModCharacter', id);
	var message = {type: 'jollySelectCharacter', character: id, mask: wearing_mask}
	window.parent.postMessage(message, '*')
}

function processFiles(files){
	clearOldMods().then(()=>{
		wearing_mask = 0;
		const keys = Object.keys(files);

		for(var i = 0; i<keys.length; i++){
			var key = keys[i];
			if(!key.endsWith('.png') && !key.endsWith('theme/settings.json')) continue;

			var file = files[key];

			var path = key.split('/');
			path.shift();

			switch(path[0]){
				case 'characters':
					processCharacterMod(path, file);
				break;
				case 'kids':
					processKidMod(path, file);
				break;
				case 'babies':
					processBabyMod(path, file);
				break;
				case 'gore':
					processGoreMod(path, file);
				break;
				case 'masks':
					wearing_mask = 1;
				case 'textures':
				case 'vehicles':
				case 'portraits':
				case 'helmets':
					processBasicMod(path, file);
				break;
				case 'theme':
					processTheme(file);
				break;
			}
		}
		sendDefaultChar();
	}).then(() => {
		setTimeout(function() {
			generateModPreviewFromIDB();
		}, 100)
	});
}
function finishMod(){
	filesToStore = 0;
	filesStored = 0;

	hideLoadingScreen();
}

function storeImage(file, target){
	file.async("blob").then(function (blob) {
		set(target, blob).then(()=>{
			filesStored++;
			$('loadingbarprogress').style.width = filesStored / filesToStore * 100 + "%"
			if(filesStored === filesToStore){
				finishMod();
			}
		})
	})
}

function processCharacterMod(path, file){
	let characterIndex = allDefaultCharactersTrimmed.indexOf(path[1]);
	if(characterIndex !== -1 && path[2] !== ""){
		filesToStore++;
		storeImage(file, `${folderName}/characters/${characterIndex}/${path[2]}`);
	}
}

function processKidMod(path, file){
	const charNameArray = ['kid1', 'kid2', 'kid3']
	let characterIndex = charNameArray.indexOf(path[1]);
	if(characterIndex !== -1 && path[2] !== ""){
		filesToStore++;
		storeImage(file, `${folderName}/kids/${characterIndex}/${path[2]}`);
	}
}

function processBabyMod(path, file){
	const charNameArray = ['baby1', 'baby2', 'baby3']
	let characterIndex = charNameArray.indexOf(path[1]);
	if(characterIndex !== -1 && path[2] !== ""){
		filesToStore++;
		storeImage(file, `${folderName}/babies/${characterIndex}/${path[2]}`);
	}
}

function processGoreMod(path, file){
	const subFolder = path[1];
	const lastPath = path[path.length-1];

	if(lastPath === "") return;

	switch(subFolder){
		case 'chunks':
		case 'organs':
			filesToStore++;
			storeImage(file, `${folderName}/gore/${lastPath}`);
		break;
		case 'skin':
			filesToStore++;
			storeImage(file, `${folderName}/characters/0/${lastPath}`);
		break;
	}
}

function processBasicMod(path, file){
	let targetPath = path[0];
	const textureName = path[path.length-1];

	if(['DirtBikeHelmet0000.png', 'SkateHelmet0000.png'].includes(textureName)){
		targetPath = 'hats';
	}

	if(textureName !== ""){
		filesToStore++;
		storeImage(file, `${folderName}/${targetPath}/${textureName}`);
	}
}

function clearOldMods(){
	removeTheme();
	var message = {type: 'jollyCleanMod'}
	window.parent.postMessage(message, '*')
	wearing_mask = 0;
	sendDefaultChar();

	return new Promise((resolve, reject) => {
		keys().then(keys => {
			keys.forEach(key => {
				if(key.indexOf(folderName) === 0){
					del(key);
				}
			})
			resolve();
		});
	})
}

function processTheme(file){
	file.async("blob").then(function (blob) {
		blob.text().then( text => {
			localStorage.setItem('jollyWorldTheme', text);
		}).catch(err => {});
	}).catch(err => {});;
}
function removeTheme(){
	localStorage.removeItem('jollyWorldTheme');
}
function openModEditor() {
	lockScrolling();
	$('creatorbackground').style.opacity = 1;
	$('creatorbackground').style.pointerEvents = "all"
}
function closeModEditor() {
	unlockScrolling();
	$('creatorbackground').style.opacity = 0;
	$('creatorbackground').style.pointerEvents = "none"
}
function lockScrolling() {
	window.scrollTo(0, 0)
	document.body.style.overflowY = "hidden";
}
function unlockScrolling() {
	document.body.style.overflowY = "scroll";
}



function wipeCurrentMod() {
	lwipeCharactersElement();
	if (!confirm("Are you sure you want to delete your current mod?")) {
		return;
	}
	clearOldMods();
	localStorage.setItem('jollyModName', "Billy Joel")
	sendDefaultChar(0);
	updateModName();
}

function wipeCharactersElement() {
	let characters_element = $('currentModCharacters')
	if (!characters_element) {
		characters_element = $('currentModCharactersMobile')
	}
	characters_element.innerHTML = '';
}

function importToEditorFromCurrentMod() {
	if (mobile_view) {
		alert("You can't edit your mod on mobile.")
		return
	}
	window.idbKeyval.keys().then((keys) => {
		zipEditorInit();
		if (keys.length <= 1) {
			document.querySelector('.ze .loading').style.display = 'block'
			zipEditorLoadExternalZip('/mod/zips/jollymodlight.zip');
			return;
		}
		loaded_zip = new JSZip();
		loaded_zip_name = localStorage.getItem('jollyModName');
		zip_loaded_text_files = {};
		zip_loaded_images = {};
		let loaded_files = 0;
		keys.forEach((key) => {
			if (key != "tempEditorWorld") {
				window.idbKeyval.get(key).then((value) => {
					var trimmedkey = key;
					for (var k = 0; k < 16; k ++) {
						trimmedkey = trimmedkey.replace("/" + k + "/", "/" + allDefaultCharactersTrimmed[k] + "/")
					}
					loaded_zip.file(trimmedkey, value)
					loaded_files ++;
					if (loaded_files == keys.length) {
						const preview = document.querySelector('.ze .main .imageedit .characterpreview')
						preview.style.backgroundImage = $('currentModThumb').style.backgroundImage;
						zipEditorImportFile(loaded_zip);
					}
				})
			} else {
				loaded_files ++;
			}
		})
	})
}

if (mobile_view || true) {
	$('createbutton').onclick = openModWardrobe;
	$('importzipbutton').style.display = 'none';
	$('wardrobedownload').style.display = 'none';
	$('wardrobeimporteditor').style.display = 'none';
	$('currentModCharacters').id = 'currentModCharactersMobile'
	$('currentmodbutton').style.display = 'none';
} else {
	$('createbutton').onclick = openModEditor;
	$('importzipbutton').style.display = 'block';
	$('wardrobedownload').style.display = 'block';
	$('wardrobeimporteditor').style.display = 'block';	
}