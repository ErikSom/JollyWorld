import { BaseObject } from './BaseObject';

export class GraphicsGroupObject extends BaseObject {
	static TYPE = 7;
	type = 7;

	graphicObjects = [];
	bodyID = null;
	texturePositionOffsetLength = null;
	texturePositionOffsetAngle = null;
	textureAngleOffset = null;
	transparancy = 1;
	tileTexture = '';
	lockselection = false;
	parallax = 0.0;
	repeatTeleportX = 0;
	repeatTeleportY = 0;
	visible = true;
	mirrored = false;

	initFromArray(arr) {
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
		thisrepeatTeleportY = arr[15] !== undefined ? arr[15] : 0;
		this.visible = typeof arr[16] === "boolean" ? arr[16] : true;
		this.mirrored = typeof arr[17] === "boolean" ? arr[17] : false;

		return this;
	}
}