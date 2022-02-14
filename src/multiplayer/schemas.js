import { BufferSchema, Model } from '@geckos.io/typed-array-buffer-schema'
import { uint8, int16, int32, string8 } from '@geckos.io/typed-array-buffer-schema'

const mainPart = BufferSchema.schema('mainPart', {
	x: { type: int32, digits: 1 },
	y: { type: int32, digits: 1 },
	r: uint8,
})

const basePart = BufferSchema.schema('basePart', {
	x: { type: int16, digits: 1 },
	y: { type: int16, digits: 1 },
	r: uint8,
})

const characterSchema = BufferSchema.schema('player', {
	id: uint8,
	mirrored: uint8,
	main: [mainPart],
	parts: [basePart],
	vehicleParts: [basePart],
})
export const characterModel = new Model(characterSchema);


// ADMIN INTRODUCTION
const adminIntroduction = BufferSchema.schema('adminIntroduction', {
	name: { type: string8, length: 32 },
	levelID: { type: string8, length: 21 }
});

export const adminIntroductionModel = new Model(adminIntroduction);

// INTRODUCTION
const introduction = BufferSchema.schema('introduction', {
	name: { type: string8, length: 32 },
	lobbyState: uint8,
})
export const introductionModel = new Model(introduction);

// SIMPLE MESSAGE
export const SIMPLE_MESSAGE_TYPES = {
	PLAYER_READY: 0,
	PLAYER_NOT_READY: 1,
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


