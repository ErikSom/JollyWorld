export class TextureObject {
	static type = 1;

	type = 1;
	x = null;
	y = null;
	scaleX = 1.0;
	scaleY = 1.0;
	rotation = 0;
	groups = "";
	refName = "";
	//
	ID = 0;
	textureName = null;
	bodyID = null;
	texturePositionOffsetLength = null;
	texturePositionOffsetAngle = null;
	textureAngleOffset = null;
	isCarvable = false;
	tint = '#FFFFFF';
	transparancy = 1.0;
	lockselection = false;
	parallax = 0.0;
	repeatTeleportX = 0;
	repeatTeleportY = 0;
	visible = true;

	/**
	 * @param {Array<any>} arr 
	 */
	static fromFlat(arr) {
		const obj = new TextureObject();

		obj.ID = arr[6];
		obj.textureName = arr[7];
		obj.bodyID = arr[8];
		obj.texturePositionOffsetLength = arr[9];
		obj.texturePositionOffsetAngle = arr[10];
		obj.textureAngleOffset = arr[11];
		obj.isCarvable = arr[12];
		obj.tint = arr[13] !== undefined ? arr[13] : "#FFFFFF";
		obj.scaleX = arr[14] || 1;
		obj.scaleY = arr[15] || 1;
		obj.transparancy = arr[16] !== undefined ? arr[16] : 1;
		obj.parallax = arr[17] !== undefined ? arr[17] : 0;
		obj.repeatTeleportX = arr[18] !== undefined ? arr[18] : 0;
		obj.repeatTeleportY = arr[19] !== undefined ? arr[19] : 0;
		obj.visible = typeof arr[20] === "boolean" ? arr[20] : true;

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