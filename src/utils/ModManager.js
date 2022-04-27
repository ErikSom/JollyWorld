import {
	game
} from "../Game";

import * as idb from 'idb-keyval';
import { Settings } from "../Settings";
import { hashName } from "../AssetList";

const folderName = 'jollymod';

export const portraitModLookup = {};

export const getModdedPortrait = async (name, fallback) => {
	const saveKey = `${folderName}/portraits/${name}`;

	if(portraitModLookup[name]) return portraitModLookup[name];

	try{
		const blob = await idb.get(saveKey);

		if(blob){
			const url = URL.createObjectURL(blob);
			portraitModLookup[name] = url;
			return url;
		}
	}catch(err){
	};

	return `${fallback}${hashName(name)}`;
}

export const init = ()=> new Promise(resolve => {
	try{
		idb.keys().then(keys => {

			const characterMods = [];
			const vehicleMods = [];
			const goreMods = [];
			const textureMods = [];
			const portraitMods = [];

			debugger

			if(keys.find( key => key.startsWith(folderName))){

				keys.forEach(key => {
					if(key.indexOf(`${folderName}/characters`) === 0 || key.indexOf(`${folderName}/kids`) === 0 || key.indexOf(`${folderName}/babies`) === 0 || key.indexOf(`${folderName}/helmets`) === 0){
						characterMods.push(key);
					}
					if(key.indexOf(`${folderName}/vehicles`) === 0){
						vehicleMods.push(key);
					}
					if(key.indexOf(`${folderName}/gore`) === 0){
						goreMods.push(key);
					}
					if(key.indexOf(`${folderName}/textures`) === 0){
						textureMods.push(key);
					}
				})

				if(characterMods.length > 0){
					modCharacters(characterMods);
				}

				if(vehicleMods.length > 0){
					modVehicles(vehicleMods);
				}

				if(goreMods.length > 0){
					modGore(goreMods);
				}

				if(textureMods.length > 0){
					modTexture(textureMods);
				}
			}
			resolve();
		}).catch(e => {
			// err
			resolve();
		})
	}catch(e){
		//
		resolve();
	}
});

const modCharacters = characterMods => {
	modAtlas('Characters_1.json_image', 'Characters_1.json', characterMods);
}

const modVehicles = vehicleMods => {
	modAtlas('Vehicles_1.json_image', 'Vehicles_1.json', vehicleMods);
}

const modGore = goreMods => {
	modAtlas('Characters_Gore.json_image', 'Characters_Gore.json', goreMods);
}

const modTexture = textureMods => {
	textureMods.forEach(key => {
		const baseName = key.split('.')[0];
		const number = parseInt(baseName.substr(baseName.length-4, 4), 10);
		const realTextureName = Settings.textureNames[number];
		modAtlas(realTextureName, '', [key]);
	});
}

const modAtlas = (textureName, jsonName, textures) => {
	// firsts lets grab our atlas base texture;

	const targetBaseTextureCache = PIXI.utils.BaseTextureCache[textureName];
	const resource = targetBaseTextureCache.resource;

	const canvas = document.createElement('canvas');
	const ctx = canvas.getContext('2d', {alpha:true});

	canvas.width = resource.width;
	canvas.height = resource.height;

	ctx.drawImage(resource.source, 0, 0);

	let atlas = null;
	if(jsonName) atlas = game.app.loader.resources[jsonName].data.frames;

	const expectedMods = textures.length;
	let finishedMods = 0;

	textures.forEach(mod => {

		const path = mod.split('/');
		const textureName = path[path.length-1].split('.')[0];

		let frame = null;

		if(!jsonName){
			frame = {x:0, y:0, w:targetBaseTextureCache.resource.width, h:targetBaseTextureCache.resource.height}
		}else{
			frame = atlas[textureName].frame;
		}

		const {x, y, w, h} = frame;

		idb.get(mod).then(blob => {
			const url = URL.createObjectURL(blob);
			const image = new Image();
			image.src = url;
			image.onload = () => {
				ctx.clearRect(x, y, w, h);
				ctx.drawImage(image, x, y, w, h);
				finishedMods++;
				if(finishedMods === expectedMods){
					if(jsonName){
						const canvasResource = new PIXI.CanvasResource(canvas);
						targetBaseTextureCache.resource.dispose();
						delete targetBaseTextureCache.resource;
						targetBaseTextureCache.setResource(canvasResource);
						targetBaseTextureCache.dirtyId++;
					}else{
						const imageResource = new Image();
						imageResource.src = canvas.toDataURL();
						imageResource.onload = ()=>{
							const imageResourceClass = new PIXI.ImageResource(imageResource);
							targetBaseTextureCache.resource.dispose();
							delete targetBaseTextureCache.resource;
							targetBaseTextureCache.setResource(imageResourceClass);
							targetBaseTextureCache.dirtyId++;
						}
					}
				}
			}
		}).catch(err => {
			// error
		});
	})
}
