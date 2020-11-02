import Hat from './hat'
import {
    game
} from "../../Game";
import { drawCircle } from '../../b2Editor/utils/drawing'
import * as Box2D from '../../../libs/Box2D'

export class RopeHat extends Hat{
	constructor(character, head, body){
		super(character, head, body);
		this.rayCastCallback  = function () {
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
	}
	activate(){
		if(this.ropeFired) return;
		this.ropeFired = true;
		const rayStart = this.head.GetPosition();
		const angle = this.head.GetAngle() - Math.PI/2;
		const rayEnd = rayStart.Clone();
		const length = 100;
		rayEnd.x += length*Math.cos(angle);
		rayEnd.y += length*Math.sin(angle);
		let callback = new this.rayCastCallback();
		this.head.GetWorld().RayCast(callback, rayStart, rayEnd);
		if (callback.m_hit) {
			console.log("HITTTTT");
			drawCircle(game.editor.getPIXIPointFromWorldPoint(callback.m_point,), 3);
			this.attachRope(callback);
		}else{
			this.ropeFired = false;
		}
	}
	attachRope(collision){
		this.ropeActive = true;

		const bd = new Box2D.b2BodyDef();
		bd.type = Box2D.b2BodyType.b2_dynamicBody;
		bd.angularDamping = 0.85;
		bd.linearDamping = 0.85;
		this.ropeEnd = this.head.GetWorld().CreateBody(bd);
		this.ropeEnd.SetBullet(true);

		const farthestPoint = this.findFarthestPointFromBody(0.5, collision.m_point, collision.m_fixture.GetBody());
		if(farthestPoint === null) return;

		this.ropeEnd.SetPosition(farthestPoint);

		//build fixtures
		this.updateRopeFixture();

		const revoluteJointDef = new Box2D.b2RevoluteJointDef;
		revoluteJointDef.Initialize(collision.m_fixture.GetBody(), this.ropeEnd, farthestPoint);
		revoluteJointDef.collideConnected = false;

		this.revoluteJoint = this.head.GetWorld().CreateJoint(revoluteJointDef);

		let ropeJointDef = new Box2D.b2DistanceJointDef();
		ropeJointDef.Initialize(this.head, this.ropeEnd, this.head.GetPosition(), this.ropeEnd.GetPosition());
		ropeJointDef.frequencyHz = 60;
		ropeJointDef.dampingRatio = 1.0;
		this.ropeHeadJoint = this.head.GetWorld().CreateJoint(ropeJointDef);


		// ropeJointDef = new Box2D.b2RopeJointDef();
		// ropeJointDef.Initialize(this.body, this.ropeEnd, new Box2D.b2Vec2(), new Box2D.b2Vec2());
		// this.ropeBodyJoint = this.head.GetWorld().CreateJoint(ropeJointDef);

		const prismaticJointDef = new Box2D.b2PrismaticJointDef();
		const axis = new Box2D.b2Vec2(Math.cos(this.head.GetAngle()+90 * game.editor.DEG2RAD), Math.sin(this.head.GetAngle()+90 * game.editor.DEG2RAD));
		prismaticJointDef.Initialize(this.head, this.ropeEnd, farthestPoint, axis);
		prismaticJointDef.maxMotorForce = 20000;
		prismaticJointDef.enableMotor = false;
		this.pulleyJoint = this.head.GetWorld().CreateJoint(prismaticJointDef);

		console.log(this.pulleyJoint, this.revoluteJoint, this.ropeHeadJoint);
	}
	findFarthestPointFromBody(radius, point, body){
		const steps = 16;
		const rotChunk = (Math.PI*2)/steps;

		const rayCB  = function () {
            this.m_hit = false;
        };
        rayCB.prototype.ReportFixture = function (fixture, point, normal, fraction) {
            if(fixture.GetBody() !== body) return -1;
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

		for(let i = 0; i<steps; i++){
			const rot = rotChunk*i;
			const x = radius*Math.cos(rot);
			const y = radius*Math.sin(rot);
			const rayStart = new Box2D.b2Vec2(point.x+x, point.y+y);
			const rayEnd = new Box2D.b2Vec2(point.x-x, point.y-y);
			this.head.GetWorld().RayCast(callback, rayStart, rayEnd);
			if(callback.m_fraction > maxLength){
				maxLength = callback.m_fraction;
				farthestPoint = rayStart;
			}
		}
		return farthestPoint;
	}
	updateRopeFixture(){

		let fixture = this.ropeEnd.GetFixtureList();
		while(fixture){
			this.ropeEnd.DestroyFixture(fixture);
			fixture = this.ropeEnd.GetFixtureList();
		}

		const ropeLength = this.head.GetPosition().Clone().SelfSub(this.ropeEnd.GetPosition()).Length();

		// rope collider
		let fixDef = new Box2D.b2FixtureDef;
		fixDef.density = 100;
		fixDef.isSensor = true;
		fixDef.shape = new Box2D.b2CircleShape;
		fixDef.shape.SetRadius(0.1);
		this.ropeEnd.CreateFixture(fixDef);

		fixDef = new Box2D.b2FixtureDef;
		fixDef.density = 0.1;
		fixDef.isSensor = true;

		const thickness = 0.1;

		const b2Vec2Arr = [];
		b2Vec2Arr.push(new Box2D.b2Vec2(-thickness, 0));
		b2Vec2Arr.push(new Box2D.b2Vec2(thickness, 0));
		b2Vec2Arr.push(new Box2D.b2Vec2(0, ropeLength));

		fixDef.shape = new Box2D.b2PolygonShape;
		fixDef.shape.SetAsArray(b2Vec2Arr, b2Vec2Arr.length);

		this.ropeEnd.CreateFixture(fixDef);
	}
	lean(dir){
		if(!this.revoluteJoint) return;
		if(dir !== 0){
			this.body.ApplyForce(new Box2D.b2Vec2(dir*50, 0), this.body.GetPosition(), true);
		}else{
		}
		console.log(this.revoluteJoint.m_motorSpeed, this.revoluteJoint.m_enableMotor)
	}
	update(){
		if(this.ropeActive){
			// this.updateRopeFixture();
		}
	}

}
