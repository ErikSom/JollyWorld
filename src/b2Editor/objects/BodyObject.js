import { Settings } from '../../Settings';
import { BaseObject } from './BaseObject';
import { serialisable, serialise, MAP } from './../utils/serialised';

@serialisable
export class BodyObject extends BaseObject {
	static TYPE = 0;
	type = 0;
	
	@serialise(6, MAP.NUMBER, 0)
	ID = 0;

	@serialise(7)
	colorFill = "#999999";

	@serialise(8)
	colorLine = "#000";

	@serialise(9)
	transparancy = 1.0;

	@serialise(10)
	fixed = true;

	@serialise(11)
	awake = true;

	@serialise(12)
	vertices = [{x: 0,y: 0}, {x: 0,y: 0}];

	@serialise(13)
	density = 0;

	@serialise(14)
	collision = 0;

	@serialise(15)
	radius = 0;

	@serialise(16, MAP.STRING, '')
	tileTexture = '';

	@serialise(17, MAP.DEFINED, 1)
	lineWidth = 1.0;

	@serialise(18, MAP.BOOL, true)
	visible = true;

	@serialise(19, MAP.BOOL, false)
	instaKill = false;

	@serialise(20, MAP.BOOL, false)
	isVehiclePart = false;

	@serialise(21, MAP.DEFINED, () => Settings.defaultRestitution)
	restitution = Settings.defaultRestitution;

	@serialise(22, MAP.DEFINED, () => Settings.defaultFriction)
	friction = Settings.defaultFriction;

	lockselection = false;

	initFromArray(arr) {
		return this.fromArray(arr);

		//
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

}