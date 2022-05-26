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

function generateModPreview(defaultImgs, moddedImgs = {}) {
	let cvs = document.createElement('canvas');
	let ctx = cvs.getContext('2d');

	cvs.width  = 2000;
	cvs.height = 350;
	cvs.classList.add('singleModCanvas');

	character_positions.forEach((part) => {
		var asset = (moddedImgs[part.asset] ? moddedImgs[part.asset] : defaultImgs[part.asset])
		ctx.save()
		ctx.translate(part.x, part.y)
		ctx.rotate(part.r)
		ctx.drawImage(asset, 0, 0, part.w, part.h)
		ctx.restore()
	})
	return cvs;
}

function blobToImage(blob) {
	const url = URL.createObjectURL(blob);
	const image = new Image();
	image.src = url;
	return image;
}

async function loadExternalZip(url) {
	var all_modded_imgs = {}
	new JSZip.external.Promise(function (resolve, reject) {
		JSZipUtils.getBinaryContent(url, function(err, data) {
			if (err) {
				reject(err);
			} else {
				resolve(data);
			}
		});
	})
	.then(JSZip.loadAsync) 
	.then(function(zip) {
		all_asset_paths.forEach(async(item) => {
			try {
				zip.file(item.substring(1)).async("blob").then(function(blob) {
					all_modded_imgs[item] = blobToImage(blob)
				})
			} catch (err) {}
		})
	})
	.then(function() {
		setTimeout(function() {
			generateModPreview(all_asset_imgs, all_modded_imgs)
		}, 100)
	})
}

function updateModName(){
	const modName = localStorage.getItem('jollyModName');
	const modCustomPreview = localStorage.getItem('jollyModCustomPreview')
	try {
		document.querySelector('.singleModItemSelected').classList.remove('singleModItemSelected')
	} catch (err) {}
	if (modName === null) {
		$('installedMod').innerText = 'Billy Joel';
		$('currentModThumb').style.backgroundImage = 'url(mod/thumbs/Billy%20Joel.png)';
	} else {
		$('installedMod').innerText = modName;
		if (modCustomPreview === null) {
			$('currentModThumb').style.backgroundImage = `url(mod/thumbs/${modName.replace(" ","%20")}.png)`;
			try {
				$(modName).classList.add('singleModItemSelected')
			} catch (err) {}
		} else {
			$('currentModThumb').style.backgroundImage = `url(${modCustomPreview})`;
		}
	}
}

var x;
function handleFileSelect() {
	event.stopPropagation();
	event.preventDefault();

	const files = event.dataTransfer ? event.dataTransfer.files : event.target.files;

	for (let i = 0, f; f = files[i]; i++) {
		const zip = new JSZip();
		zip.loadAsync(f).then(function (zip) {
			showLoadingScreen();
			processFiles(zip.files);

			try {
				document.querySelector('.singleModItemSelected').classList.remove('singleModItemSelected')
			} catch (err) {}
			localStorage.setItem('jollyModName', f.name.replace('.zip',''))

			const folder_name = Object.keys(zip.files)[0].split("/")[0]
			var all_modded_imgs = {}
			all_asset_paths.forEach(async(item) => {
				try {
					var file_path = item.replace('mod','').substring(1).replace('jollymod',folder_name).replace('wardrobe','jollymod/characters/billyjoel');
					zip.file(file_path).async("blob").then(function(blob) {
						all_modded_imgs[item.split("/")[item.split("/").length - 1]] = blobToImage(blob)
					})
				} catch (err) {}
			})
			setTimeout(function() {
				var preview_img = generateModPreview(all_asset_imgs, all_modded_imgs).toDataURL()
				localStorage.setItem('jollyModCustomPreview', preview_img);
				updateModName();
			}, 100)
		}, function () {
			alert("Not a valid zip file")
		});
	}
}

