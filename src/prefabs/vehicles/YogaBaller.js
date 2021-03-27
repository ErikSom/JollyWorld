import * as PrefabManager from '../PrefabManager';
import { BaseVehicle } from './BaseVehicle';
import { Settings } from '../../Settings';
import * as Box2D from '../../../libs/Box2D'
import * as AudioManager from '../../utils/AudioManager';

class YogaBaller extends BaseVehicle {
    constructor(target) {
        super(target);
		this.destroyConnectedJoints = {
            head:['pedal_right_joint', 'pedal_left_joint', 'grip_right_joint', 'grip_left_joint', 'back_joint', 'front_joint', 'neck_joint', 'sit_joint', 'sit_joint_2', 'grip_left_spring', 'grip_right_spring'],
            body:['pedal_right_joint', 'pedal_left_joint', 'grip_right_joint', 'grip_left_joint', 'back_joint', 'front_joint','neck_joint', 'sit_joint', 'sit_joint_2', 'grip_left_spring', 'grip_right_spring'],
            thigh_left:['pedal_left_joint', {ifno:'pedal_right_joint', destroy:['sit_joint', 'sit_joint_2', 'back_joint','front_joint']}],
            thigh_right:['pedal_right_joint', {ifno:'pedal_left_joint', destroy:['sit_joint', 'sit_joint_2', 'back_joint','front_joint']}],
            leg_left:['pedal_left_joint', {ifno:'pedal_right_joint', destroy:['sit_joint', 'sit_joint_2', 'back_joint','front_joint']}],
            leg_right:['pedal_right_joint', {ifno:'pedal_left_joint', destroy:['sit_joint', 'sit_joint_2', 'back_joint','front_joint']}],
            feet_left:['pedal_left_joint', {ifno:'pedal_right_joint', destroy:['sit_joint', 'sit_joint_2', 'back_joint','front_joint']}],
            feet_right:['pedal_right_joint', {ifno:'pedal_left_joint', destroy:['sit_joint', 'sit_joint_2', 'back_joint','front_joint']}],
            shoulder_left:['grip_left_joint', {ifno:'grip_right_joint', destroy:['back_joint', 'front_joint']}],
            shoulder_right:['grip_right_joint', {ifno:'grip_left_joint', destroy:['back_joint', 'front_joint']}],
            arm_left:['grip_left_joint', {ifno:'grip_right_joint', destroy:['back_joint', 'front_joint']}],
            arm_right:['grip_right_joint', {ifno:'grip_left_joint', destroy:['back_joint', 'front_joint']}],
            hand_left:['grip_left_joint', {ifno:'grip_right_joint', destroy:['back_joint', 'front_joint']}],
            hand_right:['grip_right_joint', {ifno:'grip_left_joint', destroy:['back_joint', 'front_joint']}],
            belly:['pedal_left_joint', 'pedal_right_joint', 'sit_joint', 'sit_joint_2', 'back_joint', 'front_joint']
        }
        this.vehicleName = 'YogaBall';

        this.base = this.lookupObject.frame;
		this.handlePoint = this.lookupObject.b1;
		
		this.steps = 12;

		this.handleFront = null;
		this.handleBack = null;
		this.buildMesh();
		this.updateHandles();

		this.accelerating = false;

		this.baseHZ = 5.2;
		this.forceBuildup = 0;
		this.forceIncrease = 0.02;
		this.stretchSoundId = null;
		this.bounceSoundTime = 0;
    }
    init() {
        super.init();
		this.leanSpeed = 2.4;
		this.pullJoints = [this.lookupObject.j5, this.lookupObject.j6, this.lookupObject.j7];
		this.pullBodies = [this.lookupObject.b5, this.lookupObject.b6, this.lookupObject.b7];
		this.pointContacts = [];

		this.yogaColorFilter = new PIXI.filters.ColorMatrixFilter();
		this.yogaColorFilter.grayscale(1.0);
		this.yogaColorFilter.alpha = 0;
		this.base.mySprite.filters = [this.yogaColorFilter];

		for(let i = 1; i<=this.steps; i++){
			this.lookupObject['b'+i].skipPush = true;
		}


		this.lookupObject._bodies.forEach(body=>{
			body.yogaBody = true;
		})
		this.pullBodies.forEach((b, i) => b.bounceIndex = i+1);
		this.character.jointMaxForces = [1000000, 1000000, 1000000, 1000000];
    }
    update() {
        super.update();
		this.updateMesh();
		this.updateHandles();

		if(!this.accelerating && this.forceBuildup !== 0){
			this.push();

			this.forceBuildup = 0;
			this.pullJoints.forEach(joint => {
				joint.SetFrequency(this.baseHZ);
				joint.SetFrequency(this.baseHZ);
			})
			this.yogaColorFilter.alpha = 0.0;

			AudioManager.stopSFX('stretch', this.stretchSoundId);
			this.stretchSoundId = null;
		}

    }

