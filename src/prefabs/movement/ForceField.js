
import * as PrefabManager from '../PrefabManager';
import * as Box2D from '../../../libs/Box2D';
import {
    game
} from "../../Game";


class ForceField extends PrefabManager.basePrefab {
    constructor(target) {
		super(target);
		this.forceField = this.lookupObject['forcefield_body'];
		this.forceField.myTileSprite.fixTextureRotation = true;

		this.width = this.height = 200;

		this.fieldBodies = [];
    }
    init() {
		super.init();
		this.setDirection(this.prefabObject.settings.direction);
		this.setDisableGravity(this.prefabObject.settings.disableGravity);
		this.disableGravity = this.prefabObject.settings.disableGravity;
		this.direction = this.prefabObject.settings.direction;
		this.force = this.prefabObject.settings.force;
		this.damping = this.prefabObject.settings.damping;

	}
	setDirection(direction){
		this.forceField.myTileSprite.fixedTextureRotationOffset = (360-direction)*game.editor.DEG2RAD;
		this.forceField.myTileSprite.updateMeshVerticeRotation(true);
	}
	setDisableGravity(disabled){
		if(disabled) this.forceField.myTileSprite.tint = 0x00d8ff;
		else this.forceField.myTileSprite.tint = 0xffd200;
	}
	setVisible(visible){
		this.forceField.myTileSprite.visible = visible;
	}

	setWidthHeight(width, height){

		const body = this.forceField;

		const aabb = new Box2D.b2AABB;
		aabb.lowerBound = new Box2D.b2Vec2(Number.MAX_VALUE, Number.MAX_VALUE);
		aabb.upperBound = new Box2D.b2Vec2(-Number.MAX_VALUE, -Number.MAX_VALUE);

		const oldRot = body.GetAngle();
		body.SetAngle(0);
		let fixture = body.GetFixtureList();
		while (fixture != null) {
			aabb.Combine1(fixture.GetAABB(0));
			fixture = fixture.GetNext();
		}
		body.SetAngle(oldRot);

		this.width = width;
		this.height = height;

		var currentSize = {
			width: aabb.GetExtents().x * 2 * game.editor.PTM,
			height: aabb.GetExtents().y * 2 * game.editor.PTM
		}

		let scaleX = width / currentSize.width;
		let scaleY = height / currentSize.height;

		let oldFixtures = []
		fixture = body.GetFixtureList();
		while (fixture != null) {
			oldFixtures.push(fixture);
			if (fixture.GetShape() instanceof Box2D.b2CircleShape) {
				//oh shit we have a circle, must scale with aspect ratio
				if (Math.round(scaleX * 100) / 100 != 1) {
					scaleY = scaleX;
				} else {
					scaleX = scaleY;
				}
			}
			fixture = fixture.GetNext();
		}

		oldFixtures.reverse();

		for (let i = 0; i < oldFixtures.length; i++) {
			let fixture = oldFixtures[i];
			var shape = fixture.GetShape();
			if (shape instanceof Box2D.b2PolygonShape) {
				let oldVertices = shape.GetVertices();

				for (let j = 0; j < oldVertices.length; j++) {
					oldVertices[j].x = oldVertices[j].x * scaleX;
					oldVertices[j].y = oldVertices[j].y * scaleY;
				}
				shape.Set(oldVertices);

				oldVertices = body.mySprite.data.vertices[i];

				for (let j = 0; j < oldVertices.length; j++) {
					oldVertices[j].x = oldVertices[j].x * scaleX;
					oldVertices[j].y = oldVertices[j].y * scaleY;
				}

			} else if (shape instanceof Box2D.b2CircleShape) {
				shape.SetRadius(shape.GetRadius() * scaleX);
				body.mySprite.data.radius = body.mySprite.data.radius.map(r => r* scaleX);
			}
			fixture.DestroyProxies();
			fixture.CreateProxies(body.m_xf);

		};

		game.editor.updateBodyShapes(body);
		game.editor.updateTileSprite(body, true);
		this.setDirection(this.prefabObject.settings.direction);
		this.setDisableGravity(this.prefabObject.settings.disableGravity);

	}
	set(property, value) {
		super.set(property, value);
        switch (property) {
            case 'direction':
                this.setDirection(value);
				break;
			case 'disableGravity':
				this.setDisableGravity(value);
				break;
			case 'width':
				this.setWidthHeight(value, this.height);
			break
			case 'height':
				this.setWidthHeight(this.width, value);
			break
			case 'visible':
				this.setVisible(value);
			break
        }
	}
	initContactListener() {
        super.initContactListener();
        var self = this;
        this.contactListener.BeginContact = function (contact) {
			const bodies = [contact.GetFixtureA().GetBody(), contact.GetFixtureB().GetBody()];
			const otherBody = (bodies[0] == self.forceField) ? bodies[1] : bodies[0];

			if(!otherBody.isAffectedByForcefield){
				otherBody.oldLinearDamping = otherBody.GetLinearDamping();
				otherBody.oldAngularDamping = otherBody.GetAngularDamping();
			}
			self.fieldBodies.push(otherBody);
			if(otherBody.isAffectedByForcefield === undefined) otherBody.isAffectedByForcefield = 0;
			otherBody.isAffectedByForcefield++
        }
        this.contactListener.EndContact = function (contact) {
			const bodies = [contact.GetFixtureA().GetBody(), contact.GetFixtureB().GetBody()];
			const otherBody = (bodies[0] == self.forceField) ? bodies[1] : bodies[0];
			if(self.disableGravity) otherBody.SetGravityScale(1.0);
			otherBody.SetLinearDamping(otherBody.oldLinearDamping);
			otherBody.SetAngularDamping(otherBody.oldAngularDamping);
			self.fieldBodies = self.fieldBodies.filter(body => body !== otherBody);
			otherBody.isAffectedByForcefield--;
		}
	}

