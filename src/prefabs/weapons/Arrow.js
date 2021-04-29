import * as PrefabManager from '../PrefabManager'

import {
    game
} from "../../Game";
import { b2CloneVec2, b2DotVV, b2MulVec2, b2SubVec2 } from '../../../libs/debugdraw';
import { Settings } from '../../Settings';

class Arrow extends PrefabManager.basePrefab {
    constructor(target) {
		super(target);
		this.dragConstant = 0.2;
		this.lifeTime = 6000;
        this.lifeTimer = 0;
		this.isBullet = false;
    }
    init() {
		this.arrowBody = this.lookupObject['arrowBody'];

		if(game.editor.bulletBodyCount < Settings.maxTotalBullets){
			this.arrowBody.SetBullet(true);
			game.editor.bulletBodyCount++;
			this.isBullet = true;
		}


		this.arrowBody.isArrow = true;

		super.init();
		this.pointingVec = new Box2D.b2Vec2( 1, 0 );
		this.tailVec = new Box2D.b2Vec2( -1.4, 0 );
		this.sticking = false;
		this.bodyToStick = null;
		this.stickImpulse = 8.0;
		this.impactOffsetLength = 1.6;
		this.maxImpactToCollisionOffset = 2.0;
		this.setAwake(this.prefabObject.settings.awake);
	}
	set(property, value){
		switch (property) {
            case 'awake':
				this.setAwake(value);
			default:
				this.prefabObject.settings[property] = value;
				break;
        }
	}
	setAwake(bool){
        this.lookupObject._bodies.forEach(body=> body.SetAwake(bool));
    }
	update(){
		if(!this.sticking && this.arrowBody.IsAwake()){
			const pointingDirection = this.arrowBody.GetWorldVector(this.pointingVec);
			let flightDirection = b2CloneVec2(this.arrowBody.GetLinearVelocity());
			const flightSpeed = flightDirection.Normalize();

			const dot = b2DotVV( flightDirection, pointingDirection );
			Box2D.destroy(pointingDirection);

			const dragForceMagnitude = (1 - Math.abs(dot)) * flightSpeed * flightSpeed * this.dragConstant * this.arrowBody.GetMass();

			const arrowTailPosition = this.arrowBody.GetWorldPoint( this.tailVec );

			b2MulVec2(flightDirection, -dragForceMagnitude);

			this.arrowBody.ApplyForce(flightDirection , arrowTailPosition );
			Box2D.destroy(flightDirection);

			if(this.bodyToStick){
				this.arrowBody.SetBullet(false);

				let offsetPos = new Box2D.b2Vec2(0.6, 0);
				const worldCoordsAnchorPoint = this.arrowBody.GetWorldPoint( offsetPos );
				Box2D.destroy(offsetPos);

				const weldJointDef = new Box2D.b2WeldJointDef();

				this.arrowBody.SetTransform(this.worldCollisionPoint, this.impactAngle);

				weldJointDef.bodyA = this.bodyToStick;
				weldJointDef.bodyB = this.arrowBody;
				weldJointDef.bodyA.GetLocalPoint( worldCoordsAnchorPoint, weldJointDef.localAnchorA);
				weldJointDef.bodyB.GetLocalPoint( worldCoordsAnchorPoint, weldJointDef.localAnchorB);
				Box2D.destroy(worldCoordsAnchorPoint);
				weldJointDef.collideConnected = false;
				weldJointDef.referenceAngle = weldJointDef.bodyB.GetAngle()-weldJointDef.bodyA.GetAngle();
				game.world.CreateJoint(weldJointDef);

				Box2D.destroy(weldJointDef);

				for (let fixture = body.GetFixtureList(); getPointer(fixture) !== getPointer(NULL); fixture = fixture.GetNext()) {
					fixture.SetSensor(true);
				}

				this.sticking = true;

			}
		}
		if (PrefabManager.timerReady(this.lifeTimer, this.lifeTime, true)) {
            this.destroy();
        }
        this.lifeTimer += game.editor.deltaTime;
	}
	destroy(){
		if(!this.destroyed){
			if(this.worldCollisionPoint) Box2D.destroy(this.worldCollisionPoint);
			Box2D.destroy(this.pointingVec);
			Box2D.destroy(this.tailVec);

			if(this.isBullet){
				game.editor.bulletBodyCount--;
			}
		}

		super.destroy();
	}
	initContactListener() {
        super.initContactListener();
        var self = this;
        this.contactListener.BeginContact = function (contact) {
			let bodies = [contact.GetFixtureA().GetBody(), contact.GetFixtureB().GetBody()];
			if((bodies[0].isArrow || bodies[0].isCrossBow) && (bodies[1].isArrow || bodies[1].isCrossBow)){
				contact.SetEnabled(false);
				return;
			}
        }
        this.contactListener.EndContact = function (contact) {
		}
		this.contactListener.PreSolve = function(contact){
			let bodies = [contact.GetFixtureA().GetBody(), contact.GetFixtureB().GetBody()];
			if((bodies[0].isArrow || bodies[0].isCrossBow) && (bodies[1].isArrow || bodies[1].isCrossBow)){
				contact.SetEnabled(false);
				return;
			}
			self.impactAngle = self.arrowBody.GetAngle();
		}
		this.contactListener.PostSolve = function (contact, impulse) {
			if(!self.sticking){
				const bodies = [contact.GetFixtureA().GetBody(), contact.GetFixtureB().GetBody()];
				let body;
				for (let i = 0; i < bodies.length; i++) {
					body = bodies[i];
					if(body == self.arrowBody || !body.isFlesh) continue;
					if(impulse.normalImpulses[0] > self.stickImpulse && !self.bodyToStick){
						const worldManifold = new Box2D.b2WorldManifold();
						contact.GetWorldManifold(worldManifold);
						self.collisionImpulse = impulse.normalImpulses(0);
						self.bodyToStick = body;
						const offsetLength = self.impactOffsetLength - Math.min(impulse.normalImpulses[0] / 10, self.maxImpactToCollisionOffset);

						const offset = self.vec;
						offset.x = offsetLength*Math.cos(self.impactAngle);
						offset.y = offsetLength*Math.sin(self.impactAngle);

						self.worldCollisionPoint = worldManifold.points[0];
						b2SubVec2(self.worldCollisionPoint, offset);

						self.arrowBody.lockPositionForOneFrame = self.worldCollisionPoint;

						let graphics = new PIXI.Graphics();
						graphics.beginFill(0x000000);
						graphics.drawRect(0, 0, self.arrowBody.myTexture.width, self.arrowBody.myTexture.height);
						graphics.beginFill(0xFFFFFF);
						const worldOffsetLength = (offsetLength-self.impactOffsetLength)*game.editor.PTM;
						const halfHeight = self.arrowBody.myTexture.height/2;
						graphics.drawRect(0, 0, self.arrowBody.myTexture.width+worldOffsetLength-halfHeight, self.arrowBody.myTexture.height);
						graphics.drawCircle(self.arrowBody.myTexture.width+worldOffsetLength-halfHeight, halfHeight,halfHeight);

						self.arrowBody.myMaskRT = PIXI.RenderTexture.create(self.arrowBody.myTexture.width, self.arrowBody.myTexture.height, 1);
						game.app.renderer.render(graphics, self.arrowBody.myMaskRT, true);
						self.arrowBody.myMask = new PIXI.heaven.Sprite(self.arrowBody.myMaskRT);
						self.arrowBody.myMask.renderable = false;

						self.arrowBody.myTexture.addChild(self.arrowBody.myMask);

						self.arrowBody.myTexture.originalSprite.pluginName = 'batchMasked';
						self.arrowBody.myTexture.originalSprite.maskSprite = self.arrowBody.myMask;

						let damage = 30;
						if(body.mySprite.data.refName === 'head') damage = 150;
						if(body.mySprite.data.refName === 'body') damage = 100;

						const bodyClass = game.editor.retrieveSubClassFromBody(body);
						if(bodyClass && bodyClass.dealDamage){
							bodyClass.dealDamage(damage);
						}

					}
				}
			}
		}
    }
}
Arrow.settings = Object.assign({}, Arrow.settings, {
    "awake": true,
});
Arrow.settingsOptions = Object.assign({}, Arrow.settingsOptions, {
	"awake": true,
});

PrefabManager.prefabLibrary.Arrow = {
    json: '{"objects":[[0,1.059544631412833,-0.007327434648982022,0,"arrow","arrowBody",0,["#999999"],["#000"],[0],false,true,[[[{"x":-3.6805252363811514,"y":1.734723475976807e-18},{"x":1.141176985178861,"y":-0.12237822897360437},{"x":1.39817126602343,"y":0.012237822897360438},{"x":1.141176985178861,"y":0.11014040607624395}]]],[1],0,[0],"",[1]],[1,2.961862192593653,0.7029452529312912,0,"arrow","arrowTexture",1,"Arrow0000",0,28.839243423167698,-3.109590225253805,0,false,"#FFFFFF",1,1,1]]}',
    class: Arrow,
    library: PrefabManager.LIBRARY_WEAPON  ,
}
