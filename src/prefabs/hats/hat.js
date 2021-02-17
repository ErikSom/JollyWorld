import * as Box2D from '../../../libs/Box2D'
import {
	game
} from "../../Game";

export default class Hat {
	constructor(character, head, body){
		this.character = character;
		this.head = head;
		this.body = body;
		this.hatBody = null;
		this.hatWeldJoint = null;
		this.hatOffsetLength = 0;
		this.hatOffsetAngle = 0;
		this.texture = "";
		this.blockControls = false;
	}
	attach(){
		const bd = new Box2D.b2BodyDef();
		bd.type = Box2D.b2BodyType.b2_dynamicBody;
		bd.angularDamping = 0.85;
		bd.linearDamping = 0.85;
		bd.position = this.head.GetPosition();
		bd.angle = this.head.GetAngle();
		this.hatBody = this.head.GetWorld().CreateBody(bd);
		this.hatBody.isHat = true;
		this.hatBody.key = this.head.mySprite.data.prefabInstanceName

		const fixDef = new Box2D.b2FixtureDef;
		fixDef.density = 0.01;
		fixDef.shape = new Box2D.b2CircleShape;
		fixDef.shape.SetRadius(1.2);
		this.hatBody.CreateFixture(fixDef);
		game.editor.setBodyCollision(this.hatBody, 7);
		this.hatBody.GetFixtureList().SetSensor(true);

		const hatWeldJointDef = new Box2D.b2WeldJointDef();
		hatWeldJointDef.Initialize(this.hatBody, this.head, this.hatBody.GetPosition());
		hatWeldJointDef.frequencyHz = 60;
		hatWeldJointDef.dampingRatio = 1.0;
		hatWeldJointDef.collideConnected = false;

		this.hatWeldJoint = this.head.GetWorld().CreateJoint(hatWeldJointDef);

		const textureObject = new game.editor.textureObject();
		textureObject.x = this.hatBody.GetPosition().x*game.editor.PTM;
		textureObject.y = this.hatBody.GetPosition().y*game.editor.PTM;
		textureObject.rotation = this.hatBody.GetAngle();
		textureObject.textureName = this.texture;
		textureObject.texturePositionOffsetLength = this.hatOffsetLength;
		textureObject.texturePositionOffsetAngle = this.hatOffsetAngle;
		textureObject.textureAngleOffset = 0;

		const texture = game.editor.buildTextureFromObj(textureObject);

		let targetTextureSwap = this.head.myTexture;
		if(this.character.lookupObject.eye_left) targetTextureSwap = this.character.lookupObject.eye_left.myTexture;
		if(this.character.lookupObject.eye_right) targetTextureSwap = this.character.lookupObject.eye_right.myTexture;

		texture.parent.addChildAt(texture, texture.parent.getChildIndex(targetTextureSwap)+1);

		this.hatBody.myTexture = texture;
	}
	detach(){
		this.hatBody.GetWorld().DestroyJoint(this.hatWeldJoint);
		this.hatBody.GetFixtureList().SetSensor(false);
		this.hatWeldJoint = null;
	}
	activate(){
	}
	update(){
	}
	flip(){
		this.hatBody.myTexture.scale.x *= -1;
	}
	destroy(){
	}
	detachFromVehicle(){
	}
	lean(dir){
	}
	accelerate(dir){
	}
}