function sendDefaultChar(id = 0) {
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
	const charNameArray = ['billyjoel', 'jeroen', 'marique', 'damien', 'thezuck', 'bobzombie', 'xenot', 'ronda', 'jacklee', 'coljackson', 'hank', 'mrskat', 'seanbro', 'crashy', 'brittany', 'machote']
	let characterIndex = charNameArray.indexOf(path[1]);
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

var loaded_images = 0;
function increaseLoadedImages() {
	loaded_images ++;
	if (loaded_images != 41) {
		return
	}
	setTimeout(function() {
		$('modwardrobesteps').innerHTML = ""
		for (var section = 0; section < total_wardrobe_steps; section ++) {
			var new_section = document.createElement('div')
			new_section.classList.add('modwardrobesection')
			new_section.id = 'modwardrobesection' + section;
			new_section.style.display = 'none'
			for (var item = 0; item < wardrobe_features[section].length; item ++) {
				var new_container = document.createElement('div');
				new_container.classList.add('wardrobeitem');
				var new_button = document.createElement('img');
				new_button.classList.add('wardrobeitemimg')
				new_button.loading = "lazy"
				new_button.src = wardrobe_path + wardrobe_features[section][item].thumb;
				new_container.section = section;
				new_container.item = item;
				new_container.onclick = function() {
					wardrobeSaveState()
					var items_to_be_overwritten = wardrobe_features[this.section][this.item].overwrite
					var done_overwriting = 0;
					for (var overwritten_item = 0; overwritten_item < items_to_be_overwritten.length; overwritten_item ++) {
						const old_item = items_to_be_overwritten[overwritten_item][0]
						const new_item = items_to_be_overwritten[overwritten_item][1]
						const preserve_old_item = items_to_be_overwritten[overwritten_item][2]
						const old_img = all_wardrobe_modified_imgs[old_item]
						const new_img = new Image()
						const cvs = document.createElement('canvas')
						cvs.width = old_img.width;
						cvs.height = old_img.height;
						const ctx = cvs.getContext('2d')
						if (preserve_old_item) {
							ctx.drawImage(old_img, 0, 0)
						}
						new_img.dest = old_item
						new_img.src = wardrobe_path + new_item
						new_img.onload = function() {
							increaseLoadedImages()
							done_overwriting ++;
							ctx.drawImage(this, 0, 0)
							all_wardrobe_modified_imgs[this.dest] = cvs;
							if (done_overwriting >= items_to_be_overwritten.length) {
								updateWardrobePreview();
								nextWardrobePage()
							}
						}
					}
					if (items_to_be_overwritten.length == 0) {
						updateWardrobePreview();
						nextWardrobePage()
					}
				}
				new_container.appendChild(new_button)
				new_section.appendChild(new_container)
			}
			const random_button = document.createElement('button');
			random_button.classList.add('button')
			random_button.innerText = "Select random";
			random_button.style.backgroundColor = "#FF6600"
			random_button.onclick = function() {
				const all_options = document.querySelectorAll(`#${this.parentElement.id} .wardrobeitem`)
				all_options[Math.floor(Math.random() * all_options.length)].click();
			}
			new_section.appendChild(random_button)
			$('modwardrobesteps').appendChild(new_section)
		}
		initWardrobe();
	}, 50);
}

function wipeCurrentMod() {
	if (!confirm("Are you sure you want to delete your current mod?")) {
		return;
	}
	clearOldMods();
	localStorage.removeItem('jollyModCustomPreview')
	localStorage.setItem('jollyModName', "Billy Joel")
	sendDefaultChar(0)
	updateModName()
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
		loaded_zip_name = localStorage.getItem('jollyModName')
		zip_loaded_text_files = {}
		zip_loaded_images = {}
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

if (mobile_view) {
	$('createbutton').onclick = openModWardrobe;
	$('importzipbutton').style.display = 'none';
	$('wardrobedownload').style.display = 'none';
	$('wardrobeimporteditor').style.display = 'none';
} else {
	$('createbutton').onclick = openModEditor;
	$('importzipbutton').style.display = 'block';
	$('wardrobedownload').style.display = 'block';
	$('wardrobeimporteditor').style.display = 'block';	
}