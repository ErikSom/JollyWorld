import * as PrefabManager from '../PrefabManager'
import { Explosive } from './Explosive';
import * as emitterManager from '../../utils/EmitterManager';
import * as PhysicsParticleEmitter from '../../utils/PhysicsParticleEmitter';


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
		console.log(this.explodeTarget);
		super.explode();

		const pos = this.explodeTarget.GetPosition();
		emitterManager.playOnceEmitter("explosion_layer1", null, pos, 0);
		emitterManager.playOnceEmitter("explosion_layer2", null, pos, 0);


		PhysicsParticleEmitter.emit(['Gore_Meat1', 'Gore_Meat2', 'Gore_Meat3', 'Gore_Meat4'], pos, 20, 30, 20, false);

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
