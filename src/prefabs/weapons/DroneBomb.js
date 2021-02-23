import * as PrefabManager from '../PrefabManager';
import * as Box2D from '../../../libs/Box2D';
import {PIDController} from '../misc/PIDController'
import { Settings } from '../../Settings';
import { normalizePI } from '../../b2Editor/utils/extramath';
import * as emitterManager from '../../utils/EmitterManager';
import { Explosive } from './Explosive';
import * as AudioManager from '../../utils/AudioManager';

import {
    game
} from "../../Game";

const SIDE_RIGHT = 0;
const SIDE_LEFT = 1;

class DroneBomb extends Explosive {
    constructor(target) {
		super(target);
		this.isDrone = true;

		this.throttleController = new PIDController(2, 0, 1);
		this.horizontalThrottle = new PIDController(2, 0, 1);

		this.rayCastCallback = function () {
			this.m_hit = false;
		};
		const self = this;
		this.rayCastCallback.prototype.ReportFixture = function (fixture, point, normal, fraction) {
			if(fixture.GetBody() === self.body) return -1;
			this.m_fixture = fixture;
			this.m_hit = true;
			return fraction;
		}
		this.rayCallback = new this.rayCastCallback();

    }
    init(){
        super.init();
		this.body = this.lookupObject['body'];

		this.droneTexture = this.body.myTexture.children[1];
		this.lightTexture = this.body.myTexture.children[0];

		this.explodeTarget = this.body;

		let fixture = this.body.GetFixtureList();
		this.sides = [];

		this.emitterLeft = emitterManager.getLoopingEmitter("sparksMetal", this.body, this.body.GetPosition(), 0);
		this.emitterRight = emitterManager.getLoopingEmitter("sparksMetal", this.body, this.body.GetPosition(), 0);
		this.emitterLeft.emit = false;
		this.emitterRight.emit = false;

		while(fixture){
			if (fixture.GetShape() instanceof Box2D.b2CircleShape) {
				fixture.SetSensor(true);
				this.sides.push(fixture);
			}
			fixture = fixture.GetNext();
		}
		this.body.SetAngularDamping(0.8);
		this.body.SetLinearDamping(0.1);

		this.blinkTimer = -0.01;
		this.blinkDelay = 0;
		this.blink = false;

		this.chaseTarget = null;
		this.chaseScoutTimer = 0;
		this.chaseScoutDelay = 100;
		this.lookRange = this.prefabObject.settings.lookRange;
		this.lookRangeVec = new Box2D.b2Vec2(this.lookRange, this.lookRange)
		this.startPosition = this.body.GetPosition().Clone();
		this.wayPoint = null;
	}

	explode(){
		if(this.exploded) return;

		super.explode();

		const pos = this.body.GetPosition();
		emitterManager.playOnceEmitter("explosion_layer1", this.explodeTarget, pos, 0);
		emitterManager.playOnceEmitter("explosion_layer2", this.explodeTarget, pos, 0);
		AudioManager.playSFX('drone-explosion', 0.3, 1.0 + 0.4 * Math.random()-0.2, pos);

		this.destroy();
	}

