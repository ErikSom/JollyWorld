import { BufferSchema, Model, string16 } from '@geckos.io/typed-array-buffer-schema'
import { uint8, int16, int32, string8 } from '@geckos.io/typed-array-buffer-schema'

const mainPart = BufferSchema.schema('mainPart', {
	x: { type: int32 },
	y: { type: int32 },
	r: uint8,
})

const basePart = BufferSchema.schema('basePart', {
	x: { type: int16 },
	y: { type: int16 },
	r: uint8,
})

const vehiclePart = BufferSchema.schema('vehiclePart', {
	x: { type: int16 },
	y: { type: int16 },
	r: uint8,
})

const characterSchema = BufferSchema.schema('player', {
	id: uint8,
	mirror: uint8,
	expression: uint8,
	main: [mainPart],
	parts: [basePart],
	vehicleParts: [vehiclePart],
})
export const characterModel = new Model(characterSchema);


// ADMIN INTRODUCTION
const adminIntroduction = BufferSchema.schema('adminIntroduction', {
	name: { type: string8, length: 32 },
	levelID: { type: string8, length: 21 },
	lobbyState: uint8,
	selectedVehicle: uint8,
	gameVersion: { type: string8, length: 12 },
});

export const adminIntroductionModel = new Model(adminIntroduction);

// INTRODUCTION
const introduction = BufferSchema.schema('introduction', {
	name: { type: string8, length: 32 },
	lobbyState: uint8,
	selectedVehicle: uint8,
})
export const introductionModel = new Model(introduction);

// SIMPLE MESSAGE
export const SIMPLE_MESSAGE_TYPES = {
	PLAYER_READY: 0,
	PLAYER_NOT_READY: 1,
	PLAYER_FINISHED_LOADING: 2,
	START_COUNTDOWN: 3,
	LEVEL_WON: 4,
	LEVEL_FAILED: 5,
	LEVEL_CHECKPOINT: 6,
	FINISH_END_COUNTDOWN: 7,
	RETURN_TO_LOBBY: 8,
	VOTE_LEVEL_1: 9,
	VOTE_LEVEL_2: 10,
	VOTE_LEVEL_3: 11,
	VOTE_LEVEL_4: 12,
	KICKED_BY_ADMIN: 13,
	KICKED_GAME_FULL: 14,
	KICKED_GAME_STARTED: 15,
	REQUEST_GAME_STATE: 16,
	SELECT_VEHICLE: 100,
}

const simpleMessage = BufferSchema.schema('simpleMessage', {
	type: uint8,
})
export const simpleMessageModel = new Model(simpleMessage);

// START LOAD LEVEL
const startLoadLevel = BufferSchema.schema('startLoadLevel', {
	levelID: { type: string8, length: 21 },
})
export const startLoadLevelModel = new Model(startLoadLevel);

// CHANGE LEVEL
const changeServerLevel = BufferSchema.schema('changeServerLevel', {
	levelID: { type: string8, length: 21 },
})
export const changeServerLevelModel = new Model(changeServerLevel);

// LEVEL WON
const levelWon = BufferSchema.schema('levelWon', {
	time: { type: int32 },
})
export const levelWonModel = new Model(levelWon);

// CHAT MESSAGE
const chatMessage = BufferSchema.schema('chatMessage', {
	message: {type: string16, length: 200},
});
export const chatMessageModel = new Model(chatMessage);

// END COUNTDOWN MESSAGE
const endCountDownMessage = BufferSchema.schema('endCountDownMessage', {
	level1: {type: string8, length: 21},
	level2: {type: string8, length: 21},
	level3: {type: string8, length: 21},
	timeOffset: {type: int32},
});
export const endCountDownMessageModel = new Model(endCountDownMessage);

// LEVEL VOTES
const levelVotesMessage = BufferSchema.schema('levelVotesMessage', {
	level1: { type: uint8 },
	level2: { type: uint8 },
	level3: { type: uint8 },
	level4: { type: uint8 },
});
export const levelVotesMessageModel = new Model(levelVotesMessage);

// SELECT HAT
const selectHatMessage = BufferSchema.schema('selectHatMessage', {
	hat: { type: uint8 },
	hatOffsetLength: { type: uint8 },
	hatOffsetAngle: { type: uint8 },
});
export const selectHatMessageModel = new Model(selectHatMessage);
