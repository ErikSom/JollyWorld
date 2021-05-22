import * as PrefabManager from '../PrefabManager';
import {SoftBreakable} from './SoftBreakable'

class Orange extends SoftBreakable {
    init(){
        this.splashColors = ['#fc6105', '#b44404'];
        this.partsType = ["Cardboard", 3];
        this.partsColors = [0xfc6105, 0xb44404];
        this.breakingForce = 14.8;
        this.partsOffset = [0, 2];
        this.sound = 'fruit-explode';
		this.name = 'Orange';
        super.init();
    }
}

PrefabManager.prefabLibrary.Orange = {
    json: '{"objects":[[0,0,0,0,"orange","base",0,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[0],[12.8775],"",[0],true,false,false,[0.5],[0.2],false,true,false],[1,0,0,0,"orange","texture",1,"Orange instance 10000",0,0,-0.0629,0,false,"#FFFFFF",1,1,1,0,0,0,true]]}',
    class: Orange,
    library: PrefabManager.LIBRARY_MISC
}