	update(){
		super.update();

		if(this.destroyed) return;

		const forceMultiplier = 100 / this.prefabObject.settings.flySpeed;
		const maxForce = 100 / forceMultiplier;

		const gravityNormal = game.world.GetGravity().Clone().SelfNormalize();

		const targetPosition = this.chaseTarget ? this.chaseTarget.GetPosition().Clone() : (this.wayPoint ? this.wayPoint.Clone() : this.startPosition.Clone());
		targetPosition.SelfAdd(gravityNormal.Clone().SelfMul(-8.0 * forceMultiplier));

		const targetDistance = targetPosition.SelfSub(this.body.GetPosition()).SelfSub(this.body.GetLinearVelocity());

		this.throttleController.setError(targetDistance.Dot(gravityNormal));
		this.throttleController.step( 1 / Settings.physicsTimeStep );
		let targetThrottle = Box2D.b2Clamp(this.throttleController.getOutput() / forceMultiplier, -maxForce, maxForce);

		const gravityAngle = Math.atan2(game.world.GetGravity().y, game.world.GetGravity().x);
		const forceDirection = normalizePI(gravityAngle -Math.PI);
		const forceNormal = new Box2D.b2Vec2(Math.cos(forceDirection), Math.sin(forceDirection));
		const facingGravity = gravityNormal.Dot(forceNormal);
		const almostFlipped = 0;

		if(facingGravity<almostFlipped){
			targetThrottle *= -1;
		}

		const force = new Box2D.b2Vec2();
		force.x = targetThrottle * Math.cos(forceDirection);
		force.y = targetThrottle * Math.sin(forceDirection);

		const quadNormal = new Box2D.b2Vec2(Math.cos(this.body.GetAngle()), Math.sin(this.body.GetAngle()));

		this.horizontalThrottle.setError(targetDistance.Dot(quadNormal));
		this.horizontalThrottle.step( 1 / Settings.physicsTimeStep );
		let targetHorizontalForce = Box2D.b2Clamp(this.horizontalThrottle.getOutput() / forceMultiplier, -maxForce, maxForce);

		const horizontalForce = new Box2D.b2Vec2();
		horizontalForce.x = targetHorizontalForce * Math.cos(this.body.GetAngle());
		horizontalForce.y = targetHorizontalForce * Math.sin(this.body.GetAngle());

		this.body.ApplyForce(horizontalForce, this.body.GetPosition(), true);

		this.body.ApplyForce(force, this.body.GetPosition(), true);

		this.positionEmitters();
		this.emitterLeft.update(game.editor.deltaTime * 0.001);
		this.emitterRight.update(game.editor.deltaTime * 0.001);

		if(this.active){
			if (PrefabManager.timerReady(this.blinkTimer, this.blinkDelay, true)) {
				if(!this.blink) this.droneTexture.texture = PIXI.Texture.from(this.droneTexture.texture.textureCacheIds[0].replace("_off", "_on"));
				else{
					this.droneTexture.texture = PIXI.Texture.from(this.droneTexture.texture.textureCacheIds[0].replace("_on", "_off"));
					AudioManager.playSFX('drone-beep', 0.1, 1.0, this.body.GetPosition());
				}
				this.blink = !this.blink;
				this.blinkDelay = (this.explodeDelay-this.explodeTimer) * 0.1;
				this.blinkTimer = 0;
			}
			this.blinkTimer += game.editor.deltaTime;
		}

		if (PrefabManager.timerReady(this.chaseScoutTimer, this.chaseScoutDelay, true)) {

			const lowerBound = this.body.GetPosition().Clone().SelfSub(this.lookRangeVec);
			const upperBound = this.body.GetPosition().Clone().SelfAdd(this.lookRangeVec);
	
			const bodies = game.editor.queryWorldForBodies(lowerBound, upperBound);


			let found = false;
			this.lightTexture.tint = 0xFFFFFF;
			for(let i = 0; i<bodies.length; i++){
				const body = bodies[i];
				this.rayCallback.m_hit = false;
				this.rayCallback.m_fixture = null;
				if(this.prefabObject.settings.chase === DroneBomb.chaseTypes.mainCharacter && body.mainCharacter){

					game.world.RayCast(this.rayCallback, this.body.GetPosition(), body.GetPosition());
					if (this.rayCallback.m_hit){
						const hitFixture = this.rayCallback.m_fixture.GetBody();
						if(hitFixture.mySprite && body.mySprite && hitFixture.mySprite.data.prefabInstanceName === body.mySprite.data.prefabInstanceName){
							this.chaseTarget = body;
							found = true;
						}
					}
					break;

				}else if(this.prefabObject.settings.chase === DroneBomb.chaseTypes.anyCharacter && body.isHumanoid){

					game.world.RayCast(this.rayCallback, this.body.GetPosition(), body.GetPosition());
					if (this.rayCallback.m_hit){
						const hitFixture = this.rayCallback.m_fixture.GetBody();
						if(hitFixture.mySprite && body.mySprite && hitFixture.mySprite.data.prefabInstanceName === body.mySprite.data.prefabInstanceName){
							this.chaseTarget = body;
							found = true;
						}
					}
					break;
				}
			}
			if(found){
				this.lightTexture.tint = 0xFF0000;
			}
			if(!found && this.chaseTarget){
				this.chaseTarget = null;
				this.startPosition = this.body.GetPosition().Clone();
			}

			this.chaseScoutTimer = 0;
		}
		if(this.prefabObject.settings.chase != DroneBomb.chaseTypes.none){
			this.chaseScoutTimer += game.editor.deltaTime;
		}
		
	}

