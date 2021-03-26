import * as PrefabManager from '../PrefabManager';
import {Humanoid} from '../humanoids/Humanoid';

import { BaseVehicle } from './BaseVehicle';
import { Settings } from '../../Settings';
import * as Box2D from '../../../libs/Box2D'


class YogaBaller extends BaseVehicle {
    constructor(target) {
        super(target);
        this.destroyConnectedJoints = {
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
    }
    init() {
        super.init();
		this.leanSpeed = 2.0;
		this.pullJoints = [this.lookupObject.j5, this.lookupObject.j6, this.lookupObject.j7];
		this.pullBodies = [this.lookupObject.b5, this.lookupObject.b6, this.lookupObject.b7];

		this.yogaColorFilter = new PIXI.filters.ColorMatrixFilter();
		this.yogaColorFilter.grayscale(1.0);
		this.yogaColorFilter.alpha = 0;
		this.base.mySprite.filters = [this.yogaColorFilter];


		for(let i = 1; i<=this.steps; i++){
			this.lookupObject['b'+i].skipPush = true;
		}

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
		}

    }

	push(){

		const angle = this.base.GetAngle() - Settings.pihalve;
		const direction = new Box2D.b2Vec2(Math.cos(angle), Math.sin(angle));
		const impulse = 1200 * this.forceBuildup;

		const baseForce = direction.SelfMul(impulse);
		const fleshForce = direction.Clone().SelfMul(1.0);

		this.lookupObject._bodies.forEach(body=>{
			if(body.myFlesh) body.ApplyForceToCenter(fleshForce);
			else if(!body.skipPush) body.ApplyForceToCenter(baseForce);
		})
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
        // super.initContactListener();
        // const self = this;
        // this.contactListener.PreSolve = function(contact) {
        //     // disable collision with right leg
        //     const skateboardPartsToIgnore = [self.lookupObject.frame, self.lookupObject.wheel_front, self.lookupObject.wheel_back];
        //     if(skateboardPartsToIgnore.includes(contact.GetFixtureA().GetBody()) || skateboardPartsToIgnore.includes(contact.GetFixtureB().GetBody())){
        //         const other = skateboardPartsToIgnore.includes(contact.GetFixtureA().GetBody()) ? contact.GetFixtureB().GetBody() : contact.GetFixtureA().GetBody();
        //         if(other.mainCharacter && other.mySprite && ["feet_right", 'leg_right', 'thigh_right'].includes(other.mySprite.data.refName)){
        //             contact.SetEnabled(false);
        //         }
        //     }
        // }
    }
}

