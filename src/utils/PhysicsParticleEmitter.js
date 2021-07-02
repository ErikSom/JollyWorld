import * as PrefabBuilder from './PrefabBuilder';
import {
	game
} from "../Game";
import { Settings } from '../Settings';
import { disableCulling } from '../utils/PIXICuller';
import { b2CloneVec2 } from '../../libs/debugdraw';
const {b2Vec2, b2AABB, b2BodyDef, b2FixtureDef, b2PolygonShape, b2CircleShape} = Box2D;

const vec1 = new Box2D.b2Vec2();
const vec2 = new Box2D.b2Vec2();

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

export const emit = (textures, worldPosition, amount, size, force, randomTexture = true, tints=[], rotation=0, offset=[0,0]) => {

	let force2 = force*2;
	size = size / Settings.PTM;
	for(let i = 0; i<amount; i++){
		const impulse = vec1;

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
			const randomTexture = textures[Math.floor(Math.random()*textures.length)];
			sprite.texture = PIXI.Texture.from(randomTexture+'0000');
		}

		sprite.lifeTime = Settings.physicsParticleLifeTime + Math.round(Settings.physicsParticleLifeTimeRandomOffset*Math.random());
		sprite.lifeDate = Date.now();

		sprite.pivot.x = sprite.width/2;
		sprite.pivot.y = sprite.height/2;

		const targetPosition = vec2;
		targetPosition.Set(worldPosition.x, worldPosition.y);

		if(offset !== [0,0]){
			if(offset[0] !== 0){

				const offsetLength = (offset[0] * 2) * Math.random() - offset[0];
				const offsetX = offsetLength * Math.cos(rotation);
				const offsetY = offsetLength * Math.sin(rotation);

				targetPosition.set_x(targetPosition.get_x() + offsetX);
				targetPosition.set_y(targetPosition.get_y() + offsetY);

			}

			if(offset[1] !== 0){

				const offsetLength = (offset[1] * 2) * Math.random() - offset[1];
				const offsetX = offsetLength * Math.cos(rotation+Settings.pihalve);
				const offsetY = offsetLength * Math.sin(rotation+Settings.pihalve);

				targetPosition.set_x(targetPosition.get_x() + offsetX);
				targetPosition.set_y(targetPosition.get_y() + offsetY);

			}
		}


		body.SetTransform(targetPosition, body.GetAngle())

		sprite.x = targetPosition.get_x()*Settings.PTM;
		sprite.y = targetPosition.get_y()*Settings.PTM;

		impulse.Set(Math.random()*force2-force, Math.random()*force2-force)
		body.SetLinearVelocity(impulse)

		if(tints.length>0){
			sprite.tint = tints[Math.floor(Math.random()*tints.length)];
		}else{
			sprite.tint = 0xFFFFFF;
		}
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
