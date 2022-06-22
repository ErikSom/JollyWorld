const url = new URLSearchParams(window.location.search);
const autoInstallMod = url.get('install');

const folderName = 'jollymod';
let filesToStore = 0;
let filesStored = 0;
let wearing_mask = 0;

function closeModWindow() {
	if (window.self !== window.top) {
		var message = {type: 'jollyCloseCharacterSelect'}
		window.parent.postMessage(message, '*')
	} else {
		window.location = "/"
	}
}

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
	del('jollyModMenuPortrait');
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

function wipeCurrentMod() {
	if (!confirm("Are you sure you want to delete your current mod?")) {
		return;
	}
	wipeCharactersElement();
	clearOldMods();
	localStorage.setItem('jollyModName', "Billy Joel");
	sendDefaultChar(0);
	updateModName();
}

function wipeCharactersElement() {
	let characters_element = $('currentModCharacters');
	if (!characters_element) {
		characters_element = $('currentModCharactersMobile');
	}
	characters_element.innerHTML = '';
}