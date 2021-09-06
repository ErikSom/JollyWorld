import Hat from './hat'
import {
	game
} from "../../Game";
import * as PIXI from 'pixi.js';
import { Settings } from '../../Settings';
import * as AudioManager from '../../utils/AudioManager';
import * as TutorialManager from '../../utils/TutorialManager';
import { b2AddVec2, b2CloneVec2, b2LinearStiffness, b2SubVec2 } from '../../../libs/debugdraw';

const { getPointer, NULL } = Box2D;

const ANIMATION_TRAVEL_SPEED = 4000 / Settings.PTM;

const vec1 = new Box2D.b2Vec2();
const vec2 = new Box2D.b2Vec2();
const vec3 = new Box2D.b2Vec2();
const copyVec1 = new Box2D.b2Vec2();

export class RopeHat extends Hat {
	constructor(character, head, body) {
		super(character, head, body);
		this.texture = 'RopeHelmet0000';
		this.hatOffsetLength = 45;
		this.hatOffsetAngle = Math.PI/2;
		this.minRopeLength = 7;

		this.ropeFired = false;
		this.showAnimation = false;
		this.ropeAttached = false;
		this.ropeGoingOut = false;
		this.targetAnimationPoint = null;
		this.currentAnimationPoint = null;
		this.ropeActive = false;
		this.pulleyJoint = null;
		this.pulleyFrameJoint = null;
		this.frameJoint = null;
		this.bendRopeLength = 0;
		this.ropePoints = [];
		this.bendPoint = null;
		this.bendSpeed = null;
		this.bendBody = null;
		this.tilingSprites = [];
		this.isRopeHat = true;
		this.touchedBodies = [];
		this.endRope = null;
		this.attach();
	}
	attach(){
		TutorialManager.showTutorial(TutorialManager.TUTORIALS.ROPEHELMET);
		super.attach();
	}
	activate() {
		if (this.ropeFired){
			this.detachRope();
			return;
		}

		if(!this.anchorTexture){
			this.ropeFired = true;
			const rayStart = this.head.GetPosition();
			const angle = this.head.GetAngle() - Math.PI / 2;
			const rayEnd = vec1;
			const length = 100;
			rayEnd.set_x(rayStart.get_x() + length * Math.cos(angle));
			rayEnd.set_y(rayStart.get_y() + length * Math.sin(angle));
			let callback = Object.assign(new Box2D.JSRayCastCallback(), {
				ReportFixture: function (fixture_p, point_p, normal_p, fraction) {

					const fixture = Box2D.wrapPointer(fixture_p, Box2D.b2Fixture);
					const point = Box2D.wrapPointer(point_p, Box2D.b2Vec2);
					const normal = Box2D.wrapPointer(normal_p, Box2D.b2Vec2);

					if(fixture.IsSensor()) return -1;
					if(fixture.GetBody().mainCharacter) return -1;

					this.m_hit = true;
					this.m_point = b2CloneVec2(point);
					this.m_normal = normal;
					this.m_fixture = fixture;
					return fraction;
				},
				m_hit: false
			});
			this.head.GetWorld().RayCast(callback, rayStart, rayEnd);


			this.anchorTexture = new self.PIXI.heaven.Sprite(PIXI.Texture.from("RopePartAndHook0000"));
			this.anchorTexture.pivot.set(this.anchorTexture.width/2, this.anchorTexture.height / 2);
			this.hatBody.myTexture.parent.addChildAt(this.anchorTexture, this.hatBody.myTexture.parent.getChildIndex(this.hatBody.myTexture));
			this.anchorTexture.rotation = angle;

			this.ropeGoingOut = true;

			if (callback.m_hit) {
				this.targetAnimationPoint = b2CloneVec2(callback.m_point);
				this.attachRope(callback.m_point, callback.m_fixture.GetBody());
				this.ropeAttached = true;

			} else {
				this.ropeFired = false;
				this.targetAnimationPoint = b2CloneVec2(rayEnd);
				this.ropeAttached = false;
			}
			this.currentAnimationPoint = this.getGunStartPosition();
			this.showAnimation = true;
			AudioManager.playSFX('rope-out', 0.2, 1.0 + 0.4 * Math.random()-0.2, this.hatBody.GetPosition());

		}
	}
	detachRope() {
		if(!this.ropeFired) return;

		this.ropeFired = false;
		this.blockControls = false;
		this.ropeAttached = false;
		this.releaseRope();
		this.clearTilingRope();
		this.ropePoints = [];

		this.showAnimation = true;
		this.ropeGoingOut = false;
		AudioManager.playSFX('rope-in', 0.2, 1.0 + 0.4 * Math.random()-0.2, this.hatBody.GetPosition());

		// make sure we dont lose momentum when attached bodies go out of the screen
		this.touchedBodies.forEach(body=> delete body.ignorePhysicsCuller);
		this.touchedBodies.length = 0;


		if(this.character.attachedToVehicle){
			const frame = this.character.mainPrefabClass.lookupObject['frame'];
			if(frame){
				if(this.character.mainPrefabClass.vehicleName === 'FoddyCan'){
					frame.SetFixedRotation(true);
				}
			}
		}
	}

