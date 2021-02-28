import {
    game
} from "../../Game";
import {
    Settings
} from '../../Settings';
import * as Box2D from '../../../libs/Box2D'

export const init = ()=>{
	const bd = new Box2D.b2BodyDef();
	bd.type = Box2D.b2BodyType.b2_kinematicBody;
	game.editor.physicsCamera = game.world.CreateBody(bd);
	game.editor.physicsCamera.SetSleepingAllowed(false);
}

export const update = ()=>{
	if(game.editor.physicsCamera.cameraZoom != game.editor.editorSettingsObject.cameraZoom){
		let fixture = game.editor.physicsCamera.GetFixtureList();
		if(fixture) game.editor.physicsCamera.DestroyFixture(fixture);

		const fixDef = new Box2D.b2FixtureDef;
		fixDef.shape = new Box2D.b2CircleShape;
		fixDef.isSensor = true;

		const targetRadius = (Settings.targetResolution.x / 2) / Settings.PTM * game.editor.editorSettingsObject.physicsCameraSize;
		fixDef.shape.SetRadius(targetRadius);
		fixture = game.editor.physicsCamera.CreateFixture(fixDef);
		fixture.isPhysicsCamera = true;
		game.editor.physicsCamera.cameraZoom = game.editor.editorSettingsObject.cameraZoom;
	}

	if(game.cameraFocusObject){
		game.editor.physicsCamera.SetPosition(game.cameraFocusObject.GetPosition());
	}
}

export const beginContact = contact => {
	const otherFixture = contact.GetFixtureA().isPhysicsCamera ? contact.GetFixtureB() : contact.GetFixtureA();
	const otherBody = otherFixture.GetBody();

	if(otherBody.mySprite){
		if(otherBody.mySprite.data.awake){
			otherBody.SetAwake(true);
			otherBody.InCameraView = true;
		}
	}
}

export const endContact = contact => {
	const otherFixture = contact.GetFixtureA().isPhysicsCamera ? contact.GetFixtureB() : contact.GetFixtureA();
	const otherBody = otherFixture.GetBody();

	if(otherBody.mySprite){
		if(otherBody.mySprite.data.awake && otherBody.IsAwake()){
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
				body.SetAwake(false);
				delete body.jointCrawled;
			});
			crawledJoints.forEach(joint => {
				delete joint.jointCrawled;
			});
		}
	}
}
