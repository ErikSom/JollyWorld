import * as PrefabManager from '../PrefabManager'
import { Explosive } from './Explosive';
import * as emitterManager from '../../utils/EmitterManager';

import {
    game
} from "../../Game";

class Grenade extends Explosive {
    constructor(target) {
        super(target);
    }
    init() {
		console.log("INIT");
		this.setActive(this.prefabObject.settings.active);
        super.init();
	}
	explode(){
		this.explodeTarget = this.lookupObject['grenadeBody'];
		super.explode();

		const pos = this.explodeTarget.GetPosition();
		emitterManager.playOnceEmitter("explosion_layer1", null, pos, 0);
		emitterManager.playOnceEmitter("explosion_layer2", null, pos, 0);
		game.editor.deleteObjects([this.explodeTarget]);
	}
	setActive(active){
		console.log(this.lookupObject);
		// NOT IN LOOKUP YET
		// const grenadeOn = this.lookupObject['grenadeTextureOn'];
		// const grenadeOff = this.lookupObject['grenadeTextureOff'];
		// grenadeOn.alpha = +active;
		// grenadeOff.alpha = +!active;
	}
}

PrefabManager.prefabLibrary.Grenade = {
    json: JSON.stringify({"objects":[[0,0,0,0,"grenade","grenadeBody",0,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],0,[12.573646401946284],"",[1]],[7,-3.613874338525329,-5.931917085039969,0,"","",1,["[1,2.4921098783996563,1.8900606024845317,0,\"grenade\",\"grenadeTextureOff\",69,\"Grenade_off0000\",null,null,null,null,false,\"#FFFFFF\",1,1]","[1,-2.4921098783996563,-1.8900606024845317,0,\"grenade\",\"grenadeTextureOn\",70,\"Grenade_on 0000\",null,null,null,null,false,\"#FFFFFF\",1,1,0]"],0,6.946058453428172,2.1179715828892522,0,1]]}),
    class: Grenade,
    library: PrefabManager.LIBRARY_WEAPON,
}
