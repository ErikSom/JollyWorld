import { Settings } from './../../Settings';

export class EditorSettingsObject {
	static TYPE = 10;
	type = 10;

	physicsDebug = (window.location.search.indexOf('physicsDebug=true')>=0);
	gravityX = 0;
	gravityY = 10;
	showPlayerHistory = false;
	showCameraLines = true;
	backgroundColor = 0xD4D4D4;
	cameraZoom = Settings.defaultCameraZoom;

	initFromArray(arr) {
		this.gravityX = arr[1];
		this.gravityY = arr[2];
		this.backgroundColor = arr[3] || 0xD4D4D4;
		this.cameraZoom = arr[4] !== undefined ? arr[4] : Settings.defaultCameraZoom;

		return this;
	}
}