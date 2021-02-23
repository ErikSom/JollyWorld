import { BaseObject } from './BaseObject';

import { serialisable, serialise, MAP } from './../utils/serialised';

@serialisable
export class AnimationGroupObject extends BaseObject {
	static TYPE = 11;
	type = 11;

	@serialise(6)
	ID = 0;

	@serialise(7)
	graphicObjects = [];

	@serialise(8)
	bodyID = null;

	@serialise(9)
	texturePositionOffsetLength = null;

	@serialise(10)
	texturePositionOffsetAngle = null;

	@serialise(11)
	textureAngleOffset = null;

	@serialise(12, MAP.DEFINED, 1)
	transparancy = 1;

	@serialise(13, MAP.DEFINED, 0)
	parallax = 0.0;

	@serialise(14, MAP.DEFINED, 1)
	repeatTeleportX = 0;

	@serialise(15, MAP.DEFINED, 1)
	repeatTeleportY = 0;

	@serialise(16, MAP.DEFINED, 12)
	fps = 12;

	@serialise(17, MAP.DEFINED, true)
	playing = true;

	@serialise(18, MAP.BOOL, true)
	visible = true;

	@serialise(19, MAP.BOOL, false)
	mirrored = false;

	lockselection = false;

	initFromArray(arr) {
		return this.fromArray(arr);

		super.initFromArray(arr);

		this.ID = arr[6];
		this.graphicObjects = arr[7];
		this.bodyID = arr[8];
		this.texturePositionOffsetLength = arr[9];
		this.texturePositionOffsetAngle = arr[10];
		this.textureAngleOffset = arr[11];
		this.transparancy = arr[12] !== undefined ? arr[12] : 1;
		this.parallax = arr[13] !== undefined ? arr[13] : 0;
		this.repeatTeleportX = arr[14] !== undefined ? arr[14] : 0;
		this.repeatTeleportY = arr[15] !== undefined ? arr[15] : 0;
		this.fps = arr[16] !== undefined ? arr[16] : 12;
		this.playing = arr[17] !== undefined ? arr[17] : true;
		this.visible = typeof arr[18] === "boolean" ? arr[18] : true;
		this.mirrored = typeof arr[19] === "boolean" ? arr[19] : false;

		return this;
	}
}