import * as PrefabManager from '../PrefabManager';
import {
    game
} from "../../Game";
import { Settings } from '../../Settings';
import { b2CloneVec2, b2MulVec2 } from '../../../libs/debugdraw';

const PIXI = require('pixi.js');

const TOP_RIGHT = 0;
const BOTTOM_RIGHT = 1;
const BOTTOM_LEFT = 2;
const TOP_LEFT = 3;

const { getPointer, NULL } = Box2D; // emscriptem specific

class Treadmill extends PrefabManager.basePrefab {

    constructor(target) {
		super(target);
		this.base = this.lookupObject['base'];
		this.wheelSize = 42;
		this.wheelCircumference = 2 * Math.PI * (this.wheelSize/2);
		this.edgeLeft = null;
		this.edgeRight = null;
		this.edgeBottom = null;
		this.edgeTop = null;
		this.edgeCenter = null;

		let count = 0;

		for (let fixture = this.base.GetFixtureList(); getPointer(fixture) !== getPointer(NULL); fixture = fixture.GetNext()) {
			if(count === 0) this.edgeLeft = fixture;
			if(count === 1) this.edgeRight = fixture;
			if(count === 2) this.edgeBottom = fixture;
			if(count === 3) this.edgeTop = fixture;
			if(count === 4) this.edgeCenter = fixture;

			if(count<=3){
				fixture.SetSensor(true);
			}
			count++;
		}

		this.edgeCenterP1X = Box2D.castObject(this.edgeCenter.GetShape(), Box2D.b2PolygonShape).get_m_vertices(TOP_RIGHT).get_x();
		this.edgeCenterP2X = Box2D.castObject(this.edgeCenter.GetShape(), Box2D.b2PolygonShape).get_m_vertices(BOTTOM_RIGHT).get_x();

		this.edgeTopP1X = Box2D.castObject(this.edgeTop.GetShape(), Box2D.b2PolygonShape).get_m_vertices(TOP_RIGHT).get_x();
		this.edgeTopP2X = Box2D.castObject(this.edgeTop.GetShape(), Box2D.b2PolygonShape).get_m_vertices(BOTTOM_RIGHT).get_x();

		this.edgeBottomP1X = Box2D.castObject(this.edgeBottom.GetShape(), Box2D.b2PolygonShape).get_m_vertices(TOP_RIGHT).get_x();
		this.edgeBottomP2X = Box2D.castObject(this.edgeBottom.GetShape(), Box2D.b2PolygonShape).get_m_vertices(BOTTOM_RIGHT).get_x();


		this.edgeRightP1X = Box2D.castObject(this.edgeRight.GetShape(), Box2D.b2PolygonShape).get_m_vertices(TOP_RIGHT).get_x();
		this.edgeRightP2X = Box2D.castObject(this.edgeRight.GetShape(), Box2D.b2PolygonShape).get_m_vertices(BOTTOM_RIGHT).get_x();
		this.edgeRightP3X = Box2D.castObject(this.edgeRight.GetShape(), Box2D.b2PolygonShape).get_m_vertices(BOTTOM_LEFT).get_x();
		this.edgeRightP4X = Box2D.castObject(this.edgeRight.GetShape(), Box2D.b2PolygonShape).get_m_vertices(TOP_LEFT).get_x();

		// 0 top right
		// 1 bottom right
		// 2 bottom left
		// 4 top left

		//

		// texture indexes
		// 0 edge left
		// 1 center
		// 2 wheel 1
		// 3 edge right
		// 4 wheel 2
		// 5 wheel 3
		this.textureContainer = this.base.myTexture;
		this.textureEdgeCenter = this.textureContainer.children[1];
		this.textureWheel = this.textureContainer.children[2];
		this.textureWheel2 = this.textureContainer.children[4];
		this.textureWheel3 = this.textureContainer.children[5];
		this.textureEdgeRight = this.textureContainer.children[3];
		this.createdTextures = [];
		this.wheelTextures = [this.textureWheel, this.textureWheel2, this.textureWheel3];


		this.textureEdgeCenterStartWidth = this.textureEdgeCenter.width;
		this.textureEdgeCenterPositionX = this.textureEdgeCenter.x;
		this.startEdgeCenterPositionX = this.textureEdgeCenter.x;
		this.startEdgeRightPositionX = this.textureEdgeRight.x;

		this.edgeCollisionTick = 0;
		this.edgeCollisionTicks = [];

		this.setWheels(this.prefabObject.settings?.wheels || 5);

		this.impulseQueue = [];

	}

