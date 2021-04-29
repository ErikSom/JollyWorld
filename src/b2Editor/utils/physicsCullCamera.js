import { b2AddVec2, b2CloneVec2, b2MulVec2 } from "../../../libs/debugdraw";
import {
    game
} from "../../Game";
import {
    Settings
} from '../../Settings';

const { getPointer, NULL } = Box2D;

export const init = ()=>{
	const bd = new Box2D.b2BodyDef();
	bd.type = Box2D.b2_kinematicBody;
	game.editor.physicsCamera = game.editor.CreateBody(bd);
	game.editor.physicsCamera.SetSleepingAllowed(false);
	game.editor.physicsCamera.isPhysicsCamera = true;
	Box2D.destroy(bd);
}

export const update = ()=>{
	if(!game.editor.physicsCamera) return;

	if(game.editor.physicsCamera.cameraZoom != game.editor.editorSettingsObject.cameraZoom){
		game.editor.physicsCamera.reFixture = true;

		const body = game.editor.physicsCamera;

		let fixture;
		for (fixture = body.GetFixtureList(); getPointer(fixture) !== getPointer(NULL); fixture = fixture.GetNext()) {
			body.DestroyFixture(fixture);
		}


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

	if(game.cameraFocusObject){
		const targetPosition = b2CloneVec2(game.cameraFocusObject.GetPosition());
		game.editor.physicsCamera.SetTransform(targetPosition, 0);
		Box2D.destroy(targetPosition);
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
			otherBody.SetAwake(false);
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

			connectedBodies.forEach(body => {
				if(!body.ignorePhysicsCuller) body.SetAwake(false);
				delete body.jointCrawled;
			});
			crawledJoints.forEach(joint => {
				delete joint.jointCrawled;
			});
		}
	}
}
