import {BaseObject} from './BaseObject';

export class TextureObject extends BaseObject {
	static TYPE = 1;
	type = 1;

	//
	textureName = null;
	bodyID = null;
	texturePositionOffsetLength = null;
	texturePositionOffsetAngle = null;
	textureAngleOffset = null;
	isCarvable = false;
	tint = '#FFFFFF';
	transparancy = 1.0;
	lockselection = false;
	parallax = 0.0;
	repeatTeleportX = 0;
	repeatTeleportY = 0;
	visible = true;

	initFromArray (arr) {
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