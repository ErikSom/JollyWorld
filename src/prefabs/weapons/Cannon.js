import * as PrefabManager from '../PrefabManager'
import * as PrefabBuilder from '../../utils/PrefabBuilder'
import * as EffectsComposer from '../../utils/EffectsComposer';
import * as emitterManager from '../../utils/EmitterManager';
import * as AudioManager from '../../utils/AudioManager';

import { drawCircle } from '../../b2Editor/utils/drawing';

import {
    game
} from "../../Game";
import { Settings } from '../../Settings';

class Cannon extends PrefabManager.basePrefab {
    constructor(target) {
		super(target);
		this.isCannon = true;
		this.flipped = false;
    }
    init() {
		this.loaded = true;
		this.reloadTime = this.prefabObject.settings.reloadTime*1000;
		this.reloadTimer = 0;
		this.shootDelay = this.prefabObject.settings.shootDelay*1000;
		this.shootTimer = 0;
		this.shootForce = this.prefabObject.settings.shootForce*3;
		this.cannonBody = this.lookupObject["barrol"];
		this.cannonBody.isCannon = true;
		this.autoShoot = this.prefabObject.settings.autoShoot;
		this.shouldShoot = false;

		this.emitter = emitterManager.getLoopingEmitter("cannonShoot", this.cannonBody, this.cannonBody.GetPosition(), 0);
		this.emitter.emit = false;
		this.positionCannonEmitter();

		if(this.prefabObject.settings.isFixed){
            this.cannonBody.SetType(Box2D.b2_staticBody);
        }else{
            this.cannonBody.SetType(Box2D.b2_dynamicBody);
		}
		this.lastCannonBalls = [];

		this.reload();
		super.init();
	}

	set(property, value) {
		super.set(property, value);
        switch (property) {
            case 'isFlipped':
                this.flip(value);
                break;
        }
    }

	flip(flipped){
		if(this.flipped != flipped){
			this.flipped = flipped;
			game.editor.mirrorPrefab(this, 'barrol');
		}
	}
	update() {
		if(this.destroyed) return;
		super.update();

		if(this.lookupObject.barrol.InCameraView){
			if(!this.loaded){
				if (PrefabManager.timerReady(this.reloadTimer, this.reloadTime, true)) {
					this.reload();
				}
				this.reloadTimer += game.editor.deltaTime;
			}else if(this.autoShoot || this.shouldShoot){
				if (PrefabManager.timerReady(this.shootTimer, this.shootDelay, true)) {
					this.shoot();
				}
				this.shootTimer += game.editor.deltaTime;
			}
		}
		this.positionCannonEmitter();
		this.emitter.update(game.editor.deltaTime * 0.001);
	}
	setShouldShoot() {
		this.shouldShoot = true;
	}

	getShootingPosition(){
		const pos = this.cannonBody.GetPosition().Clone();
		const angle = this.cannonBody.GetAngle() + (this.flipped ? Math.PI : 0);
		const offsetLength = 5.0;
		const angleOffset = Math.PI;
		pos.x -= offsetLength*Math.cos(angle+angleOffset);
		pos.y -= offsetLength*Math.sin(angle+angleOffset);
		return pos;
	}
	positionCannonEmitter(){
        const pos = this.getShootingPosition();
        this.emitter.spawnPos.set(pos.x * Settings.PTM, pos.y * Settings.PTM);
    }


	shoot() {

		const pos = this.getShootingPosition();

		const pixiPoint = game.editor.getPIXIPointFromWorldPoint(pos);
		// game.levelCamera.matrix.apply(pixiPoint,pixiPoint);
		// drawCircle(pixiPoint, 10);

		EffectsComposer.addEffect(EffectsComposer.effectTypes.shockWave, {radius:75, point:pixiPoint});
        EffectsComposer.addEffect(EffectsComposer.effectTypes.screenShake, {amplitude:this.shootForce/600, point:pixiPoint});

		const angle = this.cannonBody.GetAngle() + (this.flipped ? Math.PI : 0);
		const prefabData = PrefabBuilder.generatePrefab(pos, angle*game.editor.RAD2DEG, 'CannonBall', true);

		const { lookupObject } = prefabData;
		const body = lookupObject._bodies[0];

		AudioManager.playSFX('cannon', 0.2, 1.0 + 0.4 * Math.random()-0.2, body.GetPosition());

		const impulse = new Box2D.b2Vec2(this.shootForce*Math.cos(angle), this.shootForce*Math.sin(angle));
		body.ApplyForce(impulse, body.GetPosition());


		this.lastCannonBalls.push(prefabData.prefabClass);
		if(this.lastCannonBalls.length>Settings.maxBullets){
			this.lastCannonBalls.shift().destroy();
		}

        this.emitter.playOnce();

		this.cannonBody.ApplyForce(impulse.SelfMul(-0.1), pos, true);


		this.reloadTimer = 0;
		this.loaded = false;
		this.shouldShoot = false;
	}
	reload() {
		this.shootTimer = 0;
		this.loaded = true;
	}
	destroy(){
		if(this.destroyed) return;
        emitterManager.destroyEmitter(this.emitter);
        delete this.emitter;
        super.destroy();
    }
}

Cannon.settings = Object.assign({}, Cannon.settings, {
	"isFixed": false,
	"isFlipped": false,
    "reloadTime": 2,
    "shootDelay": 1,
	"shootForce": 2000,
	"autoShoot": false,
});
Cannon.settingsOptions = Object.assign({}, Cannon.settingsOptions, {
	"isFixed": false,
	"isFlipped": false,
    "reloadTime": {
        min: 0.5,
        max: 10.0,
        step: 0.1
	},
	"shootDelay": {
        min: 0.5,
        max: 10.0,
        step: 0.1
	},
	"shootForce": {
        min: 2000.0,
        max: 10000.0,
        step: 1.0
	},
	"autoShoot":false
});

PrefabManager.prefabLibrary.Cannon = {
    json: '{"objects":[[0,0.479,-1.297,0,"cannon","barrol",0,["#999999","#999999"],["#000","#000"],[0,1,1],false,true,[[{"x":-1.545,"y":0},{"x":-1.545,"y":0}],[[{"x":-1.526,"y":-1.475},{"x":4.606,"y":-0.737},{"x":4.625,"y":0.737},{"x":-1.526,"y":1.475}]]],[1,0.1],0,[45.728,0],"",[1,1],true,false,false,[0.5,0.5],[0.2,0.2]],[1,41.58,-39.154,0,"","",1,"Cannon0000",0,27.218,0.009,0,false,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.965,0.094,0,"cannon","wheel",2,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],0,[52.337],"",[1],true,false,false,[0.5],[0.2]],[1,-28.957,2.821,0,"","",3,"WoodWheel0000",2,0,0,0,false,"#FFFFFF",1,1,1,0,0,0,true],[2,-29.835,2.55,0,"cannon","wheel_joint",4,2,0,0,false,false,1,10,false,0,0,0,0,0,0],[0,0.553,1.17,0,"cannon","extrawheel",5,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],5,[20.737],"",[1],true,false,false,[0.5],[0.2]],[2,15.223,34.77,0,"cannon","extrawheel_joint",6,0,5,0,false,false,1,10,false,0,0,0,0,0,0]]}',
    class: Cannon,
    library: PrefabManager.LIBRARY_WEAPON,
}
