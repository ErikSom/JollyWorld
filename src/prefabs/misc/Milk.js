import * as PrefabManager from '../PrefabManager';
import {SoftBreakable} from './SoftBreakable'

class Milk extends SoftBreakable {
    init(){
        this.splashColors = ['#FFFFFF'];
        this.partsType = ["Cardboard", 3];
        this.partsColors = [0xc7f4ff, 0xffffff];
        this.breakingForce = 23.2;
        this.partsOffset = [0, 2];
        this.sound = 'milk-explode';
		this.name = 'Milk';
        super.init();
    }
}

PrefabManager.prefabLibrary.Milk = {
    json: '{"objects":[[0,0.0001,0.0241,0,"Milk","base",0,["#999999"],["#000"],[0],false,true,[[[{"x":-0.4564,"y":1.1235},{"x":-0.4652,"y":-0.5618},{"x":0,"y":-1.106},{"x":0.4652,"y":-0.5793},{"x":0.4564,"y":1.1235}]]],[1],[0],[0],"",[0],true,false,false,[0.5],[0.2],false,true,false],[1,-0.0042,-0.7228,0,"Milk","texture",1,"Milk instance 10000",0,1.4456,1.5765,0,false,"#FFFFFF",1,1,1,0,0,0,true]]}',
    class: Milk,
    library: PrefabManager.LIBRARY_MISC
}
