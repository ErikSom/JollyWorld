import { BaseObject } from './BaseObject';
import { serialisable, serialise, MAP } from './../utils/serialised';

@serialisable
export class GraphicsObject extends BaseObject {
	static TYPE = 6;
	type = 6;

	@serialise(6)
	ID = 0;

	@serialise(7)
	colorFill = "#999999";

	@serialise(8)
	colorLine = "#000";

	@serialise(9)
	transparancy = 1.0;

	@serialise(10)
	radius = 0;

	@serialise(11)
	vertices = [{x: 0, y: 0}, { x: 0, y: 0}];

	@serialise(12)
	bodyID = null;

	@serialise(13)
	texturePositionOffsetLength = null;

	@serialise(14)
	texturePositionOffsetAngle = null;

	@serialise(15)
	textureAngleOffset = null;

	@serialise(16, MAP.STRING, '')
	tileTexture = '';

	@serialise(17, MAP.DEFINED, 1.0)
	lineWidth = 1.0;

	@serialise(18, MAP.DEFINED, 0)
	parallax = 0.0;

	@serialise(19, MAP.DEFINED, 0)
	repeatTeleportX = 0;

	@serialise(20, MAP.DEFINED, 0)
	repeatTeleportY = 0;

	@serialise(21)
	gradientId = void 0;

	@serialise(22, MAP.BOOL, true)
	visible = true;

	gradient = '';
	lockselection = false;

	initFromArray(arr) {
		return this.fromArray(arr);

		super.initFromArray(arr);

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