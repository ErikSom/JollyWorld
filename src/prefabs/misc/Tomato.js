import * as PrefabManager from '../PrefabManager';
import {SoftBreakable} from './SoftBreakable'

class Tomato extends SoftBreakable {
    init(){
        this.splashColors = ['#fd0018', '#bc0004'];
        this.partsType = ["Cardboard", 3];
        this.partsColors = [0xfd0018, 0xbc0004];
        this.breakingForce = 11.2;
        this.partsOffset = [0, 2];
        this.sound = 'fruit-explode';
		this.name = 'Tomato';
        super.init();
    }
}

PrefabManager.prefabLibrary.Tomato = {
    json: '{"objects":[[0,-0.0136,0.0527,0,"tomato","base",0,["#999999","#999999"],["#000","#000"],[0,1,1],false,true,[[{"x":-0.1559,"y":-0.006},{"x":-0.1559,"y":-0.006}],[{"x":0.1559,"y":0.006},{"x":0.1559,"y":0.006}]],[1,1],[0,0],[10.5,10.5],"",[0,0],true,false,false,[0.5,0.5],[0.2,0.2],false,true,false],[1,0.408,-1.5809,0,"tomato","texture",1,"Tomato instance 10000",0,3.2654,1.3182,0,false,"#FFFFFF",1,1,1,0,0,0,true]]}',
    class: Tomato,
    library: PrefabManager.LIBRARY_MISC
}
