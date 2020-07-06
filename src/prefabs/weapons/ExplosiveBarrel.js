import * as PrefabManager from '../PrefabManager'
import { Explosive } from './Explosive';
import * as emitterManager from '../../utils/EmitterManager';
import * as PhysicsParticleEmitter from '../../utils/PhysicsParticleEmitter';
import * as PrefabBuilder from '../../utils/PrefabBuilder';
import * as Box2D from '../../../libs/Box2D';


import {
    game
} from "../../Game";

class ExplosiveBarrel extends Explosive {
    constructor(target) {
        super(target);
    }
    init() {
		this.explosiveRadius = 500;
		super.init();
		this.activateOn = Explosive.activateOnTypes.impact;
		this.explodeDelay = 0;
		this.impactForExplosion = 10;
	}
	explode(){
		if(this.exploded) return;

		this.explodeTarget = this.lookupObject['explosiveBody'];
		super.explode();

		const pos = this.explodeTarget.GetPosition();
		emitterManager.playOnceEmitter("explosion2_layer1", null, pos, 0);
		emitterManager.playOnceEmitter("explosion2_layer2", null, pos, 0);


		const prefabData = PrefabBuilder.generatePrefab(pos, 'ExplosiveBarrelBottom', true);
		const { lookupObject } = prefabData;
		const body = lookupObject._bodies[0];
		const force = 600;
		const offset = 0.3;
		const impulse = new Box2D.b2Vec2((Math.random()*(force*2)-force), (Math.random()*(force*2)-force));
		body.ApplyForce(impulse, new Box2D.b2Vec2(body.GetPosition().x+(Math.random()*(offset*2)-offset), body.GetPosition().y+(Math.random()*(offset*2)-offset)));

		PhysicsParticleEmitter.emit(['Cardboard_1', 'Cardboard_2', 'Cardboard_3'], pos, 10, 5, 20, false, [0x752E00, 0x98440D]);

		this.destroy();
	}
	set(property, value) {
		super.set(property, value);
        switch (property) {
            case 'active':
                this.setActive(value);
                break;
        }
    }
}

ExplosiveBarrel.settings = Object.assign({}, Explosive.settings, {force:4000});
delete ExplosiveBarrel.settings.active;
delete ExplosiveBarrel.settings.delay;
delete ExplosiveBarrel.settings.activateOn;

ExplosiveBarrel.settingsOptions = Object.assign({}, Explosive.settingsOptions);
delete ExplosiveBarrel.settingsOptions.active;
delete ExplosiveBarrel.settingsOptions.delay;
delete ExplosiveBarrel.settingsOptions.activateOn;



PrefabManager.prefabLibrary.ExplosiveBarrel = {
    json: '{"objects":[[0,1.6467278115847779,0.031292622821183384,0,"explosiveBarrel","explosiveBody",0,["#999999"],["#000"],[0],false,true,[[{"x":-1.3738015474247371,"y":2.2674508315008426},{"x":-1.3738015474247371,"y":-2.2674508315008426},{"x":1.3738015474247371,"y":-2.2674508315008426},{"x":1.3738015474247371,"y":2.2674508315008426}]],[1],0,[0],"",[1]],[1,49.401834347543314,-2.436966500939559,0,"explosiveBarrel","texture",1,"Tank_Flamable0000",0,3.3757451855750604,1.570796326794903,0,false,"#FFFFFF",1,1,1]]}',
    class: ExplosiveBarrel,
    library: PrefabManager.LIBRARY_WEAPON,
}

PrefabManager.prefabLibrary.ExplosiveBarrelBottom = {
	json: '{"objects":[[0,0.04568688856363534,0.040160286306099885,0,"explosiveTankBottom","body",0,["#999999"],["#000"],[0],false,true,[[{"x":-1.2919186325354817,"y":0.41674794597918763},{"x":-1.2919186325354817,"y":-0.41674794597918763},{"x":1.2919186325354817,"y":-0.41674794597918763},{"x":1.2919186325354817,"y":0.41674794597918763}]],[1],0,[0],"",[1]],[1,0.25324551287077846,-6.0299732901532765,0,"explosiveTankBottom","texture",1,"Tank_Flamable_off0000",0,7.320557681473389,1.7240286121158557,0,false,"#FFFFFF",1,1,1]]}',
	class: PrefabManager.basePrefab,
}