	setWheels(wheels){
		const startingWheels = 3;
		wheels -= startingWheels;
		const targetWheelSize = this.wheelSize*wheels;
		const targetWheelSizePTM = targetWheelSize / Settings.PTM;
		const fixtures = [this.edgeLeft, this.edgeRight, this.edgeBottom, this.edgeTop, this.edgeCenter];

		let shape = Box2D.castObject(this.edgeCenter.GetShape(), Box2D.b2PolygonShape);
		shape.get_m_vertices(TOP_RIGHT).set_x(this.edgeCenterP1X + targetWheelSizePTM);
		shape.get_m_vertices(BOTTOM_RIGHT).set_x(this.edgeCenterP2X + targetWheelSizePTM);

		shape = Box2D.castObject(this.edgeTop.GetShape(), Box2D.b2PolygonShape);
		shape.get_m_vertices(TOP_RIGHT).set_x(this.edgeTopP1X + targetWheelSizePTM);
		shape.get_m_vertices(BOTTOM_RIGHT).set_x(this.edgeTopP2X + targetWheelSizePTM);

		shape = Box2D.castObject(this.edgeBottom.GetShape(), Box2D.b2PolygonShape);
		shape.get_m_vertices(TOP_RIGHT).set_x(this.edgeBottomP1X + targetWheelSizePTM);
		shape.get_m_vertices(BOTTOM_RIGHT).set_x(this.edgeBottomP2X + targetWheelSizePTM);

		shape = Box2D.castObject(this.edgeRight.GetShape(), Box2D.b2PolygonShape);
		shape.get_m_vertices(TOP_RIGHT).set_x(this.edgeRightP1X + targetWheelSizePTM);
		shape.get_m_vertices(BOTTOM_RIGHT).set_x(this.edgeRightP2X + targetWheelSizePTM);
		shape.get_m_vertices(BOTTOM_LEFT).set_x(this.edgeRightP3X + targetWheelSizePTM);
		shape.get_m_vertices(TOP_LEFT).set_x(this.edgeRightP4X + targetWheelSizePTM);

		fixtures.forEach(fixture=>{
			const shape = Box2D.castObject(fixture.GetShape(), Box2D.b2PolygonShape);

			const b2Vec2Arr = [];
            for (let vertexIx = 0; vertexIx < shape.get_m_count(); vertexIx++) {
                const vertex = shape.get_m_vertices(vertexIx);
                b2Vec2Arr.push({x: vertex.get_x(), y: vertex.get_y()});
            }

			const fixDef = new Box2D.b2FixtureDef();
			fixDef.set_density(fixture.GetDensity());
			fixDef.set_friction(fixture.GetFriction());
			fixDef.set_restitution(fixture.GetRestitution());
			fixDef.set_isSensor(fixture.IsSensor());

			const newShape = new Box2D.b2PolygonShape();
            newShape.Set(Box2D.pointsToVec2Array(b2Vec2Arr)[0], b2Vec2Arr.length);

			fixDef.set_shape(newShape);

			const newFixture = this.base.CreateFixture(fixDef);

			if(fixture === this.edgeCenter) this.edgeCenter = newFixture;
			if(fixture === this.edgeTop) this.edgeTop = newFixture;
			if(fixture === this.edgeBottom) this.edgeBottom = newFixture;
			if(fixture === this.edgeLeft) this.edgeLeft = newFixture;
			if(fixture === this.edgeRight) this.edgeRight = newFixture;

			this.base.DestroyFixture(fixture);
		});

		this.createdTextures.forEach(texture => {
			texture.parent.removeChild(texture);
		});
		this.createdTextures.length = 0;
		this.wheelTextures.length = 3;

		for(let i = 0; i< wheels; i++){
			const duplicatedCenter = new PIXI.Sprite(PIXI.Texture.from(this.textureEdgeCenter.texture.textureCacheIds[0]));
			this.textureEdgeCenter.addChild(duplicatedCenter);
			duplicatedCenter.x = -2+this.textureEdgeCenter.x + (i+1) * this.wheelSize;
			duplicatedCenter.y = this.textureEdgeCenter.y;
			duplicatedCenter.scale.x = 1.1;
			this.createdTextures.push(duplicatedCenter);


			const duplicatedWheel = new PIXI.Sprite(PIXI.Texture.from(this.textureWheel.texture.textureCacheIds[0]));
			duplicatedWheel.pivot.set(duplicatedWheel.width / 2, duplicatedWheel.height / 2);
			this.textureContainer.addChild(duplicatedWheel);
			duplicatedWheel.x = this.textureWheel.x + (i+startingWheels) * this.wheelSize;
			duplicatedWheel.y = 0;
			this.createdTextures.push(duplicatedWheel);
			this.wheelTextures.push(duplicatedWheel);
		}
		this.textureEdgeRight.x = this.startEdgeRightPositionX+targetWheelSize;
	}
	set(property, value) {
		super.set(property, value);
        switch (property) {
            case 'wheels':
                this.setWheels(value);
                break;
        }
    }