	attachRope(point, body, precise) {

		this.ropeActive = true;
		this.blockControls = true;

		const bd = new Box2D.b2BodyDef();
		bd.set_type(Box2D.b2_dynamicBody);
		bd.set_angularDamping(0.85);
		bd.set_linearDamping(0.85);

		const farthestPoint = precise ? point : this.findFarthestPointFromBody(0.3, point, body);


		if (farthestPoint === null) return;

		const diff = b2CloneVec2(this.head.GetPosition());
		b2SubVec2(diff, farthestPoint);
		const angle = Math.atan2(diff.y, diff.x) - 90 * game.editor.DEG2RAD;

		bd.get_position().Set(farthestPoint.x, farthestPoint.y);
		bd.set_angle(angle);

		this.ropeEnd = game.editor.CreateBody(bd);
		Box2D.destroy(bd);

		this.ropeEnd.ignorePhysicsCuller = true;

		body.ignorePhysicsCuller = true;
		this.touchedBodies.push(body);

		game.editor.setBodyCollision(this.ropeEnd, 7);
		this.ropeEnd.key = this.head.mySprite.data.prefabInstanceName
		this.ropeEnd.SetBullet(true);

		this.ropeEnd.contactListener = new Box2D.JSContactListener();
		this.ropeEnd.contactListener.BeginContact = ()=>{};
		this.ropeEnd.contactListener.EndContact = ()=>{};
		this.ropeEnd.contactListener.PreSolve = contact => {
			contact.SetEnabled(false);
			if (this.bendBody || !this.revoluteJoint || Math.abs(this.revoluteJoint.GetJointSpeed())<0.01) return;
			const bodyA = contact.GetFixtureA().GetBody();
			const bodyB = contact.GetFixtureB().GetBody();
			const targetBody = bodyA === this.ropeEnd ? bodyB : bodyA;
			const targetFixture = bodyA === this.ropeEnd ? contact.GetFixtureB() : contact.GetFixtureA();
			if (targetBody.GetType() !== Box2D.b2_staticBody) return;
			if (!(targetFixture.GetFilterData().get_maskBits() & game.editor.MASKBIT_CHARACTER)) return;
			const worldManifold = new Box2D.b2WorldManifold();
			contact.GetWorldManifold(worldManifold);
			const worldCollisionPoint = worldManifold.get_points(0);
			this.bendPoint = worldCollisionPoint;
			this.bendBody = targetBody;
			this.bendSpeed = this.revoluteJoint.GetJointSpeed();
		}

		//build fixtures
		this.updateRopeFixture();

		const revoluteJointDef = new Box2D.b2RevoluteJointDef();
		revoluteJointDef.Initialize(body, this.ropeEnd, farthestPoint);
		revoluteJointDef.set_collideConnected(true);

		this.revoluteJoint = Box2D.castObject(game.editor.CreateJoint(revoluteJointDef), Box2D.b2RevoluteJoint);
		Box2D.destroy(revoluteJointDef);

		this.setDistanceJointEnabled(true);

		let prismaticJointDef = new Box2D.b2PrismaticJointDef();
		const axis = new Box2D.b2Vec2(Math.cos(this.head.GetAngle() + 90 * game.editor.DEG2RAD), Math.sin(this.head.GetAngle() + 90 * game.editor.DEG2RAD));
		prismaticJointDef.Initialize(this.head, this.ropeEnd, farthestPoint, axis);
		prismaticJointDef.set_maxMotorForce(20000);
		prismaticJointDef.set_enableMotor(false);
		this.pulleyJoint = Box2D.castObject(game.editor.CreateJoint(prismaticJointDef), Box2D.b2PrismaticJoint);
		Box2D.destroy(prismaticJointDef);

		if(this.character.attachedToVehicle){
			const frame = this.character.mainPrefabClass.lookupObject['frame'];
			if(frame){
				prismaticJointDef = new Box2D.b2PrismaticJointDef();
				prismaticJointDef.Initialize(frame, this.ropeEnd, farthestPoint, axis);
				prismaticJointDef.set_maxMotorForce(20000);
				prismaticJointDef.set_enableMotor(false);
				this.pulleyFrameJoint = Box2D.castObject(game.editor.CreateJoint(prismaticJointDef), Box2D.b2PrismaticJoint);


				if(this.character.mainPrefabClass.vehicleName === 'FoddyCan'){
					frame.SetFixedRotation(false);
				}

			}
		}
	}

