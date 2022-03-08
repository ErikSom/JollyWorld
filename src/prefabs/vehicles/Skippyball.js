import * as PrefabManager from '../PrefabManager';
import { BaseVehicle } from './BaseVehicle';
import { Settings } from '../../Settings';
import * as AudioManager from '../../utils/AudioManager';
import { b2CloneVec2, b2LinearStiffness, b2MulVec2, b2SubVec2 } from '../../../libs/debugdraw';
import easing from '../../b2Editor/utils/easing';
import * as TutorialManager from '../../utils/TutorialManager';
import { game } from '../../Game';


const vec1 = new Box2D.b2Vec2();
const vec2 = new Box2D.b2Vec2();
const vec3 = new Box2D.b2Vec2();

class Skippyball extends BaseVehicle {
    constructor(target) {
        super(target);
		this.destroyConnectedJoints = {
            head:['pedal_right_joint', 'pedal_left_joint', 'grip_right_joint', 'grip_left_joint', 'back_joint', 'front_joint', 'body_fixer_joint', 'neck_joint', 'sit_joint', 'grip_left_spring', 'grip_right_spring'],
            body:['pedal_right_joint', 'pedal_left_joint', 'grip_right_joint', 'grip_left_joint', 'back_joint', 'front_joint', 'body_fixer_joint','neck_joint', 'sit_joint', 'grip_left_spring', 'grip_right_spring'],
            thigh_left:['pedal_left_joint', {ifno:'pedal_right_joint', destroy:['sit_joint', 'back_joint','front_joint']}],
            thigh_right:['pedal_right_joint', {ifno:'pedal_left_joint', destroy:['sit_joint', 'back_joint','front_joint']}],
            leg_left:['pedal_left_joint', {ifno:'pedal_right_joint', destroy:['sit_joint', 'back_joint','front_joint']}],
            leg_right:['pedal_right_joint', {ifno:'pedal_left_joint', destroy:['sit_joint', 'back_joint','front_joint']}],
            feet_left:['pedal_left_joint', {ifno:'pedal_right_joint', destroy:['sit_joint', 'back_joint','front_joint']}],
            feet_right:['pedal_right_joint', {ifno:'pedal_left_joint', destroy:['sit_joint', 'back_joint','front_joint']}],
            shoulder_left:['grip_left_joint', {ifno:'grip_right_joint', destroy:['back_joint', 'front_joint', 'body_fixer_joint']}],
            shoulder_right:['grip_right_joint', {ifno:'grip_left_joint', destroy:['back_joint', 'front_joint', 'body_fixer_joint']}],
            arm_left:['grip_left_joint', {ifno:'grip_right_joint', destroy:['back_joint', 'front_joint', 'body_fixer_joint']}],
            arm_right:['grip_right_joint', {ifno:'grip_left_joint', destroy:['back_joint', 'front_joint', 'body_fixer_joint']}],
            hand_left:['grip_left_joint', {ifno:'grip_right_joint', destroy:['back_joint', 'front_joint', 'body_fixer_joint']}],
            hand_right:['grip_right_joint', {ifno:'grip_left_joint', destroy:['back_joint', 'front_joint', 'body_fixer_joint']}],
            belly:['pedal_left_joint', 'pedal_right_joint', 'sit_joint', 'back_joint', 'front_joint', 'body_fixer_joint']
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
		this.cachedJointForces = this.character.jointMaxForces;
		this.character.jointMaxForces = [1000000, 1000000, 2000000, 2000000];
		this.character.jointMaxTorque = 1200;
		TutorialManager.showTutorial(TutorialManager.TUTORIALS.SKIPPY);
    }

	eject(){
		super.eject();
		if(this.character){
			this.character.jointMaxForces = this.cachedJointForces;
		}
	}

	fixBalls(){

		const bouncyBall = this.lookupObject['b'+this.ballFixerIndex];
		const rayStart = vec1;
		rayStart.Set(bouncyBall.GetPosition().x, bouncyBall.GetPosition().y);
		const rayEnd = this.base.GetPosition();
		const distance = vec2;
		distance.Set(rayStart.x, rayStart.y);
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

		const velocity = this.lookupObject.frame.GetAngularVelocity();
		const velocityDamping = .6;
		if(Math.abs(velocity) > 3){
			this.lookupObject.frame.SetAngularVelocity(velocityDamping);
			this.base.SetAngularDamping(60.0);
		}else{
			this.base.SetAngularDamping(10.0);
		}
		// do in our ray cast on every ball

    }

	push(){
		const angle = this.base.GetAngle() - Settings.pihalve;
		const direction = vec1;
		direction.Set(Math.cos(angle), Math.sin(angle));
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

				const baseForce = vec2;
				baseForce.Set(direction.x, direction.y);
				b2MulVec2(baseForce, ((impulse / game.editor.editorSettingsObject.gameSpeed) * forceSpread * contactDecrease)) ;

				this.lookupObject._bodies.forEach(body=>{
					if(!body.snapped){
						body.ApplyForceToCenter(baseForce, true);
					}
				})

				break;
			}
		}

