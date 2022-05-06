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

let globalSize;
let windowSize;
function adjustBodySize() {
	windowSize = 1;
	if (window.innerWidth > 1500) {
		globalSize = 2000;
	} else if (window.innerWidth > 1100) {
		globalSize = 1500;
	} else if (window.innerWidth > 800) {
		globalSize = 1000;
	} else {
		windowSize = 0.6;
		globalSize = 600;
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

function downloadMod(name) {
	localStorage.removeItem('jollyModCustomPreview');
	downloadZip(name)
	localStorage.setItem('jollyModName', name)
	updateModName()
}

function downloadZip(name) {
	const url = `mod/zips/${name}.zip`;
	fetch(url).then(async transfer => {
		showLoadingScreen();
		
		const zipFile = await transfer.blob();
		const zip = new JSZip();
		zip.loadAsync(zipFile).then(function (zip) {
			processFiles(zip.files);
		}, function () {
			alert("mod does not exist");
		});
	}).catch(err=>console.log('error downloading mod', err));
}

function generateModPreview(defaultImgs, moddedImgs = {}) {
	let cvs = document.createElement('canvas');
	let ctx = cvs.getContext('2d');

	cvs.width  = 2000;
	cvs.height = 350;
	cvs.classList.add('singleModCanvas')

	for (var i = 0; i < bike_positions.length; i ++) {
		var part = bike_positions[i];
		var asset = (moddedImgs[part.asset] ? moddedImgs[part.asset] : defaultImgs[part.asset])
		if (part.r !== 0) {
			ctx.save()
			ctx.translate(part.x, part.y)
			ctx.rotate(part.r)
			try {
				ctx.drawImage(asset, 0, 0, part.w, part.h)
			} catch (err) {console.log(part)}
			ctx.restore()
		} else {
			ctx.drawImage(asset, part.x, part.y, part.w, part.h)
		}
	}
	return cvs
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

function addToPublicMods(responseItem) {
	const item = document.createElement('div');
	item.classList.add('singleModItem');
	item.id = responseItem[0];
	item.onclick = function() {
		downloadMod(this.id);
	}
	const modthumb = document.createElement('div');
	modthumb.style.backgroundImage = "url(mod/thumbs/" + responseItem[0] + ".png)";
	modthumb.classList.add('singleModCanvas');
	modthumb.classList.add('publicModThumb')
	item.appendChild(modthumb);
	const modtitle = document.createElement('p')
	modtitle.classList.add('singleModTitle');
	modtitle.innerText = responseItem[0];
	item.appendChild(modtitle);
	const modauthor = document.createElement('p')
	modauthor.classList.add('singleModAuthor');
	modauthor.innerText = responseItem[1];
	item.appendChild(modauthor);
	$('publicMods').appendChild(item)
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
				case 'textures':
				case 'vehicles':
				case 'portraits':
				case 'helmets':
				case 'masks':
					processBasicMod(path, file);
				break;
				case 'theme':
					processTheme(file);
				break;
			}
		}
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

var current_wardrobe_page;
var current_wardrobe_vehicle;
function openModWardrobe() {
	lockScrolling()
	document.querySelectorAll('.wardrobeitemselected').forEach((item) => item.classList.remove('wardrobeitemselected'))
	$('modwardrobefinal').style.display = 'none'
	$('modwardrobestepcounter').style.display = 'block'
	$('modwardrobepreviewcanvas').style.animation = ''
	document.querySelectorAll('.vehiclePreviewButton').forEach((elem) => elem.style.display = 'inline-block')
	wardrobe_saved_states = []

	current_wardrobe_page = -1;
	viewSetVehicle(0)
	loadWardrobeContents();

	$('modwardrobewindow').style.top = "0px";
	$('modwardrobewindow').style.opacity = 1;
	$('modwardrobewindow').style.display = 'block';
}
function closeModWardrobe() {
	unlockScrolling();
	$('modwardrobewindow').style.top = "100vh";
	$('modwardrobewindow').style.opacity = 0
	setTimeout(function() {
		$('modwardrobewindow').style.display = 'none'
	}, 400)
}

function updateWardrobePreview() {
	$('modwardrobepreviewcanvas').style.backgroundImage = 'url(' + generateModPreview(all_wardrobe_imgs, all_wardrobe_modified_imgs).toDataURL() + ')'
}

var modWardrobeDoorColor;
var modWardrobePreloaderColor;
var modWardrobeCharacterName;
function initWardrobe() {
	$('modwardrobetotalsteps').innerText = total_wardrobe_steps

	current_wardrobe_page = -1;
	modWardrobeDoorColor = '#3d7d1e';
	$('doorcolor').value = modWardrobeDoorColor;
	modWardrobePreloaderColor = '#d70201';
	$('preloadercolor').value = modWardrobePreloaderColor;
	modWardrobeCharacterName = 'Billy Joel';

	$('modwardrobeadditionalsettingsbutton').style.display = 'block';
	$('modwardrobeadditionalsettings').style.display = 'none';

	nextWardrobePage();

	all_wardrobe_modified_imgs = {}

	const all_keys = Object.keys(all_wardrobe_imgs)
	for (var item = 0; item < all_keys.length; item ++) {
		all_wardrobe_modified_imgs[all_keys[item]] = all_wardrobe_imgs[all_keys[item]]
	}

	setTimeout(updateWardrobePreview, 50)
}

var loaded_images = 0;
function increaseLoadedImages() {
	loaded_images ++;
	if (loaded_images == 41) {
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
				$('modwardrobesteps').appendChild(new_section)
			}
			initWardrobe();
		}, 50);
	}
}
var loaded_wardrobe = false;
function loadWardrobeContents() {
	if (loaded_wardrobe) {
		initWardrobe()
	} else {
		// Turn all the gore into images
		for (var i = 0; i < gore_item_paths.length; i ++) {
			const img = new Image()
			img.src = gore_path + gore_item_paths[i];
			img.num = i;
			img.onload = function() {
				increaseLoadedImages()
				const cvs = document.createElement('canvas');
				const ctx = cvs.getContext('2d');
				cvs.width = this.width;
				cvs.height = this.height;
				ctx.drawImage(this, 0, 0)
				gore_item_imgs[this.num] = cvs.toDataURL().split(',')[1];
			}
		}
		
		// Turning all of the image paths into actual images
		for (var i = 0; i < all_asset_paths.length; i ++) {
			const img = new Image();
			const cvs = document.createElement('canvas');
			const ctx = cvs.getContext('2d');
			img.src = all_asset_paths[i];
			img.onload = function() {
				increaseLoadedImages()
				var img_name = this.src.split("/")[this.src.split("/").length - 1]
				all_asset_imgs[img_name] = this;
				cvs.width = this.width;
				cvs.height = this.height;
				ctx.drawImage(this, 0, 0)
				all_wardrobe_imgs[img_name] = cvs;
			}
		}
		loaded_wardrobe = true;
	}
}

