
import * as PIXI from 'pixi.js';
import { Settings } from '../Settings';
import { SyncObject } from './rippleCharacter';

export class RippleVehicle {
	constructor(container) {
		this.container = container;
		this.currentVehicle = -1;
		this.vehicle = null;
		this.mirror = false;
		this.vehicleClasses = [ RippleBike, RippleDirtBike, null,  RippleSkateboard, RippleSkippyBall, RippleFoddyCan]
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

		if(this.vehicle.customUpdate){
			this.vehicle.customUpdate();
		}

		this.vehicle.spriteProcessList?.forEach((sprite, i) => {
			const state = this.vehicle.stateProcessList[i];
			sprite.x = state.x;
			sprite.y = state.y;
			sprite.angle = state.r;
			sprite.scale.x = state.mirror ? -1 : 1;
			sprite.visible = !(state.serverPos.x === Settings.destroyedPosition && state.serverPos.y === Settings.destroyedPosition && state.serverPos.r === 360);
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

class RippleSkippyBall {
	constructor(container){
		this.sprite = container;

		this.state = {
			base: new SyncObject(),
			p1: new SyncObject(),
			p2: new SyncObject(),
			p3: new SyncObject(),
			p4: new SyncObject(),
			p5: new SyncObject(),
			p6: new SyncObject(),
			p7: new SyncObject(),
			p8: new SyncObject(),
			p9: new SyncObject(),
			p10: new SyncObject(),
			p11: new SyncObject(),
			p12: new SyncObject(),
		}
		this.stateKeys = Object.keys(this.state);
		this.stateProcessList = [this.state.base, this.state.p1, this.state.p2, this.state.p3, this.state.p4, this.state.p5, this.state.p6, this.state.p7, this.state.p8, this.state.p9, this.state.p10, this.state.p11, this.state.p12];

		this.buildMesh();
	}

	destroy(){
		if(this.containerSprite){
			this.containerSprite.destroy();
			this.containerSprite = null;
		}
	}

	buildMesh(){

		this.containerSprite = new PIXI.Container();

		const t = PIXI.Texture.from('YogaBall0000')
		this.mesh = new PIXI.SimpleMesh(t, ...this.getMeshData());
		this.mesh.isMesh = true;

		const injectIndex = 3;
		this.containerSprite.addChild(this.mesh);

		this.sprite.addChildAt(this.containerSprite, injectIndex);

		this.handleFront = new PIXI.Sprite(PIXI.Texture.from('YogaBall_Handle_Front0000'));
		this.handleBack = new PIXI.Sprite(PIXI.Texture.from('YogaBallHandle_Back0000'));

		this.containerSprite.addChild(this.handleFront);
		this.containerSprite.addChildAt(this.handleBack, 0);
	}

	updateMesh(){
		const [vertices, uvs] = this.getMeshData();

		this.mesh.verticesBuffer.update(vertices);
		this.mesh.uvBuffer.update(uvs);
	}

	updateHandles(){
		this.handleFront.position.x = -20;
		this.handleBack.position.x = -6.5;
		const baseYOffset = this.wobbafett || 34;

		const dx = this.state.p1.x - this.state.base.x;
		const dy = this.state.p1.y - this.state.base.y;
		const l = Math.sqrt(dx * dx + dy * dy);
		const y = -l - baseYOffset;

		this.handleFront.position.y = y;
		this.handleBack.position.y = y;
	}


	getMeshData(){
		const radiusAr = [];
		const vertices = [0,0];
		const indices = [];

		const steps = 12;
		const step = 360 / steps;


		const rInc = 16;
		for(let i = 0; i < steps; i++) {


			const targetBodyIndex = (i + (this.offsetIndex || 3)) % steps + 1;

			const p = this.state[`p${targetBodyIndex}`];

			const dx = this.state.base.x - p.x;
			const dy = this.state.base.y - p.y;
			const l = Math.sqrt(dx * dx + dy * dy);
			radiusAr.push(l);

			const r = radiusAr[i] + rInc;
			vertices.push( Math.cos(Math.PI * i * step / 180)*r, Math.sin(Math.PI * i * step / 180)*r);
			indices.push(0, i + 1, i);
		}

		indices.push(0, 1, steps);


		const uvs = vertices.map((e, i) => {
			let r;
			if(i <= 1){
				r = 75;
			}else{
				const vindex = Math.floor((i-2) / 2);
				r = radiusAr[vindex] + rInc;
			}
			return 0.5 + e / r / 2;
		});

		return [vertices, uvs, indices]
	}

	customUpdate()	{
		this.containerSprite.x = this.state.base.x;
		this.containerSprite.y = this.state.base.y;
		this.containerSprite.angle = this.state.base.r;
		this.containerSprite.visible = !(this.state.base.serverPos.x === Settings.destroyedPosition && this.state.base.serverPos.y === Settings.destroyedPosition && this.state.base.serverPos.r === 360);

		this.updateMesh();
		this.updateHandles();
	}
}

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
