import { serialisable, serialise, MAP } from './../utils/serialised';

@serialisable
export class BaseObject {
	type = -1;

	@serialise(1, MAP.NUMBER, null)
	x = null;

	@serialise(2, MAP.NUMBER, null)
	y = null;

	@serialise(3, MAP.NUMBER, 0)
	rotation = 0;

	@serialise(4, MAP.STRING, '')
	groups = '';

	@serialise(5, MAP.STRING, '')
	refName = '';

	ID = 0;

	// mixin from decorator
	fromArray(arr) {
		return this;
	}

	// mixin from decorator
	toArray() {
		return []
	}

	initFromArray(arr) {
		//shared vars
		this.x = arr[1];
		this.y = arr[2];
		this.rotation = arr[3] || 0;
		this.groups = arr[4];
		this.refName = arr[5];

		return this;
	}
}