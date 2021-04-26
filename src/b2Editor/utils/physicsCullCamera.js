import {
    game
} from "../../Game";
import {
    Settings
} from '../../Settings';

export const init = ()=>{
	const bd = new Box2D.b2BodyDef();
	bd.type = Box2D.b2_kinematicBody;
	game.editor.physicsCamera = game.world.CreateBody(bd);
	game.editor.physicsCamera.SetSleepingAllowed(false);
}

export const update = ()=>{
	if(!game.editor.physicsCamera) return;

	if(game.editor.physicsCamera.cameraZoom != game.editor.editorSettingsObject.cameraZoom){
		game.editor.physicsCamera.reFixture = true;

		let fixture = game.editor.physicsCamera.GetFixtureList();
		if(fixture) game.editor.physicsCamera.DestroyFixture(fixture);

		const fixDef = new Box2D.b2FixtureDef;
		fixDef.shape = new Box2D.b2CircleShape;
		fixDef.isSensor = true;

		const targetRadius = (Settings.targetResolution.x / 2) / Settings.PTM * game.editor.editorSettingsObject.physicsCameraSize;
		fixDef.shape.SetRadius(targetRadius / game.editor.editorSettingsObject.cameraZoom);
		fixture = game.editor.physicsCamera.CreateFixture(fixDef);
		fixture.isPhysicsCamera = true;

		// also collide with only similar objects
		const filterData = fixture.GetFilterData();
		filterData.categoryBits = game.editor.MASKBIT_PHYSICS_CULL;
		filterData.maskBits = game.editor.MASKBIT_NORMAL | game.editor.MASKBIT_FIXED | game.editor.MASKBIT_CHARACTER | game.editor.MASKBIT_EVERYTHING_BUT_US | game.editor.MASKBIT_ONLY_US | game.editor.MASKBIT_NOTHING | game.editor.MASKBIT_NPC;
		fixture.SetFilterData(filterData);

		game.editor.physicsCamera.cameraZoom = game.editor.editorSettingsObject.cameraZoom;
		delete game.editor.physicsCamera.reFixture;
	}

	if(game.cameraFocusObject){
		const linearVelocity = game.cameraFocusObject.GetLinearVelocity().Clone().SelfMul(0);
		const targetPosition = game.cameraFocusObject.GetPosition().Clone().SelfAdd(linearVelocity);
		game.editor.physicsCamera.SetPosition(targetPosition);
	}
}

export const beginContact = contact => {
	const otherFixture = contact.GetFixtureA().isPhysicsCamera ? contact.GetFixtureB() : contact.GetFixtureA();
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
	const otherFixture = contact.GetFixtureA().isPhysicsCamera ? contact.GetFixtureB() : contact.GetFixtureA();
	const otherBody = otherFixture.GetBody();

	if(otherBody.mySprite && game.editor.physicsCamera && !game.editor.physicsCamera.reFixture){
		if(otherBody.mySprite.data.awake && otherBody.IsAwake() && otherBody.GetType() !== Box2D.b2_staticBody && !otherBody.ignorePhysicsCuller){
			otherBody.SetAwake(false);
			delete otherBody.InCameraView;

			const connectedBodies = [otherBody];
			otherBody.jointCrawled = true;
			const crawledJoints = [];

			const crawlJoints = body => {
				let jointEdge = body.GetJointList();
				while (jointEdge) {
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
					jointEdge = jointEdge.next;
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
