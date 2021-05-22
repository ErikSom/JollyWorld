import * as PrefabManager from '../PrefabManager';

import {
    game
} from "../../Game";

import * as emitterManager from '../../utils/EmitterManager'
import * as PhysicsParticleEmitter from '../../utils/PhysicsParticleEmitter';
import * as AudioManager from '../../utils/AudioManager';

export class SoftBreakable extends PrefabManager.basePrefab {
    constructor(target) {
        super(target);

		this.breakingForce = 40;
		this.splashColors = ['#FFFFFF'];
		this.emitterType = 'splash';
		this.partsColors = [0xFFFFFF];
		this.partsType = ['Pumpkin2', 3];
		this.partsRandom = true;
		this.partsOffset = [0,0];
		this.partsQuantity = 6;
		this.partsSize = 5;
		this.partsForce = 10;
		this.sound = 'fruit-explode';
		this.doBreak = false;

	}

	init(){
		super.init();
        this.base = this.lookupObject['base'];

		if(!this.prefabObject.settings.isAwake){
            this.base.SetAwake(false);
			this.base.mySprite.data.awake = false;
        }
	}

	break(){
		emitterManager.playOnceEmitter(this.emitterType, null, this.base.GetPosition(), 0, this.splashColors);

		let parts = [];
		if(this.partsRandom){
			for(let i = 0; i <this.partsType[1]; i++){
				parts.push(`${this.partsType[0]}_${i+1}`);
			}
		}else{
			parts = this.partsType;
		}

		AudioManager.playSFX(this.sound, 0.2, 1.0 + 0.4 * Math.random()-0.2, this.base.GetPosition());

		PhysicsParticleEmitter.emit(parts, this.base.GetPosition(), this.partsQuantity, this.partsSize, this.partsForce, this.partsRandom, this.partsColors, this.base.GetAngle(), this.partsOffset);
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

SoftBreakable.settings = Object.assign({}, SoftBreakable.settings, {
    "isAwake": true
});

SoftBreakable.settingsOptions = Object.assign({}, SoftBreakable.settingsOptions, {
    "isAwake": true
});