    init(){
        super.init();
        if(this.prefabObject.settings.isFixed){
            this.base.SetType(Box2D.b2_staticBody);
        }else{
            this.base.SetType(Box2D.b2_dynamicBody);
		}
		this.targetSpeedPTM = this.prefabObject.settings.wheelSpeed / Settings.PTM;
	}
	update(){
		super.update();

		const rotationSpeed = ((this.targetSpeedPTM / this.wheelCircumference) * Settings.pidouble) / Settings.targetFPS;

		//console.log("Left:", this.edgeLeftBodies.length, "Top:", this.edgeLeftBodies.length, "Right:", this.edgeRightBodies.length, "Bottom:", this.edgeBottomBodies.length);

		this.edgeCollisionTick++;

		// process impulse queue

		this.impulseQueue.forEach(impulseData => {
			const [body, force , point] = impulseData;
			body.ApplyForce(force, point, true);
			Box2D.destroy(force);
		});
		this.impulseQueue.length = 0;


		this.wheelTextures.forEach(wheel=>{
			wheel.rotation += rotationSpeed * game.editor.deltaTime * game.editor.RAD2DEG;
		})
	}

    initContactListener() {
		super.initContactListener();
		var self = this;
		this.contactListener.BeginContact = function (contact) {
			const treadmillFixture = [self.edgeBottom, self.edgeTop, self.edgeLeft, self.edgeRight].includes(contact.GetFixtureA()) ? contact.GetFixtureA() : contact.GetFixtureB();
			const otherBody = contact.GetFixtureA() == treadmillFixture ? contact.GetFixtureB().GetBody() :contact.GetFixtureA().GetBody();

			if(otherBody.edgeLeft === undefined) otherBody.edgeLeft = 0;
			if(otherBody.edgeRight === undefined) otherBody.edgeRight = 0;
			if(otherBody.edgeBottom === undefined) otherBody.edgeBottom = 0;
			if(otherBody.edgeTop === undefined) otherBody.edgeTop = 0;


			if(treadmillFixture === self.edgeLeft) otherBody.edgeLeft++;
			else if(treadmillFixture === self.edgeRight) otherBody.edgeRight++;
			else if(treadmillFixture === self.edgeBottom) otherBody.edgeBottom++;
			else if(treadmillFixture === self.edgeTop) otherBody.edgeTop++;
		}
		this.contactListener.EndContact = function (contact) {
			const treadmillFixture = [self.edgeBottom, self.edgeTop, self.edgeLeft, self.edgeRight].includes(contact.GetFixtureA()) ? contact.GetFixtureA() : contact.GetFixtureB();
			const otherBody = contact.GetFixtureA() == treadmillFixture ? contact.GetFixtureB().GetBody() :contact.GetFixtureA().GetBody();

			if(treadmillFixture === self.edgeLeft) otherBody.edgeLeft--;
			else if(treadmillFixture === self.edgeRight) otherBody.edgeRight--;
			else if(treadmillFixture === self.edgeBottom) otherBody.edgeBottom--;
			else if(treadmillFixture === self.edgeTop) otherBody.edgeTop--;

			if(otherBody.edgeLeft === 0) delete otherBody.edgeLeft;
			if(otherBody.edgeRight === 0) delete otherBody.edgeRight;
			if(otherBody.edgeBottom === 0) delete otherBody.edgeBottom;
			if(otherBody.edgeTop === 0) delete otherBody.edgeTop;
		}
		this.contactListener.PostSolve = function (contact, impulse){
			const otherBody = contact.GetFixtureA().GetBody() === self.base ? contact.GetFixtureB().GetBody() : contact.GetFixtureA().GetBody();

			const worldManifold = new Box2D.b2WorldManifold();
			contact.GetWorldManifold(worldManifold);
			const worldCollisionPoint = worldManifold.get_points(0);

			const rotationToVelocityTranslation = 30;
			const velocityToImpulseTranslation = 8;

			const targetVelocities = [];
			const targetDirections = [];
			if(otherBody.edgeTop){
				let angle = self.base.GetAngle();

				const velocity = new Box2D.b2Vec2(self.targetSpeedPTM * Math.cos(angle) * rotationToVelocityTranslation, self.targetSpeedPTM * Math.sin(angle) * rotationToVelocityTranslation);
				targetVelocities.push(velocity);
				targetDirections.push(0);
			}
			if(otherBody.edgeRight){
				let angle = self.base.GetAngle()+Settings.pihalve;

				const velocity = new Box2D.b2Vec2(self.targetSpeedPTM * Math.cos(angle) * rotationToVelocityTranslation, self.targetSpeedPTM * Math.sin(angle) * rotationToVelocityTranslation);
				targetVelocities.push(velocity);
				targetDirections.push(1);

			}
			if(otherBody.edgeBottom){
				let angle = self.base.GetAngle()+Math.PI;
				const velocity = new Box2D.b2Vec2(self.targetSpeedPTM * Math.cos(angle) * rotationToVelocityTranslation, self.targetSpeedPTM * Math.sin(angle) * rotationToVelocityTranslation);
				targetVelocities.push(velocity);
				targetDirections.push(2);
			}
			if(otherBody.edgeLeft){
				let angle = self.base.GetAngle()-Settings.pihalve;
				const velocity = new Box2D.b2Vec2(self.targetSpeedPTM * Math.cos(angle) * rotationToVelocityTranslation, self.targetSpeedPTM * Math.sin(angle) * rotationToVelocityTranslation);
				targetVelocities.push(velocity);
				targetDirections.push(3);
			}

			targetVelocities.forEach((targetVelocity, index) => {

				if(otherBody.GetType() == Box2D.b2_staticBody && !self.prefabObject.settings.isFixed) {


					const direction = targetDirections[index];
					if(self.edgeCollisionTicks[direction] != self.edgeCollisionTick){
						const force = targetVelocity;
						b2MulVec2(force, velocityToImpulseTranslation);
						b2MulVec2(force, self.base.GetMass());
						b2MulVec2(force, -1); // invert speed when applied to treadmill

						self.impulseQueue.push([self.base, b2CloneVec2(force), worldCollisionPoint]);

						self.edgeCollisionTicks[direction] = self.edgeCollisionTick;
					}
				}else{
					const current = otherBody.GetLinearVelocity();
					let applyForce = false;

					if(targetVelocity.get_x() < 0 && current.get_x() > targetVelocity.get_x()) applyForce = true;
					if(targetVelocity.get_x() > 0 && current.get_x() < targetVelocity.get_x()) applyForce = true;
					if(targetVelocity.get_y() < 0 && current.get_y() > targetVelocity.get_y()) applyForce = true;
					if(targetVelocity.get_y() > 0 && current.get_y() < targetVelocity.get_y()) applyForce = true;

					if(applyForce){
						const force = targetVelocity;
						b2MulVec2(force, velocityToImpulseTranslation);
						b2MulVec2(force, otherBody.GetMass());
						self.impulseQueue.push([otherBody, b2CloneVec2(force), worldCollisionPoint]);
					}
				}

				Box2D.destroy(targetVelocity);
			});

		}
    }
}

