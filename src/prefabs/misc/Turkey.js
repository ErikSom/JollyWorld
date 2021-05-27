import * as PrefabManager from '../PrefabManager';
import {SoftBreakable} from './SoftBreakable'

class Turkey extends SoftBreakable {
    init(){
        this.splashColors = ['#ffdfe0', '#fdcbcc', '#d6abac'];
        this.partsType = ["Chicken_1", "Chicken_2", "Chicken_3", "Chicken_3"];
        this.partsRandom = false;
        this.partsQuantity = 3;
        this.partsColors = [];
        this.breakingForce = 33;
        this.partsOffset = [2, 2];
        this.sound = 'chicken-explode';
        this.name = "Turkey";
        super.init();
    }
}

PrefabManager.prefabLibrary.Turkey = {
    json: '{"objects":[[0,-0.0455,-0.0337,0,"turkey","base",0,["#999999","#999999"],["#000","#000"],[0,1,1],false,true,[[{"x":-0.3966,"y":-0.0159},{"x":-0.3966,"y":-0.0159}],[{"x":0.3966,"y":0.0159},{"x":0.3966,"y":0.0159}]],[1,1],[0,0],[18.8298,19.6251],"",[0,0],true,false,false,[0.5,0.5],[0.2,0.2],false,true,false,false],[1,1.3647,1.0115,0,"turkey","texture",1,"Turkey instance 10000",0,3.3974,-0.6378,0,false,"#FFFFFF",1,1,1,0,0,0,true]]}',
    class: Turkey,
    library: PrefabManager.LIBRARY_MISC
}
