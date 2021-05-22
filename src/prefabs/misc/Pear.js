import * as PrefabManager from '../PrefabManager';
import {SoftBreakable} from './SoftBreakable'

class Pear extends SoftBreakable {
    init(){
        this.splashColors = ['#6bd105', '#4c9401'];
        this.partsType = ["Cardboard", 3];
        this.partsColors = [0x6bd105, 0x4c9401];
        this.breakingForce = 19.6;
        this.partsOffset = [0, 2];
        this.sound = 'fruit-explode';
		this.name = 'Pear';
        super.init();
    }
}

PrefabManager.prefabLibrary.Pear = {
    json: '{"objects":[[0,0.0185,0.0808,0,"pear","base",0,["#999999","#999999","#999999"],["#000","#000","#000"],[0,0,0,0],false,true,[[{"x":0.0832,"y":0.1894},{"x":0.0832,"y":0.1894}],[{"x":-0.0785,"y":0.1801},{"x":-0.0785,"y":0.1801}],[{"x":-0.0046,"y":-0.3695},{"x":-0.0046,"y":-0.3695}]],[1,1,1],[0,0,0],[9.8621,9.8621,8],"",[0,0,0],true,false,false,[0.5,0.5,0.5],[0.2,0.2,0.2],false,true,false],[1,-0.5542,-2.4245,-0.1745,"pear","texture",1,"Pear instance 10000",0,4.9741,1.7955,0.1745,false,"#FFFFFF",1,1,1,0,0,0,true]]}',
    class: Pear,
    library: PrefabManager.LIBRARY_MISC
}
