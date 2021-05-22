import * as PrefabManager from '../PrefabManager';
import {SoftBreakable} from './SoftBreakable'

class Bottle extends SoftBreakable {
    init(){
        this.splashColors = ['#7a201f', '#2d0707', '#180706'];
        this.partsType = ["Plastic", 4];
        this.partsColors = [0x0b6800, 0x0b6800, 0x333333];
        this.breakingForce = 18;
        this.partsOffset = [0, 2];
        this.sound = 'glass-break1';
		this.name = 'Bottle';
        super.init();
    }
}

PrefabManager.prefabLibrary.Bottle = {
    json: '{"objects":[[0,0.0044,-0.0451,0,"Bottle","base",0,["#999999"],["#000"],[1],false,true,[[[{"x":-0.3403,"y":1.2665},{"x":-0.3403,"y":-0.191},{"x":-0.143,"y":-1.0716},{"x":0.1303,"y":-1.0716},{"x":0.3353,"y":-0.1759},{"x":0.3353,"y":1.2665}]]],[1],[0],[0],"",[0],false,false,false,[0.5],[0.2],false,true,false],[1,-0.1332,1.352,0,"Bottle","texture",1,"Wine instance 10000",0,2.7171,-1.669,0,false,"#FFFFFF",1,1,1,0,0,0,true]]}',
    class: Bottle,
    library: PrefabManager.LIBRARY_MISC
}
