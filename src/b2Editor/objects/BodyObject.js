import { Settings } from '../../Settings';
import { BaseObject } from './BaseObject';

export class BodyObject extends BaseObject {
	static TYPE = 0;
	//
	colorFill = "#999999";
	colorLine = "#000";
	transparancy = 1.0;
	fixed = true;
	awake = true;
	vertices = [{x: 0,y: 0}, {x: 0,y: 0}];
	density = 1;
	collision = 0;
	radius = 0;
	tileTexture = "";
	lockselection = false;
	lineWidth = 1.0;
	visible = true;
	instaKill = false;
	isVehiclePart = false;
	restitution = Settings.defaultRestitution;
	friction = Settings.defaultFriction;

	initFromArray(arr) {
		super.initFromArray(arr);

		this.ID = arr[6];
		this.colorFill = arr[7];
		this.colorLine = arr[8];
		this.transparancy = arr[9];
		this.fixed = arr[10];
		this.awake = arr[11];
		this.vertices = arr[12];
		this.density = arr[13];
		this.collision = arr[14];
		this.radius = arr[15];
		this.tileTexture = arr[16] || "";
		this.lineWidth = arr[17] !== undefined ? arr[17] : 1.0;
		this.visible = typeof arr[18] === "boolean" ? arr[18] : true;
		this.instaKill = typeof arr[19] === "boolean" ? arr[19] : false;
		this.isVehiclePart = typeof arr[20] === "boolean" ? arr[20] : false;
		this.friction = arr[21] !== undefined ? arr[21] : Settings.defaultFriction;
		this.restitution = arr[22] !== undefined ? arr[22] : Settings.defaultRestitution;

		return this;
	}

	/**
	 * @param {Array<any>} arr 
	 */
	static fromFlat(arr) {
		return new BodyObject().initFromArray(arr);
	}
}