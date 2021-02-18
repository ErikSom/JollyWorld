import { Settings } from '../../Settings';

export class BodyObject {
	static type = 0;

	type = self.object_BODY;
	x = null;
	y = null;
	rotation = 0;
	groups = "";
	refName = "";
	//
	ID = 0;
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

	/**
	 * @param {Array<any>} arr 
	 */
	static fromFlat(arr) {
		const obj = new BodyObject();

		obj.ID = arr[6];
		obj.colorFill = arr[7];
		obj.colorLine = arr[8];
		obj.transparancy = arr[9];
		obj.fixed = arr[10];
		obj.awake = arr[11];
		obj.vertices = arr[12];
		obj.density = arr[13];
		obj.collision = arr[14];
		obj.radius = arr[15];
		obj.tileTexture = arr[16] || "";
		obj.lineWidth = arr[17] !== undefined ? arr[17] : 1.0;
		obj.visible = typeof arr[18] === "boolean" ? arr[18] : true;
		obj.instaKill = typeof arr[19] === "boolean" ? arr[19] : false;
		obj.isVehiclePart = typeof arr[20] === "boolean" ? arr[20] : false;
		obj.friction = arr[21] !== undefined ? arr[21] : Settings.defaultFriction;
		obj.restitution = arr[22] !== undefined ? arr[22] : Settings.defaultRestitution;

		//shared vars
		obj.x = arr[1];
		obj.y = arr[2];
		obj.rotation = arr[3] || 0;

		if (arr[0] != this.object_PREFAB) {
			obj.groups = arr[4];
			obj.refName = arr[5];
		}

		return obj;
	}
}