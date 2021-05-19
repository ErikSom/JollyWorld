import * as PrefabManager from '../PrefabManager';
import { BaseVehicle } from './BaseVehicle';
import { Settings } from '../../Settings';
import * as AudioManager from '../../utils/AudioManager';
import { b2CloneVec2, b2LinearStiffness, b2MulVec2, b2SubVec2 } from '../../../libs/debugdraw';
import easing from '../../b2Editor/utils/easing';

class Skippyball extends BaseVehicle {
    constructor(target) {
        super(target);
		this.destroyConnectedJoints = {
            head:['pedal_right_joint', 'pedal_left_joint', 'grip_right_joint', 'grip_left_joint', 'back_joint', 'front_joint', 'body_fixer_joint', 'neck_joint', 'sit_joint', 'sit_joint_2', 'grip_left_spring', 'grip_right_spring'],
            body:['pedal_right_joint', 'pedal_left_joint', 'grip_right_joint', 'grip_left_joint', 'back_joint', 'front_joint', 'body_fixer_joint','neck_joint', 'sit_joint', 'sit_joint_2', 'grip_left_spring', 'grip_right_spring'],
            thigh_left:['pedal_left_joint', {ifno:'pedal_right_joint', destroy:['sit_joint', 'sit_joint_2', 'back_joint','front_joint']}],
            thigh_right:['pedal_right_joint', {ifno:'pedal_left_joint', destroy:['sit_joint', 'sit_joint_2', 'back_joint','front_joint']}],
            leg_left:['pedal_left_joint', {ifno:'pedal_right_joint', destroy:['sit_joint', 'sit_joint_2', 'back_joint','front_joint']}],
            leg_right:['pedal_right_joint', {ifno:'pedal_left_joint', destroy:['sit_joint', 'sit_joint_2', 'back_joint','front_joint']}],
            feet_left:['pedal_left_joint', {ifno:'pedal_right_joint', destroy:['sit_joint', 'sit_joint_2', 'back_joint','front_joint']}],
            feet_right:['pedal_right_joint', {ifno:'pedal_left_joint', destroy:['sit_joint', 'sit_joint_2', 'back_joint','front_joint']}],
            shoulder_left:['grip_left_joint', {ifno:'grip_right_joint', destroy:['back_joint', 'front_joint', 'body_fixer_joint']}],
            shoulder_right:['grip_right_joint', {ifno:'grip_left_joint', destroy:['back_joint', 'front_joint', 'body_fixer_joint']}],
            arm_left:['grip_left_joint', {ifno:'grip_right_joint', destroy:['back_joint', 'front_joint', 'body_fixer_joint']}],
            arm_right:['grip_right_joint', {ifno:'grip_left_joint', destroy:['back_joint', 'front_joint', 'body_fixer_joint']}],
            hand_left:['grip_left_joint', {ifno:'grip_right_joint', destroy:['back_joint', 'front_joint', 'body_fixer_joint']}],
            hand_right:['grip_right_joint', {ifno:'grip_left_joint', destroy:['back_joint', 'front_joint', 'body_fixer_joint']}],
            belly:['pedal_left_joint', 'pedal_right_joint', 'sit_joint', 'sit_joint_2', 'back_joint', 'front_joint', 'body_fixer_joint']
        }
        this.vehicleName = 'Skippyball';

        this.base = this.lookupObject.frame;
		this.handlePoint = this.lookupObject.b1;
		
		this.steps = 12;

		this.handleFront = null;
		this.handleBack = null;
		this.buildMesh();
		this.updateHandles();

		this.accelerating = false;

		this.baseHZ = 5.2;
		this.baseDampingratio = 0.1;
		this.forceBuildup = 0;
		this.forceIncrease = 0.02;
		this.stretchSoundId = null;
		this.bounceSoundTime = 0;

		this.ballFixerIndex = 1;

		// we have to do this again because the mesh is build later
        this.applyColorMatrix(this.prefabObject.settings.colorMatrix);
    }
    init() {
        super.init();
		this.leanSpeed = 3.0;
		this.pullJoints = [this.lookupObject.j5, this.lookupObject.j6, this.lookupObject.j7];
		this.pullBodies = [this.lookupObject.b5, this.lookupObject.b6, this.lookupObject.b7];
		this.pointContacts = [];

		this.yogaColorFilter = new PIXI.filters.ColorMatrixFilter();
		this.yogaColorFilter.grayscale(1.0);
		this.yogaColorFilter.alpha = 0;

		if(Array.isArray(this.base.mySprite.filters)){
			this.base.mySprite.filters.push(this.yogaColorFilter);
		}else{
			this.base.mySprite.filters = [this.yogaColorFilter];
		}

		for(let i = 1; i<=this.steps; i++){
			const bouncyBall = this.lookupObject['b'+i];
			bouncyBall.skipPush = true;
		}

		this.lookupObject._bodies.forEach(body=>{
			body.yogaBody = true;
		})
		this.pullBodies.forEach((b, i) => b.bounceIndex = i+1);
		this.character.jointMaxForces = [1000000, 1000000, 1200000, 1200000];
    }

