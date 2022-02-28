import { adminIntroductionModel, changeServerLevelModel, characterModel, chatMessageModel, endCountDownMessageModel, introductionModel, levelVotesMessageModel, levelWonModel, simpleMessageModel, startLoadLevelModel } from "./schemas"
import {
	Settings
} from '../Settings'
import { game } from "../Game";

const RAD2DEG = 57.29577951308232;

const BODY_PARTS = {
	HEAD: 'head',
	BODY: 'body',
	THIGH_LEFT: 'thigh_left',
	THIGH_RIGHT: 'thigh_right',
	LEG_LEFT: 'leg_left',
	LEG_RIGHT: 'leg_right',
	FEET_LEFT: 'feet_left',
	FEET_RIGHT: 'feet_right',
	SHOULDER_LEFT: 'shoulder_left',
	SHOULDER_RIGHT: 'shoulder_right',
	ARM_LEFT: 'arm_left',
	ARM_RIGHT: 'arm_right',
	HAND_LEFT: 'hand_left',
	HAND_RIGHT: 'hand_right',
	BELLY: 'belly',
}

let lastValidMainData = {x: 0, y: 0};

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
			x: 0,
			y: 0,
			r: 0,
		}
	}

	const bodySprite = body.myTexture || body.mySprite;

	if(!target){
		lastValidMainData = {
			x: bodySprite.position.x,
			y: bodySprite.position.y,
			r: serializeAngle(body.GetAngle()),
		}
		return lastValidMainData;
	}else{

		const targetSprite = target.myTexture || target.mySprite;

		const refPosition = target ? {
			x: targetSprite.position.x,
			y: targetSprite.position.y,
		} : lastValidMainData;

		return {
			x: bodySprite.position.x - refPosition.x,
			y: bodySprite.position.y - refPosition.y,
			r: serializeAngle(body.GetAngle()),
		}
	}
}