		// push away other dynamic objects
		this.pointContacts.forEach( (contactBody, index)  => {
			if(contactBody && contactBody.GetType() === Box2D.b2_dynamicBody && contactBody?.mySprite?.data.type !== game.editor.object_TRIGGER){
				const contactDecrease = 0.5;
				const baseForce = vec2;
				baseForce.Set(direction.x, direction.y);
				b2MulVec2(baseForce, (impulse * -50 * forceSpread * contactDecrease));
				contactBody.ApplyForce(baseForce, this.pullBodies[index-1].GetPosition(), true);
			}
		});

		const pitchOffset = 0.2;
		AudioManager.playSFX ('bouncejump', 0.3 * this.forceBuildup, 1.0 + (Math.random()*pitchOffset - pitchOffset/2), this.base.GetPosition());

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
				const direction = vec1;
				direction.Set(body.GetPosition().x, body.GetPosition().y);
				b2SubVec2(direction, this.base.GetPosition());
				direction.Normalize();
				b2MulVec2(direction, -30 * this.forceBuildup);
				body.ApplyForceToCenter(direction, true);
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

		const pos = vec1;
		pos.Set(this.handlePoint.GetPosition().x, this.handlePoint.GetPosition().y);
		b2SubVec2(pos, this.base.GetPosition());
		const y = -pos.Length() * Settings.PTM - this.baseYOffset;

