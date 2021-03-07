import * as PrefabBuilder from './PrefabBuilder';
import * as Box2D from '../../libs/Box2D';
import {
	game
} from "../Game";
import { Settings } from '../Settings';
import { disableCulling } from '../utils/PIXICuller';


const poolSize = 200;
const spritePool = [];
const activeParticles = [];

const bodyDef = new Box2D.b2BodyDef();
bodyDef.type = Box2D.b2BodyType.b2_dynamicBody;
bodyDef.angularDamping = 0.9;

const fixDef = new Box2D.b2FixtureDef;
fixDef.density = 0.1;
fixDef.friction = Settings.defaultFriction;
fixDef.restitution = Settings.defaultRestitution;
fixDef.shape = new Box2D.b2CircleShape;

const impulse = new Box2D.b2Vec2();

export const init = ()=> {
	fixDef.filter.categoryBits = game.editor.MASKBIT_EVERYTHING_BUT_US;
	fixDef.filter.maskBits = game.editor.MASKBIT_NORMAL | game.editor.MASKBIT_FIXED | game.editor.MASKBIT_CHARACTER; //game.editor.MASKBIT_EVERYTHING_BUT_US | game.editor.MASKBIT_ONLY_US;
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

		let sprite, body;
		if(spritePool.length>0){
			body = game.editor.world.CreateBody(bodyDef);
			fixDef.shape.SetRadius(size);
			body.CreateFixture(fixDef);

			sprite = spritePool.pop();
			sprite.myBody = body;
			body.mySprite = sprite;

			game.myEffectsContainer.addChild(sprite);
			disableCulling(sprite);
			activeParticles.push(sprite);
		}else{
			// we grab a random active particle
			const randomSpriteIndex = Math.floor(Math.random()*activeParticles.length);
			sprite = activeParticles[randomSpriteIndex];
			body = sprite.myBody;
			body.GetFixtureList().GetShape().SetRadius(size);
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

		body.SetPosition(worldPosition)
		sprite.x = worldPosition.x*Settings.PTM;
		sprite.y = worldPosition.y*Settings.PTM;

		impulse.Set(Math.random()*force2-force, Math.random()*force2-force)
		body.SetLinearVelocity(impulse)

		if(tints.length>0){
			sprite.tint = tints[Math.round(Math.random()*tints.length)];
		}
	}
}

export const update = clean => {
	for(let i = 0; i<activeParticles.length; i++){
		const sprite = activeParticles[i];
		if(Date.now() - sprite.lifeDate > sprite.lifeTime || clean){
			game.editor.world.DestroyBody(sprite.myBody);
			delete sprite.myBody;

			sprite.parent.removeChild(sprite);
			activeParticles.splice(i, 1);
			spritePool.push(sprite);

			i--;
		}
	}
}
