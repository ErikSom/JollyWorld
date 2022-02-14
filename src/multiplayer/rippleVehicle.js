
import * as PIXI from 'pixi.js';
import { SyncObject } from './rippleCharacter';

export class RippleVehicle {
	constructor(container) {
		this.container = container;
		this.currentVehicle = -1;
		this.vehicle = null;
		this.vehicleClasses = [ RippleBike/*, RippleDirtBike, null,  RippleSkateboard, RippleSkippyBall, RippleFoddyCan*/]
		this.state = {
		}
	}

	selectVehicle(vehicle){
		if(this.currentVehicle !== vehicle){
			if(this.vehicle){
				this.vehicle.destroy();
			}
			this.vehicle = new this.vehicleClasses[vehicle-1](this.container);
			this.currentVehicle = vehicle;
		}
	}

	processServerData(parts, id, time){
		if(!this.vehicle || parts.length !== this.vehicle.stateProcessList.length) return;
		this.vehicle.stateProcessList.forEach((state, i) => {
			const stateData = parts[i];
			if(this.lastPackageID === -1){
				state.forcePosition(id, stateData.x, stateData.y, stateData.r, time);
			}else{
				state.updateServerPosition(id, stateData.x, stateData.y, stateData.r, time);
			}
		});
	}

	interpolatePosition(){
		if(!this.vehicle) return;

		this.vehicle.stateKeys.forEach(key => {
			this.vehicle.state[key].interpolatePosition();
		});

		this.vehicle.spriteProcessList.forEach((sprite, i) => {
			sprite.x = this.vehicle.stateProcessList[i].x;
			sprite.y = this.vehicle.stateProcessList[i].y;
			sprite.angle = this.vehicle.stateProcessList[i].r;
		});

	}
}

export class RippleBike {
	constructor(container){
		this.sprite = container;

		this.state = {
			body: new SyncObject(),
			wheelBack: new SyncObject(),
			wheelFront: new SyncObject(),
			pedals: new SyncObject(),
		}
		this.stateKeys = Object.keys(this.state);
		this.stateProcessList = [this.state.body, this.state.wheelBack, this.state.wheelFront, this.state.pedals];

		this.buildSprite();
	}

	buildSprite(){
		this.sprites = {
			body: new PIXI.Sprite(PIXI.Texture.from('Bicycle_Body0000')),
			wheelBack: new PIXI.Sprite(PIXI.Texture.from('Bicycle_WheelBack0000')),
			wheelFront: new PIXI.Sprite(PIXI.Texture.from('Bicycle_WheelFront0000')),
			pedals: new PIXI.Sprite(PIXI.Texture.from('Bicycle_Pedals0000')),
		}

		for(let obj in this.sprites){
			this.sprites[obj].anchor.set(0.5, 0.5);
		}

		const injectIndex = 3;

		this.sprite.addChildAt(this.sprites.body, injectIndex);
		this.sprite.addChildAt(this.sprites.wheelBack, injectIndex);
		this.sprite.addChildAt(this.sprites.wheelFront, injectIndex);
		this.sprite.addChildAt(this.sprites.pedals, injectIndex);

		this.spriteProcessList = [this.sprites.body, this.sprites.wheelBack, this.sprites.wheelFront, this.sprites.pedals];
	}

	destroy(){
		this.spriteProcessList.forEach(sprite => sprite.destroy());
	}
}
