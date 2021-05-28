import * as PrefabManager from '../PrefabManager';
import {SoftBreakable} from './SoftBreakable'

class Cola extends SoftBreakable {
    init(){
        this.splashColors = ['#181211', '#4a110a', '#181211', '#4a110a', '#deaf67'];
        this.partsType = ["Plastic", 4];
        this.partsColors = [0x4f2700, 0x4f2700, 0x4f2700, 0x4f2700, 0xff0001];
        this.breakingForce = 19.6;
        this.partsOffset = [0, 2];
        this.sound = 'coke-explode';
        this.name = "Cola";
        super.init();
    }
}

PrefabManager.prefabLibrary.Cola = {
    json: '{"objects":[[0,0.0024,-0.0092,0,"cola","base",0,["#999999"],["#000"],[0],false,true,[[{"x":0.3228,"y":-1.19},{"x":0.3228,"y":1.19},{"x":-0.3228,"y":1.19},{"x":-0.3228,"y":-1.19}]],[1],[0],[0],"",[0],true,false,false,[0.5],[0.2],false,true,false,false],[1,-0.072,0.2759,0,"cola","texture",1,"Cola instance 10000",0,0.5703,-1.826,0,false,"#FFFFFF",1,1,1,0,0,0,true]]}',
    class: Cola,
    library: PrefabManager.LIBRARY_MISC
}
