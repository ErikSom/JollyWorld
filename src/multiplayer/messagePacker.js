import { adminIntroductionModel, changeServerLevelModel, characterModel, introductionModel, simpleMessageModel, startLoadLevelModel } from "./schemas"
import {
	Settings
} from '../Settings'
const RAD2DEG = 57.29577951308232;

const BODY_PARTS = {
	HEAD: 'head',
	BODY: 'body',
	SHOULDER_LEFT: 'shoulder_left',
	SHOULDER_RIGHT: 'shoulder_right',
	ARM_LEFT: 'arm_left',
	ARM_RIGHT: 'arm_right',
	HAND_LEFT: 'hand_left',
	HAND_RIGHT: 'hand_right',
}

let lastValidMainData = {x: 0, y: 0};

export const BODY_STATE = {
	NORMAL: 0,
	SNAPPED: 1,
	BASHED: 2,
}

const serializeAngle = radians => {
	let deg = (radians * RAD2DEG) % 360;
	if(deg<0) deg += 360;
	return Math.round((deg / 360) * 255);
}

const fixAngle = uint => {
	return Math.round((uint / 255) * 360);
}

const extractPosition = (body, target) => {
	if(!body){
		return {
			x:0,
			y:0,
			r: 0,
			state: BODY_STATE.BASHED,
		}
	}
	if(!target){
		lastValidMainData = {
			x: body.GetPosition().x * Settings.PTM,
			y: body.GetPosition().y * Settings.PTM,
			r: serializeAngle(body.GetAngle()),
			state: BODY_STATE.NORMAL
		}
		return lastValidMainData;
	}else{
		const refPosition = target ? {
			x: target.GetPosition().x * Settings.PTM,
			y: target.GetPosition().y * Settings.PTM,
		} : lastValidMainData;

		return {
			x: body.GetPosition().x * Settings.PTM - refPosition.x,
			y: body.GetPosition().y * Settings.PTM - refPosition.y,
			r: serializeAngle(body.GetAngle()),
			state: BODY_STATE.NORMAL
		}
	}
}

// id 0 - 255
export const characterToBuffer = (characterClass, id) => {
	const lookup = characterClass.lookupObject;
	const characterData = {
		id,
		mirrored: false,
		main: [extractPosition(lookup[BODY_PARTS.BODY])],
		parts:[
			extractPosition(lookup[BODY_PARTS.HEAD], lookup[BODY_PARTS.BODY]),
			extractPosition(lookup[BODY_PARTS.SHOULDER_LEFT], lookup[BODY_PARTS.BODY]),
			extractPosition(lookup[BODY_PARTS.SHOULDER_RIGHT], lookup[BODY_PARTS.BODY]),
			extractPosition(lookup[BODY_PARTS.ARM_LEFT], lookup[BODY_PARTS.BODY]),
			extractPosition(lookup[BODY_PARTS.ARM_RIGHT], lookup[BODY_PARTS.BODY]),
			extractPosition(lookup[BODY_PARTS.HAND_LEFT], lookup[BODY_PARTS.BODY]),
			extractPosition(lookup[BODY_PARTS.HAND_RIGHT], lookup[BODY_PARTS.BODY]),
		]
	}
	const buffer = characterModel.toBuffer(characterData);
	return buffer;
}

export const characterFromBuffer = buffer => {
	const characterData = characterModel.fromBuffer(buffer);
	characterData.main[0].r = fixAngle(characterData.main[0].r);
	characterData.parts.forEach( p => {
		p.r = fixAngle(p.r);
	});
	return characterData;
}

// ADMIN INTRODUCTION
export const dataToAdminIntroductionBuffer = (name, levelID) => {
	const buffer = adminIntroductionModel.toBuffer({name, levelID})
	return buffer;
}

export const dataFromAdminIntroductionBuffer = buffer => {
	const introductionData = adminIntroductionModel.fromBuffer(buffer);
	return introductionData;
}

// PEER INTRODUCTION
export const dataToIntroductionBuffer = (name, lobbyState) => {
	const buffer = introductionModel.toBuffer({name, lobbyState})
	return buffer;
}

export const dataFromIntroductionBuffer = buffer => {
	const introductionData = introductionModel.fromBuffer(buffer);
	return introductionData;
}

// SIMPLE MESSAGE
export const dataToSimpleMessageBuffer = type => {
	const buffer = simpleMessageModel.toBuffer({type});
	return buffer;
}

export const dataFromSimpleMessageBuffer = buffer => {
	const simpleMessageData = simpleMessageModel.fromBuffer(buffer);
	return simpleMessageData;
}

// START LOAD LEVEL
export const dataToStartLoadLevelBuffer = levelID => {
	const buffer = startLoadLevelModel.toBuffer({levelID});
	return buffer;
}

export const dataFromStartLoadLevelBuffer = buffer => {
	const simpleMessageData = startLoadLevelModel.fromBuffer(buffer);
	return simpleMessageData;
}

// CHANGE LEVEL
export const dataToChangeServerLevelBuffer = levelID => {
	const buffer = changeServerLevelModel.toBuffer({levelID});
	return buffer;
}

export const dataFromChangeServerLevelBuffer = buffer => {
	const simpleMessageData = changeServerLevelModel.fromBuffer(buffer);
	return simpleMessageData;
}



