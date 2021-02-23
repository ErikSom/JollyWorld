import { BaseObject } from './BaseObject';

export class MultiObject extends BaseObject {
	static TYPE = 5;
	type = 5;

	lockselection = false;

	initFromArray(arr) {
		return this;
	}
}