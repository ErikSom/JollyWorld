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
}

PrefabManager.prefabLibrary.Grenade = {
    json: '{"objects":[[0,0,0,0,"grenade","grenadeBody",0,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],0,[12.573646401946284],"",[1]],[1,-4.370894525720985,-3.7464810220467655,0,"grenade","grenadeTexture",1,"Grenade0000",0,5.756808056860525,2.4329663814620957,0,false,"#FFFFFF",1,1]]}',
    class: Grenade,
    library: PrefabManager.LIBRARY_WEAPON  ,
}
