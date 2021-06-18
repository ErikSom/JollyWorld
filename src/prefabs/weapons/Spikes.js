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
    json: '{"objects":[[0,-0.0154,0.46,0,"spike","sharpBody",0,["#999999","#999999"],["#000","#000"],[0,0,0],false,true,[[{"x":-2.5036,"y":1.3739},{"x":-2.5036,"y":0.5767},{"x":2.5168,"y":0.5767},{"x":2.5168,"y":1.3739}],[{"x":-2.3547,"y":0.601},{"x":-2.3547,"y":-2.5516},{"x":2.3414,"y":-2.5516},{"x":2.3414,"y":0.601}]],[1,1],[0,0],[0,0],"",[0,0],true,false,false,[0.5,0.5],[0.2,0.2],false,true,false],[1,0.4624,-13.7991,0,"spike","sharpTexture",1,"Spikes0000",0,27.6137,1.5373,0,false,"#FFFFFF",1,1,1,0,0,0,true]]}',
    class: Spikes,
    library: PrefabManager.LIBRARY_WEAPON  ,
}
