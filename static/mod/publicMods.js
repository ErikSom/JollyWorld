const all_public_mods = [
	{name: "Cirilla", author: "Ocularist"},
	{name: "Darkmode", author: "TriggerTitan"},
	{name: "TrudyWalker", author: "Anonymous Frog"},
	{name: "piconjomod", author: "Anonymous Frog"},
	{name: "jollyMattShea", author: "JollyBoy"},
	{name: "RickAndMorty", author: "JollyBoy", characters: [
	{id: 0, name: "Rick"}, 
	{id: 1, name: "Morty"}, 
	{id: 2, name: "Jerry"}, 
	{id: 3, name: "Beth"}, 
	{id: 12, name: "Summer"}
	]},
	{name: "JunpeiZaki", author: "JollyBoy"},
	{name: "Mario", author: "Warze"},
	{name: "warzemod", author: "Warze"},
];

function addToPublicMods(mod_id) {
	const mod_object = all_public_mods[mod_id];
	const name = mod_object.name;
	const author = mod_object.author;
	$('publicMods').innerHTML += `
	<div class="singleModItem" id="${name}" onclick="downloadPublicMod(${mod_id});">
		<div style="background-image: url('mod/thumbs/${name}.png');" class="singleModCanvas publicModThumb">
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
	let characters = `[{"id":0,"name":"${name}"}]`
	if (mod_object.characters) {
		characters = JSON.stringify(mod_object.characters)
	}
	localStorage.setItem('jollyModName', name);
	localStorage.setItem('jollyModAvailableCharacters', characters);
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
	updateModName()
}