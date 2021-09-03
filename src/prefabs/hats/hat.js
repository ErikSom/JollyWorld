import { b2LinearStiffness } from "../../../libs/debugdraw";
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
		bd.set_type(Box2D.b2_dynamicBody);
		bd.set_angularDamping(0.85);
		bd.set_linearDamping(0.85);
		bd.get_position().Set(this.head.GetPosition().x, this.head.GetPosition().y);
		bd.set_angle(this.head.GetAngle());
		this.hatBody = game.editor.CreateBody(bd);
		Box2D.destroy(bd);
	
		this.hatBody.isHat = true;
		this.hatBody.key = this.head.mySprite.data.prefabInstanceName

		const fixDef = new Box2D.b2FixtureDef();
		fixDef.density = 0.01;

		const shape = new Box2D.b2CircleShape();
		shape.set_m_radius(1.2);
		fixDef.set_shape(shape);
		this.hatBody.CreateFixture(fixDef);
		Box2D.destroy(shape);
		Box2D.destroy(fixDef);

		game.editor.setBodyCollision(this.hatBody, 7);
		this.hatBody.GetFixtureList().SetSensor(true);

		const hatWeldJointDef = new Box2D.b2WeldJointDef();
		hatWeldJointDef.Initialize(this.hatBody, this.head, this.hatBody.GetPosition());

		b2LinearStiffness(hatWeldJointDef, 60, 1.0, this.hatBody, this.head);


		hatWeldJointDef.set_collideConnected(false);

		this.hatWeldJoint = Box2D.castObject(game.editor.CreateJoint(hatWeldJointDef), Box2D.b2WeldJoint);

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
		game.editor.DestroyJoint(this.hatWeldJoint);
		this.hatBody.GetFixtureList().SetSensor(false);
		this.hatWeldJoint = null;
	}
	activate(){
	}
	update(){
	}
	flip(){
		this.hatBody.myTexture.scale.x *= -1;
		this.hatBody.myTexture.data.texturePositionOffsetAngle = -(this.hatBody.myTexture.data.texturePositionOffsetAngle+Math.PI/2) - Math.PI/2;
	}
	destroy(){
		this.detach();
		if(this.hatBody){
			this.hatBody.myTexture.parent.removeChild(this.hatBody.myTexture);
			game.editor.DestroyBody(this.hatBody);
			this.hatBody = null;
		}
	}
	detachFromVehicle(){
	}
	lean(dir){
	}
	accelerate(dir){
	}
}