	fixBalls(){

		const bouncyBall = this.lookupObject['b'+this.ballFixerIndex];
		const rayStart = b2CloneVec2(bouncyBall.GetPosition());
		const rayEnd = this.base.GetPosition();
		const distance = b2CloneVec2(rayStart);
		b2SubVec2(distance,rayEnd)
		distance.Normalize();

		const offsetDistance = 0.1;
		rayStart.set_x(rayStart.get_x()+distance.x * offsetDistance);
		rayStart.set_y(rayStart.get_y()+distance.y * offsetDistance);

		let callback = Object.assign(new Box2D.JSRayCastCallback(), {
			ReportFixture: function (fixture_p, point_p, normal_p, fraction) {

				const fixture = Box2D.wrapPointer(fixture_p, Box2D.b2Fixture);
				const point = Box2D.wrapPointer(point_p, Box2D.b2Vec2);
				const normal = Box2D.wrapPointer(normal_p, Box2D.b2Vec2);

				if(fixture.GetBody().yogaBody) return -1;
				if (fixture.IsSensor()) return -1;
				this.m_hit = true;
				this.m_point = point;
				this.m_normal = normal;
				this.m_fixture = fixture;
				return fraction;
			},
			m_hit: false
		});

		bouncyBall.GetWorld().RayCast(callback, rayStart, rayEnd);

		if (callback.m_hit) {
			bouncyBall.SetTransform(rayEnd, bouncyBall.GetAngle());
		}

		Box2D.destroy(rayStart);
		Box2D.destroy(distance);

		this.ballFixerIndex++;
		if(this.ballFixerIndex>this.steps) this.ballFixerIndex = 1;
	}

    update() {
        super.update();
		this.updateMesh();
		this.updateHandles();
		this.fixBalls();

		if(!this.accelerating && this.forceBuildup !== 0){
			this.push();

			this.forceBuildup = 0;
			this.pullJoints.forEach(joint => {
				b2LinearStiffness(joint, this.baseHZ, this.baseDampingratio, joint.GetBodyA(), joint.GetBodyB(), true);
			})
			this.yogaColorFilter.alpha = 0.0;

			AudioManager.stopSFX('stretch', this.stretchSoundId);
			this.stretchSoundId = null;
		}


		// do in our ray cast on every ball

    }

