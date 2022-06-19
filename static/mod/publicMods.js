const all_public_mods = [
	{name: "Cirilla", author: "Taurus"},
	{name: "Darkmode", author: "TriggerTitan"},
	{name: "TrudyWalker", author: "Anonymous Frog", about: "A little girl with a massive obsession with poo. She's from a set of music videos made by Koit Studios: <a href='highasakoit.co.uk'>highasakoit.co.uk</a><a href='youtube.com/koit75'>youtube.com/koit75</a>"},
	{name: "Piconjo", author: "Anonymous Frog", about: "g0d of teh pr0tal on newgr0unds and in teh j0llyw0ld: <a href='https://piconjo.newgrounds.com/'>piconjo.newgrounds.com</a>"},
	{name: "Lolita", author: "PetiteCass"},
	{name: "jollyMattShea", author: "JollyBoy", about: "A popular YouTuber that has featured JollyWorld on his channel: <a href='https://youtube.com/mattsheatv/'>youtube.com/mattsheatv</a>"},
	{name: "RickAndMorty", author: "JollyBoy", characters: [0,1,2,3,12], about: "5 characters from the animated series. Rick, Morty, Jerry, Beth and Summer."},
	{name: "JunpeiZaki", author: "JollyBoy", about: "A popular creator that has featured JollyWorld on his TikTok: <a href='https://www.tiktok.com/@junpei.zaki'>tiktok.com/@junpei.zaki</a>"},
	{name: "hellboy69", author: "lara", about: "A character inspired by Medusa, but with added cool."},
	{name: "DianeNguyen", author: "lara", about: "A main protagonist in the famous show Bojack Horseman."},
	{name: "WalterWhite", author: "Warze", about: "The main character of the iconic show Breaking Bad."},
	{name: "Mario", author: "Warze", about: "The iconic italian plumber from the most popular gaming franchise in history."},
	{name: "warzemod", author: "Warze", about: "A representation of Warze in JollyWorld's artstyle."},
];
let all_public_mods_added = false;

function addToPublicMods(mod_id) {
	const mod_object = all_public_mods[mod_id];
	const name = mod_object.name;
	const author = mod_object.author;
	const about = mod_object.about;
	const characters = mod_object.characters;
	let characters_array = [0]
	if (mod_object.characters) {
		characters_array = mod_object.characters;
	}
	let characterimgs = '';
	for (var i = 0; i < characters_array.length; i ++) {
		const imgid = (characters_array[i] === 0 ? "" : characters_array[i]);
		const offset = -i * (150 / characters_array.length);
		const zindex = characters_array.length - i;
		const opacity = i / characters_array.length;
		characterimgs += `
		<div class="publicModThumbSubContainer" style="z-index:${zindex};filter:grayscale(${opacity}) brightness(${1+opacity/2})">
			<img 
			style="transform: translateX(${offset}px);"
			class="publicModThumb" 
			src="mod/thumbs/${name}${imgid}.png">
		</div>
		`
	}
	const aboutsection = (about === undefined ? '' : `<p class="publicModAboutHover">
		?
		<p class="publicModAbout">${about}</p>
	</p>`);
	$('publicMods').innerHTML += `
	<div class="singleModItem" id="${name}" onclick="downloadPublicMod(${mod_id});">
		<div class="publicModThumbContainer singleModCanvas">
			${characterimgs}
			${aboutsection}
			<p class="publicModDownloadCount">
				<span class="publicModDownloadCountText" id="downloadCount${name}">
					0
				</span>
				<svg width="12" height="12">
					<path d="M3,0 9,0 9,6 12,6 6,12 0,6 3,6 3,0" fill="black">
				</svg>
			</p>
		</div>
		<p class="singleModTitle">${name}</p>
		<p class="singleModAuthor">${author}</p>
	</div>`
}

function addAllPublicMods() {
	if (all_public_mods_added) return;
	for (var mod = 0; mod < all_public_mods.length; mod ++) {
		addToPublicMods(mod);
	};
	all_public_mods_added = true;
	fetch('https://warze.org/jwmod/getall').then((response) => {
        response.text().then((text) => {
            const obj = JSON.parse(text.replaceAll("'",'"'));
			
			for (const [key, value] of Object.entries(obj)) {
				try {
					$('downloadCount' + key).innerText = value;
				} catch (err) {};
			};
        });
    });
}

function downloadPublicMod(mod_id) {
	const mod_object = all_public_mods[mod_id];
	const name = mod_object.name;
	fetch('https://warze.org/jwmod/count?mod=' + name)
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