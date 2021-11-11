import {
	Container
} from "@pixi/display";
import * as PIXI from 'pixi.js';

export class RippleCharacter {
	constructor(id) {
		this.id = id;
		this.sprite = new Container();
		this.state = {
			body: new SyncObject(),
			head: new SyncObject(),
			shoulderLeft: new SyncObject(),
			shoulderRight: new SyncObject(),
			armLeft: new SyncObject(),
			armRight: new SyncObject(),
			handLeft: new SyncObject(),
			handRight: new SyncObject(),
		}
		this.spriteSheet = null;
	}

	loadSkin(url){
		const loader = new PIXI.Loader();
		const key = `character_${this.id}`;
		loader.add(key, url);
		loader.load((_, resources) =>{
			this.spriteSheet = new PIXI.Spritesheet(resources[key].texture, atlasData);
			this.spriteSheet.parse(()=>{
				this.buildSprite();
			})
		})
	}

	buildSprite() {
		const body = new PIXI.Sprite(this.spriteSheet.textures['Normal_Core']);
		this.sprite.addChild(body);
	}
}

const maxPreviousPosInterpolation = 5;

class SyncObject {
	constructor(x = 0, y = 0, r = 0) {
		this.x = x;
		this.y = y;
		this.r = r;
		this.previousPos = [];
		this.serverId = -1;
		this.serverTime = 0;
		this.serverPos = {
			x,
			y,
			r,
			time: -1,
		}
	}

	forcePosition(id, x, y, r) {
		this.x = x;
		this.y = y;
		this.r = r;
		this.previousPos = [];
		this.serverId = id;
		this.serverPos = {
			x,
			y,
			r
		}
	}

	updateServerPosition(id, x, y, r, time) {
		// ids go from 0 - 255, so when the id goes from 255 to 0 we still want to process it as a new id
		// consider here extrapolation
		if (id > this.serverId || this.serverId - id > 100) {
			if (this.serverPos.time > 0) {
				this.previousPos.push(this.serverPos);
				if (this.previousPos.length > maxPreviousPosInterpolation) {
					this.previousPos.shift();
				}
			}
			this.serverPos = {
				x,
				y,
				r,
				time
			}
			this.serverId = id;
			this.serverTime = time;
		}
	}

	interpolatePosition() {
		// use time difference for interpolation
	}
}


const atlasData = {
	"frames": {

		"Mouth_Idle": {
			"frame": {
				"x": 209,
				"y": 139,
				"w": 43,
				"h": 31
			},
			"rotated": false,
			"trimmed": false,
			"spriteSourceSize": {
				"x": 0,
				"y": 0,
				"w": 43,
				"h": 31
			},
			"sourceSize": {
				"w": 43,
				"h": 31
			}
		},
		"Mouth_Pain": {
			"frame": {
				"x": 2,
				"y": 114,
				"w": 43,
				"h": 31
			},
			"rotated": false,
			"trimmed": false,
			"spriteSourceSize": {
				"x": 0,
				"y": 0,
				"w": 43,
				"h": 31
			},
			"sourceSize": {
				"w": 43,
				"h": 31
			}
		},
		"Mouth_Special": {
			"frame": {
				"x": 47,
				"y": 114,
				"w": 43,
				"h": 31
			},
			"rotated": false,
			"trimmed": false,
			"spriteSourceSize": {
				"x": 0,
				"y": 0,
				"w": 43,
				"h": 31
			},
			"sourceSize": {
				"w": 43,
				"h": 31
			}
		},
		"Normal_Arm": {
			"frame": {
				"x": 170,
				"y": 101,
				"w": 37,
				"h": 58
			},
			"rotated": false,
			"trimmed": false,
			"spriteSourceSize": {
				"x": 0,
				"y": 0,
				"w": 37,
				"h": 58
			},
			"sourceSize": {
				"w": 37,
				"h": 58
			}
		},
		"Normal_Core": {
			"frame": {
				"x": 2,
				"y": 2,
				"w": 122,
				"h": 110
			},
			"rotated": false,
			"trimmed": false,
			"spriteSourceSize": {
				"x": 0,
				"y": 0,
				"w": 122,
				"h": 110
			},
			"sourceSize": {
				"w": 122,
				"h": 110
			}
		},
		"Normal_Eye": {
			"frame": {
				"x": 225,
				"y": 2,
				"w": 23,
				"h": 23
			},
			"rotated": false,
			"trimmed": false,
			"spriteSourceSize": {
				"x": 0,
				"y": 0,
				"w": 23,
				"h": 23
			},
			"sourceSize": {
				"w": 23,
				"h": 23
			}
		},
		"Normal_Eye_Closed": {
			"frame": {
				"x": 225,
				"y": 27,
				"w": 23,
				"h": 22
			},
			"rotated": false,
			"trimmed": false,
			"spriteSourceSize": {
				"x": 0,
				"y": 0,
				"w": 23,
				"h": 22
			},
			"sourceSize": {
				"w": 23,
				"h": 22
			}
		},
		"Normal_Hand": {
			"frame": {
				"x": 209,
				"y": 101,
				"w": 40,
				"h": 36
			},
			"rotated": false,
			"trimmed": false,
			"spriteSourceSize": {
				"x": 0,
				"y": 0,
				"w": 40,
				"h": 36
			},
			"sourceSize": {
				"w": 40,
				"h": 36
			}
		},
		"Normal_Head_Idle": {
			"frame": {
				"x": 126,
				"y": 2,
				"w": 97,
				"h": 97
			},
			"rotated": false,
			"trimmed": false,
			"spriteSourceSize": {
				"x": 0,
				"y": 0,
				"w": 97,
				"h": 97
			},
			"sourceSize": {
				"w": 97,
				"h": 97
			}
		},
		"Normal_Shoulder": {
			"frame": {
				"x": 126,
				"y": 101,
				"w": 42,
				"h": 71
			},
			"rotated": false,
			"trimmed": false,
			"spriteSourceSize": {
				"x": 0,
				"y": 0,
				"w": 42,
				"h": 71
			},
			"sourceSize": {
				"w": 42,
				"h": 71
			}
		}
	},
	"meta": {
		"app": "Adobe Animate",
		"version": "21.0.7.42652",
		"image": "Multiplayer_Character.png",
		"format": "RGBA8888",
		"size": {
			"w": 256,
			"h": 256
		},
		"scale": "1"
	}
}