	push(){
		const angle = this.base.GetAngle() - Settings.pihalve;
		const direction = new Box2D.b2Vec2(Math.cos(angle), Math.sin(angle));
		const impulse = 1000 * easing.easeInQuad(this.forceBuildup);

		const forceSpread = 1.0;

		const mostOccurringBodies = [...this.pointContacts].sort((a,b) =>
          this.pointContacts.filter(v => v===a).length - this.pointContacts.filter(v => v===b).length
    	)

		for(let i = 0; i<mostOccurringBodies.length; i++){
			const contactBody = mostOccurringBodies[i];

			if(contactBody || i == mostOccurringBodies.length-1){

				let contactDecrease = 1.0;
				if(!contactBody){
					contactDecrease = 0.6;
				} else if(contactBody.GetType() === Box2D.b2_dynamicBody){
					contactDecrease = 0.6;
				}

				const baseForce = b2CloneVec2(direction);
				b2MulVec2(baseForce, (impulse * forceSpread * contactDecrease)) ;

				this.lookupObject._bodies.forEach(body=>{
					if(!body.snapped){
						body.ApplyForceToCenter(baseForce, true);
					}
				})

				Box2D.destroy(baseForce);

				break;
			}
		}

		// push away other dynamic objects
		this.pointContacts.forEach( (contactBody, index)  => {
			if(contactBody && contactBody.GetType() === Box2D.b2_dynamicBody){
				const contactDecrease = 0.5;
				const baseForce = b2CloneVec2(direction);
				b2MulVec2(baseForce, (impulse * -50 * forceSpread * contactDecrease));
				contactBody.ApplyForce(baseForce, this.pullBodies[index-1].GetPosition(), true);
				Box2D.destroy(baseForce);
			}
		});

		const pitchOffset = 0.2;
		AudioManager.playSFX ('bouncejump', 0.3 * this.forceBuildup, 1.0 + (Math.random()*pitchOffset - pitchOffset/2), this.base.GetPosition());

		Box2D.destroy(direction);
	}

	buildMesh(){
		const t = PIXI.Texture.from('YogaBall0000')
		this.mesh = new PIXI.SimpleMesh(t, ...this.getMeshData());
		this.base.mySprite.addChild(this.mesh);
		this.base.mySprite.isMesh = true;

		this.handleFront = new PIXI.Sprite(PIXI.Texture.from('YogaBall_Handle_Front0000'));
		this.handleBack = new PIXI.Sprite(PIXI.Texture.from('YogaBallHandle_Back0000'));

		this.base.mySprite.addChild(this.handleFront);
		this.base.mySprite.addChildAt(this.handleBack, 0);
	}

	updateMesh(){
		const [vertices, uvs] = this.getMeshData();

		this.mesh.verticesBuffer.update(vertices);
		this.mesh.uvBuffer.update(uvs);
	}

	accelerate(dir) {


		if(dir < 0){
			this.accelerating = true;

			this.forceBuildup = Math.min(this.forceBuildup + this.forceIncrease, 1);

			const HZReducer = 2.2;
			this.pullJoints.forEach(joint => {
				b2LinearStiffness(joint, this.baseHZ - HZReducer * this.forceBuildup, this.baseDampingratio, joint.GetBodyA(), joint.GetBodyB(), true);
			})

			this.pullBodies.forEach(body => {
				const direction = b2CloneVec2(body.GetPosition());
				b2SubVec2(direction, this.base.GetPosition());
				direction.Normalize();
				b2MulVec2(direction, -30 * this.forceBuildup);
				body.ApplyForceToCenter(direction, true);
				Box2D.destroy(direction);
			})

			this.yogaColorFilter.alpha = 0.4 * this.forceBuildup;

			const pitchOffset = 0.2;
			if(!this.stretchSoundId) this.stretchSoundId = AudioManager.playSFX ('stretch', 0.3, 1.0 + (Math.random()*pitchOffset - pitchOffset/2), this.base.GetPosition())


		}else{
			this.accelerating = false;
		}
	}
	stopAccelerate(){
		this.accelerating = false;
	}

	updateHandles(){
		this.handleFront.position.x = -20;
		this.handleBack.position.x = -6.5;
		this.baseYOffset = 34;

		const pos = b2CloneVec2(this.handlePoint.GetPosition());
		b2SubVec2(pos, this.base.GetPosition());
		const y = -pos.Length() * Settings.PTM - this.baseYOffset;

		this.handleFront.position.y = y;
		this.handleBack.position.y = y;
		Box2D.destroy(pos);
	}