Treadmill.settings = Object.assign({}, Treadmill.settings, {
	"isFixed": false,
	"wheels":5,
	"wheelSpeed": 3,
});
Treadmill.settingsOptions = Object.assign({}, Treadmill.settingsOptions, {
	"isFixed": false,
	"wheels": {
        min: 3,
        max: 20,
        step: 1,
	},
	"wheelSpeed": {
        min: -10,
        max: 10,
        step: 0.1,
    }
});

PrefabManager.prefabLibrary.Treadmill = {
    json: JSON.stringify({"objects":[[0,0.005,0.014,0,"treadmill","base",0,["#999999","#999999","#999999","#999999","#999999"],["#000","#000","#000","#000","#000"],[0,0,0,0,0,0],false,true,[[{"x":-1.863,"y":0.715},{"x":-1.863,"y":-0.723},{"x":1.837,"y":-0.723},{"x":1.837,"y":0.715}],[{"x":-2.169,"y":-0.73},{"x":-2.169,"y":-1.048},{"x":2.199,"y":-1.048},{"x":2.199,"y":-0.73}],[{"x":-2.175,"y":1.052},{"x":-2.175,"y":0.734},{"x":2.189,"y":0.734},{"x":2.189,"y":1.052}],[{"x":1.85,"y":1.046},{"x":1.85,"y":-1.052},{"x":2.164,"y":-1.052},{"x":2.164,"y":1.046}],[{"x":-2.171,"y":1.053},{"x":-2.171,"y":-1.045},{"x":-1.857,"y":-1.045},{"x":-1.857,"y":1.053}]],[1,1,1,1,1],0,[0,0,0,0,0],"",[1,1,1,1,1],true,false,false,[0.5,0.5,0.5,0.5,0.5],[0.2,0.2,0.2,0.2,0.2]],[7,-0.143,-0.43,0,"treadmill","texture",1,["[1,-40.771,0.683,0,\"treadmill\",\"edge_left\",74,\"Treadmill_Edge0000\",null,null,null,null,false,\"#FFFFFF\",1,1,1,0,0,0,true]","[1,-0.118,0.683,0,\"treadmill\",\"middle_texture\",75,\"TreadmillRoll0000\",null,null,null,null,false,\"#FFFFFF\",1,1,1,0,0,0,true]","[1,-41.961,-0.457,0,\"treadmill\",\"wheel_texture1\",76,\"Treadmill_Wheel0000\",null,null,null,null,false,\"#FFFFFF\",1,1,1,0,0,0,true]","[1,41.041,0.683,3.142,\"treadmill\",\"edge_right\",77,\"Treadmill_Edge0000\",null,null,null,null,false,\"#FFFFFF\",1,1,1,0,0,0,true]","[1,-0.095,-0.26,0,\"treadmill\",\"wheel_texture2\",78,\"Treadmill_Wheel0000\",null,null,null,null,false,\"#FFFFFF\",1,1,1,0,0,0,true]","[1,41.905,-0.26,0,\"treadmill\",\"wheel_texture3\",79,\"Treadmill_Wheel0000\",null,null,null,null,false,\"#FFFFFF\",1,1,1,0,0,0,true]"],0,0.907,1.892,0,1,0,0,0,true]]}),
    class: Treadmill,
    library: PrefabManager.LIBRARY_MOVEMENT
}
