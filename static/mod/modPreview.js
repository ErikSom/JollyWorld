const promiseBlobToImage = function(blob) {
	return new Promise((resolve, reject) => {
		const url = URL.createObjectURL(blob);
		const image = new Image();
		image.src = url;
		image.onload = function() {
			resolve(this);
		};
	});
}

function generateModPreviewFromIDB(updatecharacterselection = true) {
	if (updatecharacterselection) {
		$('currentModCharacters').innerHTML = '';
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

						$('currentModCharacters').appendChild(character_container);
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