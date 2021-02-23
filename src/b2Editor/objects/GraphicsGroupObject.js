import { BaseObject } from './BaseObject';
import { serialisable, serialise, MAP } from './../utils/serialised';

@serialisable
export class GraphicsGroupObject extends BaseObject {
	static TYPE = 7;
	type = 7;

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

	@serialise(14, MAP.DEFINED, 0)
	repeatTeleportX = 0;

	@serialise(15, MAP.DEFINED, 0)
	repeatTeleportY = 0;

	@serialise(16, MAP.BOOL, true)
	visible = true;

	@serialise(17, MAP.BOOL, false)
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
		this.visible = typeof arr[16] === "boolean" ? arr[16] : true;
		this.mirrored = typeof arr[17] === "boolean" ? arr[17] : false;

		return this;
	}
}