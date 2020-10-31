import Hat from './hat'
import {
    game
} from "../../Game";
import { drawCircle } from '../../b2Editor/utils/drawing'
import * as Box2D from '../../../libs/Box2D'

export class RopeHat extends Hat{
	constructor(character, head){
		super(character, head);
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

		const bd = new Box2D.b2BodyDef();
		bd.type = Box2D.b2BodyType.b2_dynamicBody;
		const ropeEnd = this.head.GetWorld().CreateBody(bd);

		//build fixtures
		const fixDef = new Box2D.b2FixtureDef();
		fixDef.density = 1.0;
		fixDef.isSensor = true;
		fixDef.shape = new Box2D.b2CircleShape();
		fixDef.shape.SetRadius(0.2);
		ropeEnd.CreateFixture(fixDef);

		ropeEnd.SetPosition(collision.m_point);

		const revoluteJointDef = new Box2D.b2RevoluteJointDef;
		revoluteJointDef.Initialize(collision.m_fixture.GetBody(), ropeEnd, collision.m_point);
		revoluteJointDef.collideConnected = false;
		revoluteJointDef.referenceAngle = this.head.GetAngle();
		revoluteJointDef.lowerAngle = -175 * game.editor.DEG2RAD;
		revoluteJointDef.upperAngle =  175 * game.editor.DEG2RAD;
		revoluteJointDef.enableLimit = true;

		this.revoluteJoint = this.head.GetWorld().CreateJoint(revoluteJointDef);

		const prismaticJointDef = new Box2D.b2PrismaticJointDef();
		console.log('dafuqw');
		const axis = new Box2D.b2Vec2(Math.cos(this.head.GetAngle()+90 * game.editor.DEG2RAD), Math.sin(this.head.GetAngle()+90 * game.editor.DEG2RAD));
		prismaticJointDef.Initialize(this.head, ropeEnd, collision.m_point, axis);
		prismaticJointDef.maxMotorForce = 20000;
		prismaticJointDef.enableMotor = true;

		this.pulleyJoint = this.head.GetWorld().CreateJoint(prismaticJointDef);


		console.log(this.pulleyJoint, this.revoluteJoint, ropeEnd);
	}

}
