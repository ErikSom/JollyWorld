import {Howl, Howler} from '../../libs/howler';
import {hashName} from '../AssetList'

Howler.mobileAutoEnable = true;

let sfx;
let sfxLoaded = false;

const activeSounds = {};


export const init = ()=>{
	sfx = new Howl({
		"src": [
		  "./assets/audio/sfx.ogg",
		  "./assets/audio/sfx.m4a",
		  "./assets/audio/sfx.mp3",
		  "./assets/audio/sfx.ac3"
		],
		"sprite": {
			"bike_idle_loop": [
			  0,
			  515.1927437641723
			],
			"bike_pedal_loop": [
			  2000,
			  1115.9863945578231
			],
			"dirtbike_idle_loop": [
			  5000,
			  1631.201814058957
			]
		  }
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

	let soundId = null;
	if(activeSounds[prefabName] && activeSounds[prefabName][sfxName]){
		soundId = activeSounds[prefabName][sfxName];
	}else {
		soundId = sfx.play(sfxName);
		sfx.loop(true, soundId);
		if(!activeSounds[prefabName]) activeSounds[prefabName] = {};
		activeSounds[prefabName][sfxName] = soundId;
	}

	console.log(prefabName, sfxName, volume);

	sfx.volume(volume, soundId);
	// sfx.rate(pitch, soundId);
}
export const stopPrefabUniqueLoopSFX = (prefabName, sfxName) => {
	if(!sfxLoaded) return;

	console.log("STOP ACCEL");

	let soundId = null;
	if(activeSounds[prefabName] && activeSounds[prefabName][sfxName]){
		soundId = activeSounds[prefabName][sfxName];
	}
	if(soundId){
		sfx.stop(soundId);
		delete activeSounds[prefabName][sfxName];
	}
}
