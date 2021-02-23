import { BaseObject } from './BaseObject';
import { serialisable, serialise, MAP } from './../utils/serialised';

@serialisable
export class TriggerObject extends BaseObject {
	static TYPE = 8;
	type = 8;
	
	@serialise(6)
	vertices = [{ x: 0, y: 0 }, { x: 0, y: 0 }];

	@serialise(7)
	radius = 0;

	@serialise(8, MAP.BOOL, true)
	enabled = true;

	@serialise(9)
	targetType = 0;
	
	@serialise(10)
	repeatType = 0;
	
	@serialise(11)
	triggerObjects = [];
	
	@serialise(12)
	triggerActions = [];
	
	@serialise(13, MAP.BOOL, false)
	followPlayer = false;

	@serialise(14, MAP.ARRAY, [])
	worldActions = [];
	
	@serialise(15, MAP.NUMBER, 32)
	triggerKey = 32;

	@serialise(16, MAP.BOOL, false)
	followFirstTarget = false;
	
	@serialise(17, MAP.NUMBER, 0)
	delay = 0; 
	
	@serialise(18, MAP.NUMBER, 0)
	repeatDelay = 0; 

	lockselection = false;
	
	initFromArray(arr) {
		return this.fromArray(arr);

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
		this.delay = typeof arr[17] === "number" ? arr[17] : 0; 
		this.repeatDelay = typeof arr[18] === "number" ? arr[18] : 0; 

		return this;
	}
}