var wardrobe_saved_states = []

function wardrobeSaveState() {
	var saved_data = {}
	const all_wardrobe_keys = Object.keys(all_wardrobe_modified_imgs)
	for (var item = 0; item < all_wardrobe_keys.length; item ++) {
		var img = all_wardrobe_modified_imgs[all_wardrobe_keys[item]]
		if (!img instanceof HTMLImageElement) {
			img = img.toDataURL()
		}
		saved_data[all_wardrobe_keys[item]] = all_wardrobe_modified_imgs[all_wardrobe_keys[item]];
	}
	wardrobe_saved_states.push(saved_data)
}
function wardrobeLoadState() {
	const all_wardrobe_keys = Object.keys(all_wardrobe_imgs)
	const loaded_state = wardrobe_saved_states.pop()
	for (var item = 0; item < all_wardrobe_keys.length; item ++) {
		var img = new Image();
		if (loaded_state[all_wardrobe_keys[item]] instanceof HTMLImageElement) {
			img = loaded_state[all_wardrobe_keys[item]];
		} else {
			img.src = loaded_state[all_wardrobe_keys[item]].toDataURL();
		}
		all_wardrobe_modified_imgs[all_wardrobe_keys[item]] = img;
	}
	setTimeout(function() {
		updateWardrobePreview()
	}, 100)
}

function previousWardrobePage() {
	if (current_wardrobe_page == 0) return
	wardrobeLoadState();
	current_wardrobe_page --;
	$('modwardrobestep').innerText = current_wardrobe_page + 1;
	document.querySelectorAll('.modwardrobesection').forEach((section) => section.style.display = 'none')
	if (current_wardrobe_page == total_wardrobe_steps) {
		$('modwardrobefinal').style.display = 'block';
		$('modwardrobestepcounter').style.display = 'none';
	} else {
		$('modwardrobesection' + current_wardrobe_page).style.display = 'block';
	}
}

function nextWardrobePage() {
	current_wardrobe_page ++;
	$('modwardrobestep').innerText = current_wardrobe_page + 1;
	document.querySelectorAll('.modwardrobesection').forEach((section) => section.style.display = 'none')
	try {
		$('modwardrobesection' + current_wardrobe_page).style.display = 'block';
	} catch (err) {}
	switch (current_wardrobe_page) {
		case 9:
			viewSetVehicle(0)
			break;
		case 10:
			viewSetVehicle(1)
			break;
		case 11:
			viewSetVehicle(2)
			break;
		case 12:
			viewSetVehicle(3)
			break;
		case 13:
			viewSetVehicle(4)
			break;
		case total_wardrobe_steps:
			$('modwardrobefinal').style.display = 'block';
			$('modwardrobestepcounter').style.display = 'none';
			$('modwardrobepreviewcanvas').style.animation = 'cyclethroughcharacters 8s cubic-bezier(.26,-0.01,.01,1.01) infinite'
			document.querySelectorAll('.vehiclePreviewButton').forEach((elem) => elem.style.display = 'none')
			if (!mobile_view) {
				$('confetti').play();
			}
			break;
	}
}

