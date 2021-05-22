import * as PrefabManager from '../PrefabManager';
import {SoftBreakable} from './SoftBreakable'

class Pumpkin extends SoftBreakable {
    init(){
        this.splashColors = ['#ffcb05', '#ff9e1c'];
        this.partsType = ["Pumpkin", 3];
        this.partsColors = [];
        this.breakingForce = 84.3;
        this.partsOffset = [2, 2];
        this.sound = 'pumpkin-explode';
		this.name = 'Pumpkin';
        super.init();
    }
}

PrefabManager.prefabLibrary.Pumpkin = {
    json: '{"objects":[[0,0.0079,0.117,0,"Pumpkin","base",0,["#999999","#999999"],["#000","#000"],[0,1,0],false,true,[[{"x":-0.0432,"y":-0.0008},{"x":-0.0432,"y":-0.0008}],[{"x":0.0432,"y":0.0008},{"x":0.0432,"y":0.0008}]],[1,1],[0,0],[22,22],"",[0,0],true,false,false,[0.5,0.5],[0.2,0.2],false,true,false],[1,-0.2355,-3.511,0,"Pumpkin","texture",1,"Pumpkin instance 10000",0,7.0378,1.6378,0,false,"#FFFFFF",1,1,1,0,0,0,true]]}',
    class: Pumpkin,
    library: PrefabManager.LIBRARY_MISC
}
