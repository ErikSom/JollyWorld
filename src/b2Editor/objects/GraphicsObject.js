import { BaseObject } from './BaseObject';

export class GraphicsObject extends BaseObject {
	static TYPE = 6;
	type = 6;

	colorFill = "#999999";
	colorLine = "#000";
	transparancy = 1.0;
	radius = 0;
	vertices = [{x: 0, y: 0}, { x: 0, y: 0}];
	bodyID = null;
	texturePositionOffsetLength = null;
	texturePositionOffsetAngle = null;
	textureAngleOffset = null;
	tileTexture = "";
	lockselection = false;
	lineWidth = 1.0;
	parallax = 0.0;
	repeatTeleportX = 0;
	repeatTeleportY = 0;
	gradientId = 0;
	gradient = '';
	visible = true;

	initFromArray(arr) {
		this.ID = arr[6];
		this.colorFill = arr[7];
		this.colorLine = arr[8];
		this.transparancy = arr[9];
		this.radius = arr[10];
		this.vertices = arr[11];
		this.bodyID = arr[12];
		this.texturePositionOffsetLength = arr[13];
		this.texturePositionOffsetAngle = arr[14];
		this.textureAngleOffset = arr[15];
		this.tileTexture = arr[16] || "";
		this.lineWidth = arr[17] !== undefined ? arr[17] : 1.0;
		this.parallax = arr[18] !== undefined ? arr[18] : 0;
		this.repeatTeleportX = arr[19] !== undefined ? arr[19] : 0;
		this.repeatTeleportY = arr[20] !== undefined ? arr[20] : 0;

		this.gradientId = arr[21];
		// context not free field
		// this.gradient = arr[21] !== undefined ? (this.levelGradientsNames[arr[21]] || '') : '';
		
		this.visible = typeof arr[22] === "boolean" ? arr[22] : true;

		return this;
	}
}