	push(){
		const angle = this.base.GetAngle() - Settings.pihalve;
		const direction = new Box2D.b2Vec2(Math.cos(angle), Math.sin(angle));
		const impulse = 1200 * this.forceBuildup;

		const forceSpread = 1 / this.pointContacts.length;

		this.pointContacts.forEach( (contactBody, index)  => {

			let contactDecrease = 1.0;
			if(!contactBody){
				contactDecrease = 0.5;
			} else if(contactBody.GetType() === Box2D.b2BodyType.b2_dynamicBody){
				contactDecrease = 0.5;
				const baseForce = direction.Clone().SelfMul(impulse * -50 * forceSpread * contactDecrease) ;
				contactBody.ApplyForce(baseForce, this.pullBodies[index-1].GetPosition(), true);
			}

			const baseForce = direction.Clone().SelfMul(impulse * forceSpread * contactDecrease) ;

			this.lookupObject._bodies.forEach(body=>{
				body.ApplyForceToCenter(baseForce);
			})

		});
		const pitchOffset = 0.2;
		AudioManager.playSFX ('bouncejump', 0.3 * this.forceBuildup, 1.0 + (Math.random()*pitchOffset - pitchOffset/2), this.base.GetPosition());
	}

	buildMesh(){
		const t = PIXI.Texture.from('YogaBall0000')
		this.mesh = new PIXI.SimpleMesh(t, ...this.getMeshData());
		this.base.mySprite.addChild(this.mesh);

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
				joint.SetFrequency(this.baseHZ - HZReducer * this.forceBuildup);
				joint.SetFrequency(this.baseHZ - HZReducer * this.forceBuildup);
			})

			this.pullBodies.forEach(body => {
				const direction = body.GetPosition().Clone().SelfSub(this.base.GetPosition()).SelfNormalize();
				body.ApplyForceToCenter(direction.SelfMul(-30 * this.forceBuildup));
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
		this.handleFront.position.y = -this.handlePoint.GetPosition().Clone().SelfSub(this.base.GetPosition()).Length() * Settings.PTM - this.baseYOffset;
		this.handleBack.position.y = -this.handlePoint.GetPosition().Clone().SelfSub(this.base.GetPosition()).Length() * Settings.PTM - this.baseYOffset;

	}

	getMeshData(){
		const radiusAr = [];

		for(let i = 0; i<this.steps; i++){
			const targetBodyIndex = (i + 3) % this.steps + 1;
			const p = this.lookupObject[`b${targetBodyIndex}`];
			p.mySprite.visible = false;
			radiusAr.push(this.base.GetPosition().Clone().SelfSub(p.GetPosition()).Length()*Settings.PTM);
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
			for (let i = 0; i < impulse.normalImpulses.length; i++)
			if (impulse.normalImpulses[i] > force) force = impulse.normalImpulses[i];

			if(force>=8 && performance.now() - self.bounceSoundTime > 100){
				const pitchOffset = 0.2;
				AudioManager.playSFX (['bounce1', 'bounce2', 'bounce3'], 0.3, 1.0 + (Math.random()*pitchOffset - pitchOffset/2), self.base.GetPosition())
				self.bounceSoundTime = performance.now()
			}
        }
    }
}

