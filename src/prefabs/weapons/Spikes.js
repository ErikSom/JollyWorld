import * as PrefabManager from '../PrefabManager'
import { SharpObject } from './SharpObject';

import {
    game
} from "../../Game";

class Spikes extends SharpObject {
    constructor(target) {
        super(target);
        this.base = this.lookupObject.sharpBody;
    }
    init() {
        super.init();

        if(this.prefabObject.settings.isFixed){
            this.base.SetType(Box2D.b2_staticBody);
        }else{
            this.base.SetType(Box2D.b2_dynamicBody);
        }
    }
}

Spikes.settings = Object.assign({}, Spikes.settings, {
    "isFixed": false,
});
Spikes.settingsOptions = Object.assign({}, Spikes.settingsOptions, {
	"isFixed": false,
});


PrefabManager.prefabLibrary.Spikes = {
    json: '{"objects":[[0,0.1297966967763502,1.759501451838539,0,"spike","sharpBody",0,["#999999","#999999"],["#000","#000"],[0,0,0],false,true,[[{"x":-2.507682326599107,"y":0.4814338360844125},{"x":-2.507682326599107,"y":-0.4814338360844125},{"x":2.507682326599107,"y":-0.4814338360844125},{"x":2.507682326599107,"y":0.4814338360844125}],[{"x":-2.296935401422024,"y":-0.4656213851525126},{"x":-2.296935401422024,"y":-3.4994010665800674},{"x":2.315305295065622,"y":-3.4994010665800674},{"x":2.315305295065622,"y":-0.4656213851525126}]],[1,1],0,[0,0],"",[1,1]],[1,3.8435325982501403,0.11200529795080882,0,"spike","sharpTexture",1,"Spikes0000",0,52.673062339408105,1.5717525710396676,0,false,"#FFFFFF"]]}',
    class: Spikes,
    library: PrefabManager.LIBRARY_WEAPON  ,
}
