import * as PrefabBuilder from './PrefabBuilder';
import * as Box2D from '../../libs/Box2D';

export const emit = (textures, worldPosition, amount, size, force, randomTexture = true, tints=[]) => {

	for(let i = 0; i<amount; i++){
		const prefabData = PrefabBuilder.generatePrefab(worldPosition, 'PhysicsParticle', false);
		const { lookupObject, prefabClass } = prefabData;
		console.log(prefabData);
		if(!randomTexture){
			prefabClass.texture = textures[i%textures.length];
		}else{
			prefabClass.texture = textures[Math.round(Math.random()*textures.length)];
		}

		const body = lookupObject._bodies[0];
		const impulse = new Box2D.b2Vec2((Math.random()*(force*2)-force), (Math.random()*(force*2)-force));
		body.ApplyForce(impulse, body.GetPosition());


		prefabClass.particleSize = size;
		prefabClass.init();

		const texture = body.myTexture.originalSprite;
		if(tints.length>0){
			texture.tint = tints[Math.round(Math.random()*tints.length)];
		}
		body.myTexture.pivot.x = texture.width/2;
		body.myTexture.pivot.y = texture.height/2;
		texture.x = texture.y = 0;
	}
}
