import {Humanoid} from '../humanoids/Humanoid'
import { startAddingJoint, startPositioningLimb } from '../vehicles/NoVehicle';
import {
    game
} from "../../Game";

export class NPC extends Humanoid {
    constructor(target) {
		super(target);
		if(this.prefabObject.settings){
			this.flip(this.prefabObject.settings.isFlipped);
			if(this.prefabObject.settings?.limbs){
				for(let key in this.prefabObject.settings.limbs){
					this.positionLimb(key);
				}
			}
		}
		this.initialized = true;
	}
	init(){
		super.init();
        this.life = this.prefabObject.settings.life;
	}
	positionLimb(limb){
        let x = this.prefabObject.settings.limbs[limb][0];
        let y = this.prefabObject.settings.limbs[limb][1];
        const l = Math.sqrt(x*x+y*y);
        const a = Math.atan2(y,x);

        // must restore rotation with prefab rotation

        x = l * Math.cos(a + this.prefabObject.rotation*game.editor.DEG2RAD);
        y = l * Math.sin(a + this.prefabObject.rotation*game.editor.DEG2RAD);

        x += this.prefabObject.x / game.editor.PTM;
        y += this.prefabObject.y / game.editor.PTM;

        super.positionLimb(limb, x, y);
    }
	set(property, value) {
		super.set(property, value);
        switch (property) {
            case 'isFlipped':
                this.flip(value);
                break;
        }
	}
	flip(flipped){
		if(this.flipped != flipped){
			if(this.initialized && this.prefabObject.settings?.limbs){
				for(let key in this.prefabObject.settings.limbs){
					this.prefabObject.settings.limbs[key][0] *=  -1;
				}
			}
			super.flip();
			if(this.initialized && this.prefabObject.settings?.limbs){
				for(let key in this.prefabObject.settings.limbs){
					this.positionLimb(key);
				}
			}
		}
	}
}

NPC.settings = Object.assign({}, NPC.settings, {
    "isFlipped": false,
	"skin": 1,
	"life": 300,
	"positionLeftArm": prefab=>startPositioningLimb(prefab, Humanoid.BODY_PARTS.ARM_LEFT),
    "positionRightArm": prefab=>startPositioningLimb(prefab, Humanoid.BODY_PARTS.ARM_RIGHT),
    "positionLeftLeg": prefab=>startPositioningLimb(prefab, Humanoid.BODY_PARTS.LEG_LEFT),
    "positionRightLeg": prefab=>startPositioningLimb(prefab, Humanoid.BODY_PARTS.LEG_RIGHT),
    "positionHead": prefab=>startPositioningLimb(prefab, Humanoid.BODY_PARTS.HEAD),
    "selectJointTarget": "body",
    "addJoint": prefab=>startAddingJoint(prefab),
});
NPC.settingsOptions = Object.assign({}, NPC.settingsOptions, {
    "isFlipped": false,
    "skin": {
        min: 1,
        max: 4,
        step: 1
    },
    "life": {
        min: 1.0,
        max: 10000.0,
        step: 1.0
	},
	"positionLeftArm": '$function',
    "positionRightArm": '$function',
    "positionLeftLeg": '$function',
    "positionRightLeg": '$function',
    "positionHead": '$function',
    "selectJointTarget": [...Object.values(Humanoid.BODY_PARTS)],
    "addJoint": '$function',
});