PrefabManager.prefabLibrary.YogaBaller = {
    json: '{"objects":[[0,-0.0763,-2.673,0.4887,".character#Character , .flesh","shoulder_left",0,["#999999"],["#000"],[0],false,true,[[{"x":-0.1849,"y":-0.8588},{"x":0.1931,"y":-0.8424},{"x":0.1109,"y":0.8506},{"x":-0.1192,"y":0.8506}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[0,0.0507,-1.4358,-0.9076,".character#Character , .flesh","arm_left",1,["#999999"],["#000"],[0],false,true,[[{"x":-0.1356,"y":-0.6862},{"x":0.1438,"y":-0.7027},{"x":0.1274,"y":0.6945},{"x":-0.1356,"y":0.6945}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[1,-1.8325,-79.8437,0.4887,"","",2,"Normal_Shoulder0000",0,0.5731,-0.1606,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,1.8186,-43.0783,-0.9076,"","",3,"Normal_Arm0000",1,0.2976,-0.8938,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,0.7208,-0.7648,-0.6807,".character#Character , .flesh","hand_left",4,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.5126],"",[1],true,false,false,[0.5],[0.2],false,true],[1,20.0051,-22.1632,-0.6807,"","",5,"Normal_Hand0000",4,1.7975,2.9104,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,0.1003,0.2485,-0.7854,".character#Character , .flesh","thigh_left",6,["#999999"],["#000"],[0],false,true,[[{"x":-0.2024,"y":-1.0313},{"x":0.196,"y":-1.0442},{"x":0.1703,"y":1.0378},{"x":-0.1639,"y":1.0378}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[0,0.5747,1.8266,0.4014,".character#Character , .flesh","leg_left",7,["#999999"],["#000"],[0],false,true,[[{"x":-0.1606,"y":-0.9125},{"x":0.1606,"y":-0.9253},{"x":0.0835,"y":0.9125},{"x":-0.0835,"y":0.9253}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[1,3.0048,7.8679,-0.7854,"","",8,"Normal_Thigh0000",6,0.4132,-2.3665,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,0.3958,2.9528,0.1047,".character#Character , .flesh","feet_left",9,["#999999"],["#000"],[0],false,true,[[{"x":-0.3532,"y":-0.2334},{"x":0.3593,"y":0},{"x":0.3593,"y":0.1229},{"x":-0.3655,"y":0.1106}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[1,17.058,54.7201,0.4014,"","",10,"Normal_Leg0000",7,0.1988,-3.1416,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,12.5483,87.227,0.1047,"","",11,"Normal_Feet0000",9,1.5151,1.2143,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.4038,2.004,0.3665,".vehicle","frame",12,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[4],[7],[20],"",[1],true,false,false,[0.5],[0.2],false,true],[0,0.3671,0.0557,0.3665,".vehicle","b1",13,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1.23],[7],[10],"",[1],true,false,false,[0.5],[0.2],false,true],[0,-1.1317,3.9807,0.3665,".vehicle","b7",14,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1.23],[7],[10],"",[1],true,false,false,[0.5],[0.2],false,true],[0,1.5504,2.7608,0.3665,".vehicle","b4",15,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1.23],[7],[10],"",[1],true,false,false,[0.5],[0.2],false,true],[0,-2.3396,1.2676,0.3665,".vehicle","b10",16,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1.23],[7],[10],"",[1],true,false,false,[0.5],[0.2],false,true],[0,-0.7143,-0.0575,-0.1571,".vehicle","b12",17,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1.23],[7],[10],"",[1],true,false,false,[0.5],[0.2],false,true],[0,-0.0497,4.091,-0.1571,".vehicle","b6",18,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1.23],[7],[10],"",[1],true,false,false,[0.5],[0.2],false,true],[0,1.6631,1.6935,-0.1571,".vehicle","b3",19,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1.23],[7],[10],"",[1],true,false,false,[0.5],[0.2],false,true],[0,-2.4486,2.3454,-0.1571,".vehicle","b9",20,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1.23],[7],[10],"",[1],true,false,false,[0.5],[0.2],false,true],[0,-1.7073,0.3851,-0.6807,".vehicle","b11",21,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1.23],[7],[10],"",[1],true,false,false,[0.5],[0.2],false,true],[0,0.9388,3.6419,-0.6807,".vehicle","b5",22,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1.23],[7],[10],"",[1],true,false,false,[0.5],[0.2],false,true],[0,1.227,0.7129,-0.6807,".vehicle","b2",23,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1.23],[7],[10],"",[1],true,false,false,[0.5],[0.2],false,true],[0,-2.0076,3.3262,-0.6807,".vehicle","b8",24,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1.23],[7],[10],"",[1],true,false,false,[0.5],[0.2],false,true],[0,-0.7265,-0.6084,0,".character#Character , .flesh","belly",25,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[14.1815],"",[1],true,false,false,[0.5],[0.2],false,true],[0,0.5858,-4.7475,0,".character#Character , .flesh","head",26,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[30.3931],"",[1],true,false,false,[0.5],[0.2],false,true],[0,-0.1371,-2.3434,0.3142,".character#Character , .flesh","body",27,["#999999"],["#000"],[0],false,true,[[{"x":-0.5373,"y":1.2023},{"x":-0.4316,"y":-1.3697},{"x":-0.1497,"y":-1.8277},{"x":0.1321,"y":-1.7925},{"x":0.5549,"y":-1.1231},{"x":0.5549,"y":1.3081},{"x":0.0969,"y":1.8013},{"x":-0.2202,"y":1.8013}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[1,-18.2852,-26.264,0.2,"","",28,"Normal_Belly0000",25,8.7468,1.1579,-0.2,false,"#FFFFFF",1,1,1,0,0,0,true],[1,-2.1089,-73.9577,0.3142,"","",29,"Normal_Core0000",27,4.1688,1.3835,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,19.688,-144.5393,0,"","",30,"Normal_Head_Idle0000",26,2.9897,0.7854,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.0974,0.2737,-0.8552,".character#Character , .flesh","thigh_right",31,["#999999"],["#000"],[0],false,true,[[{"x":-0.2024,"y":-1.0313},{"x":0.196,"y":-1.0442},{"x":0.1703,"y":1.0378},{"x":-0.1639,"y":1.0378}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[0,0.4272,1.8239,0.2792,".character#Character , .flesh","leg_right",32,["#999999"],["#000"],[0],false,true,[[{"x":-0.1606,"y":-0.9125},{"x":0.1606,"y":-0.9253},{"x":0.0835,"y":0.9125},{"x":-0.0835,"y":0.9253}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[0,0.7751,-4.843,0,".character#Character","eye_left",33,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.534],"",[1],true,false,false,[0.5],[0.2],false,true],[1,-2.8974,8.6232,-0.8552,"","",34,"Normal_Thigh0000",31,0.4132,-2.3665,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,12.6249,54.662,0.2792,"","",35,"Normal_Leg0000",32,0.1988,-3.1416,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,23.4227,-145.8252,0,"","",36,"Normal_Eye0000",33,0.5612,1.2636,0,null,"#FFFFFF",1,1,1,0,0,0,true],[0,0.3668,2.9595,0.1047,".character#Character , .flesh","feet_right",37,["#999999"],["#000"],[0],false,true,[[{"x":-0.3532,"y":-0.2334},{"x":0.3593,"y":0},{"x":0.3593,"y":0.1229},{"x":-0.3655,"y":0.1106}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[1,11.6783,87.428,0.1047,"","",38,"Normal_Feet0000",37,1.5151,1.2143,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.2256,-2.6117,0.4537,".character#Character , .flesh","shoulder_right",39,["#999999"],["#000"],[0],false,true,[[{"x":-0.1849,"y":-0.8588},{"x":0.1931,"y":-0.8424},{"x":0.1109,"y":0.8506},{"x":-0.1192,"y":0.8506}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[0,-0.0652,-1.4399,-0.925,".character#Character , .flesh","arm_right",40,["#999999"],["#000"],[0],false,true,[[{"x":-0.1356,"y":-0.6862},{"x":0.1438,"y":-0.7027},{"x":0.1274,"y":0.6945},{"x":-0.1356,"y":0.6945}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[0,1.4596,-4.8331,0,".character#Character","eye_right",41,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.534],"",[1],true,false,false,[0.5],[0.2],false,true],[1,43.9577,-145.5282,0,"","",42,"Normal_Eye0000",41,0.5612,1.2636,0,null,"#FFFFFF",1,1,1,0,0,0,true],[1,-6.2997,-78.0209,0.4537,"","",43,"Normal_Shoulder0000",39,0.5731,-0.1606,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,-1.6585,-43.2065,-0.925,"","",44,"Normal_Arm0000",40,0.2976,-0.8938,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,0.5799,-0.8492,-0.9425,".character#Character , .flesh","hand_right",45,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.5126],"",[1],true,false,false,[0.5],[0.2],false,true],[1,16.0354,-24.3028,-0.9425,"","",46,"Normal_Hand0000",45,1.7975,2.9104,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-1.8798,2.4834,0,".vehicle","stabalize_left",47,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[4],[7],[24.1081],"",[0],true,false,false,[0.5],[0.2],false,true],[0,1.0189,2.7002,0,".vehicle","stabalize_right",48,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[3],[7],[24.1081],"",[0],true,false,false,[0.5],[0.2],false,true],[2,-14.0174,-56.064,-0.6981,".character#Character","arm_left_joint",49,1,0,0,false,false,1,10,true,152,0,0,0,0,0,false],[2,19.074,-30.3775,0.9948,".character#Character","hand_left_joint",50,4,1,0,false,false,1,10,true,60,-60,0,0,0,0,false],[2,27.2544,29.2692,0,".character#Character","leg_left_joint",51,7,6,0,false,false,1,10,true,-10,-149,0,0,0,0,false],[2,5.7864,79.8479,0,".character#Character","feet_left_joint",52,9,7,0,false,false,1,10,true,20,-20,0,0,0,0,false],[2,14.1489,-114.5257,0,".character#Character","head_joint",53,26,27,0,false,false,1,10,true,58,-64,0,0,0,0,false],[2,18.9096,30.1793,-0.2269,".character#Character","leg_right_joint",54,32,31,0,false,false,1,10,true,-10,-149,0,0,0,0,false],[2,5.7604,82.2903,0.1047,".character#Character","feet_right_joint",55,37,32,0,false,false,1,10,true,20,-20,0,0,0,0,false],[2,43.7436,-144.5307,0,".character#Character","eye_right_joint",56,41,26,0,false,false,1,10,true,0,0,0,0,0,0,false],[2,-17.2427,-56.7358,-0.5414,".character#Character","arm_right_joint",57,40,39,0,false,false,1,10,true,148.4753,0,0,0,0,0,false],[2,13.1311,-31.9098,1.1519,".character#Character","hand_right_joint",58,45,40,0,false,false,1,10,true,60,-60,0,0,0,0,false],[2,2.971,-99.1278,0.3665,".character#Character","shoulder_right_joint",59,39,27,0,false,false,1,10,true,180,-19,0,0,0,0,false],[2,23.0493,-145.5231,0,".character#Character","eye_left_joint",60,33,26,0,false,false,1,10,true,0,0,0,0,0,0,false],[2,8.9885,-101.41,0.3665,".character#Character","shoulder_left_joint",61,0,27,0,false,false,1,10,true,180,-19,0,0,0,0,false],[2,-17.3116,-124.3158,0,".character#Character","neck_joint",62,27,26,2,false,false,1,10,false,0,0,0.25,3,0,0,false],[2,-18.1464,-24.4077,0,".character#Character","belly_joint",63,27,25,0,false,false,1,10,true,10,-10,0,0,0,0,false],[2,-21.5971,-9.8608,0,".character#Character","thigh_right_joint",64,31,25,0,false,false,1,10,true,142,-16,0,0,0,0,false],[2,-16.5079,-14.1017,0,".character#Character","thigh_left_joint",65,6,25,0,false,false,1,10,true,142,-16,0,0,0,0,false],[2,-33.9561,119.4208,0.3665,".vehicle","j7",66,12,14,2,false,false,1,10,false,0,0,0.1,5.2,0,0,true],[2,-70.1945,38.0281,0.3665,".vehicle","j10",67,12,16,2,false,false,1,10,false,0,0,0.1,5.2,0,0,true],[2,11.2692,1.6048,0.3665,".vehicle","j1",68,12,13,0,false,false,1,10,true,0,0,0.1,5.2,0,0,true],[2,47.1031,83.0544,0.3665,".vehicle","j4",69,12,15,2,false,false,1,10,false,0,0,0.1,5.2,0,0,true],[2,-1.3975,122.7299,-0.1571,".vehicle","j6",70,12,18,2,false,false,1,10,false,0,0,0.1,5.2,0,0,true],[2,-73.5772,70.3609,-0.1571,".vehicle","j9",71,12,20,2,false,false,1,10,false,0,0,0.1,5.2,0,0,true],[2,50.5187,50.706,-0.1571,".vehicle","j3",72,12,19,2,false,false,1,10,false,0,0,0.1,5.2,0,0,true],[2,28.2671,109.3662,-0.6807,".vehicle","j5",73,12,22,2,false,false,1,10,false,0,0,0.1,5.2,0,0,true],[2,-60.3403,100.0532,-0.6807,".vehicle","j8",74,12,24,2,false,false,1,10,false,0,0,0.1,5.2,0,0,true],[2,-51.1519,11.181,-0.6807,".vehicle","j11",75,12,21,2,false,false,1,10,false,0,0,0.1,5.2,0,0,true],[2,37.3025,20.9837,-0.6807,".vehicle","j2",76,12,23,2,false,false,1,10,false,0,0,0.1,5.2,0,0,true],[2,18.2,-25.4188,0,".character#Character","grip_right_joint",77,45,13,2,false,false,1,10,false,0,0,0.5,8,0,0,true],[2,25,-24.9188,0,".character#Character","grip_left_joint",78,4,13,2,false,false,1,10,false,0,0,0.5,8,0,0,true],[2,21.1367,81.422,0,".vehicle","stabalize_right_joint",79,48,12,2,false,false,1,10,true,0,0,0.5,5,0,0,true],[2,-46.4002,72.5001,0,"","stabalize_left_joint",80,12,47,2,false,false,1,10,true,0,0,0.5,5,0,0,true],[2,-89.9195,-10.284,0,".character#Character","back_joint",81,27,47,2,false,false,1,10,false,0,0,0.5,7.2,0,0,true],[2,59.8384,-15.1112,0,".character#Character","front_joint",82,27,48,2,false,false,1,10,false,0,0,0.5,7.2,0,0,true],[2,-19.1015,-22.6337,0,".character#Character","sit_joint",83,25,12,2,false,false,1,10,false,0,0,0.5,6,0,0,true],[2,8.6746,88.4986,0,".character#Character","pedal_right_joint",84,12,37,0,false,false,1,10,false,0,0,0,0,0,0,true],[2,12.3235,89.35,0,".character#Character","pedal_left_joint",85,12,9,0,false,false,1,10,false,0,0,0,0,0,0,true],[2,-21.625,-1.346,0,".vehicle","j12",86,17,12,2,false,false,1,10,false,0,0,0.1,5.2,0,0,true],[2,-8.8429,-24.1318,0,".character#Character","sit_joint_2",87,27,12,2,false,false,1,10,false,0,0,0.5,6,0,0,true],[2,-17.7238,-52.7408,0,".character#Character","grip_right_spring",88,27,40,2,false,false,1,10,false,0,0,0.5,3,0,0,true],[2,-15.9032,-54.9433,0,".character#Character","grip_left_spring",89,27,1,2,false,false,1,10,false,0,0,0.5,3,0,0,true]]}',
    class: YogaBaller,
    library: PrefabManager.LIBRARY_ADMIN,
}
