
import * as PIXI from 'pixi.js';

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

	interpolatePosition(){
	}
}

export class RippleBike {
	constructor(container){
		this.sprite = container;
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