	positionEmitters(){
		const correctedPos = this.body.GetPosition().Clone();
		const correctLengthOffset = 0.5;
		const correctionAngle = this.body.GetAngle()-Settings.pihalve;
		correctedPos.x += correctLengthOffset * Math.cos(correctionAngle);
		correctedPos.y += correctLengthOffset * Math.sin(correctionAngle);

		let pos = correctedPos.Clone();
        const lengthOffset = 2.1;
        let angle = this.body.GetAngle()+Math.PI;
        pos.x += lengthOffset * Math.cos(angle);
		pos.y += lengthOffset * Math.sin(angle);

        this.emitterLeft.spawnPos.set(pos.x * Settings.PTM, pos.y * Settings.PTM);
		let emitterAngleOffset = (this.emitterLeft.maxStartRotation - this.emitterLeft.minStartRotation) / 2;

        this.emitterLeft.minStartRotation = - emitterAngleOffset;
        this.emitterLeft.maxStartRotation = + emitterAngleOffset;
		this.emitterLeft.rotation = angle * game.editor.RAD2DEG;

		angle = this.body.GetAngle();
		pos.Copy(correctedPos);
		pos.x += lengthOffset * Math.cos(angle);
		pos.y += lengthOffset * Math.sin(angle);

        this.emitterRight.spawnPos.set(pos.x * Settings.PTM, pos.y * Settings.PTM);
        emitterAngleOffset = (this.emitterRight.maxStartRotation - this.emitterRight.minStartRotation) / 2;
        this.emitterRight.minStartRotation = - emitterAngleOffset;
        this.emitterRight.maxStartRotation = + emitterAngleOffset;
        this.emitterRight.rotation = angle * game.editor.RAD2DEG;
	}
	destroy(){
		emitterManager.destroyEmitter(this.emitterLeft);
		emitterManager.destroyEmitter(this.emitterRight);
        delete this.emitterLeft;
        delete this.emitterRight;
        super.destroy();
	}

