import {
	game
} from "../Game";

import * as idb from 'idb-keyval';

const folderName = 'mod';

const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d', {alpha:true});

export const init = ()=>{
	idb.keys().then(keys => {
		console.log("KEYS:", keys)

		const characterMods = [];

		if(keys.find( key => key.startsWith(folderName))){


			keys.forEach(key => {
				console.log(key)
				if(key.indexOf(`${folderName}/characters`) === 0){
					characterMods.push(key);
				}
			})


			if(characterMods.length > 0){
				modCharacters(characterMods);
			}

			console.log(game.app, characterMods.length);
			console.log("Mod found, enable mod!!");


			// var url = URL.createObjectURL(blob);
			// var image = new Image();
			// document.body.appendChild(image);
			// image.src = url;
		}
	})
}

const modCharacters = characterMods => {
	// firsts lets grab our Characters base texture;

	const targetBaseTextureCache = PIXI.utils.BaseTextureCache['Characters_1.json_image'];
	const resource = targetBaseTextureCache.resource;

	canvas.width = resource.width;
	canvas.height = resource.height;

	ctx.drawImage(resource.source, 0, 0);

	const atlas = game.app.loader.resources['Characters_1.json'].data.frames;

	const expectedMods = characterMods.length;
	let finishedMods = 0;

	characterMods.forEach(mod => {

		const path = mod.split('/');
		const textureName = path[path.length-1].split('.')[0];

		const {x, y, w, h} = atlas[textureName].frame;

		idb.get(mod).then(blob => {
			const url = URL.createObjectURL(blob);
			const image = new Image();
			document.body.appendChild(image);
			image.src = url;
			image.onload = () => {
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
