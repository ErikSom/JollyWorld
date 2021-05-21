import * as PrefabManager from '../PrefabManager';

import {
    game
} from "../../Game";

import * as emitterManager from '../../utils/EmitterManager'
import * as PhysicsParticleEmitter from '../../utils/PhysicsParticleEmitter';

export class SoftBreakable extends PrefabManager.basePrefab {
    constructor(target) {
        super(target);

		this.breakingForce = 40;
		this.splashColors = ['#FFFFFF'];
		this.emitterType = 'splash';
		this.partsColors = [0xFFFFFF];
		this.partsType = ['Pumpkin2', 3];
		this.partsQuantity = 6;
		this.partsSize = 5;
		this.partsForce = 10;
		this.doBreak = false;

	}

	init(){
		super.init();
        this.base = this.lookupObject['base'];
	}

	break(){
		emitterManager.playOnceEmitter(this.emitterType, null, this.base.GetPosition(), 0, this.splashColors);

		const parts = [];
		for(let i = 0; i <this.partsType[1]; i++){
			parts.push(`${this.partsType[0]}_${i+1}`);
		}

		PhysicsParticleEmitter.emit(parts, this.base.GetPosition(), this.partsQuantity, this.partsSize, this.partsForce, false, this.partsColors);
		this.destroy();
	}

	update(){
		if(this.doBreak){
			this.break();
		}
	}

	initContactListener() {
        super.initContactListener();
        const self = this;
        this.contactListener.PostSolve = function (contact, impulse) {
			let force = 0;
			for (let j = 0; j < impulse.get_count(); j++){
				if (impulse.get_normalImpulses(j) > force){
					force = impulse.get_normalImpulses(j);
				}
			}

			const skipBecauseToLight = contact.GetFixtureA().GetDensity() === 0.001 || contact.GetFixtureB().GetDensity() === 0.001;
			if (force > self.breakingForce && !skipBecauseToLight) {
				self.doBreak = true;
			}
		}
    }
}
