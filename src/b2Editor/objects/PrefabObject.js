import { serialisable, serialise, MAP } from './../utils/serialised';

@serialisable
export class PrefabObject {
	static TYPE = 4;
	type = 4;

	@serialise(1, MAP.NUMBER, 0)
	x = 0;

	@serialise(2, MAP.NUMBER, 0)
	y = 0;

	@serialise(3, MAP.NUMBER, 0)
	rotation = 0;

	@serialise(4)
	settings = {};

	@serialise(5)
	prefabName = '';

	initFromArray(arr) {
		// mixed by decorator
		return this.fromArray(arr);

		this.x = arr[1];
		this.y = arr[2];
		this.rotation = arr[3] || 0;
		this.settings = arr[4];
		this.prefabName = arr[5];

		return this;
	}
}