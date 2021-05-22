import * as PrefabManager from '../PrefabManager';
import {SoftBreakable} from './SoftBreakable'

class Banana extends SoftBreakable {
    init(){
        this.splashColors = ['#ffce09', '#d8af07'];
        this.partsType = ["Cardboard", 3];
        this.partsColors = [0xffce09, 0xd8af07];
        this.breakingForce = 9.2;
        this.partsOffset = [0, 2];
        this.sound = 'fruit-explode';
		this.name = 'Banana';
        super.init();
    }
}

PrefabManager.prefabLibrary.Banana = {
    json: '{"objects":[[0,0.0231,0.0158,0,"banana","base",0,["#999999"],["#000"],[0],false,true,[[[{"x":-0.304,"y":-0.6672},{"x":-0.0522,"y":0.0043},{"x":-0.4539,"y":0.6278},{"x":0.2036,"y":0.5019},{"x":0.3168,"y":0.1682},{"x":0.3022,"y":-0.3203},{"x":0.0604,"y":-0.5545}]]],[1],[0],[0],"",[0],true,false,false,[0.5],[0.2],false,true,false],[1,-0.6932,-0.4752,0,"banana","texture",1,"Banana instance 10000",0,1.6808,2.5406,0,false,"#FFFFFF",1,1,1,0,0,0,true]]}',
    class: Banana,
    library: PrefabManager.LIBRARY_MISC
}
