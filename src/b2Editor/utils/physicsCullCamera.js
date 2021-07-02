import { b2AddVec2, b2CloneVec2, b2MulVec2 } from "../../../libs/debugdraw";
import {
    game
} from "../../Game";
import {
    Settings
} from '../../Settings';

const { getPointer, NULL } = Box2D;

const vec1 = new Box2D.b2Vec2();

export const init = ()=>{
	const bd = new Box2D.b2BodyDef();
	bd.type = Box2D.b2_dynamicBody;
	game.editor.physicsCamera = game.editor.CreateBody(bd);
	game.editor.physicsCamera.SetSleepingAllowed(false);
	game.editor.physicsCamera.SetGravityScale(0);
	game.editor.physicsCamera.isPhysicsCamera = true;
	Box2D.destroy(bd);
}

export const update = ()=>{
	if(!game.editor.physicsCamera) return;

	if(game.editor.physicsCamera.cameraZoom != game.editor.editorSettingsObject.cameraZoom){
		game.editor.physicsCamera.reFixture = true;

		const body = game.editor.physicsCamera;

		let fixture;

		const fixturesToDestroy = [];
		for (fixture = body.GetFixtureList(); getPointer(fixture) !== getPointer(NULL); fixture = fixture.GetNext()) {
			fixturesToDestroy.push(fixture);
		}
		fixturesToDestroy.forEach(fixture => body.DestroyFixture(fixture));


		const fixDef = new Box2D.b2FixtureDef();

		const shape = new Box2D.b2CircleShape();
		const targetRadius = (Settings.targetResolution.x / 2) / Settings.PTM * game.editor.editorSettingsObject.physicsCameraSize;
		shape.set_m_radius(targetRadius / game.editor.editorSettingsObject.cameraZoom);

		fixDef.set_shape(shape);
		fixDef.set_isSensor(true);

		fixture = game.editor.physicsCamera.CreateFixture(fixDef);
		Box2D.destroy(shape);
		Box2D.destroy(fixDef);

		// also collide with only similar objects
		const filterData = fixture.GetFilterData();
		filterData.set_categoryBits(game.editor.MASKBIT_PHYSICS_CULL);
		filterData.set_maskBits(game.editor.MASKBIT_NORMAL | game.editor.MASKBIT_FIXED | game.editor.MASKBIT_CHARACTER | game.editor.MASKBIT_EVERYTHING_BUT_US | game.editor.MASKBIT_ONLY_US | game.editor.MASKBIT_NOTHING | game.editor.MASKBIT_NPC);
		fixture.SetFilterData(filterData);

		game.editor.physicsCamera.cameraZoom = game.editor.editorSettingsObject.cameraZoom;
		delete game.editor.physicsCamera.reFixture;
	}

	if(game.cameraFocusObject && !game.cameraFocusObject.destroyed){
		const targetPosition = vec1;
		targetPosition.Set(game.cameraFocusObject.GetPosition().x, game.cameraFocusObject.GetPosition().y);
		game.editor.physicsCamera.SetTransform(targetPosition, 0);
	}else{
		let cameraX = -(game.editor.cameraHolder.x / game.editor.cameraHolder.scale.x - (window.innerWidth / 2 / game.editor.cameraHolder.scale.x)) / Settings.PTM;
		let cameraY = -(game.editor.cameraHolder.y / game.editor.cameraHolder.scale.y - (window.innerHeight / 2 / game.editor.cameraHolder.scale.y)) / Settings.PTM;
		const targetPosition = new Box2D.b2Vec2(cameraX, cameraY);
		game.editor.physicsCamera.SetTransform(targetPosition, 0);
	}
}

export const beginContact = contact => {
	const otherFixture = contact.GetFixtureA().GetBody().isPhysicsCamera ? contact.GetFixtureB() : contact.GetFixtureA();
	const otherBody = otherFixture.GetBody();

	if(otherBody.mySprite){

		const isPrefab = otherBody.mySprite.data.prefabInstanceName;

		let allowAwake;
		if(!isPrefab) allowAwake = otherBody.mySprite.data.awake;
		else{
			const prefab = game.editor.activePrefabs[otherBody.mySprite.data.prefabInstanceName];
			allowAwake = (prefab.settings.isAwake === undefined || prefab.settings.isAwake);
		}

		if(allowAwake){
			otherBody.SetAwake(true);
			otherBody.InCameraView = true;
		}
	}
}

export const endContact = contact => {
	const otherFixture = contact.GetFixtureA().GetBody().isPhysicsCamera ? contact.GetFixtureB() : contact.GetFixtureA();
	const otherBody = otherFixture.GetBody();

	if(otherBody.mySprite && game.editor.physicsCamera && !game.editor.physicsCamera.reFixture){
		if(otherBody.mySprite.data.awake && otherBody.IsAwake() && otherBody.GetType() !== Box2D.b2_staticBody && !otherBody.ignorePhysicsCuller){
			delete otherBody.InCameraView;

			const connectedBodies = [otherBody];
			otherBody.jointCrawled = true;
			const crawledJoints = [];

			const crawlJoints = body => {
				for (let jointEdge = body.GetJointList(); getPointer(jointEdge) !== getPointer(NULL); jointEdge = jointEdge.get_next()) {
					const joint = jointEdge.joint;
					if(!joint.jointCrawled){
						joint.jointCrawled = true;
						crawledJoints.push(joint);
						const bodyA = joint.GetBodyA();
						if(!bodyA.jointCrawled){
							bodyA.jointCrawled = true;
							bodyA.isVehiclePart = true;
							connectedBodies.push(bodyA);
							crawlJoints(bodyA);
						}
						const bodyB = joint.GetBodyB();
						if(!bodyB.jointCrawled){
							bodyB.jointCrawled = true;
							bodyB.isVehiclePart = true;
							connectedBodies.push(bodyB);
							crawlJoints(bodyB);
						}
					}
				}
			}

			crawlJoints(otherBody);

			let canFreeze = true;

			connectedBodies.forEach(body => {
				if(body.InCameraView) canFreeze = false;
			});

			if(canFreeze){
				otherBody.SetAwake(false);
			}

			connectedBodies.forEach(body => {
				if(!body.ignorePhysicsCuller && canFreeze) body.SetAwake(false);
				delete body.jointCrawled;
			});
			crawledJoints.forEach(joint => {
				delete joint.jointCrawled;
			});
		}
	}
}
