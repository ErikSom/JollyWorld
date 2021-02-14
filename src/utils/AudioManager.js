import {Howl, Howler} from '../../libs/howler';
import {hashName} from '../AssetList'

Howler.autoUnlock = true;

let sfx;
let sfxLoaded = false;
let activeSounds = {};
const maxPitch = 20;

const sfxJSON = require('../../static/assets/audio/sfx.json');

export const init = ()=>{
	sfx = new Howl({
		"src": [
		  `./assets/audio/${hashName('sfx.ogg')}`,
		  `./assets/audio/${hashName('sfx.m4a')}`,
		  `./assets/audio/${hashName('sfx.mp3')}`,
		  `./assets/audio/${hashName('sfx.ac3')}`
		],
		sprite:sfxJSON.sprite,
	  });

	  sfx.once('load', function () {
		sfxLoaded = true;
		// download next
		console.log("AUDIO LOADED");
	  });
	//   sfx.on('loadprogress', function (e) {
	// 	  console.log("PROGRESSS");
	//   });
}

export const playPrefabUniqueLoopSFX = (prefabName, sfxName, volume, pitch=1) => {
	if(!sfxLoaded) return;

	let soundId = null;
	if(activeSounds[prefabName] && activeSounds[prefabName][sfxName]){
		soundId = activeSounds[prefabName][sfxName];
	}else {
		soundId = sfx.play(sfxName);
		sfx.loop(true, soundId);
		if(!activeSounds[prefabName]) activeSounds[prefabName] = {};
		activeSounds[prefabName][sfxName] = soundId;
	}
	sfx.volume(volume, soundId);
	sfx.rate(Math.min(maxPitch, pitch), soundId);
}
export const stopPrefabUniqueLoopSFX = (prefabName, sfxName) => {
	if(!sfxLoaded) return;

	let soundId = null;
	if(activeSounds[prefabName] && activeSounds[prefabName][sfxName]){
		soundId = activeSounds[prefabName][sfxName];
	}
	if(soundId){
		sfx.loop(false, soundId);
		sfx.stop(soundId);
		delete activeSounds[prefabName][sfxName];
	}
}
export const playSFX = (sfxName, volume, pitch=1) => {
	if(!sfxLoaded) return;

	console.log("PLAYING SFX");

	const soundId = sfx.play(sfxName);
	sfx.volume(volume, soundId);
	sfx.rate(Math.min(maxPitch, pitch), soundId);
}
export const stopAllSounds = ()=>{
	if(!sfxLoaded) return;

	Object.keys(activeSounds).forEach( key => {
		const innerKeys = Object.keys(activeSounds[key]);
		if(innerKeys){
			innerKeys.forEach(innerKey => {
				const soundId = activeSounds[key][innerKey];
				sfx.loop(false, soundId);
				sfx.stop(soundId);
			})
		}
	})

	sfx.stop();
	activeSounds = {}
}
