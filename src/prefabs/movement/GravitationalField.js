
import * as PrefabManager from '../PrefabManager';
import * as Box2D from '../../../libs/Box2D';
import {
    game
} from "../../Game";

let circularTextureMaterial;

class GravitationalField extends PrefabManager.basePrefab {
    constructor(target) {
		super(target);

		this.forceField = this.lookupObject['forcefield_body'];
		this.forceField.myTileSprite.fixTextureRotation = true;
		this.forceField.myTileSprite.pluginName = 'meshCircleTexture';
		this.forceField.ignoreCasts = true;

		this.width = this.height = 200;
		this.fieldBodies = [];
    }
    init() {
		super.init();
		this.setDisableGravity(this.prefabObject.settings.disableGravity);
		this.disableGravity = this.prefabObject.settings.disableGravity;
		this.direction = this.prefabObject.settings.direction;
		this.force = this.prefabObject.settings.force;
		this.push = this.prefabObject.settings.push;
		this.damping = this.prefabObject.settings.damping;
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

		body.myTileSprite.pluginName = 'meshCircleTexture';

		this.setDisableGravity(this.prefabObject.settings.disableGravity);

	}
	set(property, value) {
		super.set(property, value);
        switch (property) {
			case 'disableGravity':
				this.setDisableGravity(value);
				break;
			case 'radius':
				this.setWidthHeight(value, value);
			break
			case 'isVisible':
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
		this.fieldBodies.forEach(body=>{

			if(this.disableGravity) body.SetGravityScale(0.0);
			body.SetLinearDamping(this.damping);
			body.SetAngularDamping(this.damping);

			const diff = body.GetPosition().Clone().SelfSub(this.forceField.GetPosition());
			const rad = Math.max(1.0, diff.LengthSquared()*2);

			const forceScalar = Math.sqrt(this.force);
			const forceValue = this.push ? forceScalar : -forceScalar;
			const force = new Box2D.b2Vec2((forceValue*diff.x)/rad, (forceValue*diff.y)/rad);

			body.ApplyLinearImpulse(force, body.GetPosition(), true);
		})
	}
}

GravitationalField.settings = Object.assign({}, GravitationalField.settings, {
    "disableGravity": true,
	"push": false,
	"force": 3.0,
	"damping": 1.0,
	"radius": 200,
	"isVisible": true,
});
GravitationalField.settingsOptions = Object.assign({}, GravitationalField.settingsOptions, {
	"radius":{
		min:10.0,
		max:3000.0,
		step:1.0
	},
	"disableGravity": true,
	"push": false,
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
	"isVisible": true
});


PrefabManager.prefabLibrary.GravitationalField = {
	json: '{"objects":[[0,0,0,0,"forcefield","forcefield_body",0,["#999999"],["#000"],[0.6],true,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[2],[100],"Ice1",[0],true,false,false,[0.5],[0.2]]]}',
    class: GravitationalField,
    library: PrefabManager.LIBRARY_MOVEMENT
}

const CIRCULAR_TEXTURE_FRAG_SHADER =
`
#define M_PI 3.1415926535897932384626433832795

varying vec2 vTextureCoord;
uniform vec4 uLight, uDark;

uniform sampler2D uSampler;

void main(void)
{
    vec2 pos = vTextureCoord;
    vec2 center = vec2(0.5, 0.5);
    vec2 delta = pos - center;

    float d = length(delta) * 3.;
    float a = 3. * atan(-delta.y, delta.x) / M_PI;

	vec2 rad = vec2(1.-d, a);

	vec4 texColor = texture2D(uSampler, rad);
	gl_FragColor.a = texColor.a * uLight.a;
	gl_FragColor.rgb = ((texColor.a - 1.0) * uDark.a + 1.0 - texColor.rgb) * uDark.rgb + texColor.rgb * uLight.rgb;
}
`;

class MeshCircleTextureRenderer extends PIXI.heaven.mesh.MeshHeavenRenderer {
	onContextChange() {
		const gl = this.renderer.gl;
		this.shader = new PIXI.Shader(gl, PIXI.heaven.mesh.MeshHeavenRenderer.vert, CIRCULAR_TEXTURE_FRAG_SHADER);
		this.shaderTrim = new PIXI.Shader(gl, PIXI.heaven.mesh.MeshHeavenRenderer.vert, PIXI.heaven.mesh.MeshHeavenRenderer.fragTrim);
	};
}
PIXI.WebGLRenderer.registerPlugin('meshCircleTexture', MeshCircleTextureRenderer);
