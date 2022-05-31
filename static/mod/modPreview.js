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

function generateModPreviewFromIDB(updatecharacterselection = true) {
	let characters_element = $('currentModCharacters')
	if (!characters_element) {
		characters_element = $('currentModCharactersMobile')
	}
	if (updatecharacterselection) {
		characters_element.innerHTML = '';
	}
	window.idbKeyval.keys().then((keys) => {
		let all_modded_imgs = {};
		let loaded_files = 0;
		keys.forEach((key) => {
			if (key.includes('characters') || key.includes('vehicles')) {
				window.idbKeyval.get(key).then((value) => {
					var trimmedkey = key.split("/")[key.split("/").length-1];
					promiseBlobToImage(value).then((img) => {
						all_modded_imgs[trimmedkey] = img;
						loaded_files ++;
						if (loaded_files === keys.length) {
							const cvs = generateModPreview(all_asset_imgs, all_modded_imgs)

							//temp
							const portraitcvs = document.createElement('canvas');
							portraitcvs.width = 332;
							portraitcvs.height= 361;
							const portraitctx = portraitcvs.getContext('2d');
							portraitctx.drawImage(cvs, 92, 0, 216, 235, 0, 0, 332, 361)
							portraitcvs.toBlob(function(blob) {
								set('jollyModMenuPortrait', blob)
							});
							//temp ends

							$('currentModThumbCvs').innerHTML = "";
							cvs.classList.remove('singleModCanvas');
							cvs.classList.add('previewModCanvas');
							$('currentModThumbCvs').appendChild(cvs);
						}
					})
				})
			} else if (key.includes('portraits/character') && updatecharacterselection) {
				loaded_files ++;
				window.idbKeyval.get(key).then((value) => {
					promiseBlobToImage(value).then((img) => {
						const character_container = document.createElement('div');
						character_container.classList.add('currentModCharacterImg');
						const character_id = key.replace(/\D/g, "") - 1;
						character_container.setAttribute('characterid', character_id)
						character_container.onclick = function() {
							changeModCharacter(this.getAttribute('characterid'))
						}

						const character_img = blobToImage(value);
						character_container.appendChild(character_img)

						const character_name = document.createElement('h1');

						try {
							character_name.innerText = JSON.parse(localStorage.getItem('jollyWorldTheme')).charNames[character_id]
						}
						catch (err) {
							character_name.innerText = allDefaultCharacters[character_id]
						}

						character_container.appendChild(character_name)

						characters_element.appendChild(character_container);
					})
				})
			} else {
				loaded_files ++;
			}
		})
	})
}

function generateModPreview(defaultImgs, moddedImgs = {}) {
	let cvs = document.createElement('canvas');
	let ctx = cvs.getContext('2d');

	cvs.width  = 2000;
	cvs.height = 350;
	cvs.classList.add('singleModCanvas');

	const character = localStorage.getItem('jollyModCharacter');
	character_positions.forEach((part) => {
		let a = part.asset;
		if (character > 0 && (a.startsWith('Normal') || a.startsWith('Mouth'))) {
			a = a.replace('0000',character.padStart(4,'0'))
		}
		var asset = (moddedImgs[a] ? moddedImgs[a] : defaultImgs[a])
		ctx.save()
		ctx.translate(part.x, part.y)
		ctx.rotate(part.r)
		try {
			ctx.drawImage(asset, 0, 0, part.w, part.h)
		}
		catch (err) {
			console.error(asset)
		}
		ctx.restore()
	})
	return cvs;
}