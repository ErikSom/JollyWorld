import { Settings } from './../../Settings';
import { serialisable, serialise, MAP } from './../utils/serialised';

@serialisable
export class EditorSettingsObject {
	static TYPE = 10;
	type = 10;

	@serialise(1)
	gravityX = 0;

	@serialise(2)
	gravityY = 10;

	@serialise(3, MAP.DEFINED, 0xD4D4D4)
	backgroundColor = 0xD4D4D4;

	@serialise(4, MAP.DEFINED, () => Settings.defaultCameraZoom)
	cameraZoom = Settings.defaultCameraZoom;
	
	showPlayerHistory = false;
	showCameraLines = true;

	physicsDebug = (window.location.search.indexOf('physicsDebug=true')>=0);
	stats = (window.location.search.indexOf('stats=true')>=0);

	initFromArray(arr) {
		return this.fromArray(arr);

		this.gravityX = arr[1];
		this.gravityY = arr[2];
		this.backgroundColor = arr[3] || 0xD4D4D4;
		this.cameraZoom = arr[4] !== undefined ? arr[4] : Settings.defaultCameraZoom;

		return this;
	}
}