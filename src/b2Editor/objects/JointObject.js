import { BaseObject } from './BaseObject';
import { serialisable, serialise, MAP } from './../utils/serialised';

@serialisable
export class JointObject extends BaseObject {
	static TYPE = 2;
	type = 2;

	@serialise(6)
	ID = 0;

	@serialise(7)
	bodyA_ID = void 0;

	@serialise(8)
	bodyB_ID = void 0;

	@serialise(9)
	jointType = 0;

	@serialise(10)
	collideConnected = false;

	@serialise(11)
	enableMotor = false;

	@serialise(12)
	maxMotorTorque = 1.0;

	@serialise(13)
	motorSpeed = 10.0;

	@serialise(14)
	enableLimit = false;

	@serialise(15)
	upperAngle = 0.0;

	@serialise(16)
	lowerAngle = 0.0;

	@serialise(17)
	dampingRatio = 0.0;

	@serialise(18)
	frequencyHz = 0.0;

	@serialise(19, MAP.DEFINED, 0)
	upperLimit = 0.0;

	@serialise(20, MAP.DEFINED, 0)
	lowerLimit = 0.0;

	@serialise(21, MAP.DEFINED, false)
	autoReferenceAngle = true;

	lockselection = false;

	initFromArray(arr) {
		return this.fromArray(arr);

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
}