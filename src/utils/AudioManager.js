import {Howl, Howler} from '../../libs/howler';
import {hashName} from '../AssetList'
import { Settings } from '../Settings';

import {
    game
} from "../Game"

Howler.autoUnlock = true;

let sfx;
let sfxLoaded = false;
let activeSounds = {};
let activePlayingSounds = 0;
let currentQueueReleaseTime = 0;
const maxPitch = 20;
const maxPlayingSounds = 6;
const soundQueueReleaseInterval = 50;

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
		autoplay:false,
	  });

	  sfx.once('unlock', ()=>{
		  sfx.stop();
	  })

	  sfx.once('load', function () {
		sfxLoaded = true;
		// download next
		// console.log("AUDIO LOADED");
	  });
	//   sfx.on('loadprogress', function (e) {
	// 	  console.log("PROGRESSS");
	//   });
}

const determineVolumeAndPan = pos => {
	if(!pos) return {vl:1.0, pan:0};

	const effectMargin = 300;
	let pixiPoint = game.editor.getPIXIPointFromWorldPoint(pos);
	pixiPoint = game.editor.container.toGlobal(pixiPoint);

	if (game.editor.container.camera) {
		game.editor.container.camera.toScreenPoint(pixiPoint, pixiPoint);
	}

	const dx = window.innerWidth/2 - pixiPoint.x;
	const dy = window.innerHeight/2 - pixiPoint.y;
	const distance = Math.sqrt(dx*dx + dy*dy);

	let maxDistance = window.innerWidth > window.innerHeight ? window.innerWidth/2 : window.innerHeight/2;
	maxDistance += effectMargin;

	const vl = Math.max(0, 1-(distance / maxDistance))
	const pan = -dx / maxDistance;

	return {vl, pan}
}

export const playPrefabUniqueLoopSFX = (prefabName, sfxName, volume, pitch=1, position) => {
	if(!sfxLoaded || !Settings.sfxOn) return;
	if(activePlayingSounds>=maxPlayingSounds) return;

	pitch = Math.max(0.1, pitch * game.editor.editorSettingsObject.gameSpeed);
	const {vl, pan} = determineVolumeAndPan(position);
	if(vl === 0){
		stopPrefabUniqueLoopSFX(prefabName, sfxName);
		return;
	}

	let soundId = null;
	if(activeSounds[prefabName] && activeSounds[prefabName][sfxName]){
		soundId = activeSounds[prefabName][sfxName];
	}else {
		soundId = sfx.play(sfxName);
		sfx.loop(true, soundId);
		if(!activeSounds[prefabName]) activeSounds[prefabName] = {};
		activeSounds[prefabName][sfxName] = soundId;
	}

	sfx.volume(volume*vl, soundId);
	sfx.rate(Math.min(maxPitch, pitch), soundId);
	sfx.stereo(pan, soundId);
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
export const playSFX = (sfxName, volume, pitch=1, position) => {
	if(!sfxLoaded || !Settings.sfxOn) return;
	if(activePlayingSounds>=maxPlayingSounds) return;

	pitch = Math.max(0.1, pitch * game.editor.editorSettingsObject.gameSpeed);

	const {vl, pan} = determineVolumeAndPan(position);
	if(vl === 0) return;

	if(Array.isArray(sfxName)) sfxName = sfxName[Math.floor(Math.random() * sfxName.length)];

	const soundId = sfx.play(sfxName);
	sfx.volume(volume*vl, soundId);
	sfx.rate(Math.min(maxPitch, pitch), soundId);
	sfx.stereo(pan, soundId);
	activePlayingSounds++;
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
export const update = ()=> {
	currentQueueReleaseTime += game.editor.deltaTime;
	if(currentQueueReleaseTime > soundQueueReleaseInterval) activePlayingSounds--;
	while(currentQueueReleaseTime > soundQueueReleaseInterval) currentQueueReleaseTime -= soundQueueReleaseInterval;
}
