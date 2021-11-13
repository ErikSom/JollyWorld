import {
	Container
} from "@pixi/display";
import * as PIXI from 'pixi.js';

const DEG2RAD = 0.017453292519943296;


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
		this.stateKeys = Object.keys(this.state);
		this.stateProcessList = [this.state.head, this.state.shoulderLeft, this.state.shoulderRight, this.state.armLeft, this.state.armRight, this.state.handLeft, this.state.handRight];
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

	processServerData(data, time){
		debugger;
		this.state.body.updateServerPosition(data.id, data.main[0].x, data.main[0].y, data.main[0].r, time);

		this.stateProcessList.forEach((state, i) => {
			const stateData = data.parts[i];
			state.updateServerPosition(stateData.id, stateData.x, stateData.y, stateData.r, time);
		});
	}

	interpolatePosition(){
		this.stateKeys.forEach(key => {
			this.state[key].interpolatePosition();
		});

		// correct IK

		// apply positions
		this.sprite.x = this.state.body.x;
		this.sprite.y = this.state.body.y;
		this.sprite.angle = this.state.body.r;
	}
}

const maxPreviousPosInterpolation = 5;
const lagCompensation = 100;
const syncSmooth = .4;

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
		this.targetPos = {
			x,
			y,
			r,
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
		this.targetPos = {
			x,
			y,
			r,
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




	angleDiff(sourceA, targetA) {
		const mod = (a, n) => a - Math.floor(a/n) * n;
		let a = targetA - sourceA
		return mod(a + 180, 360) - 180
	}

	interpolatePosition() {
		// use time difference for interpolation
		// no data no interpolation
		if(this.previousPos.length === 0) return;

		// get movement
		const movement = { x: 0, y: 0 }

		if(this.previousPos.length > 0){
			this.previousPos.forEach((pos, i) => {
				const nextPos = (i === this.previousPos.length -1 ) ? this.serverPos : this.previousPos[i + 1];
				movement.x += nextPos.x - pos.x;
				movement.y += nextPos.y - pos.y;
			})
			movement.x /= this.previousPos.length;
			movement.y /= this.previousPos.length;
		}

		const currentTime = Date.now() - lagCompensation;
		const targetTime = this.serverPos.time;



		const previousKnownPosition = this.previousPos[this.previousPos.length - 1];
		// const timeDiff = targetTime - previousKnownPosition.time; // 100
		// let realTimeDiff = currentTime - previousKnownPosition.time; // -200

		// const progressOnTime = realTimeDiff / timeDiff;

		// console.log("Progress on time:", progressOnTime)

		// const lastStepDiff = {x: this.serverPos.x - previousKnownPosition.x, y: this.serverPos.y - previousKnownPosition.y};

		// this.targetPos.x = previousKnownPosition.x + lastStepDiff.x * progressOnTime;
		// this.targetPos.y = previousKnownPosition.y + lastStepDiff.y * progressOnTime;


		const render_timestamp = Date.now() - (1000.0 / 20);

		const x0 = previousKnownPosition.x;
		const x1 = this.serverPos.x;
		const y0 = previousKnownPosition.y;
		const y1 = this.serverPos.y;
		const r0 = previousKnownPosition.r;
		const r1 = this.serverPos.r;
		const t0 = previousKnownPosition.time;
		const t1 = this.serverPos.time;

		this.targetPos.x =	x0 + (x1 - x0) * (render_timestamp - t0) / (t1 - t0);
		this.targetPos.y =	y0 + (y1 - y0) * (render_timestamp - t0) / (t1 - t0);
		this.targetPos.r =	(r0 + this.angleDiff(r0, r1) * (render_timestamp - t0) / (t1 - t0)) % 360;

		this.x += (this.targetPos.x - this.x) * syncSmooth;
		this.y += (this.targetPos.y - this.y) * syncSmooth;
		console.log("ANGL DIFF:", this.angleDiff(this.r, this.targetPos.r), this.r, this.targetPos.r);
		this.r += this.angleDiff(this.r, this.targetPos.r) * syncSmooth;


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
