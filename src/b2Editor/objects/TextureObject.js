import {BaseObject} from './BaseObject';
import { serialisable, serialise, MAP } from './../utils/serialised';

@serialisable
export class TextureObject extends BaseObject {
	static TYPE = 1;
	type = 1;

	@serialise(6, MAP.NUMBER, 0)
	ID = 0;

	@serialise(7, MAP.STRING, null)
	textureName = null;

	@serialise(8)
	bodyID = null;

	@serialise(9)
	texturePositionOffsetLength = null;

	@serialise(10)
	texturePositionOffsetAngle = null;

	@serialise(11)
	textureAngleOffset = null;

	@serialise(12)
	isCarvable = false;

	@serialise(13, MAP.DEFINED, '#FFFFFF')
	tint = '#FFFFFF';

	@serialise(14, MAP.DEFINED, 1)
	scaleX = 1;

	@serialise(15, MAP.DEFINED, 1)
	scaleY = 1;

	@serialise(16, MAP.DEFINED, 1)
	transparancy = 1.0;

	@serialise(17, MAP.DEFINED, 0)
	parallax = 0.0;

	@serialise(18, MAP.DEFINED, 0)
	repeatTeleportX = 0;

	@serialise(19, MAP.DEFINED, 0)
	repeatTeleportY = 0;

	@serialise(20, MAP.BOOL, true)
	visible = true;

	lockselection = false;

	initFromArray (arr) {
		return this.fromArray(arr);

		super.initFromArray(arr);

		this.ID = arr[6];
		this.textureName = arr[7];
		this.bodyID = arr[8];
		this.texturePositionOffsetLength = arr[9];
		this.texturePositionOffsetAngle = arr[10];
		this.textureAngleOffset = arr[11];
		this.isCarvable = arr[12];
		this.tint = arr[13] !== undefined ? arr[13] : "#FFFFFF";
		this.scaleX = arr[14] || 1;
		this.scaleY = arr[15] || 1;
		this.transparancy = arr[16] !== undefined ? arr[16] : 1;
		this.parallax = arr[17] !== undefined ? arr[17] : 0;
		this.repeatTeleportX = arr[18] !== undefined ? arr[18] : 0;
		this.repeatTeleportY = arr[19] !== undefined ? arr[19] : 0;
		this.visible = typeof arr[20] === "boolean" ? arr[20] : true;

		return this;
	}
}