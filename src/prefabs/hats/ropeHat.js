import Hat from './hat'
import {
	game
} from "../../Game";
import * as Box2D from '../../../libs/Box2D'

export class RopeHat extends Hat {
	constructor(character, head, body) {
		super(character, head, body);
		this.texture = 'RopeHelmet0000';
		this.hatOffsetLength = 45;
		this.hatOffsetAngle = Math.PI/2;
		this.rayCastCallback = function () {
			this.m_hit = false;
		};
		this.rayCastCallback.prototype.ReportFixture = function (fixture, point, normal, fraction) {
			// if(fixture.GetBody() !== self.lookupObject['portal']) return -1;
			this.m_hit = true;
			this.m_point = point.Clone();
			this.m_normal = normal;
			this.m_fixture = fixture;
			return fraction;
		}
		this.ropeFired = false;
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
		this.attach();
	}
	activate() {
		if (this.ropeFired){
			this.detachRope();
			return;
		}

		this.ropeFired = true;
		const rayStart = this.head.GetPosition();
		const angle = this.head.GetAngle() - Math.PI / 2;
		const rayEnd = rayStart.Clone();
		const length = 100;
		rayEnd.x += length * Math.cos(angle);
		rayEnd.y += length * Math.sin(angle);
		let callback = new this.rayCastCallback();
		this.head.GetWorld().RayCast(callback, rayStart, rayEnd);
		if (callback.m_hit) {
			this.anchorTexture = new PIXI.heaven.Sprite(PIXI.Texture.fromImage("RopePartAndHook0000"));
			this.anchorTexture.pivot.set(this.anchorTexture.width/2, this.anchorTexture.height / 2);
			this.hatBody.myTexture.parent.addChildAt(this.anchorTexture, this.hatBody.myTexture.parent.getChildIndex(this.hatBody.myTexture));
			this.attachRope(callback.m_point, callback.m_fixture.GetBody());
		} else {
			this.ropeFired = false;
		}
	}
	detachRope() {
		this.ropeFired = false;
		this.releaseRope();
		this.clearTilingRope();
		this.ropePoints = [];
		if(this.anchorTexture){
			this.anchorTexture.parent.removeChild(this.anchorTexture);
		}
		this.anchorTexture = null;
	}
	attachRope(point, body, precise) {
		this.ropeActive = true;

		const bd = new Box2D.b2BodyDef();
		bd.type = Box2D.b2BodyType.b2_dynamicBody;
		bd.angularDamping = 0.85;
		bd.linearDamping = 0.85;

		const farthestPoint = precise ? point : this.findFarthestPointFromBody(0.3, point, body);
		if (farthestPoint === null) return;

		const diff = this.head.GetPosition().Clone().SelfSub(farthestPoint);
		const angle = Math.atan2(diff.y, diff.x) - 90 * game.editor.DEG2RAD;

		bd.position = farthestPoint;
		bd.angle =angle;

		this.ropeEnd = this.head.GetWorld().CreateBody(bd);
		this.ropeEnd.key = this.head.mySprite.data.prefabInstanceName
		this.ropeEnd.SetBullet(true);

		this.ropeEnd.contactListener = new Box2D.b2ContactListener();
		this.ropeEnd.contactListener.PreSolve = contact => {
			contact.SetEnabled(false);
			if (this.bendBody || !this.revoluteJoint || Math.abs(this.revoluteJoint.GetJointSpeed())<0.01) return;
			const bodyA = contact.GetFixtureA().GetBody();
			const bodyB = contact.GetFixtureB().GetBody();
			const targetBody = bodyA === this.ropeEnd ? bodyB : bodyA;
			if (targetBody.GetType() !== Box2D.b2BodyType.b2_staticBody) return;
			const worldManifold = new Box2D.b2WorldManifold();
			contact.GetWorldManifold(worldManifold);
			const worldCollisionPoint = worldManifold.points[0];
			this.bendPoint = worldCollisionPoint;
			this.bendBody = targetBody;
			this.bendSpeed = this.revoluteJoint.GetJointSpeed();
		}

		//build fixtures
		this.updateRopeFixture();

		const revoluteJointDef = new Box2D.b2RevoluteJointDef;
		revoluteJointDef.Initialize(body, this.ropeEnd, farthestPoint);
		revoluteJointDef.collideConnected = true;

		this.revoluteJoint = this.head.GetWorld().CreateJoint(revoluteJointDef);

		this.setDistanceJointEnabled(true);

		let prismaticJointDef = new Box2D.b2PrismaticJointDef();
		const axis = new Box2D.b2Vec2(Math.cos(this.head.GetAngle() + 90 * game.editor.DEG2RAD), Math.sin(this.head.GetAngle() + 90 * game.editor.DEG2RAD));
		prismaticJointDef.Initialize(this.head, this.ropeEnd, farthestPoint, axis);
		prismaticJointDef.maxMotorForce = 20000;
		prismaticJointDef.enableMotor = false;
		this.pulleyJoint = this.head.GetWorld().CreateJoint(prismaticJointDef);

		if(this.character.attachedToVehicle){
			const frame = this.character.mainPrefabClass.lookupObject['frame'];
			if(frame){
				prismaticJointDef = new Box2D.b2PrismaticJointDef();
				prismaticJointDef.Initialize(frame, this.ropeEnd, farthestPoint, axis);
				prismaticJointDef.maxMotorForce = 20000;
				prismaticJointDef.enableMotor = false;
				this.pulleyFrameJoint = frame.GetWorld().CreateJoint(prismaticJointDef);
			}
		}
	}

