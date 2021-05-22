import * as PrefabManager from '../PrefabManager';
import {SoftBreakable} from './SoftBreakable'

class WaterMelon extends SoftBreakable {
    init(){
        this.splashColors = ['#f81e2c', '#efafaf', '#fa443f'];
        this.partsType = ["WaterMelon", 3];
        this.partsColors = [];
        this.breakingForce = 69.6;
        this.partsOffset = [0, 2];
        this.sound = 'melon-explode';
		this.name = 'WaterMelon';
        super.init();
    }
}

PrefabManager.prefabLibrary.WaterMelon = {
    json: '{"objects":[[0,-0.0125,-0.0067,0,"WaterMelon","base",0,["#999999","#999999"],["#000","#000"],[1,1,0],false,true,[[{"x":0.0121,"y":0.3909},{"x":0.0121,"y":0.3909}],[{"x":-0.0121,"y":-0.3909},{"x":-0.0121,"y":-0.3909}]],[1,1],[0,0],[26.1741,26.1741],"",[0,0],true,false,false,[0.5,0.5],[0.2,0.2],false,true,false],[1,0.3754,0.201,0,"WaterMelon","texture",1,"WaterMelon instance 10000",0,0.8516,-0.4916,0,false,"#FFFFFF",1,1,1,0,0,0,true]]}',
    class: WaterMelon,
    library: PrefabManager.LIBRARY_MISC
}
