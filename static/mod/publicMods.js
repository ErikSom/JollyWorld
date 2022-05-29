const all_public_mods = [
	{name: "Cirilla", author: "Ocularist"},
	{name: "Darkmode", author: "TriggerTitan"},
	{name: "TrudyWalker", author: "Anonymous Frog"},
	{name: "piconjomod", author: "Anonymous Frog"},
	{name: "jollyMattShea", author: "JollyBoy"},
	{name: "RickAndMorty", author: "JollyBoy", characters: {
	0: "Rick", 
	1: "Morty", 
	2: "Jerry", 
	3: "Beth", 
	12: "Summer"
	}},
	{name: "JunpeiZaki", author: "JollyBoy"},
	{name: "Mario", author: "Warze"},
	{name: "warzemod", author: "Warze"},
];

function addToPublicMods(mod_id) {
	const mod_object = all_public_mods[mod_id];
	const name = mod_object.name;
	const author = mod_object.author;
	const characters = mod_object.characters;
	let characters_obj = {"0":name}
	if (mod_object.characters) {
		characters_obj = mod_object.characters;
	}
	let characterimgs = '';
	const ids = Object.keys(characters_obj);
	for (var i = 0; i < ids.length; i ++) {
		const imgid = (ids[i] === "0" ? "" : ids[i]);
		const offset = -i * (150 / ids.length);
		const zindex = ids.length - i;
		const opacity = 1 - i / ids.length;
		characterimgs += `
		<div class="publicModThumbSubContainer" style="z-index:${zindex};opacity:${opacity}">
			<img 
			style="transform: translateX(${offset}px);"
			class="publicModThumb" 
			src="mod/thumbs/${name}${imgid}.png">
		</div>
		`
	}
	$('publicMods').innerHTML += `
	<div class="singleModItem" id="${name}" onclick="downloadPublicMod(${mod_id});">
		<div class="publicModThumbContainer singleModCanvas">
			${characterimgs}
		</div>
		<p class="singleModTitle">${name}</p>
		<p class="singleModAuthor">${author}</p>
	</div>`
}

for (var mod = 0; mod < all_public_mods.length; mod ++) {
	addToPublicMods(mod);
}

function downloadPublicMod(mod_id) {
	const mod_object = all_public_mods[mod_id];
	const name = mod_object.name;
	let characters = `{"0":"${name}"}`
	if (mod_object.characters) {
		characters = JSON.stringify(mod_object.characters)
	}
	localStorage.setItem('jollyModName', name);
	localStorage.setItem('jollyModAvailableCharacters', characters);
	const url = `mod/zips/${name}.zip`;
	$('installedMod').innerText = name;
	document.querySelectorAll('.singleModItemSelected').forEach(e => e.classList.remove('singleModItemSelected'))
	try {
		$(name).classList.add('singleModItemSelected')
	} catch (err) {}
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