	setDistanceJointEnabled(enabled){
		if(this.ropeHeadJoint){
			this.head.GetWorld().DestroyJoint(this.ropeHeadJoint);
		}
		if(this.frameJoint){
			this.head.GetWorld().DestroyJoint(this.frameJoint);
		}
		if(enabled){
			let distanceJointDef = new Box2D.b2DistanceJointDef();
			distanceJointDef.Initialize(this.head, this.ropeEnd, this.head.GetPosition(), this.ropeEnd.GetPosition());
			distanceJointDef.frequencyHz = 60;
			distanceJointDef.dampingRatio = 1.0;
			this.ropeHeadJoint = this.head.GetWorld().CreateJoint(distanceJointDef);

			if(this.character.attachedToVehicle){
				const frame = this.character.mainPrefabClass.lookupObject['frame'];
				if(frame){
					let ropeJointDef = new Box2D.b2RopeJointDef();
					ropeJointDef.Initialize(frame, this.ropeEnd, frame.GetPosition(), this.ropeEnd.GetPosition());
					const xd = frame.GetPosition().x - this.ropeEnd.GetPosition().x;
					const yd = frame.GetPosition().y - this.ropeEnd.GetPosition().y;
					ropeJointDef.maxLength = Math.sqrt(xd * xd + yd * yd);

					this.frameJoint = frame.GetWorld().CreateJoint(ropeJointDef);
				}
			}
		}
	}