	getMeshData(){
		const radiusAr = [];

		for(let i = 0; i<this.steps; i++){
			const targetBodyIndex = (i + 3) % this.steps + 1;
			const p = this.lookupObject[`b${targetBodyIndex}`];
			p.mySprite.visible = false;

			const pos = b2CloneVec2(this.base.GetPosition());
			b2SubVec2(pos, p.GetPosition());

			radiusAr.push(pos.Length()*Settings.PTM);
			Box2D.destroy(pos);
		}

		const rInc = 16;

		const vertices = [0,0];
		const indices = [];

		const step = 360 / this.steps;

		for(let i = 0; i < this.steps; i ++) {
			const r = radiusAr[i] + rInc;
			vertices.push( Math.cos(Math.PI * i * step / 180)*r, Math.sin(Math.PI * i * step / 180)*r);
			indices.push(0, i + 1, i);
		}

		indices.push(0, 1, this.steps);

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
	initContactListener() {
        super.initContactListener();
        const self = this;
		this.contactListener.BeginContact = function(contact){

			const bodyA = contact.GetFixtureA().GetBody();
			const bodyB = contact.GetFixtureB().GetBody();

			if(!bodyA.bounceIndex && !bodyB.bounceIndex) return;

			const bounceBody = bodyA.bounceIndex ? bodyA : bodyB;
			const otherBody = bodyA.bounceIndex ? bodyB : bodyA;

			if(otherBody.yogaBody) return;

			self.pointContacts[bounceBody.bounceIndex] = otherBody;
		}
		this.contactListener.EndContact = function(contact){
			const bodyA = contact.GetFixtureA().GetBody();
			const bodyB = contact.GetFixtureB().GetBody();

			if(!bodyA.bounceIndex && !bodyB.bounceIndex) return;

			const bounceBody = bodyA.bounceIndex ? bodyA : bodyB;
			const otherBody = bodyA.bounceIndex ? bodyB : bodyA;

			if(otherBody.yogaBody) return;

			self.pointContacts[bounceBody.bounceIndex] = null;
		}
        this.contactListener.PostSolve = function(contact, impulse) {
            // disable collision with right leg

			const bodyA = contact.GetFixtureA().GetBody();
			const bodyB = contact.GetFixtureB().GetBody();

			if(!bodyA.skipPush && !bodyB.skipPush) return;

			let force = 0;
			for (let i = 0; i < impulse.get_count(); i++)
			if (impulse.get_normalImpulses(i) > force) force = impulse.get_normalImpulses(i);

			if(force>=8 && performance.now() - self.bounceSoundTime > 100){
				const pitchOffset = 0.2;
				AudioManager.playSFX (['bounce1', 'bounce2', 'bounce3'], 0.3, 1.0 + (Math.random()*pitchOffset - pitchOffset/2), self.base.GetPosition())
				self.bounceSoundTime = performance.now()
			}
        }
    }
}

PrefabManager.prefabLibrary.Skippyball = {
    json: '{"objects":[[0,-0.0759,-2.6764,0.4887,".character#Character , .flesh","shoulder_left",0,["#999999"],["#000"],[0],false,true,[[{"x":-0.1849,"y":-0.8588},{"x":0.1931,"y":-0.8424},{"x":0.1109,"y":0.8506},{"x":-0.1192,"y":0.8506}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false],[0,0.0511,-1.4392,-0.9076,".character#Character , .flesh","arm_left",1,["#999999"],["#000"],[0],false,true,[[{"x":-0.1356,"y":-0.6862},{"x":0.1438,"y":-0.7027},{"x":0.1274,"y":0.6945},{"x":-0.1356,"y":0.6945}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false],[1,-1.8204,-79.9463,0.4887,"","",2,"Normal_Shoulder0000",0,0.5731,-0.1606,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,1.8307,-43.1809,-0.9076,"","",3,"Normal_Arm0000",1,0.2976,-0.8938,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,0.7212,-0.7682,-0.6807,".character#Character , .flesh","hand_left",4,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.5126],"",[1],true,false,false,[0.5],[0.2],false,true,false],[1,20.0172,-22.2657,-0.6807,"","",5,"Normal_Hand0000",4,1.7975,2.9104,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,0.1007,0.2451,-0.7854,".character#Character , .flesh","thigh_left",6,["#999999"],["#000"],[0],false,true,[[{"x":-0.2024,"y":-1.0313},{"x":0.196,"y":-1.0442},{"x":0.1703,"y":1.0378},{"x":-0.1639,"y":1.0378}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false],[0,0.5751,1.8232,0.4014,".character#Character , .flesh","leg_left",7,["#999999"],["#000"],[0],false,true,[[{"x":-0.1606,"y":-0.9125},{"x":0.1606,"y":-0.9253},{"x":0.0835,"y":0.9125},{"x":-0.0835,"y":0.9253}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false],[1,3.0168,7.7654,-0.7854,"","",8,"Normal_Thigh0000",6,0.4132,-2.3665,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,0.3962,2.9494,0.1047,".character#Character , .flesh","feet_left",9,["#999999"],["#000"],[0],false,true,[[{"x":-0.3532,"y":-0.2334},{"x":0.3593,"y":0},{"x":0.3593,"y":0.1229},{"x":-0.3655,"y":0.1106}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false],[1,17.0701,54.6176,0.4014,"","",10,"Normal_Leg0000",7,0.1988,-3.1416,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,12.5603,87.1244,0.1047,"","",11,"Normal_Feet0000",9,1.5151,1.2143,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.4034,2.0006,0.3665,".vehicle","frame",12,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[4],[7],[22],"",[1],true,false,false,[0.5],[0.2],false,true,false],[0,0.3675,0.0523,0.3665,".vehicle","b1",13,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1.23],[7],[10],"",[1],true,false,false,[0.5],[0.2],false,true,false],[0,-1.1313,3.9773,0.3665,".vehicle","b7",14,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1.23],[7],[10],"",[1],true,false,false,[0.5],[0.2],false,true,false],[0,1.5508,2.7574,0.3665,".vehicle","b4",15,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1.23],[7],[10],"",[1],true,false,false,[0.5],[0.2],false,true,false],[0,-2.3392,1.2642,0.3665,".vehicle","b10",16,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1.23],[7],[10],"",[1],true,false,false,[0.5],[0.2],false,true,false],[0,-0.7139,-0.0609,-0.1571,".vehicle","b12",17,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1.23],[7],[10],"",[1],true,false,false,[0.5],[0.2],false,true,false],[0,-0.0493,4.0876,-0.1571,".vehicle","b6",18,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1.23],[7],[10],"",[1],true,false,false,[0.5],[0.2],false,true,false],[0,1.6635,1.6901,-0.1571,".vehicle","b3",19,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1.23],[7],[10],"",[1],true,false,false,[0.5],[0.2],false,true,false],[0,-2.4482,2.342,-0.1571,".vehicle","b9",20,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1.23],[7],[10],"",[1],true,false,false,[0.5],[0.2],false,true,false],[0,-1.7069,0.3817,-0.6807,".vehicle","b11",21,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1.23],[7],[10],"",[1],true,false,false,[0.5],[0.2],false,true,false],[0,0.9392,3.6385,-0.6807,".vehicle","b5",22,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1.23],[7],[10],"",[1],true,false,false,[0.5],[0.2],false,true,false],[0,1.2274,0.7095,-0.6807,".vehicle","b2",23,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1.23],[7],[10],"",[1],true,false,false,[0.5],[0.2],false,true,false],[0,-2.0072,3.3228,-0.6807,".vehicle","b8",24,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1.23],[7],[10],"",[1],true,false,false,[0.5],[0.2],false,true,false],[0,-0.7261,-0.6118,0,".character#Character , .flesh","belly",25,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[14.1815],"",[1],true,false,false,[0.5],[0.2],false,true,false],[0,0.5862,-4.7509,0,".character#Character , .flesh","head",26,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[30.3931],"",[1],true,false,false,[0.5],[0.2],false,true,false],[0,-0.1367,-2.3468,0.3142,".character#Character , .flesh","body",27,["#999999"],["#000"],[0],false,true,[[{"x":-0.5373,"y":1.2023},{"x":-0.4316,"y":-1.3697},{"x":-0.1497,"y":-1.8277},{"x":0.1321,"y":-1.7925},{"x":0.5549,"y":-1.1231},{"x":0.5549,"y":1.3081},{"x":0.0969,"y":1.8013},{"x":-0.2202,"y":1.8013}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false],[1,-18.2731,-26.3665,0.2,"","",28,"Normal_Belly0000",25,8.7468,1.1579,-0.2,false,"#FFFFFF",1,1,1,0,0,0,true],[1,-2.0968,-74.0602,0.3142,"","",29,"Normal_Core0000",27,4.1688,1.3835,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,19.7001,-144.6418,0,"","",30,"Normal_Head_Idle0000",26,2.9897,0.7854,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.097,0.2703,-0.8552,".character#Character , .flesh","thigh_right",31,["#999999"],["#000"],[0],false,true,[[{"x":-0.2024,"y":-1.0313},{"x":0.196,"y":-1.0442},{"x":0.1703,"y":1.0378},{"x":-0.1639,"y":1.0378}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false],[0,0.4276,1.8205,0.2792,".character#Character , .flesh","leg_right",32,["#999999"],["#000"],[0],false,true,[[{"x":-0.1606,"y":-0.9125},{"x":0.1606,"y":-0.9253},{"x":0.0835,"y":0.9125},{"x":-0.0835,"y":0.9253}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false],[0,0.8088,-4.8464,0,".character#Character","eye_left",33,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.534],"",[1],true,false,false,[0.5],[0.2],false,true,false],[1,-2.8853,8.5207,-0.8552,"","",34,"Normal_Thigh0000",31,0.4132,-2.3665,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,12.637,54.5594,0.2792,"","",35,"Normal_Leg0000",32,0.1988,-3.1416,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,24.4338,-145.9277,0,"","",36,"Normal_Eye0000",33,0.5612,1.2636,0,null,"#FFFFFF",1,1,1,0,0,0,true],[0,0.3672,2.9561,0.1047,".character#Character , .flesh","feet_right",37,["#999999"],["#000"],[0],false,true,[[{"x":-0.3532,"y":-0.2334},{"x":0.3593,"y":0},{"x":0.3593,"y":0.1229},{"x":-0.3655,"y":0.1106}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false],[1,11.6903,87.3254,0.1047,"","",38,"Normal_Feet0000",37,1.5151,1.2143,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.2252,-2.6151,0.4537,".character#Character , .flesh","shoulder_right",39,["#999999"],["#000"],[0],false,true,[[{"x":-0.1849,"y":-0.8588},{"x":0.1931,"y":-0.8424},{"x":0.1109,"y":0.8506},{"x":-0.1192,"y":0.8506}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false],[0,-0.0648,-1.4433,-0.925,".character#Character , .flesh","arm_right",40,["#999999"],["#000"],[0],false,true,[[{"x":-0.1356,"y":-0.6862},{"x":0.1438,"y":-0.7027},{"x":0.1274,"y":0.6945},{"x":-0.1356,"y":0.6945}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false],[0,1.5266,-4.8365,0,".character#Character","eye_right",41,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.534],"",[1],true,false,false,[0.5],[0.2],false,true,false],[1,45.9678,-145.6307,0,"","",42,"Normal_Eye0000",41,0.5612,1.2636,0,null,"#FFFFFF",1,1,1,0,0,0,true],[1,-6.2876,-78.1234,0.4537,"","",43,"Normal_Shoulder0000",39,0.5731,-0.1606,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,-1.6465,-43.309,-0.925,"","",44,"Normal_Arm0000",40,0.2976,-0.8938,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,0.5803,-0.8526,-0.9425,".character#Character , .flesh","hand_right",45,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.5126],"",[1],true,false,false,[0.5],[0.2],false,true,false],[1,16.0475,-24.4053,-0.9425,"","",46,"Normal_Hand0000",45,1.7975,2.9104,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-1.8794,2.48,0,".vehicle","stabalize_left",47,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[4],[7],[24.1081],"",[0],true,false,false,[0.5],[0.2],false,true,false],[0,1.0193,2.6968,0,".vehicle","stabalize_right",48,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[3],[7],[24.1081],"",[0],true,false,false,[0.5],[0.2],false,true,false],[2,-14.0066,-56.1673,-0.6981,".character#Character","arm_left_joint",49,1,0,0,false,false,1,10,true,152,0,0,0,0,0,false],[2,19.0848,-30.4808,0.9948,".character#Character","hand_left_joint",50,4,1,0,false,false,1,10,true,60,-60,0,0,0,0,false],[2,27.2652,29.1659,0,".character#Character","leg_left_joint",51,7,6,0,false,false,1,10,true,-10,-149,0,0,0,0,false],[2,5.7972,79.7446,0,".character#Character","feet_left_joint",52,9,7,0,false,false,1,10,true,20,-20,0,0,0,0,false],[2,14.1597,-114.629,0,".character#Character","head_joint",53,26,27,0,false,false,1,10,true,58,-64,0,0,0,0,false],[2,18.9204,30.076,-0.2269,".character#Character","leg_right_joint",54,32,31,0,false,false,1,10,true,-10,-149,0,0,0,0,false],[2,5.7712,82.187,0.1047,".character#Character","feet_right_joint",55,37,32,0,false,false,1,10,true,20,-20,0,0,0,0,false],[2,45.7544,-144.634,0,".character#Character","eye_right_joint",56,41,26,0,false,false,1,10,true,0,0,0,0,0,0,false],[2,-17.2319,-56.8391,-0.5414,".character#Character","arm_right_joint",57,40,39,0,false,false,1,10,true,148.4753,0,0,0,0,0,false],[2,13.1419,-32.0131,1.1519,".character#Character","hand_right_joint",58,45,40,0,false,false,1,10,true,60,-60,0,0,0,0,false],[2,2.9818,-99.2311,0.3665,".character#Character","shoulder_right_joint",59,39,27,0,false,false,1,10,true,180,-19,0,0,0,0,false],[2,24.0601,-145.6264,0,".character#Character","eye_left_joint",60,33,26,0,false,false,1,10,true,0,0,0,0,0,0,false],[2,8.9993,-101.5133,0.3665,".character#Character","shoulder_left_joint",61,0,27,0,false,false,1,10,true,180,-19,0,0,0,0,false],[2,-17.3008,-124.4191,0,".character#Character","neck_joint",62,27,26,2,false,false,1,10,false,0,0,0.25,3,0,0,false],[2,-18.1356,-24.511,0,".character#Character","belly_joint",63,27,25,0,false,false,1,10,true,10,-10,0,0,0,0,false],[2,-21.5863,-9.9641,0,".character#Character","thigh_right_joint",64,31,25,0,false,false,1,10,true,142,-16,0,0,0,0,false],[2,-16.4971,-14.205,0,".character#Character","thigh_left_joint",65,6,25,0,false,false,1,10,true,142,-16,0,0,0,0,false],[2,-33.9453,119.3175,0.3665,".vehicle","j7",66,12,14,2,false,false,1,10,false,0,0,0.1,5.2,0,0,true],[2,-70.1837,37.9248,0.3665,".vehicle","j10",67,12,16,2,false,false,1,10,false,0,0,0.1,5.2,0,0,true],[2,11.28,1.5015,0.3665,".vehicle","j1",68,12,13,0,false,false,1,10,true,0,0,0.1,5.2,0,0,true],[2,47.1139,82.9511,0.3665,".vehicle","j4",69,12,15,2,false,false,1,10,false,0,0,0.1,5.2,0,0,true],[2,-1.3867,122.6266,-0.1571,".vehicle","j6",70,12,18,2,false,false,1,10,false,0,0,0.1,5.2,0,0,true],[2,-73.5664,70.2576,-0.1571,".vehicle","j9",71,12,20,2,false,false,1,10,false,0,0,0.1,5.2,0,0,true],[2,50.5295,50.6027,-0.1571,".vehicle","j3",72,12,19,2,false,false,1,10,false,0,0,0.1,5.2,0,0,true],[2,28.2779,109.2629,-0.6807,".vehicle","j5",73,12,22,2,false,false,1,10,false,0,0,0.1,5.2,0,0,true],[2,-60.3295,99.9499,-0.6807,".vehicle","j8",74,12,24,2,false,false,1,10,false,0,0,0.1,5.2,0,0,true],[2,-51.1411,11.0777,-0.6807,".vehicle","j11",75,12,21,2,false,false,1,10,false,0,0,0.1,5.2,0,0,true],[2,37.3133,20.8804,-0.6807,".vehicle","j2",76,12,23,2,false,false,1,10,false,0,0,0.1,5.2,0,0,true],[2,18.2108,-25.5221,0,".character#Character","grip_right_joint",77,45,13,2,false,false,1,10,false,0,0,0.5,8,0,0,true],[2,25.0108,-25.0221,0,".character#Character","grip_left_joint",78,4,13,2,false,false,1,10,false,0,0,0.5,8,0,0,true],[2,21.1475,81.3187,0,".vehicle","stabalize_right_joint",79,48,12,2,false,false,1,10,true,0,0,0.5,5,0,0,true],[2,-46.3894,72.3968,0,"","stabalize_left_joint",80,12,47,2,false,false,1,10,true,0,0,0.5,5,0,0,true],[2,-89.9087,-10.3873,0,".character#Character","back_joint",81,27,47,2,false,false,1,10,false,0,0,0.5,7.2,0,0,true],[2,59.8492,-15.2145,0,".character#Character","front_joint",82,27,48,2,false,false,1,10,false,0,0,0.5,7.2,0,0,true],[2,-19.0907,-22.737,0,".character#Character","sit_joint",83,25,12,2,false,false,1,10,false,0,0,0.5,6,0,0,true],[2,8.6854,88.3953,0,".character#Character","pedal_right_joint",84,12,37,0,false,false,1,10,false,0,0,0,0,0,0,true],[2,12.3343,89.2467,0,".character#Character","pedal_left_joint",85,12,9,0,false,false,1,10,false,0,0,0,0,0,0,true],[2,-21.6142,-1.4493,0,".vehicle","j12",86,17,12,2,false,false,1,10,false,0,0,0.1,5.2,0,0,true],[2,-8.8321,-24.2351,0,".character#Character","sit_joint_2",87,27,12,2,false,false,1,10,false,0,0,0.5,6,0,0,true],[2,-17.713,-52.8441,0,".character#Character","grip_right_spring",88,27,40,2,false,false,1,10,false,0,0,0.5,3,0,0,true],[2,-15.8924,-55.0466,0,".character#Character","grip_left_spring",89,27,1,2,false,false,1,10,false,0,0,0.5,3,0,0,true],[2,-10.0275,9.2563,0,".character#Character","body_fixer_joint",90,27,12,1,false,false,1,10,false,0,0,0,0,0,0,true]]}',
    class: Skippyball,
    library: PrefabManager.LIBRARY_ADMIN,
}
