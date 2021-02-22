import { BaseObject } from './BaseObject';

export class PrefabObject extends BaseObject {
    static TYPE = 4;

    type = 4;
    settings = {};
    prefabName = '';

    initFromArray(arr) {
        //shared vars
		this.x = arr[1];
		this.y = arr[2];
		this.rotation = arr[3] || 0;
		this.settings = arr[4];
		this.prefabName = arr[5];

        return this;
    }
}