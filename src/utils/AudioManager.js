import {Howl, Howler} from '../../libs/howler';
import {hashName} from '../AssetList'
import { Settings } from '../Settings';

import {
    game
} from "../Game"

Howler.autoUnlock = true;

let quality = 'lq';

let howls = [];
let spriteHowlMap = {};

let activeSounds = {};
let activePlayingSounds = 0;
let currentQueueReleaseTime = 0;
const maxPitch = 20;
const maxPlayingSounds = 6;
const soundQueueReleaseInterval = 50;

const sfxJSON = require('../../static/assets/audio/sfx-hq.json');
const pack1JSON = require('../../static/assets/audio/pack1-hq.json');
const pack2JSON = require('../../static/assets/audio/pack2-hq.json');

let audioSpriteKeys = [...Object.keys(pack1JSON.sprite), ...Object.keys(pack2JSON.sprite)].sort();

export const init = ()=>{
	loadAudio('sfx', sfxJSON)
	.then(()=> {
		// kickstart howl context retrieval
		playSFX('bike_idle_loop', 0.1);
		return loadAudio('pack1', pack1JSON);
	})
	.then(()=> loadAudio('pack2', pack2JSON))
	.then(()=>{
		// console.log("ALL AUDIO LOADED:", getAvailableAudioSprites());
	})
}

export const getAvailableAudioSprites = ()=>{
	return audioSpriteKeys;
}

export const loadAudio = (name, json) => {
	return new Promise(resolve => {
		const howl = new Howl({
			"src": [
			`assets/audio/${hashName(`${name}-${quality}.ogg`)}`,
			`assets/audio/${hashName(`${name}-${quality}.mp3`)}`,
			],
			sprite:json.sprite,
			autoplay:false,
		});

		howl.once('unlock', ()=>{
			try{
				howl.stop();
			}catch(e){
				//
			}
		})

		howl.once('load', function () {
			Object.keys(json.sprite).forEach(key=>{
				if(spriteHowlMap[key]) throw new Error('Audio sprite key already exists!:'+key)
				spriteHowlMap[key] = howl;
			})
			howls.push(howl);
			resolve();
		});
	});
}

const getHowl = sprite => {
	return spriteHowlMap[sprite];
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

	const vl = Math.max(0, 1-(distance / maxDistance)) || 0
	const pan = (-dx / maxDistance) || 0;

	return {vl, pan}
}

export const playPrefabUniqueLoopSFX = (prefabName, sfxName, volume, pitch=1, position) => {

	const howl = getHowl(sfxName);

	if(!howl || !Settings.sfxOn) return;
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
		soundId = howl.play(sfxName);
		howl.loop(true, soundId);
		if(!activeSounds[prefabName]) activeSounds[prefabName] = {};
		activeSounds[prefabName][sfxName] = soundId;
	}

	howl.volume(volume*vl, soundId);
	howl.rate(Math.min(maxPitch, pitch), soundId);
	howl.stereo(pan, soundId);
}
export const stopPrefabUniqueLoopSFX = (prefabName, sfxName) => {
	const howl = getHowl(sfxName);
	if(!howl) return;

	let soundId = null;
	if(activeSounds[prefabName] && activeSounds[prefabName][sfxName]){
		soundId = activeSounds[prefabName][sfxName];
	}
	if(soundId){
		howl.loop(false, soundId);
		try{
			howl.stop(soundId);
		}catch(e){
			//
		}
		delete activeSounds[prefabName][sfxName];
	}
}
export const playSFX = (sfxName, volume, pitch=1, position) => {

	if(Array.isArray(sfxName)) sfxName = sfxName[Math.floor(Math.random() * sfxName.length)];

	const howl = getHowl(sfxName);

	if(!howl || !Settings.sfxOn) return;
	if(activePlayingSounds>=maxPlayingSounds) return;

	pitch = Math.max(0.1, pitch * game.editor.editorSettingsObject.gameSpeed);

	const {vl, pan} = determineVolumeAndPan(position);
	if(vl === 0) return;

	const soundId = howl.play(sfxName);
	howl.volume(volume*vl, soundId);
	howl.rate(Math.min(maxPitch, pitch), soundId);
	howl.stereo(pan, soundId);
	activePlayingSounds++;
	return soundId;
}
export const stopSFX = (sfxName, id) => {
	const howl = getHowl(sfxName);
	if(!howl) return;
	try{
		howl.stop(id)
	} catch(e){
		//
	}
}
export const stopAllSounds = ()=>{
	try{
		Object.keys(activeSounds).forEach( key => {
			const innerKeys = Object.keys(activeSounds[key]);
			if(innerKeys){
				innerKeys.forEach(innerKey => {
					const howl = getHowl(innerKey);
					if(howl){
						const soundId = activeSounds[key][innerKey];
						howl.loop(false, soundId);
						howl.stop(soundId);
					}
				})
			}
		});

		howls.forEach(howl=> howl.stop());
	}catch(e){
		//
	}
	activeSounds = {}
}
export const update = ()=> {
	currentQueueReleaseTime += game.editor.deltaTime;

	if(currentQueueReleaseTime > soundQueueReleaseInterval) activePlayingSounds--;
	while(currentQueueReleaseTime > soundQueueReleaseInterval) currentQueueReleaseTime -= soundQueueReleaseInterval;
}