	setDistanceJointEnabled(enabled){
		if(this.ropeHeadJoint){
			game.editor.DestroyJoint(this.ropeHeadJoint);
		}
		if(this.frameJoint){
			game.editor.DestroyJoint(this.frameJoint);
		}
		if(enabled){
			if(this.character.attachedToVehicle){
				const frame = this.character.mainPrefabClass.lookupObject['frame'];
				if(frame){
					let ropeJointDef = new Box2D.b2DistanceJointDef();
					ropeJointDef.Initialize(frame, this.ropeEnd, frame.GetPosition(), this.ropeEnd.GetPosition());

					const length = ropeJointDef.get_length();
					ropeJointDef.set_minLength(length);
					ropeJointDef.set_maxLength(length);

					ropeJointDef.set_stiffness(0);
					ropeJointDef.set_damping(0);

					this.frameJoint = Box2D.castObject(game.editor.CreateJoint(ropeJointDef), Box2D.b2DistanceJoint);
					Box2D.destroy(ropeJointDef);

				}
			}else{
				let distanceJointDef = new Box2D.b2DistanceJointDef();
				distanceJointDef.Initialize(this.head, this.ropeEnd, this.head.GetPosition(), this.ropeEnd.GetPosition());
				b2LinearStiffness(distanceJointDef, 60, 10, this.head, this.ropeEnd);

				this.ropeHeadJoint = Box2D.castObject(game.editor.CreateJoint(distanceJointDef), Box2D.b2DistanceJoint);
				Box2D.destroy(distanceJointDef);
			}
		}
	}

