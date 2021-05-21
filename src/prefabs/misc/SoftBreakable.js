import * as PrefabManager from '../PrefabManager';

import {
    game
} from "../../Game";


export class SoftBreakable extends PrefabManager.basePrefab {
    constructor(target) {
        super(target);

		this.life = 100;
		this.splashColor = '#FFFFFF';
		this.splashTexture = 'Splash';
		this.partsColors = ['#FFFFFF'];
		this.partsType = ['Pumpkin2', 3];
		this.partsQuantity = 6;

	}

	init(){
		super.init();
        this.base = this.lookupObject['base'];
	}

	dealDamage(damage){
		this.life -= damage;

		console.log(this.life);
		if(this.life<= 0){
			this.destroy();
		}
	}

	destroy(){
		super.destroy();
	}

	initContactListener() {
        super.initContactListener();
        const self = this;
        this.contactListener.PostSolve = function (contact, impulse) {
            const bodies = [contact.GetFixtureA().GetBody(), contact.GetFixtureB().GetBody()];

            const baseBody = (bodies[0] == self.base) ? bodies[0] : bodies[1];
            const otherBody = (bodies[0] == self.base) ? bodies[1] : bodies[0];

			let force = 0;
			for (let j = 0; j < impulse.get_count(); j++){
				if (impulse.get_normalImpulses(j) > force){
					force = impulse.get_normalImpulses(j);
				}
			}

			const velocityA = contact.GetFixtureA().GetBody().GetLinearVelocity().Length();
			const velocityB = contact.GetFixtureB().GetBody().GetLinearVelocity().Length();
			let impactAngle = (velocityA > velocityB) ? Math.atan2(contact.GetFixtureA().GetBody().GetLinearVelocity().get_y(), contact.GetFixtureA().GetBody().GetLinearVelocity().get_x()) : Math.atan2(contact.GetFixtureB().GetBody().GetLinearVelocity().get_y(), contact.GetFixtureB().GetBody().GetLinearVelocity().get_x());
			impactAngle *= game.editor.RAD2DEG + 180;
			const velocitySum = velocityA + velocityB;

			console.log("Velocity sum:", velocitySum);

			const skipBecauseToLight = contact.GetFixtureA().GetDensity() === 0.001 || contact.GetFixtureB().GetDensity() === 0.001;
			if (velocitySum > 6.0 && !skipBecauseToLight) {

				const slidingDamageScalar = 50;
				self.dealDamage(force/slidingDamageScalar);
			}
		}
    }
}