PrefabManager.prefabLibrary.YogaBaller = {
    json: '{"objects":[[0,0.117,-2.7704,0.4189,".character#Character , .flesh","shoulder_left",0,["#999999"],["#000"],[0],false,true,[[{"x":-0.1849,"y":-0.8588},{"x":0.1931,"y":-0.8424},{"x":0.1109,"y":0.8506},{"x":-0.1192,"y":0.8506}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[0,0.1936,-1.4912,-0.8203,".character#Character , .flesh","arm_left",1,["#999999"],["#000"],[0],false,true,[[{"x":-0.1356,"y":-0.6862},{"x":0.1438,"y":-0.7027},{"x":0.1274,"y":0.6945},{"x":-0.1356,"y":0.6945}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[1,3.9893,-82.798,0.4189,"","",2,"Normal_Shoulder0000",0,0.5731,-0.1606,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,6.1045,-44.714,-0.8203,"","",3,"Normal_Arm0000",1,0.2976,-0.8938,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,0.7495,-0.8176,-0.6807,".character#Character , .flesh","hand_left",4,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.5126],"",[1],true,false,false,[0.5],[0.2],false,true],[1,20.8658,-23.7468,-0.6807,"","",5,"Normal_Hand0000",4,1.7975,2.9104,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,0.0723,0.2157,-0.7854,".character#Character , .flesh","thigh_left",6,["#999999"],["#000"],[0],false,true,[[{"x":-0.2024,"y":-1.0313},{"x":0.196,"y":-1.0442},{"x":0.1703,"y":1.0378},{"x":-0.1639,"y":1.0378}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[0,0.5467,1.7938,0.4014,".character#Character , .flesh","leg_left",7,["#999999"],["#000"],[0],false,true,[[{"x":-0.1606,"y":-0.9125},{"x":0.1606,"y":-0.9253},{"x":0.0835,"y":0.9125},{"x":-0.0835,"y":0.9253}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[1,2.1645,6.8843,-0.7854,"","",8,"Normal_Thigh0000",6,0.4132,-2.3665,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,0.3678,2.92,0.1047,".character#Character , .flesh","feet_left",9,["#999999"],["#000"],[0],false,true,[[{"x":-0.3532,"y":-0.2334},{"x":0.3593,"y":0},{"x":0.3593,"y":0.1229},{"x":-0.3655,"y":0.1106}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[1,16.2177,53.7365,0.4014,"","",10,"Normal_Leg0000",7,0.1988,-3.1416,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,11.708,86.2433,0.1047,"","",11,"Normal_Feet0000",9,1.5151,1.2143,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.4318,1.9712,0.3665,".vehicle","frame",12,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[4],[7],[20],"",[1],true,false,false,[0.5],[0.2],false,true],[0,0.3391,0.0229,0.3665,".vehicle","b1",13,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1.23],[7],[10],"",[1],true,false,false,[0.5],[0.2],false,true],[0,-1.1597,3.9479,0.3665,".vehicle","b7",14,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1.23],[7],[10],"",[1],true,false,false,[0.5],[0.2],false,true],[0,1.5224,2.728,0.3665,".vehicle","b4",15,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1.23],[7],[10],"",[1],true,false,false,[0.5],[0.2],false,true],[0,-2.3676,1.2348,0.3665,".vehicle","b10",16,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1.23],[7],[10],"",[1],true,false,false,[0.5],[0.2],false,true],[0,-0.7423,-0.0903,-0.1571,".vehicle","b12",17,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1.23],[7],[10],"",[1],true,false,false,[0.5],[0.2],false,true],[0,-0.0777,4.0582,-0.1571,".vehicle","b6",18,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1.23],[7],[10],"",[1],true,false,false,[0.5],[0.2],false,true],[0,1.6351,1.6607,-0.1571,".vehicle","b3",19,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1.23],[7],[10],"",[1],true,false,false,[0.5],[0.2],false,true],[0,-2.4766,2.3126,-0.1571,".vehicle","b9",20,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1.23],[7],[10],"",[1],true,false,false,[0.5],[0.2],false,true],[0,-1.7353,0.3523,-0.6807,".vehicle","b11",21,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1.23],[7],[10],"",[1],true,false,false,[0.5],[0.2],false,true],[0,0.9108,3.6091,-0.6807,".vehicle","b5",22,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1.23],[7],[10],"",[1],true,false,false,[0.5],[0.2],false,true],[0,1.199,0.6801,-0.6807,".vehicle","b2",23,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1.23],[7],[10],"",[1],true,false,false,[0.5],[0.2],false,true],[0,-2.0356,3.2934,-0.6807,".vehicle","b8",24,["#999999"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1.23],[7],[10],"",[1],true,false,false,[0.5],[0.2],false,true],[0,-0.7545,-0.6412,0,".character#Character , .flesh","belly",25,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[14.1815],"",[1],true,false,false,[0.5],[0.2],false,true],[0,0.5578,-4.7803,0,".character#Character , .flesh","head",26,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[30.3931],"",[1],true,false,false,[0.5],[0.2],false,true],[0,-0.1651,-2.3762,0.3142,".character#Character , .flesh","body",27,["#999999"],["#000"],[0],false,true,[[{"x":-0.5373,"y":1.2023},{"x":-0.4316,"y":-1.3697},{"x":-0.1497,"y":-1.8277},{"x":0.1321,"y":-1.7925},{"x":0.5549,"y":-1.1231},{"x":0.5549,"y":1.3081},{"x":0.0969,"y":1.8013},{"x":-0.2202,"y":1.8013}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[1,-19.1255,-27.2476,0.2,"","",28,"Normal_Belly0000",25,8.7468,1.1579,-0.2,false,"#FFFFFF",1,1,1,0,0,0,true],[1,-2.9492,-74.9413,0.3142,"","",29,"Normal_Core0000",27,4.1688,1.3835,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,18.8478,-145.5229,0,"","",30,"Normal_Head_Idle0000",26,2.9897,0.7854,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.1254,0.2409,-0.8552,".character#Character , .flesh","thigh_right",31,["#999999"],["#000"],[0],false,true,[[{"x":-0.2024,"y":-1.0313},{"x":0.196,"y":-1.0442},{"x":0.1703,"y":1.0378},{"x":-0.1639,"y":1.0378}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[0,0.3992,1.7911,0.2792,".character#Character , .flesh","leg_right",32,["#999999"],["#000"],[0],false,true,[[{"x":-0.1606,"y":-0.9125},{"x":0.1606,"y":-0.9253},{"x":0.0835,"y":0.9125},{"x":-0.0835,"y":0.9253}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[0,0.7471,-4.8758,0,".character#Character","eye_left",33,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.534],"",[1],true,false,false,[0.5],[0.2],false,true],[1,-3.7377,7.6396,-0.8552,"","",34,"Normal_Thigh0000",31,0.4132,-2.3665,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,11.7846,53.6783,0.2792,"","",35,"Normal_Leg0000",32,0.1988,-3.1416,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,22.5824,-146.8088,0,"","",36,"Normal_Eye0000",33,0.5612,1.2636,0,null,"#FFFFFF",1,1,1,0,0,0,true],[0,0.3388,2.9267,0.1047,".character#Character , .flesh","feet_right",37,["#999999"],["#000"],[0],false,true,[[{"x":-0.3532,"y":-0.2334},{"x":0.3593,"y":0},{"x":0.3593,"y":0.1229},{"x":-0.3655,"y":0.1106}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[1,10.838,86.4443,0.1047,"","",38,"Normal_Feet0000",37,1.5151,1.2143,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.1556,-2.7425,0.4537,".character#Character , .flesh","shoulder_right",39,["#999999"],["#000"],[0],false,true,[[{"x":-0.1849,"y":-0.8588},{"x":0.1931,"y":-0.8424},{"x":0.1109,"y":0.8506},{"x":-0.1192,"y":0.8506}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[0,-0.0304,-1.5188,-0.8028,".character#Character , .flesh","arm_right",40,["#999999"],["#000"],[0],false,true,[[{"x":-0.1356,"y":-0.6862},{"x":0.1438,"y":-0.7027},{"x":0.1274,"y":0.6945},{"x":-0.1356,"y":0.6945}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[0,1.4316,-4.8659,0,".character#Character","eye_right",41,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.534],"",[1],true,false,false,[0.5],[0.2],false,true],[1,43.1174,-146.5118,0,"","",42,"Normal_Eye0000",41,0.5612,1.2636,0,null,"#FFFFFF",1,1,1,0,0,0,true],[1,-4.1999,-81.9445,0.4537,"","",43,"Normal_Shoulder0000",39,0.5731,-0.1606,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,-0.6159,-45.5368,-0.8028,"","",44,"Normal_Arm0000",40,0.2976,-0.8938,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,0.5519,-0.882,-0.9425,".character#Character , .flesh","hand_right",45,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.5126],"",[1],true,false,false,[0.5],[0.2],false,true],[1,15.1951,-25.2864,-0.9425,"","",46,"Normal_Hand0000",45,1.7975,2.9104,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-1.9078,2.4506,0,".vehicle","stabalize_left",47,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[4],[7],[24.1081],"",[0],true,false,false,[0.5],[0.2],false,true],[0,0.9909,2.6674,0,".vehicle","stabalize_right",48,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[3],[7],[24.1081],"",[0],true,false,false,[0.5],[0.2],false,true],[2,-9.665,-59.0785,-0.6981,".character#Character","arm_left_joint",49,1,0,0,false,false,1,10,true,152,0,0,0,0,0,false],[2,18.2328,-33.7672,0.9948,".character#Character","hand_left_joint",50,4,1,0,false,false,1,10,true,60,-60,0,0,0,0,false],[2,26.4142,28.2856,0,".character#Character","leg_left_joint",51,7,6,0,false,false,1,10,true,-10,-149,0,0,0,0,false],[2,4.9462,78.8643,0,".character#Character","feet_left_joint",52,9,7,0,false,false,1,10,true,20,-20,0,0,0,0,false],[2,13.3087,-115.5093,0,".character#Character","head_joint",53,26,27,0,false,false,1,10,true,58,-64,0,0,0,0,false],[2,18.0694,29.1957,-0.2269,".character#Character","leg_right_joint",54,32,31,0,false,false,1,10,true,-10,-149,0,0,0,0,false],[2,4.9202,81.3067,0.1047,".character#Character","feet_right_joint",55,37,32,0,false,false,1,10,true,20,-20,0,0,0,0,false],[2,42.9034,-145.5143,0,".character#Character","eye_right_joint",56,41,26,0,false,false,1,10,true,0,0,0,0,0,0,false],[2,-14.5642,-60.8611,0.5061,".character#Character","arm_right_joint",57,40,39,0,false,false,1,10,true,152,0,0,0,0,0,false],[2,11.1798,-34.3075,1.1519,".character#Character","hand_right_joint",58,45,40,0,false,false,1,10,true,60,-60,0,0,0,0,false],[2,-0.2014,-98.7163,0.3665,".character#Character","shoulder_right_joint",59,39,27,0,false,false,1,10,true,180,-19,0,0,0,0,false],[2,22.2091,-146.5067,0,".character#Character","eye_left_joint",60,33,26,0,false,false,1,10,true,0,0,0,0,0,0,false],[2,6.5917,-101.0517,0.3665,".character#Character","shoulder_left_joint",61,0,27,0,false,false,1,10,true,180,-19,0,0,0,0,false],[2,-18.1518,-125.2994,0,".character#Character","neck_joint",62,27,26,2,false,false,1,10,false,0,0,0.25,3,0,0,false],[2,-18.9866,-25.3913,0,".character#Character","belly_joint",63,27,25,0,false,false,1,10,true,10,-10,0,0,0,0,false],[2,-22.4373,-10.8444,0,".character#Character","thigh_right_joint",64,31,25,0,false,false,1,10,true,142,-16,0,0,0,0,false],[2,-17.3481,-15.0853,0,".character#Character","thigh_left_joint",65,6,25,0,false,false,1,10,true,142,-16,0,0,0,0,false],[2,-34.7963,118.4372,0.3665,".vehicle","j7",66,12,14,2,false,false,1,10,false,0,0,0.1,5.2,0,0,true],[2,-71.0347,37.0445,0.3665,".vehicle","j10",67,12,16,2,false,false,1,10,false,0,0,0.1,5.2,0,0,true],[2,10.429,0.6212,0.3665,".vehicle","j1",68,12,13,0,false,false,1,10,true,0,0,0.1,5.2,0,0,true],[2,46.2629,82.0708,0.3665,".vehicle","j4",69,12,15,2,false,false,1,10,false,0,0,0.1,5.2,0,0,true],[2,-2.2377,121.7463,-0.1571,".vehicle","j6",70,12,18,2,false,false,1,10,false,0,0,0.1,5.2,0,0,true],[2,-74.4174,69.3773,-0.1571,".vehicle","j9",71,12,20,2,false,false,1,10,false,0,0,0.1,5.2,0,0,true],[2,49.6785,49.7224,-0.1571,".vehicle","j3",72,12,19,2,false,false,1,10,false,0,0,0.1,5.2,0,0,true],[2,27.4269,108.3826,-0.6807,".vehicle","j5",73,12,22,2,false,false,1,10,false,0,0,0.1,5.2,0,0,true],[2,-61.1805,99.0696,-0.6807,".vehicle","j8",74,12,24,2,false,false,1,10,false,0,0,0.1,5.2,0,0,true],[2,-51.9921,10.1974,-0.6807,".vehicle","j11",75,12,21,2,false,false,1,10,false,0,0,0.1,5.2,0,0,true],[2,36.4623,20.0001,-0.6807,".vehicle","j2",76,12,23,2,false,false,1,10,false,0,0,0.1,5.2,0,0,true],[2,17.3598,-26.4024,0,".character#Character","grip_right_joint",77,45,13,2,false,false,1,10,false,0,0,0.5,8,0,0,true],[2,24.1598,-25.9024,0,".character#Character","grip_left_joint",78,4,13,2,false,false,1,10,false,0,0,0.5,8,0,0,true],[2,20.2965,80.4384,0,".vehicle","stabalize_right_joint",79,48,12,2,false,false,1,10,true,0,0,0.5,5,0,0,true],[2,-47.2404,71.5165,0,"","stabalize_left_joint",80,12,47,2,false,false,1,10,true,0,0,0.5,5,0,0,true],[2,-90.7597,-11.2676,0,".character#Character","back_joint",81,27,47,2,false,false,1,10,false,0,0,0.5,7.2,0,0,true],[2,58.9982,-15.9185,0,".character#Character","front_joint",82,27,48,2,false,false,1,10,false,0,0,0.5,7.2,0,0,true],[2,-19.9417,-23.6173,0,".character#Character","sit_joint",83,25,12,2,false,false,1,10,false,0,0,0.5,6,0,0,true],[2,7.8344,87.515,0,"","pedal_right_joint",84,12,37,0,false,false,1,10,false,0,0,0,0,0,0,true],[2,11.4833,88.3664,0,".character#Character","pedal_left_joint",85,12,9,0,false,false,1,10,false,0,0,0,0,0,0,true],[2,-22.4652,-2.3296,0,".vehicle","j12",86,17,12,2,false,false,1,10,false,0,0,0.1,5.2,0,0,true],[2,-9.6831,-25.1154,0,".character#Character","sit_joint_2",87,27,12,2,false,false,1,10,false,0,0,0.5,6,0,0,true]]}',
    class: YogaBaller,
    library: PrefabManager.LIBRARY_ADMIN,
}
