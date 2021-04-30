import * as PrefabBuilder from './PrefabBuilder';
import {
	game
} from "../Game";
import { Settings } from '../Settings';
import { disableCulling } from '../utils/PIXICuller';
const {b2Vec2, b2AABB, b2BodyDef, b2FixtureDef, b2PolygonShape, b2CircleShape} = Box2D;



const poolSize = 200;
const spritePool = [];
const activeParticles = [];

export const init = ()=> {
	for(let i = 0; i<poolSize; i++){
		const sprite = new PIXI.Sprite(PIXI.Texture.from('Gore_Meat10000'));
		disableCulling(sprite);
		sprite.data = {};
		spritePool.push(sprite);
	}
}

export const emit = (textures, worldPosition, amount, size, force, randomTexture = true, tints=[]) => {

	let force2 = force*2;
	size = size / Settings.PTM;
	for(let i = 0; i<amount; i++){
		const impulse = new Box2D.b2Vec2();

		let sprite, body;
		if(spritePool.length>0){

			const bodyDef = new b2BodyDef();
			bodyDef.set_type(Box2D.b2_dynamicBody);
			bodyDef.set_angularDamping(0.9);

			const fixDef = new Box2D.b2FixtureDef();
			fixDef.set_density(0.1);
			fixDef.set_friction(Settings.defaultFriction);
			fixDef.set_restitution(Settings.defaultRestitution);
			fixDef.get_filter().set_categoryBits(game.editor.MASKBIT_EVERYTHING_BUT_US);
			fixDef.get_filter().set_maskBits(game.editor.MASKBIT_NORMAL | game.editor.MASKBIT_FIXED | game.editor.MASKBIT_CHARACTER); //game.editor.MASKBIT_EVERYTHING_BUT_US | game.editor.MASKBIT_ONLY_US;

			const shape = new Box2D.b2CircleShape();
			shape.set_m_radius(size);

			fixDef.set_shape(shape);

			body = game.editor.CreateBody(bodyDef);
			body.CreateFixture(fixDef);

			sprite = spritePool.pop();
			sprite.myBody = body;
			body.mySprite = sprite;

			game.myEffectsContainer.addChild(sprite);
			disableCulling(sprite);
			activeParticles.push(sprite);

			Box2D.destroy(fixDef);
			Box2D.destroy(bodyDef);
			Box2D.destroy(shape);
		}else{
			// we grab a random active particle
			const randomSpriteIndex = Math.floor(Math.random()*activeParticles.length);
			sprite = activeParticles[randomSpriteIndex];
			body = sprite.myBody;
			body.GetFixtureList().GetShape().set_m_radius(size);
		}

		if(!randomTexture){
			sprite.texture = PIXI.Texture.from(textures[i%textures.length]+'0000');
		}else{
			sprite.texture = PIXI.Texture.from(textures[Math.round(Math.random()*textures.length)]+'0000');
		}

		sprite.lifeTime = Settings.physicsParticleLifeTime + Math.round(Settings.physicsParticleLifeTimeRandomOffset*Math.random());
		sprite.lifeDate = Date.now();

		sprite.pivot.x = sprite.width/2;
		sprite.pivot.y = sprite.height/2;

		body.SetTransform(worldPosition, body.GetAngle())

		sprite.x = worldPosition.get_x()*Settings.PTM;
		sprite.y = worldPosition.get_y()*Settings.PTM;

		impulse.Set(Math.random()*force2-force, Math.random()*force2-force)
		body.SetLinearVelocity(impulse)

		if(tints.length>0){
			sprite.tint = tints[Math.round(Math.random()*tints.length)];
		}

		Box2D.destroy(impulse);

	}
}

export const update = clean => {
	for(let i = 0; i<activeParticles.length; i++){
		const sprite = activeParticles[i];
		if(Date.now() - sprite.lifeDate > sprite.lifeTime || clean){
			if(!clean) game.editor.DestroyBody(sprite.myBody);
			delete sprite.myBody;

			sprite.parent.removeChild(sprite);
			activeParticles.splice(i, 1);
			spritePool.push(sprite);

			i--;
		}
	}
}