	releaseRope() {
		if (this.ropeEnd) {
			game.editor.DestroyBody(this.ropeEnd);

			if(this.pulleyJoint) game.editor.DestroyJoint(this.pulleyJoint);
			if(this.pulleyFrameJoint) game.editor.DestroyJoint(this.pulleyFrameJoint);
			this.revoluteJoint = this.pulleyJoint = this.pulleyFrameJoint = null;
			this.ropeActive = false
			this.bendBody = this.bendPoint = null;
			this.ropeEnd = null;
		}
	}
	bendRope(point, body) {
		const diff = vec1;
		diff.Set(this.head.GetPosition().x, this.head.GetPosition().y);
		b2SubVec2(diff, point);

		let angle = Math.atan2(diff.y, diff.x);
		if(this.bendSpeed > 0){
			angle -=  45 * game.editor.DEG2RAD;
		}else{
			angle +=  45 * game.editor.DEG2RAD;
		}

		body.ignorePhysicsCuller = true;
		this.touchedBodies.push(body);

		const offsetPoint = copyVec1;
		offsetPoint.Set(point.x, point.y);
		const offsetLength = 0.5;
		const offset = vec2;
		offset.Set(offsetLength*Math.cos(angle), offsetLength*Math.sin(angle));
		b2AddVec2(offsetPoint, offset);

		const bendPos = vec3;
		bendPos.Set(this.ropeEnd.GetPosition().x, this.ropeEnd.GetPosition().y);
		b2SubVec2(bendPos, offsetPoint).Length();
		const bendLength = bendPos.Length();

		this.bendRopeLength += bendLength;

		this.ropePoints.push({
			point: b2CloneVec2(this.ropeEnd.GetPosition()),
			body: this.revoluteJoint.GetBodyA(),
			speed: this.revoluteJoint.GetJointSpeed(),
			bendLength
		});

		this.releaseRope();

		this.attachRope(offsetPoint, body, true);
		this.oldDir = 0;

	}
	unBendRope() {
		const bendData = this.ropePoints.pop();
		this.bendRopeLength -= bendData.bendLength;

		this.releaseRope();
		this.attachRope(bendData.point, bendData.body, true);
		this.oldDir = 0;
	}
	findFarthestPointFromBody(radius, point, body) {
		const steps = 16;
		const rotChunk = (Math.PI * 2) / steps;

		const callback = Object.assign(new Box2D.JSRayCastCallback(), {
			ReportFixture: function (fixture_p, point_p, normal_p, fraction) {

				const fixture = Box2D.wrapPointer(fixture_p, Box2D.b2Fixture);
				const point = Box2D.wrapPointer(point_p, Box2D.b2Vec2);
				const normal = Box2D.wrapPointer(normal_p, Box2D.b2Vec2);
				if (fixture.GetBody() !== body) return -1;
				this.m_hit = true;
				this.m_point = point;
				this.m_normal = normal;
				this.m_fixture = fixture;
				this.m_fraction = fraction;
			},
			m_hit: false
		});

		let maxLength = 0;
		let farthestPoint = null;

		const dir = vec1;
		dir.Set(this.head.GetPosition().x, this.head.GetPosition().y);
		b2SubVec2(dir, point);
		dir.Normalize();

		for (let i = 0; i < steps; i++) {
			const rot = rotChunk * i;
			const x = radius * Math.cos(rot);
			const y = radius * Math.sin(rot);
			const rayStart = vec2;
			rayStart.Set(point.x + x, point.y + y);
			const radiusEdge = radius*1.1;
			const rayEnd = vec3;
			rayEnd.Set(point.x - dir.x * radiusEdge, point.y - dir.y * radiusEdge);

			this.head.GetWorld().RayCast(callback, rayStart, rayEnd);
			if (callback.m_fraction > maxLength) {
				maxLength = callback.m_fraction;
				farthestPoint = b2CloneVec2(rayStart);
			}
		}
		return farthestPoint;
	}
	clearTilingRope(){
		if(this.tilingSprites.length){
			this.tilingSprites.forEach(tileSprite=>tileSprite.parent.removeChild(tileSprite));
			this.tilingSprites.length = 0;
		}
	}

	getGunStartPosition(){
		const gunStartPosition = b2CloneVec2(this.head.GetPosition());
		const gunAngle = this.hatBody.GetAngle()+90*game.editor.DEG2RAD;
		const gunlength = 3.5;
		gunStartPosition.set_x(gunStartPosition.get_x() - gunlength * Math.cos(gunAngle));
		gunStartPosition.set_y(gunStartPosition.get_y() - gunlength * Math.sin(gunAngle));
		return gunStartPosition;
	}

