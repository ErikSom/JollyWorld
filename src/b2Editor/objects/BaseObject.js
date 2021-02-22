export class BaseObject {
	type = -1;

	x = - Infinity;
	y = - Infinity;
	type = -1;
	ID = 0;
	rotation = 0;
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