import {Howl, Howler} from '../../libs/howler';
import {hashName} from '../AssetList'

Howler.mobileAutoEnable = true;

let sfx;
let sfxLoaded = false;

let activeSounds = {};

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
		html5:true,
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

export const playPrefabUniqueLoopSFX = (prefabName, sfxName, volume, pitch=0) => {
	if(!sfxLoaded) return;
	if(pitch<0.5){
		 stopPrefabUniqueLoopSFX(prefabName, sfxName);
		 return;
	}

	let soundId = null;
	if(activeSounds[prefabName] && activeSounds[prefabName][sfxName]){
		console.log("Play ref sound", prefabName, sfxName);
		soundId = activeSounds[prefabName][sfxName];
	}else {
		soundId = sfx.play(sfxName);
		sfx.loop(true, soundId);
		if(!activeSounds[prefabName]) activeSounds[prefabName] = {};
		activeSounds[prefabName][sfxName] = soundId;
		console.log("Play ***new*** sound", prefabName, sfxName);
	}

	console.log(prefabName, sfxName, volume, pitch);

	sfx.volume(volume, soundId);
	sfx.rate(Math.min(4, pitch), soundId);
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
		console.log("STOP ref sound", prefabName, sfxName);
	}
}
export const stopAllSounds = ()=>{
	if(!sfxLoaded) return;
	sfx.stop();
	activeSounds = {}
}
