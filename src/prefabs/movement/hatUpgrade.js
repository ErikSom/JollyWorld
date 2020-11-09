
import * as PrefabManager from '../PrefabManager';
import {
    game
} from "../../Game";
import {RopeHat} from '../hats/ropeHat'


const HAT_TYPES = {
	ROPE:'Rope',
}
const hatTypeToClass = {
	[HAT_TYPES.ROPE]:RopeHat
}

class HatUpgrade extends PrefabManager.basePrefab {
    constructor(target) {
        super(target);
        this.hatType = HAT_TYPES.ROPE;
		this.shouldUpgrade = null;
    }
    init() {
        super.init();
    }
    update() {
        super.update();
        if(this.shouldUpgrade){
			this.shouldUpgrade.setHat(hatTypeToClass[this.hatType]);
			this.destroy();
		}
    }
    initContactListener() {
        super.initContactListener();
        this.contactListener.BeginContact = contact => {
			if(this.shouldDestroy) return;

            const bodies = [contact.GetFixtureA().GetBody(), contact.GetFixtureB().GetBody()];
            const body = bodies[0].mainCharacter ? bodies[0] : bodies[1];
            if(body.mainCharacter){
				const characterClass = game.editor.retrieveSubClassFromBody(body);
				this.shouldUpgrade = characterClass;
            }
        }
    }
}

PrefabManager.prefabLibrary.HatUpgrade = {
    json: '{"objects":[[0,0,0,0,"hatUpgrade","hatBody",0,["#999999"],["#000"],[0],true,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],2,[63.579923817390195],"",[1]],[1,-3.502436231241809,-35.899971370220776,0,"hatUpgrade","hatTexture",1,"RopeHelmet0000",0,36.07041729640214,1.6680495250464833,0,false,"#FFFFFF",1,1,1,0,0,0]]}',
    class: HatUpgrade,
    library: PrefabManager.LIBRARY_MOVEMENT
}
