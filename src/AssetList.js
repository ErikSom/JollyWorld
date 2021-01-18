import * as PIXI from 'pixi.js';
import {
	Settings
} from './Settings'

export const hashName = name => {
    if(window.__assetHashNames && typeof window.__assetHashNames === 'object' && window.__assetHashNames !== null){
        if(window.__assetHashNames[name]) return window.__assetHashNames[name];
    }
    return name;
}

export const LoadCoreAssets = function (loader){
    loader.add("Characters_1.json", `assets/images/characters/${hashName('Characters_1.json')}`)
        .add("Characters_Gore.json", `assets/images/characters/${hashName('Characters_Gore.json')}`)
        .add("Vehicles_1.json", `assets/images/vehicles/${hashName('Vehicles_1.json')}`)
        .add("Movement.json", `assets/images/prefabs/${hashName('Movement.json')}`)
        .add("Construction.json", `assets/images/prefabs/${hashName('Construction.json')}`)
        .add("Nature.json", `assets/images/prefabs/${hashName('Nature.json')}`)
        .add("Weapons.json", `assets/images/prefabs/${hashName('Weapons.json')}`)
        .add("Level.json", `assets/images/prefabs/${hashName('Level.json')}`)
        .add("textures.json", `assets/images/textures/${hashName('textures.json')}`)
        /*TILE DATA*/
        .add("rope.png", `assets/images/misc/${hashName('rope.png')}`)
        /*PARTICLE DATA*/
        .add(`assets/images/particles/${hashName('particles.json')}`)
        /*MISC*/
        .add("Logo", `assets/images/gui/${hashName('Logo.svg')}`)
        .add(`assets/images/gui/${hashName('iconSet.json')}`);
}

export const ExtractTextureAssets = async () => {
    const textureSheet = PIXI.loader.resources["textures.json"];
    const sheetImage = textureSheet.spritesheet.baseTexture.source;

    const tempCanvas = document.createElement('canvas');
    const tempCTX = tempCanvas.getContext('2d');
    const textureSize = 128;
    tempCanvas.width = tempCanvas.height = textureSize;
    const keys = Object.keys(textureSheet.textures);
    for(let i = 0; i< keys.length; i++){
        const key = keys[i];
        const texture = textureSheet.textures[key];
        tempCTX.clearRect(0, 0, textureSize, textureSize);
        tempCTX.drawImage(sheetImage, texture._frame.x, texture._frame.y, textureSize, textureSize, 0, 0, textureSize, textureSize);

        const image = await new Promise(resolve => {
            const image = new Image();
            image.alt = Settings.textureNames[i+1];
            image.src = tempCanvas.toDataURL();
            image.onload = ()=>{resolve(image)};
        })
        const baseTexture = new PIXI.BaseTexture(image);
        PIXI.BaseTexture.addToCache(baseTexture, Settings.textureNames[i+1])
    };
}
