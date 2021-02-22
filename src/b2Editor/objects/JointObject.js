import { BaseObject } from './BaseObject';

export class JointObject extends BaseObject {
	static TYPE = 2;
	type = 2;

	bodyA_ID = -1;
	bodyB_ID = -1;
	jointType = 0;
	collideConnected = false;
	enableMotor = false;
	maxMotorTorque = 1.0;
	motorSpeed = 10.0;
	enableLimit = false;
	upperAngle = 0.0;
	lowerAngle = 0.0;
	dampingRatio = 0.0;
	frequencyHz = 0.0;
	upperLimit = 0.0;
	lowerLimit = 0.0;
	lockselection = false;
	autoReferenceAngle = true;

	initFromArray(arr) {
		super.initFromArray(arr);

		this.ID = arr[6];
		this.bodyA_ID = arr[7];
		this.bodyB_ID = arr[8];
		this.jointType = arr[9];
		this.collideConnected = arr[10];
		this.enableMotor = arr[11];
		this.maxMotorTorque = arr[12];
		this.motorSpeed = arr[13];
		this.enableLimit = arr[14];
		this.upperAngle = arr[15];
		this.lowerAngle = arr[16];
		this.dampingRatio = arr[17];
		this.frequencyHz = arr[18];
		this.upperLimit = arr[19] !== undefined ? arr[19] : this.upperLimit;
		this.lowerLimit = arr[20] !== undefined ? arr[20] : this.lowerLimit;
		this.autoReferenceAngle = arr[21] !== undefined ? arr[21] : false;

		return this;
	}

	static fromFlat(arr) {
		return new JointObject().initFromArray(arr);
	}
}