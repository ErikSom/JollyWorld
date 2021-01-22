import * as PrefabManager from '../PrefabManager';
import * as Box2D from '../../../libs/Box2D';
import {PIDController} from '../misc/PIDController'
import { Settings } from '../../Settings';
import { normalizePI } from '../../b2Editor/utils/extramath';
import * as emitterManager from '../../utils/EmitterManager';

import {
    game
} from "../../Game";

const SIDE_RIGHT = 0;
const SIDE_LEFT = 1;

class DroneBomb extends PrefabManager.basePrefab {
    constructor(target) {
		super(target);


		this.throttleController = new PIDController(2, 0, 1);
		this.horizontalThrottle = new PIDController(2, 0, 1);


		console.log(this.throttleController);
    }
    init(){
        super.init();
		this.body = this.lookupObject['body'];

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

	}
	update(){

		const maxForce = 100;

		const gravityNormal = game.world.GetGravity().Clone().SelfNormalize();
		const targetPosition = game.editor.mousePosWorld.Clone().SelfAdd(gravityNormal.Clone().SelfMul(-8.0));

		const targetDistance = targetPosition.SelfSub(this.body.GetPosition()).SelfSub(this.body.GetLinearVelocity());

		this.throttleController.setError(targetDistance.Dot(gravityNormal));
		this.throttleController.step( 1 / Settings.physicsTimeStep );
		let targetThrottle = Box2D.b2Clamp(this.throttleController.getOutput(), -maxForce, maxForce);

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
		let targetHorizontalForce = Box2D.b2Clamp(this.horizontalThrottle.getOutput(), -maxForce, maxForce);

		const horizontalForce = new Box2D.b2Vec2();
		horizontalForce.x = targetHorizontalForce * Math.cos(this.body.GetAngle());
		horizontalForce.y = targetHorizontalForce * Math.sin(this.body.GetAngle());

		this.body.ApplyForce(horizontalForce, this.body.GetPosition(), true);

		this.body.ApplyForce(force, this.body.GetPosition(), true);

		this.positionEmitters();
		this.emitterLeft.update(game.editor.deltaTime * 0.001);
		this.emitterRight.update(game.editor.deltaTime * 0.001);
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

	initContactListener() {
        super.initContactListener();
        var self = this;
        this.contactListener.BeginContact = function (contact) {
			const sideFixture = self.sides.includes(contact.GetFixtureA()) ? contact.GetFixtureA() : (self.sides.includes(contact.GetFixtureB()) ? contact.GetFixtureB() : null);


			if(sideFixture){

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

				} else if(sideFixture === self.sides[SIDE_LEFT]){
					const pos = new Box2D.b2Vec2().Copy(self.emitterLeft.spawnPos).SelfMul(1/Settings.PTM);
					if(isFlesh){
						emitterManager.playOnceEmitter("blood", self.body, pos, self.emitterLeft.rotation);
						game.editor.addDecalToBody(otherFixture.GetBody(), pos, "Decal.png", true, 1.0);
					}else self.emitterLeft.playOnce();

					self.body.ApplyForce(angleVector.Clone().SelfMul(pushForce/4), pos, true);
					self.body.ApplyForce(angleVector.Clone().SelfMul(pushForce), self.body.GetPosition(), true);

				}
			}
        }
        this.contactListener.EndContact = function (contact) {
		}
	}
}

PrefabManager.prefabLibrary.DroneBomb = {
    json: '{"objects":[[0,0.003,-0.276,0,"dronebomb","body",0,["#999999","#999999","#999999","#999999"],["#000","#000","#000","#000"],[0,1,1,1,1],false,true,[[{"x":-2.1,"y":0.16},{"x":-2.1,"y":-0.476},{"x":2.096,"y":-0.476},{"x":2.096,"y":0.16}],[{"x":-0.845,"y":1.536},{"x":-0.845,"y":0.098},{"x":0.801,"y":0.098},{"x":0.801,"y":1.536}],[{"x":-2.199,"y":-0.33},{"x":-2.199,"y":-0.33}],[{"x":2.222,"y":-0.33},{"x":2.222,"y":-0.33}]],[0.3,0.3,0.1,0.1],0,[0,0,6.651,6.651],"",[1,1,1,1],true,false,false,[0.5,0.5,0.5,0.5],[0.2,0.2,0.2,0.2]],[1,-0.077,8.295,0,"dronebomb","texture",1,"HommingBomb_Drone_off0000",0,16.591,-1.58,0,false,"#FFFFFF",1,1,1,0,0,0,true]]}',
    class: DroneBomb,
    library: PrefabManager.LIBRARY_WEAPON
}
