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
		super.init();
		this.explosiveRadius = 600;
		this.activateOn = Explosive.activateOnTypes.impact;
		this.explodeDelay = 0;
		this.impactForExplosion = 270;
	}
	explode(){
		if(this.exploded) return;

		this.explodeTarget = this.lookupObject['explosiveBody'];
		super.explode();

		const pos = this.explodeTarget.GetPosition();

		emitterManager.playOnceEmitter("explosion2_layer1", this.explodeTarget, pos, 0);
		emitterManager.playOnceEmitter("explosion2_layer2", this.explodeTarget, pos, 0);
		
		const prefabData = PrefabBuilder.generatePrefab(pos, 0, 'ExplosiveBarrelBottom', true);
		const { lookupObject } = prefabData;
		const body = lookupObject._bodies[0];
		const force = 1500;
		const offset = 0.5;
		const impulse = new Box2D.Vec2((Math.random()*(force*2)-force), (Math.random()*(force*2)-force));
		body.ApplyForce(impulse, new Box2D.Vec2(body.GetPosition().x+(Math.random()*(offset*2)-offset), body.GetPosition().y+(Math.random()*(offset*2)-offset)));

		PhysicsParticleEmitter.emit(['Cardboard_1', 'Cardboard_2', 'Cardboard_3'], pos, 20, 5, 20, false, [0x752E00, 0x98440D]);

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

ExplosiveBarrel.settings = Object.assign({}, Explosive.settings, {force:6000});
delete ExplosiveBarrel.settings.active;
delete ExplosiveBarrel.settings.delay;
delete ExplosiveBarrel.settings.activateOn;

ExplosiveBarrel.settingsOptions = Object.assign({}, Explosive.settingsOptions);
delete ExplosiveBarrel.settingsOptions.active;
delete ExplosiveBarrel.settingsOptions.delay;
delete ExplosiveBarrel.settingsOptions.activateOn;



PrefabManager.prefabLibrary.ExplosiveBarrel = {
    json: '{"objects":[[0,-0.04601924674682996,-0.22858055065911953,0,"explosiveBarrel","explosiveBody",0,["#999999"],["#000"],[0],false,true,[[{"x":-2.0574512567209604,"y":3.3417201940372285},{"x":-2.0574512567209604,"y":-3.3417201940372285},{"x":2.0574512567209604,"y":-3.3417201940372285},{"x":2.0574512567209604,"y":3.3417201940372285}]],[1],0,[0],"",[1]],[1,-0.4077612717285123,-13.253638034478469,0,"explosiveBarrel","explosiveTexture",1,"Tank_Flamable0000",0,6.469777499209521,1.4198607371241059,0,false,"#FFFFFF",1,1,1]]}',
    class: ExplosiveBarrel,
    library: PrefabManager.LIBRARY_WEAPON,
}

PrefabManager.prefabLibrary.ExplosiveBarrelBottom = {
	json: '{"objects":[[0,-0.04159315440056843,0.058112796535037564,0,"explosiveTankBottom","body",0,["#999999"],["#000"],[0],false,true,[[{"x":-2.0588611428281127,"y":0.6654904704090869},{"x":-2.0588611428281127,"y":-0.6654904704090869},{"x":2.0588611428281127,"y":-0.6654904704090869},{"x":2.0588611428281127,"y":0.6654904704090869}]],[1],0,[0],"",[1]],[1,-1.9292498990856641,-9.977508723075704,0,"explosiveTankBottom","texture",1,"Tank_Flamable_off0000",0,11.740685885846592,1.6288711684514927,0,false,"#FFFFFF",1,1,1]]}',
	class: PrefabManager.basePrefab,
}
