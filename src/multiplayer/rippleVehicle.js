
import * as PIXI from 'pixi.js';
import { SyncObject } from './rippleCharacter';

export class RippleVehicle {
	constructor(container) {
		this.container = container;
		this.currentVehicle = -1;
		this.vehicle = null;
		this.mirror = false;
		this.vehicleClasses = [ RippleBike, RippleDirtBike, null,  RippleSkateboard, null/*RippleSkippyBall*/, RippleFoddyCan]
		this.state = {
		}
	}

	selectVehicle(vehicle){
		if(this.currentVehicle !== vehicle){
			if(this.vehicle){
				this.vehicle.destroy();
			}
			if(this.vehicleClasses[vehicle-1]){
				this.vehicle = new this.vehicleClasses[vehicle-1](this.container);
			} else{
				this.vehicle = null;
			}
			this.currentVehicle = vehicle;
		}
	}

	processServerData(parts, id, mirror, time){
		if(!this.vehicle || parts.length !== this.vehicle.stateProcessList.length) return;

		const flipped = this.mirror !== mirror;
		this.mirror = mirror;

		this.vehicle.stateProcessList.forEach((state, i) => {
			const stateData = parts[i];
			if(this.lastPackageID === -1 || flipped){
				state.forcePosition(id, stateData.x, stateData.y, stateData.r, mirror, time);
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
			const state = this.vehicle.stateProcessList[i];
			sprite.x = state.x;
			sprite.y = state.y;
			sprite.angle = state.r;
			sprite.scale.x = state.mirror ? -1 : 1;
		});

	}
}

class RippleBike {
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

class RippleDirtBike {
	constructor(container){
		this.sprite = container;

		this.state = {
			body: new SyncObject(),
			wheelBack: new SyncObject(),
			wheelFront: new SyncObject(),
			frontSuspension: new SyncObject(),
			backSuspension: new SyncObject(),
		}
		this.stateKeys = Object.keys(this.state);
		this.stateProcessList = [this.state.body, this.state.wheelBack, this.state.wheelFront, this.state.frontSuspension, this.state.backSuspension];

		this.buildSprite();
	}

	buildSprite(){
		this.sprites = {
			body: new PIXI.Sprite(PIXI.Texture.from('DirtBike_Body0000')),
			wheelBack: new PIXI.Sprite(PIXI.Texture.from('DirtBike_WheelBack0000')),
			wheelFront: new PIXI.Sprite(PIXI.Texture.from('DirtBike_WheelFront0000')),
			frontSuspension: new PIXI.Sprite(PIXI.Texture.from('DirtBike_Axis0000')),
			backSuspension: new PIXI.Sprite(PIXI.Texture.from('DirtBike_WheelSupport0000')),
		}

		for(let obj in this.sprites){
			this.sprites[obj].anchor.set(0.5, 0.5);
		}

		const injectIndex = 3;

		this.sprite.addChildAt(this.sprites.body, injectIndex);
		this.sprite.addChildAt(this.sprites.frontSuspension, injectIndex);
		this.sprite.addChildAt(this.sprites.backSuspension, injectIndex);
		this.sprite.addChildAt(this.sprites.wheelBack, injectIndex);
		this.sprite.addChildAt(this.sprites.wheelFront, injectIndex);

		this.spriteProcessList = [this.sprites.body, this.sprites.wheelBack, this.sprites.wheelFront, this.sprites.frontSuspension, this.sprites.backSuspension];
	}

	destroy(){
		this.spriteProcessList.forEach(sprite => sprite.destroy());
	}
}

class RippleSkateboard {
	constructor(container){
		this.sprite = container;

		this.state = {
			body: new SyncObject(),
			wheelBack: new SyncObject(),
			wheelFront: new SyncObject(),
		}
		this.stateKeys = Object.keys(this.state);
		this.stateProcessList = [this.state.body, this.state.wheelBack, this.state.wheelFront];

		this.buildSprite();
	}

	buildSprite(){
		this.sprites = {
			body: new PIXI.Sprite(PIXI.Texture.from('SkateBoard_Board0000')),
			wheelBack: new PIXI.Sprite(PIXI.Texture.from('Skateboard_Wheel0000')),
			wheelFront: new PIXI.Sprite(PIXI.Texture.from('Skateboard_Wheel0000')),
		}

		for(let obj in this.sprites){
			this.sprites[obj].anchor.set(0.5, 0.5);
		}

		const injectIndex = 3;

		this.sprite.addChildAt(this.sprites.body, injectIndex);
		this.sprite.addChildAt(this.sprites.wheelBack, injectIndex);
		this.sprite.addChildAt(this.sprites.wheelFront, injectIndex);

		this.spriteProcessList = [this.sprites.body, this.sprites.wheelBack, this.sprites.wheelFront];
	}

	destroy(){
		this.spriteProcessList.forEach(sprite => sprite.destroy());
	}
}

// SKIPPY BALL

class RippleFoddyCan {
	constructor(container){
		this.sprite = container;

		this.state = {
			body: new SyncObject(),
			hammer: new SyncObject(),
		}
		this.stateKeys = Object.keys(this.state);
		this.stateProcessList = [this.state.body, this.state.hammer];

		this.buildSprite();
	}

	buildSprite(){
		this.sprites = {
			body: new PIXI.Sprite(PIXI.Texture.from('Pot0000')),
			hammer: new PIXI.Sprite(PIXI.Texture.from('Hammer0000')),
		}

		for(let obj in this.sprites){
			this.sprites[obj].anchor.set(0.5, 0.5);
		}

		const injectIndex = 12;

		this.sprite.addChildAt(this.sprites.hammer, injectIndex);
		this.sprite.addChildAt(this.sprites.body, injectIndex);

		this.spriteProcessList = [this.sprites.body, this.sprites.hammer];
	}

	destroy(){
		this.spriteProcessList.forEach(sprite => sprite.destroy());
	}
}