function viewPreviousVehicle() {
	if (current_wardrobe_vehicle > 0) {
		current_wardrobe_vehicle --;
		setVehiclePage();
	}
}
function viewNextVehicle() {
	if (current_wardrobe_vehicle < 4) {
		current_wardrobe_vehicle ++;
		setVehiclePage();
	}
}
function viewSetVehicle(num) {
	current_wardrobe_vehicle = num;
	setVehiclePage();
}
function setVehiclePage() {
	if (current_wardrobe_vehicle <= 0) {
		$('vehiclePreviewButtonLeft').style.opacity = 0.1;
	} else {
		$('vehiclePreviewButtonLeft').style.opacity = 1;
	}
	if (current_wardrobe_vehicle >= 4) {
		$('vehiclePreviewButtonRight').style.opacity = 0.1;
	} else {
		$('vehiclePreviewButtonRight').style.opacity = 1;
	}
	$('modwardrobepreviewcanvas').style.backgroundPositionX = current_wardrobe_vehicle * -400 + "px"
}

function showAdditionalSettings() {
	$('modwardrobeadditionalsettingsbutton').style.display = 'none';
	$('modwardrobeadditionalsettings').style.display = 'inline-block';
}

const total_wardrobe_steps = wardrobe_features.length;

function processWardrobe(apply, importEditor = false) {
	const zip = new JSZip();
	const main_folder = zip.folder('jollymod')
	const character_folder = main_folder.folder('characters').folder('billyjoel');
	const vehicles_folder = main_folder.folder('vehicles');
	const bike_folder = vehicles_folder.folder('bike')
	const dirtbike_folder = vehicles_folder.folder('dirtbike')
	const skateboard_folder = vehicles_folder.folder('skateboard')
	const yogaball_folder = vehicles_folder.folder('yogaball')
	const foddycan_folder = vehicles_folder.folder('foddycan')
	const masks_folder = main_folder.folder('masks');

	const gore_folder = main_folder.folder('gore');
	const chunks_folder = gore_folder.folder('chunks').folder('billyjoel')
	for (let item = 0; item < 9; item ++) {
		chunks_folder.file(gore_item_paths[item].split("/")[gore_item_paths[item].split("/").length - 1], gore_item_imgs[item], {base64: true})
	}

	const settings_json = `{
		"doorColor": "${modWardrobeDoorColor}",
		"doorPreloaderColor": "${modWardrobePreloaderColor}",
		"doorlogoURL": "https://i.imgur.com/Zz4tyyG.png",
		"charNames": ["${modWardrobeCharacterName}", "Jeroen", "Marique", "Damien", "The Zuck!", "Bob Zombie", "Xenot", "Ronda", "Jack Lee", "Col. Jackson", "Hank", "Mrs. Kat", "Sean Bro", "Crashy", "Brittany", "Machote"]
	}`
	main_folder.file('theme/settings.json', settings_json)

	const cvs = document.createElement('canvas')
	const ctx = cvs.getContext('2d');
	const all_wardrobe_keys = Object.keys(all_wardrobe_modified_imgs)
	for (let item = 0; item < all_wardrobe_keys.length; item ++) {
		const img_name = all_wardrobe_keys[item]
		const img = all_wardrobe_modified_imgs[img_name]
		cvs.width = img.width;
		cvs.height = img.height;
		ctx.drawImage(img, 0, 0);
		file = cvs.toDataURL("image/png").split(',')[1]
		var dest_folder
		switch (img_name[0]) {
			case "B":
				dest_folder = bike_folder;
				break;
			case "D":
				dest_folder = dirtbike_folder;
				break;
			case "S":
				dest_folder = skateboard_folder;
				break;
			case "Y":
				dest_folder = yogaball_folder;
				break;
			case "H":
			case "P":
				dest_folder = foddycan_folder;
				break;
			case "m":
				dest_folder = masks_folder;
				break;
			default:
				dest_folder = character_folder;
		}
		dest_folder.file(img_name, file, {base64: true});
	}
	if (importEditor) {
		zipEditorInit();
		loaded_zip = zip;
		zipEditorImportFile(zip)
		closeModWardrobe();
		setTimeout(function() {
			updateZipEditorPreview();
		}, 1000)
	} else {
		if (apply) {
			localStorage.setItem('jollyModName', "Created in Wardrobe")
			processFiles(zip.files)
			wearing_mask = 1;
			sendDefaultChar();
			setTimeout(function() {
				const preview_img = generateModPreview(all_wardrobe_imgs, all_wardrobe_modified_imgs).toDataURL()
				localStorage.setItem('jollyModCustomPreview', preview_img);
				closeModWardrobe();
				updateModName();
			}, 100)
		} else {
			zip.generateAsync({type:"blob"})
			.then(function(content) {
				saveAs(content, "jollymod-" + modWardrobeCharacterName + ".zip");
			});
		}
	}
}

if (mobile_view) {
	$('createbutton').onclick = function() {openModWardrobe()};
	$('importzipbutton').style.display = 'none';
	$('wardrobedownload').style.display = 'none';
	$('wardrobeimporteditor').style.display = 'none';
} else {
	$('createbutton').onclick = function() {openModEditor()};
	$('importzipbutton').style.display = 'block';
	$('wardrobedownload').style.display = 'block';
	$('wardrobeimporteditor').style.display = 'block';
}