import { BaseObject } from './BaseObject';
import { serialisable, serialise, MAP } from './../utils/serialised';

@serialisable
export class TextObject extends BaseObject {
	static TYPE = 9;
	type = 9;

	@serialise(6, MAP.NUMBER, 0)
	ID = 0;

	@serialise(7, MAP.STRING, '')
	text = 'Write your text here';

	@serialise(8)
	textColor = "#FFF";

	@serialise(9, MAP.NUMBER, 1)
	transparancy = 1.0;

	@serialise(10)
	fontSize = 12;

	@serialise(11)
	fontName = "Arial";

	@serialise(12)
	textAlign = 'left';

	@serialise(13)
	bodyID = null;

	@serialise(14)
	texturePositionOffsetLength = null;

	@serialise(15)
	texturePositionOffsetAngle = null;

	@serialise(16)
	textureAngleOffset = null;

	@serialise(17, MAP.DEFINED, 0)
	parallax = 0.0;

	@serialise(18, MAP.DEFINED, 0)
	repeatTeleportX = 0;

	@serialise(19, MAP.DEFINED, 0)
	repeatTeleportY = 0;

	@serialise(20, MAP.BOOL, true)
	visible = true;

	lockselection = false;

	initFromArray(arr) {
		return this.fromArray(arr);

		super.initFromArray(arr);

		this.ID = arr[6];
		this.text = arr[7];
		this.textColor = arr[8];
		this.transparancy = arr[9];
		this.fontSize = arr[10];
		this.fontName = arr[11];
		this.textAlign = arr[12];
		this.bodyID = arr[13];
		this.texturePositionOffsetLength = arr[14];
		this.texturePositionOffsetAngle = arr[15];
		this.textureAngleOffset = arr[16];
		this.parallax = arr[17] !== undefined ? arr[17] : 0;
		this.repeatTeleportX = arr[18] !== undefined ? arr[18] : 0;
		this.repeatTeleportY = arr[19] !== undefined ? arr[19] : 0;
		this.visible = typeof arr[20] === "boolean" ? arr[20] : true;

		return this;
	}
}