import * as PrefabBuilder from './PrefabBuilder';
import * as Box2D from '../../libs/Box2D';

export const emit = (textures, worldPosition, amount, size, force, randomTexture = true) => {

	for(let i = 0; i<amount; i++){
		const prefabData = PrefabBuilder.generatePrefab(worldPosition, 'PhysicsParticle', false);
		const { lookupObject, prefabClass } = prefabData;
		if(!randomTexture){
			prefabClass.texture = textures[i%textures.length];
		}else{
			prefabClass.texture = textures[Math.round(Math.random(textures.length))];
		}

		const body = lookupObject._bodies[0];
		const impulse = new Box2D.b2Vec2((Math.random()*(force*2)-force), (Math.random()*(force*2)-force));
		body.ApplyForce(impulse, body.GetPosition());


		prefabClass.particleSize = size;
		prefabClass.init();
	}
}
