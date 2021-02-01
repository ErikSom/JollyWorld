import * as PrefabManager from '../PrefabManager';
import { startAddingJoint, startPositioningLimb } from '../vehicles/NoVehicle';
import {Humanoid} from '../humanoids/Humanoid'
import {
    game
} from "../../Game";

export class NPC extends PrefabManager.basePrefab {
    constructor(target) {
		super(target);
		this.flipped = false;
		this.character = game.editor.activePrefabs[this.lookupObject.character.body.mySprite.data.subPrefabInstanceName].class;
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
        this.character.life = this.prefabObject.settings.life;
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

        this.character.positionLimb(limb, x, y);
    }
	set(property, value) {
		super.set(property, value);
        switch (property) {
            case 'isFlipped':
                this.flip(value);
				break;
			case 'skin':
				this.character.setSkin(value-1);
				break;
			case "selectJointTarget":
				this.prefabObject.class.jointTarget = value;
        }
	}

	flipLimbs(){
		for(let key in this.prefabObject.settings.limbs){

			let x = this.prefabObject.settings.limbs[key][0];
			let y = this.prefabObject.settings.limbs[key][1];

			let a = Math.atan2(y, x);
			let l = Math.sqrt(x*x + y*y);

			// rotate back on prefab
			x = l * Math.cos(a+this.prefabObject.rotation*game.editor.DEG2RAD);
			y = l * Math.sin(a+this.prefabObject.rotation*game.editor.DEG2RAD);
			x += this.prefabObject.x / game.editor.PTM;
			y += this.prefabObject.y / game.editor.PTM;

			// rotate around body
			const body = this.prefabObject.class.lookupObject['body'];
			const dx = x-body.GetPosition().x;
			const dy = y-body.GetPosition().y;
			const dl = Math.sqrt(dx*dx + dy*dy);
			let da = Math.atan2(dy, dx);

			x = dl * Math.cos(da-body.GetAngle());
			y = dl * Math.sin(da-body.GetAngle());
			x *= -1;

			da = Math.atan2(y, x);

			x = body.GetPosition().x + dl * Math.cos(da+body.GetAngle());
			y = body.GetPosition().y + dl * Math.sin(da+body.GetAngle());

			x -= this.prefabObject.x / game.editor.PTM;
			y -= this.prefabObject.y / game.editor.PTM;


			// rotate back around prefab
			a = Math.atan2(y,x);
			l = Math.sqrt(x*x + y*y);
			x = l * Math.cos(a-this.prefabObject.rotation*game.editor.DEG2RAD);
			y = l * Math.sin(a-this.prefabObject.rotation*game.editor.DEG2RAD);

			this.prefabObject.settings.limbs[key][0] = x;
			this.prefabObject.settings.limbs[key][1] = y;

		}
	}
	flip(flipped){
		if(this.flipped != flipped){
			if(this.initialized && this.prefabObject.settings?.limbs){
				this.flipLimbs();
			}
			this.character.flip();
			if(this.initialized && this.prefabObject.settings?.limbs){
				for(let key in this.prefabObject.settings.limbs){
					this.positionLimb(key);
				}
			}
			this.flipped = flipped;
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
        max: 7,
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
