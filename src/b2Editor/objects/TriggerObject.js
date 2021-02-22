import { BaseObject } from './BaseObject';

export class TriggerObject extends BaseObject {
	static TYPE = 8;
	type = 8;
	//
	vertices = [{ x: 0, y: 0 }, { x: 0, y: 0 }];
	radius = 0;
	enabled = true;
	targetType = 0;
	repeatType = 0;
	triggerObjects = [];
	triggerActions = [];
	followPlayer = false;
	worldActions = [];
	triggerKey = 32;
	followFirstTarget = false;
	lockselection = false;

	initFromArray(arr) {
		super.initFromArray(arr);

		this.vertices = arr[6];
		this.radius = arr[7];
		this.enabled = typeof arr[8] === "boolean" ? arr[8] : true;
		this.targetType = arr[9];
		this.repeatType = arr[10];
		this.triggerObjects = arr[11];
		this.triggerActions = arr[12];
		this.followPlayer = typeof arr[13] === "boolean" ? arr[13] : false;
		this.worldActions = arr[14] || [];
		this.triggerKey = arr[15] || 32;
		this.followFirstTarget = typeof arr[16] === "boolean" ? arr[16] : false;

		return this;
	}
}