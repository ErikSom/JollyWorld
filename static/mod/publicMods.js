const all_public_mods = [
	{name: "Cirilla", author: "Ocularist"},
	{name: "Darkmode", author: "TriggerTitan"},
	{name: "TrudyWalker", author: "Anonymous Frog"},
	{name: "piconjomod", author: "Anonymous Frog"},
	{name: "jollyMattShea", author: "JollyBoy"},
	{name: "RickAndMorty", author: "JollyBoy", characters: [0, 1, 2, 3, 12]},
	{name: "JunpeiZaki", author: "JollyBoy"},
	{name: "Mario", author: "Warze"},
	{name: "warzemod", author: "Warze"},
];

function addToPublicMods(mod) {
	$('publicMods').innerHTML += `
	<div class="singleModItem" id="${mod.name}" onclick="downloadPublicMod(this.id);">
		<div style="background-image: url('mod/thumbs/${mod.name}.png');" class="singleModCanvas publicModThumb">
		</div>
		<p class="singleModTitle">${mod.name}</p>
		<p class="singleModAuthor">${mod.author}</p>
	</div>`
}

function downloadPublicMod(name) {
	localStorage.removeItem('jollyModCustomPreview');
	downloadPublicModZip(name)
	localStorage.setItem('jollyModName', name)
	updateModName()
}

function downloadPublicModZip(name) {
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

all_public_mods.forEach(mod => addToPublicMods(mod))
updateModName();