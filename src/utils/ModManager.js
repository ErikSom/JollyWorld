import {
	game
} from "../Game";

import * as idb from 'idb-keyval';

const folderName = 'jollymod';

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d', {alpha:true});

export const init = ()=>{
	idb.keys().then(keys => {
		console.log("KEYS:", keys)

		const characterMods = [];
		const vehicleMods = [];

		if(keys.find( key => key.startsWith(folderName))){

			keys.forEach(key => {
				if(key.indexOf(`${folderName}/characters`) === 0 || key.indexOf(`${folderName}/kids`) === 0 || key.indexOf(`${folderName}/babies`) === 0){
					characterMods.push(key);
				}
				if(key.indexOf(`${folderName}/vehicles`) === 0){
					vehicleMods.push(key);
				}
			})

			if(characterMods.length > 0){
				modCharacters(characterMods);
			}

			if(vehicleMods.length > 0){
				modVehicles(vehicleMods);
			}

			console.log(game.app, characterMods.length, vehicleMods.length);
			console.log("Mod found, enable mod!!");


			// var url = URL.createObjectURL(blob);
			// var image = new Image();
			// document.body.appendChild(image);
			// image.src = url;
		}
	})
}

const modCharacters = characterMods => {
	modAtlas('Characters_1.json_image', 'Characters_1.json', characterMods);
}

const modVehicles = vehicleMods => {
	modAtlas('Vehicles_1.json_image', 'Vehicles_1.json', vehicleMods);
}

const modAtlas = (textureName, jsonName, textures) => {
	// firsts lets grab our atlas base texture;

	const targetBaseTextureCache = PIXI.utils.BaseTextureCache[textureName];
	const resource = targetBaseTextureCache.resource;

	canvas.width = resource.width;
	canvas.height = resource.height;

	ctx.drawImage(resource.source, 0, 0);

	const atlas = game.app.loader.resources[jsonName].data.frames;

	const expectedMods = textures.length;
	let finishedMods = 0;

	textures.forEach(mod => {

		const path = mod.split('/');
		const textureName = path[path.length-1].split('.')[0];

		const {x, y, w, h} = atlas[textureName].frame;

		idb.get(mod).then(blob => {
			const url = URL.createObjectURL(blob);
			const image = new Image();
			document.body.appendChild(image);
			image.src = url;
			image.onload = () => {
				ctx.clearRect(x, y, w, h);
				ctx.drawImage(image, x, y, w, h);
				finishedMods++;
				if(finishedMods === expectedMods){
					const canvasResource = new PIXI.CanvasResource(canvas);
					targetBaseTextureCache.resource.dispose();
					delete targetBaseTextureCache.resource;
					targetBaseTextureCache.setResource(canvasResource);
					targetBaseTextureCache.dirtyId++;
				}
			}
		}).catch(err => {
			// error
		});
	})
}