// id 0 - 255
export const characterToBuffer = (characterClass, id) => {
	const lookup = characterClass.lookupObject;


	// build expression uint
	// 2 5 5 values ( eyes (3), expression (6), empty (6))
	let eyesBit = 0;
	const eyeLeftCache = lookup.eye_left?.myTexture?.originalSprite?.texture?.textureCacheIds;
	const eyeRightCache = lookup.eye_right?.myTexture?.originalSprite?.texture?.textureCacheIds;
	if((eyeLeftCache.length && eyeLeftCache[0].indexOf('Closed') >= 0) || (eyeRightCache.length && eyeRightCache[0].indexOf('Closed') >= 0)){
		eyesBit = 100;
	}
	let expressionBit = 0;
	if(characterClass.expression === 'Pain') expressionBit = 10;
	if(characterClass.expression === 'Special') expressionBit = 20;
	const expression = eyesBit + expressionBit;
	//

	const characterData = {
		id,
		mirror: +characterClass.flipped,
		expression,
		main: [extractPosition(lookup[BODY_PARTS.BODY])],
		parts:[
			extractPosition(lookup[BODY_PARTS.HEAD], lookup[BODY_PARTS.BODY]),
			extractPosition(lookup[BODY_PARTS.SHOULDER_LEFT], lookup[BODY_PARTS.BODY]),
			extractPosition(lookup[BODY_PARTS.SHOULDER_RIGHT], lookup[BODY_PARTS.BODY]),
			extractPosition(lookup[BODY_PARTS.ARM_LEFT], lookup[BODY_PARTS.BODY]),
			extractPosition(lookup[BODY_PARTS.ARM_RIGHT], lookup[BODY_PARTS.BODY]),
			extractPosition(lookup[BODY_PARTS.HAND_LEFT], lookup[BODY_PARTS.BODY]),
			extractPosition(lookup[BODY_PARTS.HAND_RIGHT], lookup[BODY_PARTS.BODY]),
			extractPosition(lookup[BODY_PARTS.BELLY], lookup[BODY_PARTS.BODY]),
			extractPosition(lookup[BODY_PARTS.THIGH_LEFT], lookup[BODY_PARTS.BODY]),
			extractPosition(lookup[BODY_PARTS.THIGH_RIGHT], lookup[BODY_PARTS.BODY]),
			extractPosition(lookup[BODY_PARTS.LEG_LEFT], lookup[BODY_PARTS.BODY]),
			extractPosition(lookup[BODY_PARTS.LEG_RIGHT], lookup[BODY_PARTS.BODY]),
			extractPosition(lookup[BODY_PARTS.FEET_LEFT], lookup[BODY_PARTS.BODY]),
			extractPosition(lookup[BODY_PARTS.FEET_RIGHT], lookup[BODY_PARTS.BODY]),
		],
		vehicleParts:[],
	}


	if(game.vehicle){
		if(game.selectedVehicle === 1){
			const vehicleLookup = game.vehicle.lookupObject;
			characterData.vehicleParts = [
				extractPosition(vehicleLookup.frame, lookup[BODY_PARTS.BODY]),
				extractPosition(vehicleLookup.wheel_back, lookup[BODY_PARTS.BODY]),
				extractPosition(vehicleLookup.wheel_front, lookup[BODY_PARTS.BODY]),
				extractPosition(vehicleLookup.pedal, lookup[BODY_PARTS.BODY]),
			]
		}
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
	characterData.vehicleParts.forEach( p => {
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
	introductionData.name = introductionData.name.trim();
	introductionData.levelID = introductionData.levelID.trim();
	return introductionData;
}

// PEER INTRODUCTION
export const dataToIntroductionBuffer = (name, lobbyState) => {
	const buffer = introductionModel.toBuffer({name, lobbyState})
	return buffer;
}

export const dataFromIntroductionBuffer = buffer => {
	const introductionData = introductionModel.fromBuffer(buffer);
	introductionData.name = introductionData.name.trim();
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

// LEVEL WON
export const dataToLevelWonBuffer = time => {
	const buffer = levelWonModel.toBuffer({time});
	return buffer;
}

export const dataFromLevelWonBuffer = buffer => {
	const simpleMessageData = levelWonModel.fromBuffer(buffer);
	return simpleMessageData;
}

// CHAT MESSAGE
export const dataToChatMessageBuffer = message => {
	const slicedMessage = message.substr(0, Settings.maxChatLength);
	const buffer = chatMessageModel.toBuffer({message:slicedMessage});
	return buffer;
}

export const dataFromChatMessageBuffer = buffer => {
	const chatMessageData = chatMessageModel.fromBuffer(buffer);
	chatMessageData.message = chatMessageData.message.substr(0, Settings.maxChatLength).trim();
	return chatMessageData;
}

// END COUNTDOWN MESSAGE
export const dataToEndCountDownMessageBuffer = levelIds => {
	const buffer = endCountDownMessageModel.toBuffer({level1:levelIds[0], level2:levelIds[1], level3:levelIds[2]});
	return buffer;
}

export const dataFromEndCountDownMessageBuffer = buffer => {
	const endCountDownMessageData = endCountDownMessageModel.fromBuffer(buffer);
	endCountDownMessageData.levelIds = [endCountDownMessageData.level1, endCountDownMessageData.level2, endCountDownMessageData.level3];
	return endCountDownMessageData;
}

// LEVEL VOTES MESSAGE
export const dataToLevelVotesMessageBuffer = votes => {
	const buffer = levelVotesMessageModel.toBuffer({level1:votes[0], level2:votes[1], level3:votes[2], level4:votes[3]});
	return buffer;
}

export const dataFromLevelVotesMessageBuffer = buffer => {
	const levelVotesMessageData = levelVotesMessageModel.fromBuffer(buffer);
	levelVotesMessageData.votes = [levelVotesMessageData.level1, levelVotesMessageData.level2, levelVotesMessageData.level3, levelVotesMessageData.level4];
	return levelVotesMessageData;
}