	updateRopeFixture() {
		if(!this.ropeEnd || this.ropeEnd.destroyed) return;

		this.clearTilingRope();

		const tilingPoints = [];
		this.ropePoints.forEach(rope=>tilingPoints.push(rope.point));
		tilingPoints.push(b2CloneVec2(this.ropeEnd.GetPosition()));

		tilingPoints.push(this.getGunStartPosition());

		for(let i = 1; i<tilingPoints.length; i++){
			const point = tilingPoints[i];
			const previousPoint = tilingPoints[i-1];
			const diff = vec1;
			diff.Set(point.x, point.y);
			b2SubVec2(diff, previousPoint);

			const tilingSprite = new PIXI.TilingSprite(
				PIXI.Texture.from("rope.png"),
				4,
				diff.Length()*game.editor.PTM,
			);
			tilingSprite.x = point.x*game.editor.PTM;
			tilingSprite.y = point.y*game.editor.PTM;

			const angle = Math.atan2(diff.y, diff.x);
			tilingSprite.rotation = angle + 90 * game.editor.DEG2RAD;

			if(i === 1){
				this.anchorTexture.x = previousPoint.x*game.editor.PTM;
				this.anchorTexture.y = previousPoint.y*game.editor.PTM;
				this.anchorTexture.rotation = angle+Math.PI;
			}

			this.anchorTexture.parent.addChildAt(tilingSprite, this.anchorTexture.parent.getChildIndex(this.anchorTexture));
			this.tilingSprites.push(tilingSprite);

		}

		const fixturesToDestroy = [];
		for (let fixture = this.ropeEnd.GetFixtureList(); getPointer(fixture) !== getPointer(NULL); fixture = fixture.GetNext()) {
			fixturesToDestroy.push(fixture);
		}
		fixturesToDestroy.forEach(fixture => this.ropeEnd.DestroyFixture(fixture));

		const ropeDiss = vec1;
		ropeDiss.Set(this.head.GetPosition().x, this.head.GetPosition().y);
		b2SubVec2(ropeDiss, this.ropeEnd.GetPosition());
		const ropeLength = ropeDiss.Length();

		// rope collider
		let fixDef = new Box2D.b2FixtureDef();
		fixDef.set_density(100);
		let shape = new Box2D.b2CircleShape();
		shape.set_m_radius(0.1);

		fixDef.set_shape(shape);

		fixDef.set_isSensor(true);
		this.ropeEnd.CreateFixture(fixDef);
		Box2D.destroy(shape);
		Box2D.destroy(fixDef);

		fixDef = new Box2D.b2FixtureDef();
		fixDef.set_density(0.1);

		const thickness = 0.05;

		const b2Vec2Arr = [];
		b2Vec2Arr.push({x:-thickness, y:0});
		b2Vec2Arr.push({x:thickness, y:0});
		b2Vec2Arr.push({x:0, y:ropeLength});

		shape = new Box2D.b2PolygonShape();
		shape.Set(Box2D.pointsToVec2Array(b2Vec2Arr)[0], b2Vec2Arr.length);
		fixDef.set_shape(shape);
		this.ropeEnd.CreateFixture(fixDef);

		Box2D.destroy(shape);
		Box2D.destroy(fixDef);
	}

	clearRope(){
		if(this.anchorTexture && this.anchorTexture.parent){
			this.anchorTexture.parent.removeChild(this.anchorTexture);
			this.clearTilingRope();
		}
	}

	showRopeAnimation(){
		this.clearTilingRope();

		if(!this.anchorTexture.parent) return;

		const point = this.currentAnimationPoint;
		const previousPoint = this.ropeGoingOut ? this.targetAnimationPoint : this.getGunStartPosition();
		const diff = vec1;
		diff.Set(point.x, point.y);
		b2SubVec2(diff, previousPoint);
		const dir = vec2;
		dir.Set(diff.x, diff.y);
		dir.Normalize();
		const angle = Math.atan2(diff.y, diff.x);

		this.currentAnimationPoint.set_x(this.currentAnimationPoint.get_x() - dir.x * ANIMATION_TRAVEL_SPEED * game.editor.deltaTimeSeconds);
		this.currentAnimationPoint.set_y(this.currentAnimationPoint.get_y() - dir.y * ANIMATION_TRAVEL_SPEED * game.editor.deltaTimeSeconds);

		this.anchorTexture.x = point.x*game.editor.PTM;
		this.anchorTexture.y = point.y*game.editor.PTM;
		if(!this.ropeGoingOut){
			this.anchorTexture.rotation = angle;
		}

		const ropeDiff = vec3;
		ropeDiff.Set(this.currentAnimationPoint.x, this.currentAnimationPoint.y);
		b2SubVec2(ropeDiff, this.getGunStartPosition())

		const ropeAngle = Math.atan2(ropeDiff.y, ropeDiff.x);

		const tilingSprite = new PIXI.TilingSprite(
			PIXI.Texture.from("rope.png"),
			4,
			ropeDiff.Length()*game.editor.PTM,
		);

		tilingSprite.x = point.x*game.editor.PTM;
		tilingSprite.y = point.y*game.editor.PTM;

		tilingSprite.rotation = ropeAngle + 90 * game.editor.DEG2RAD;
		this.anchorTexture.parent.addChildAt(tilingSprite, this.anchorTexture.parent.getChildIndex(this.anchorTexture));

		this.tilingSprites.push(tilingSprite);


		const endDiff = vec1;
		endDiff.Set(point.x, point.y);
		b2SubVec2(endDiff, previousPoint);

		if(endDiff.Length()<= ANIMATION_TRAVEL_SPEED * game.editor.deltaTimeSeconds * 1.5){
			if(this.ropeGoingOut && !this.ropeAttached){
				// ?
				AudioManager.playSFX('rope-in', 0.2, 1.0 + 0.4 * Math.random()-0.2, this.hatBody.GetPosition());
			}else{
				this.showAnimation = false;

				if(!this.ropeAttached){
					this.clearRope();
					this.anchorTexture = null;
					AudioManager.playSFX('rope-helmet', 0.2, 1.0 + 0.4 * Math.random()-0.2, this.hatBody.GetPosition());
				}else{
					AudioManager.playSFX('rope-ground', 0.3, 1.0 + 0.4 * Math.random()-0.2, this.hatBody.GetPosition());
				}

			}
			this.ropeGoingOut = false;
		}
	}

