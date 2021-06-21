const folderName = 'jollymod';
const modNameKey = 'jollyModName';
let filesToStore = 0;
let filesStored = 0;

const {get, set, keys, del} = window.idbKeyval;

function updateModName(){
	const modName = localStorage.getItem(modNameKey);
	if(modName){
		document.querySelector('#remove').style.display = 'block';
	}else{
		document.querySelector('#remove').style.display = 'none';
	}
	document.querySelector('#installed > span').innerText = modName || 'none';
}
updateModName();

function handleFileSelect(evt) {
	evt.stopPropagation();
	evt.preventDefault();

	const files = evt.dataTransfer ? evt.dataTransfer.files : evt.target.files;

	for (let i = 0, f; f = files[i]; i++) {
		const zip = new JSZip();
		zip.loadAsync(f).then(function (zip) {
			processFiles(zip.files);
			localStorage.setItem(modNameKey, f.name);
		}, function () {
			alert("Not a valid zip file")
		});

	}
}
const dropZone = document.getElementById('files');
dropZone.addEventListener('change', handleFileSelect, false);

const label = document.getElementById('label');

function handleDragOver(evt) {
	evt.stopPropagation();
	evt.preventDefault();
	evt.dataTransfer.dropEffect = 'copy';
}

dropZone.addEventListener('dragover', handleDragOver, false);
dropZone.addEventListener('drop', handleFileSelect, false);

function processFiles(files){
	clearOldMods().then(()=>{
		label.innerText = 'Installing Mod...';

		const keys = Object.keys(files);

		for(var i = 0; i<keys.length; i++){
			var key = keys[i];
			if(!key.endsWith('.png')) continue;

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
					processBasicMod(path, file);
				break;
			}
		}
	});
}
function finishMod(){
	filesToStore = 0;
	filesStored = 0;
	label.innerText = 'Mod installed';
	dropZone.value = "";
	updateModName();
}

function storeImage(file, target){
	file.async("blob").then(function (blob) {
		set(target, blob).then(()=>{
			filesStored++;
			label.innerText = `Installing Mod... ${filesStored}/${filesToStore}`;
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
	if(path[path.length-1] !== ""){
		filesToStore++;
		storeImage(file, `${folderName}/${path[0]}/${path[path.length-1]}`);
		console.log("Processing basic mod:", path[path.length-1]);
	}
}

function clearOldMods(){
	label.innerText = 'Removing old Mod...';
	localStorage.removeItem(modNameKey);
	updateModName();

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

document.querySelector('#remove').onclick = ()=> {
	clearOldMods().then(()=>{
		label.innerText = 'Drop mod .zip here to install';
		updateModName();
	});
}