    update() {
		const direction = this.direction*game.editor.DEG2RAD;
		this.fieldBodies.forEach(body=>{

			if(this.disableGravity) body.SetGravityScale(0.0);
			body.SetLinearDamping(this.damping);
			body.SetAngularDamping(this.damping);

			const force = new Box2D.b2Vec2(this.force*Math.cos(direction), this.force*Math.sin(direction));
			body.ApplyForceToCenter(force, true);
		})
	}
}

ForceField.settings = Object.assign({}, ForceField.settings, {
    "disableGravity": true,
	"direction": 0,
	"force": 3.0,
	"damping": 1.0,
	"width": 200,
	"height": 200,
	"visible": true,
});
ForceField.settingsOptions = Object.assign({}, ForceField.settingsOptions, {
	"width":{
		min:10.0,
		max:3000.0,
		step:1.0
	},
	"height":{
		min:10.0,
		max:3000.0,
		step:1.0
	},
	"disableGravity": true,
	"direction": {
        min: 0.0,
        max: 360.0,
        step: 1.0
    },
    "force": {
        min: 0.0,
        max: 1000.0,
        step: 0.1
	},
	"damping":{
		min:0.0,
		max:20.0,
		step:0.01
	},
	"visible": true
});


PrefabManager.prefabLibrary.ForceField = {
    json: '{"objects":[[0,0,0,0,"forcefield","forcefield_body",0,["#FFFFFF"],["#FFFFFF"],[0.6],true,true,[[{"x":-3.3230424036184223,"y":3.319249149419366},{"x":-3.3230424036184223,"y":-3.3192491494193646},{"x":3.3230424036184223,"y":-3.3192491494193646},{"x":3.3230424036184223,"y":3.319249149419366}]],[1],2,[0],"TileArrow.jpg",[0]]]}',
    class: ForceField,
    library: PrefabManager.LIBRARY_MOVEMENT
}