	releaseRope() {
		if (this.ropeEnd) {
			this.head.GetWorld().DestroyBody(this.ropeEnd);
			if(this.pulleyJoint) this.head.GetWorld().DestroyJoint(this.pulleyJoint);
			if(this.pulleyFrameJoint) this.head.GetWorld().DestroyJoint(this.pulleyFrameJoint);
			this.revoluteJoint = this.pulleyJoint = this.pulleyFrameJoint = null;
			this.ropeActive = false
			this.bendBody = this.bendPoint = null;
		}
	}
	bendRope(point, body) {
		const diff = this.head.GetPosition().Clone().SelfSub(point);
		let angle = Math.atan2(diff.y, diff.x);
		if(this.bendSpeed > 0){
			angle -=  45 * game.editor.DEG2RAD;
		}else{
			angle +=  45 * game.editor.DEG2RAD;
		}

		const offsetPoint = point.Clone();
		const offsetLength = 0.5;
		const offset = new Box2D.b2Vec2(offsetLength*Math.cos(angle), offsetLength*Math.sin(angle));
		offsetPoint.SelfAdd(offset);

		const bendLength = this.ropeEnd.GetPosition().Clone().SelfSub(offsetPoint).Length();
		this.bendRopeLength += bendLength;

		this.ropePoints.push({
			point: this.ropeEnd.GetPosition().Clone(),
			body: this.revoluteJoint.GetBodyA(),
			speed: this.revoluteJoint.GetJointSpeed(),
			bendLength
		});

		this.releaseRope();

		this.attachRope(offsetPoint, body, true);

	}
	unBendRope() {
		const bendData = this.ropePoints.pop();
		this.bendRopeLength -= bendData.bendLength;

		this.releaseRope();
		this.attachRope(bendData.point, bendData.body, true);
	}
	findFarthestPointFromBody(radius, point, body) {
		const steps = 16;
		const rotChunk = (Math.PI * 2) / steps;

		const rayCB = function () {
			this.m_hit = false;
		};
		rayCB.prototype.ReportFixture = function (fixture, point, normal, fraction) {
			if (fixture.GetBody() !== body) return -1;
			this.m_hit = true;
			this.m_point = point.Clone();
			this.m_normal = normal;
			this.m_fixture = fixture;
			this.m_fraction = fraction;
			return fraction;
		}

		const callback = new rayCB();
		let maxLength = 0;
		let farthestPoint = null;

		const dir = this.head.GetPosition().Clone().SelfSub(point).SelfNormalize();

		for (let i = 0; i < steps; i++) {
			const rot = rotChunk * i;
			const x = radius * Math.cos(rot);
			const y = radius * Math.sin(rot);
			const rayStart = new Box2D.b2Vec2(point.x + x, point.y + y);
			const radiusEdge = radius*1.1;
			const rayEnd = new Box2D.b2Vec2(point.x - dir.x * radiusEdge, point.y - dir.y * radiusEdge);

			this.head.GetWorld().RayCast(callback, rayStart, rayEnd);
			if (callback.m_fraction > maxLength) {
				maxLength = callback.m_fraction;
				farthestPoint = rayStart;
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
	updateRopeFixture() {
		this.clearTilingRope();

		const tilingPoints = [];
		this.ropePoints.forEach(rope=>tilingPoints.push(rope.point));
		tilingPoints.push(this.ropeEnd.GetPosition());


		const gunStartPosition = this.head.GetPosition().Clone();
		const gunAngle = this.hatBody.GetAngle()+90*game.editor.DEG2RAD;
		const gunlength = 3.5;
		gunStartPosition.x -= gunlength * Math.cos(gunAngle);
		gunStartPosition.y -= gunlength * Math.sin(gunAngle);

		tilingPoints.push(gunStartPosition);


		for(let i = 1; i<tilingPoints.length; i++){
			const point = tilingPoints[i];
			const previousPoint = tilingPoints[i-1];
			const diff = point.Clone().SelfSub(previousPoint);

			const tilingSprite = new PIXI.extras.TilingSprite(
				PIXI.Texture.fromImage("rope.png"),
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


		let fixture = this.ropeEnd.GetFixtureList();
		while (fixture) {
			this.ropeEnd.DestroyFixture(fixture);
			fixture = this.ropeEnd.GetFixtureList();
		}

		const ropeLength = this.head.GetPosition().Clone().SelfSub(this.ropeEnd.GetPosition()).Length();

		// rope collider
		let fixDef = new Box2D.b2FixtureDef;
		fixDef.density = 100;
		fixDef.shape = new Box2D.b2CircleShape;
		fixDef.shape.SetRadius(0.1);
		fixDef.isSensor = true;
		this.ropeEnd.CreateFixture(fixDef);

		fixDef = new Box2D.b2FixtureDef;
		fixDef.density = 0.1;

		const thickness = 0.05;

		const b2Vec2Arr = [];
		b2Vec2Arr.push(new Box2D.b2Vec2(-thickness, 0));
		b2Vec2Arr.push(new Box2D.b2Vec2(thickness, 0));
		b2Vec2Arr.push(new Box2D.b2Vec2(0, ropeLength));

		fixDef.shape = new Box2D.b2PolygonShape;
		fixDef.shape.SetAsArray(b2Vec2Arr, b2Vec2Arr.length);

		this.ropeEnd.CreateFixture(fixDef);
	}
	lean(dir) {
		if (!this.revoluteJoint) return;

		const angle = this.body.GetAngle();
		const force = 50 * dir;
		const xForce = force * Math.cos(angle);
		const yForce = force * Math.sin(angle);

		const drawPos = this.body.GetPosition().Clone().SelfAdd(new Box2D.b2Vec2(xForce/force, yForce/force));

		this.body.ApplyForce(new Box2D.b2Vec2(xForce, yForce), this.body.GetPosition(), true);
	}
	accelerate(dir) {
		if(this.oldDir == dir) return;
		if (!this.pulleyJoint) return;
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

	detachFromVehicle(){
		if(this.frameJoint)	this.head.GetWorld().DestroyJoint(this.frameJoint);
		if(this.pulleyFrameJoint) this.head.GetWorld().DestroyJoint(this.pulleyFrameJoint);
		this.frameJoint = this.pulleyJoint = null;
	}

	update() {
		if (this.ropeActive) {
			this.updateRopeFixture();
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