	lean(dir) {
		if (!this.revoluteJoint) return;

		const angle = this.body.GetAngle();

		let baseForce = this.character.attachedToVehicle ? 100 : 20;

		const force = baseForce * dir;
		const xForce = force * Math.cos(angle);
		const yForce = force * Math.sin(angle);

		const forceVec = vec1;
		forceVec.Set(xForce, yForce);

		this.body.ApplyForce(forceVec, this.body.GetPosition(), true);
	}
	accelerate(dir) {
		if (!this.pulleyJoint) return;

		const ropeDiss = vec1;
		ropeDiss.Set(this.ropeEnd.GetPosition().x, this.ropeEnd.GetPosition().y);
		b2SubVec2(ropeDiss, this.hatBody.GetPosition());
		const ropeLength = ropeDiss.Length();
		// stop pulling when we are below min length
		if(dir<0 && ropeLength<this.minRopeLength){
			dir = 0;
		}

		if(this.oldDir == dir) return;
		if(dir === 0){
			this.pulleyJoint.EnableMotor(false);
			if(this.pulleyFrameJoint) this.pulleyFrameJoint.EnableMotor(false);
			this.setDistanceJointEnabled(true);
			this.oldDir = dir;
			return;
		}
		this.setDistanceJointEnabled(false);

		const speed = 5;
		this.pulleyJoint.EnableMotor(true);
		this.pulleyJoint.SetMotorSpeed(speed*-dir);
		if(this.pulleyFrameJoint){
			this.pulleyFrameJoint.EnableMotor(true);
			this.pulleyFrameJoint.SetMotorSpeed(speed*-dir);
		}
		this.oldDir = dir;
	}
	flip(){
		this.detachRope();
		super.flip();
	}

	detach(){
		super.detach();
		this.detachRope();
		this.clearRope();
	}

	detachFromVehicle(){
		if(this.frameJoint)	game.editor.DestroyJoint(this.frameJoint);
		if(this.pulleyFrameJoint) game.editor.DestroyJoint(this.pulleyFrameJoint);
		this.frameJoint = this.pulleyFrameJoint = null;
		if(this.ropeFired) this.setDistanceJointEnabled(true);
	}

	update() {
		if(this.showAnimation){
			this.showRopeAnimation();
		}

		if (this.ropeActive) {
			if(!this.showAnimation){
				this.updateRopeFixture();
			}
			if (this.bendBody) {
				this.bendRope(this.bendPoint, this.bendBody);
			}
			// detect unbend
			if (this.ropePoints.length > 0) {
				const lastPoint = this.ropePoints[this.ropePoints.length - 1];
				const savedSpeed = lastPoint.speed;
				const currentSpeed = this.revoluteJoint.GetJointSpeed();

				const x2 = lastPoint.point.x;
				const y2 = lastPoint.point.y;
				const x1 = this.ropeEnd.GetPosition().x;
				const y1 = this.ropeEnd.GetPosition().y;
				const x = this.head.GetPosition().x;
				const y = this.head.GetPosition().y;

				if (currentSpeed < 0 && savedSpeed > 0) {
					if (((x2 - x1) * (y - y1) - (y2 - y1) * (x - x1)) > 0) {
						this.unBendRope();
					}
				} else if (currentSpeed > 0 && savedSpeed < 0) {
					if (((x2 - x1) * (y - y1) - (y2 - y1) * (x - x1)) < 0) {
						this.unBendRope();
					}
				}
			}
		}
	}
}