	initContactListener() {
        super.initContactListener();
        var self = this;
        this.contactListener.BeginContact = function (contact) {
			const sideFixture = self.sides.includes(contact.GetFixtureA()) ? contact.GetFixtureA() : (self.sides.includes(contact.GetFixtureB()) ? contact.GetFixtureB() : null);


			if(sideFixture && !self.destroyed){

				const otherFixture = sideFixture === contact.GetFixtureA() ? contact.GetFixtureB() : contact.GetFixtureA();
				if(otherFixture.IsSensor()) return;

				const isFlesh = otherFixture.GetBody().isFlesh;
				const pushForce = 300;
				const angleVector = new Box2D.b2Vec2(Math.cos(self.body.GetAngle()), Math.sin(self.body.GetAngle()));

				if(sideFixture === self.sides[SIDE_RIGHT]){
					const pos = new Box2D.b2Vec2().Copy(self.emitterRight.spawnPos).SelfMul(1/game.editor.PTM);
					if(isFlesh){
						emitterManager.playOnceEmitter("blood", self.body, pos, self.emitterRight.rotation);
						game.editor.addDecalToBody(otherFixture.GetBody(), pos, "Decal.png", true, 1.0);
					}else self.emitterRight.playOnce();

					self.body.ApplyForce(angleVector.Clone().SelfMul(-pushForce/4), pos, true);
					self.body.ApplyForce(angleVector.Clone().SelfMul(-pushForce), self.body.GetPosition(), true);

					AudioManager.playSFX('drone-wall', 0.3, 1.0 + 0.4 * Math.random()-0.2, self.body.GetPosition());

				} else if(sideFixture === self.sides[SIDE_LEFT]){
					const pos = new Box2D.b2Vec2().Copy(self.emitterLeft.spawnPos).SelfMul(1/Settings.PTM);
					if(isFlesh){
						emitterManager.playOnceEmitter("blood", self.body, pos, self.emitterLeft.rotation);
						game.editor.addDecalToBody(otherFixture.GetBody(), pos, "Decal.png", true, 1.0);
					}else self.emitterLeft.playOnce();

					self.body.ApplyForce(angleVector.Clone().SelfMul(pushForce/4), pos, true);
					self.body.ApplyForce(angleVector.Clone().SelfMul(pushForce), self.body.GetPosition(), true);

					AudioManager.playSFX('drone-wall', 0.3, 1.0 + 0.4 * Math.random()-0.2, self.body.GetPosition());
				}

				if(self.activateOn == Explosive.activateOnTypes.mainCharacter){
					if(otherFixture.GetBody().mainCharacter){
						self.set('active', true);
					}
				}else if(self.activateOn == Explosive.activateOnTypes.anyCharacter){
					if(otherFixture.GetBody().isHumanoid){
						self.set('active', true);
					}
				}
			}
        }
        this.contactListener.EndContact = function (contact) {
		}
	}
}


DroneBomb.chaseTypes = {
	none:"None",
	mainCharacter:"Main Character",
	anyCharacter:"Any Character"
}
DroneBomb.settings = Object.assign({}, Explosive.settings, {
	"chase": "None",
	"lookRange": 20,
	"flySpeed": 100,
});
DroneBomb.settingsOptions = Object.assign({}, Explosive.settingsOptions, {
	"chase":Object.values(DroneBomb.chaseTypes),
	"lookRange": {
        min: 5,
        max: 100,
        step: 1
	},
	"flySpeed": {
        min: 50,
        max: 500,
        step: 1
	},
});


PrefabManager.prefabLibrary.DroneBomb = {
    json: JSON.stringify({"objects":[[0,0.01,-0.051,0,"dronebomb","body",0,["#999999","#999999","#999999","#999999"],["#000","#000","#000","#000"],[0,1,1,1,1],false,true,[[{"x":-2.1,"y":0.16},{"x":-2.1,"y":-0.476},{"x":2.096,"y":-0.476},{"x":2.096,"y":0.16}],[{"x":-0.845,"y":1.536},{"x":-0.845,"y":0.098},{"x":0.801,"y":0.098},{"x":0.801,"y":1.536}],[{"x":-2.199,"y":-0.33},{"x":-2.199,"y":-0.33}],[{"x":2.222,"y":-0.33},{"x":2.222,"y":-0.33}]],[0.3,0.3,0.1,0.1],0,[0,0,6.651,6.651],"",[1,1,1,1],true,false,false,[0.5,0.5,0.5,0.5],[0.2,0.2,0.2,0.2]],[7,-0.292,1.533,0,"","",1,["[1,-0.432,-13.525,0,\"\",\"\",1,\"HommingDrone_Light0000\",null,null,null,null,false,\"#FFFFFF\",1,1,1,0,0,0,true]","[1,0.432,13.525,0,\"dronebomb\",\"texture\",2,\"HommingBomb_Drone_off0000\",null,null,null,null,false,\"#FFFFFF\",1,1,1,0,0,0,true]"],0,3.12,-1.759,0,1,0,0,0,true]]}),
    class: DroneBomb,
    library: PrefabManager.LIBRARY_WEAPON
}
