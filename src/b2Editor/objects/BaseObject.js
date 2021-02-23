export class BaseObject {
	type = -1;

	x = null;
	y = null;
	rotation = 0;

	ID = 0;
	groups = '';
	refName = '';

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