		this.handleFront.position.y = y;
		this.handleBack.position.y = y;
	}

	getMeshData(){
		const radiusAr = [];

		for(let i = 0; i<this.steps; i++){
			const targetBodyIndex = (i + 3) % this.steps + 1;
			const p = this.lookupObject[`b${targetBodyIndex}`];
			p.mySprite.visible = false;

			const pos = vec1;
			pos.Set(this.base.GetPosition().x, this.base.GetPosition().y);
			b2SubVec2(pos, p.GetPosition());

			radiusAr.push(pos.Length()*Settings.PTM);
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
    json: '{"objects":[[0,-0.0792,-2.6853,0.4887,".character#Character , .flesh","shoulder_left",0,["#999999"],["#000"],[0],false,true,[[{"x":-0.1849,"y":-0.8588},{"x":0.1931,"y":-0.8424},{"x":0.1109,"y":0.8506},{"x":-0.1192,"y":0.8506}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false],[0,0.0478,-1.4481,-0.9076,".character#Character , .flesh","arm_left",1,["#999999"],["#000"],[0],false,true,[[{"x":-0.1356,"y":-0.6862},{"x":0.1438,"y":-0.7027},{"x":0.1274,"y":0.6945},{"x":-0.1356,"y":0.6945}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false],[1,-1.9186,-80.2124,0.4887,"","",2,"Normal_Shoulder0000",0,0.5731,-0.1606,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,1.7325,-43.447,-0.9076,"","",3,"Normal_Arm0000",1,0.2976,-0.8938,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,0.7179,-0.7771,-0.6807,".character#Character , .flesh","hand_left",4,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.5126],"",[1],true,false,false,[0.5],[0.2],false,true,false],[1,19.919,-22.5319,-0.6807,"","",5,"Normal_Hand0000",4,1.7975,2.9104,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,0.0974,0.2362,-0.7854,".character#Character , .flesh","thigh_left",6,["#999999"],["#000"],[0],false,true,[[{"x":-0.2024,"y":-1.0313},{"x":0.196,"y":-1.0442},{"x":0.1703,"y":1.0378},{"x":-0.1639,"y":1.0378}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false],[0,0.5718,1.8143,0.4014,".character#Character , .flesh","leg_left",7,["#999999"],["#000"],[0],false,true,[[{"x":-0.1606,"y":-0.9125},{"x":0.1606,"y":-0.9253},{"x":0.0835,"y":0.9125},{"x":-0.0835,"y":0.9253}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false],[1,2.9187,7.4993,-0.7854,"","",8,"Normal_Thigh0000",6,0.4132,-2.3665,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,0.3929,2.9405,0.1047,".character#Character , .flesh","feet_left",9,["#999999"],["#000"],[0],false,true,[[{"x":-0.3532,"y":-0.2334},{"x":0.3593,"y":0},{"x":0.3593,"y":0.1229},{"x":-0.3655,"y":0.1106}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false],[1,16.9719,54.3514,0.4014,"","",10,"Normal_Leg0000",7,0.1988,-3.1416,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,12.4622,86.8583,0.1047,"","",11,"Normal_Feet0000",9,1.5151,1.2143,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.4067,1.9917,0.3665,".vehicle","frame",12,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[4],[7],[22],"",[1],true,false,false,[0.5],[0.2],false,true,false],[0,0.3642,0.0434,0.3665,".vehicle","b1",13,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1.23],[7],[10],"",[1],true,false,false,[0.5],[0.2],false,true,false],[0,-1.1346,3.9684,0.3665,".vehicle","b7",14,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1.23],[7],[10],"",[1],true,false,false,[0.5],[0.2],false,true,false],[0,1.5475,2.7485,0.3665,".vehicle","b4",15,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1.23],[7],[10],"",[1],true,false,false,[0.5],[0.2],false,true,false],[0,-2.3425,1.2553,0.3665,".vehicle","b10",16,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1.23],[7],[10],"",[1],true,false,false,[0.5],[0.2],false,true,false],[0,-0.7172,-0.0698,-0.1571,".vehicle","b12",17,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1.23],[7],[10],"",[1],true,false,false,[0.5],[0.2],false,true,false],[0,-0.0526,4.0787,-0.1571,".vehicle","b6",18,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1.23],[7],[10],"",[1],true,false,false,[0.5],[0.2],false,true,false],[0,1.6602,1.6812,-0.1571,".vehicle","b3",19,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1.23],[7],[10],"",[1],true,false,false,[0.5],[0.2],false,true,false],[0,-2.4515,2.3331,-0.1571,".vehicle","b9",20,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1.23],[7],[10],"",[1],true,false,false,[0.5],[0.2],false,true,false],[0,-1.7102,0.3728,-0.6807,".vehicle","b11",21,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1.23],[7],[10],"",[1],true,false,false,[0.5],[0.2],false,true,false],[0,0.9359,3.6296,-0.6807,".vehicle","b5",22,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1.23],[7],[10],"",[1],true,false,false,[0.5],[0.2],false,true,false],[0,1.2241,0.7006,-0.6807,".vehicle","b2",23,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1.23],[7],[10],"",[1],true,false,false,[0.5],[0.2],false,true,false],[0,-2.0105,3.3139,-0.6807,".vehicle","b8",24,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1.23],[7],[10],"",[1],true,false,false,[0.5],[0.2],false,true,false],[0,-0.7294,-0.6207,0,".character#Character , .flesh","belly",25,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[14.1815],"",[1],true,false,false,[0.5],[0.2],false,true,false],[0,0.5829,-4.7598,0,".character#Character , .flesh","head",26,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[30.3931],"",[1],true,false,false,[0.5],[0.2],false,true,false],[0,-0.14,-2.3557,0.3142,".character#Character , .flesh","body",27,["#999999"],["#000"],[0],false,true,[[{"x":-0.5373,"y":1.2023},{"x":-0.4316,"y":-1.3697},{"x":-0.1497,"y":-1.8277},{"x":0.1321,"y":-1.7925},{"x":0.5549,"y":-1.1231},{"x":0.5549,"y":1.3081},{"x":0.0969,"y":1.8013},{"x":-0.2202,"y":1.8013}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false],[1,-18.3713,-26.6327,0.2,"","",28,"Normal_Belly0000",25,8.7468,1.1579,-0.2,false,"#FFFFFF",1,1,1,0,0,0,true],[1,-2.195,-74.3264,0.3142,"","",29,"Normal_Core0000",27,4.1688,1.3835,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,19.6019,-144.908,0,"","",30,"Normal_Head_Idle0000",26,2.9897,0.7854,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.1003,0.2614,-0.8552,".character#Character , .flesh","thigh_right",31,["#999999"],["#000"],[0],false,true,[[{"x":-0.2024,"y":-1.0313},{"x":0.196,"y":-1.0442},{"x":0.1703,"y":1.0378},{"x":-0.1639,"y":1.0378}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false],[0,0.4243,1.8116,0.2792,".character#Character , .flesh","leg_right",32,["#999999"],["#000"],[0],false,true,[[{"x":-0.1606,"y":-0.9125},{"x":0.1606,"y":-0.9253},{"x":0.0835,"y":0.9125},{"x":-0.0835,"y":0.9253}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false],[0,0.8055,-4.8553,0,".character#Character","eye_left",33,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.534],"",[1],true,false,false,[0.5],[0.2],false,true,false],[1,-2.9835,8.2545,-0.8552,"","",34,"Normal_Thigh0000",31,0.4132,-2.3665,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,12.5388,54.2933,0.2792,"","",35,"Normal_Leg0000",32,0.1988,-3.1416,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,24.3356,-146.1938,0,"","",36,"Normal_Eye0000",33,0.5612,1.2636,0,null,"#FFFFFF",1,1,1,0,0,0,true],[0,0.3639,2.9472,0.1047,".character#Character , .flesh","feet_right",37,["#999999"],["#000"],[0],false,true,[[{"x":-0.3532,"y":-0.2334},{"x":0.3593,"y":0},{"x":0.3593,"y":0.1229},{"x":-0.3655,"y":0.1106}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false],[1,11.5922,87.0593,0.1047,"","",38,"Normal_Feet0000",37,1.5151,1.2143,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.2285,-2.624,0.4537,".character#Character , .flesh","shoulder_right",39,["#999999"],["#000"],[0],false,true,[[{"x":-0.1849,"y":-0.8588},{"x":0.1931,"y":-0.8424},{"x":0.1109,"y":0.8506},{"x":-0.1192,"y":0.8506}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false],[0,-0.0681,-1.4522,-0.925,".character#Character , .flesh","arm_right",40,["#999999"],["#000"],[0],false,true,[[{"x":-0.1356,"y":-0.6862},{"x":0.1438,"y":-0.7027},{"x":0.1274,"y":0.6945},{"x":-0.1356,"y":0.6945}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false],[0,1.5233,-4.8454,0,".character#Character","eye_right",41,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.534],"",[1],true,false,false,[0.5],[0.2],false,true,false],[1,45.8696,-145.8969,0,"","",42,"Normal_Eye0000",41,0.5612,1.2636,0,null,"#FFFFFF",1,1,1,0,0,0,true],[1,-6.3858,-78.3896,0.4537,"","",43,"Normal_Shoulder0000",39,0.5731,-0.1606,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,-1.7446,-43.5752,-0.925,"","",44,"Normal_Arm0000",40,0.2976,-0.8938,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,0.577,-0.8615,-0.9425,".character#Character , .flesh","hand_right",45,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.5126],"",[1],true,false,false,[0.5],[0.2],false,true,false],[1,15.9493,-24.6715,-0.9425,"","",46,"Normal_Hand0000",45,1.7975,2.9104,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-1.8827,2.4711,0,".vehicle","stabalize_left",47,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[4],[7],[24.1081],"",[0],true,false,false,[0.5],[0.2],false,true,false],[0,1.016,2.6879,0,".vehicle","stabalize_right",48,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[3],[7],[24.1081],"",[0],true,false,false,[0.5],[0.2],false,true,false],[2,-14.1047,-56.4342,-0.6981,".character#Character","arm_left_joint",49,1,0,0,false,false,1,10,true,152,0,0,0,0,0,false],[2,18.9867,-30.7477,0.9948,".character#Character","hand_left_joint",50,4,1,0,false,false,1,10,true,60,-60,0,0,0,0,false],[2,27.1671,28.899,0,".character#Character","leg_left_joint",51,7,6,0,false,false,1,10,true,-10,-149,0,0,0,0,false],[2,5.6991,79.4777,0,".character#Character","feet_left_joint",52,9,7,0,false,false,1,10,true,20,-20,0,0,0,0,false],[2,14.0616,-114.8959,0,".character#Character","head_joint",53,26,27,0,false,false,1,10,true,58,-64,0,0,0,0,false],[2,18.8223,29.8091,-0.2269,".character#Character","leg_right_joint",54,32,31,0,false,false,1,10,true,-10,-149,0,0,0,0,false],[2,5.6731,81.9201,0.1047,".character#Character","feet_right_joint",55,37,32,0,false,false,1,10,true,20,-20,0,0,0,0,false],[2,45.6563,-144.9009,0,".character#Character","eye_right_joint",56,41,26,0,false,false,1,10,true,0,0,0,0,0,0,false],[2,-17.33,-57.106,-0.5414,".character#Character","arm_right_joint",57,40,39,0,false,false,1,10,true,148.4753,0,0,0,0,0,false],[2,13.0438,-32.28,1.1519,".character#Character","hand_right_joint",58,45,40,0,false,false,1,10,true,60,-60,0,0,0,0,false],[2,2.8837,-99.498,0.3665,".character#Character","shoulder_right_joint",59,39,27,0,false,false,1,10,true,180,-19,0,0,0,0,false],[2,23.962,-145.8933,0,".character#Character","eye_left_joint",60,33,26,0,false,false,1,10,true,0,0,0,0,0,0,false],[2,8.9012,-101.7802,0.3665,".character#Character","shoulder_left_joint",61,0,27,0,false,false,1,10,true,180,-19,0,0,0,0,false],[2,-17.3989,-124.686,0,".character#Character","neck_joint",62,27,26,2,false,false,1,10,false,0,0,0.25,3,0,0,false],[2,-18.2337,-24.7779,0,".character#Character","belly_joint",63,27,25,0,false,false,1,10,true,10,-10,0,0,0,0,false],[2,-21.6844,-10.231,0,".character#Character","thigh_right_joint",64,31,25,0,false,false,1,10,true,142,-16,0,0,0,0,false],[2,-16.5952,-14.4719,0,".character#Character","thigh_left_joint",65,6,25,0,false,false,1,10,true,142,-16,0,0,0,0,false],[2,-34.0434,119.0506,0.3665,".vehicle","j7",66,12,14,2,false,false,1,10,false,0,0,0.1,5.2,0,0,true],[2,-70.2818,37.6579,0.3665,".vehicle","j10",67,12,16,2,false,false,1,10,false,0,0,0.1,5.2,0,0,true],[2,11.1819,1.2346,0.3665,".vehicle","j1",68,12,13,0,false,false,1,10,true,0,0,0.1,5.2,0,0,true],[2,47.0158,82.6842,0.3665,".vehicle","j4",69,12,15,2,false,false,1,10,false,0,0,0.1,5.2,0,0,true],[2,-1.4848,122.3597,-0.1571,".vehicle","j6",70,12,18,2,false,false,1,10,false,0,0,0.1,5.2,0,0,true],[2,-73.6645,69.9907,-0.1571,".vehicle","j9",71,12,20,2,false,false,1,10,false,0,0,0.1,5.2,0,0,true],[2,50.4314,50.3358,-0.1571,".vehicle","j3",72,12,19,2,false,false,1,10,false,0,0,0.1,5.2,0,0,true],[2,28.1798,108.996,-0.6807,".vehicle","j5",73,12,22,2,false,false,1,10,false,0,0,0.1,5.2,0,0,true],[2,-60.4276,99.683,-0.6807,".vehicle","j8",74,12,24,2,false,false,1,10,false,0,0,0.1,5.2,0,0,true],[2,-51.2392,10.8108,-0.6807,".vehicle","j11",75,12,21,2,false,false,1,10,false,0,0,0.1,5.2,0,0,true],[2,37.2152,20.6135,-0.6807,".vehicle","j2",76,12,23,2,false,false,1,10,false,0,0,0.1,5.2,0,0,true],[2,18.1127,-25.789,0,".character#Character","grip_right_joint",77,45,13,2,false,false,1,10,false,0,0,0.5,8,0,0,true],[2,24.9127,-25.289,0,".character#Character","grip_left_joint",78,4,13,2,false,false,1,10,false,0,0,0.5,8,0,0,true],[2,21.0494,81.0518,0,".vehicle","stabalize_right_joint",79,48,12,2,false,false,1,10,true,0,0,0.5,5,0,0,true],[2,-46.4875,72.1299,0,"","stabalize_left_joint",80,12,47,2,false,false,1,10,true,0,0,0.5,5,0,0,true],[2,-90.0068,-10.6542,0,".character#Character","back_joint",81,27,47,2,false,false,1,10,false,0,0,0.5,7.2,0,0,true],[2,59.7511,-15.4814,0,".character#Character","front_joint",82,27,48,2,false,false,1,10,false,0,0,0.5,7.2,0,0,true],[2,-19.1888,-23.2519,0,".character#Character","sit_joint",83,25,12,2,false,false,1,10,false,0,0,0.5,6,0,0,true],[2,8.5873,88.1284,0,".character#Character","pedal_right_joint",84,12,37,0,false,false,1,10,false,0,0,0,0,0,0,true],[2,12.2362,88.9798,0,".character#Character","pedal_left_joint",85,12,9,0,false,false,1,10,false,0,0,0,0,0,0,true],[2,-21.7123,-1.7162,0,".vehicle","j12",86,17,12,2,false,false,1,10,false,0,0,0.1,5.2,0,0,true],[2,-17.8111,-53.111,0,".character#Character","grip_right_spring",87,27,40,2,false,false,1,10,false,0,0,0.5,3,0,0,true],[2,-15.9905,-55.3135,0,".character#Character","grip_left_spring",88,27,1,2,false,false,1,10,false,0,0,0.5,3,0,0,true],[2,-10.1256,8.9894,0,".character#Character","body_fixer_joint",89,27,12,1,false,false,1,10,false,0,0,0,0,0,0,true]]}',
    class: Skippyball,
    library: PrefabManager.LIBRARY_ADMIN,
}
