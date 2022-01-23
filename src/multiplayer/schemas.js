import { BufferSchema, Model } from '@geckos.io/typed-array-buffer-schema'
import { uint8, int16, int32, string8 } from '@geckos.io/typed-array-buffer-schema'

const mainPart = BufferSchema.schema('mainPart', {
	x: { type: int32, digits: 1 },
	y: { type: int32, digits: 1 },
	r: uint8,
	state: uint8
})

const basePart = BufferSchema.schema('basePart', {
	x: { type: int16, digits: 1 },
	y: { type: int16, digits: 1 },
	r: uint8,
	state: uint8
})

const characterSchema = BufferSchema.schema('player', {
	id: uint8,
	mirrored: uint8,
	main: [mainPart],
	parts: [basePart]
})

export const characterModel = new Model(characterSchema);


const introduction = BufferSchema.schema('introduction', {
	name: string8,
	lobbyState: uint8,
})

export const introductionModel = new Model(introduction);
