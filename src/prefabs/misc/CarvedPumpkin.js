import * as PrefabManager from '../PrefabManager';
import {SoftBreakable} from './SoftBreakable'

class CarvedPumpkin extends SoftBreakable {
    init(){
        this.splashColors = ['#996798', '#e99619'];
        this.partsType = ["Pumpkin2", 3];
        this.partsColors = [];
        this.breakingForce = 84.3;
        this.partsOffset = [2, 2];
        this.sound = 'pumpkin-explode';
		this.name = 'CarvedPumpkin';
        super.init();
    }
}

PrefabManager.prefabLibrary.CarvedPumpkin = {
    json: '{"objects":[[0,-0.0053,0.1074,0,"CarvedPumpkin","base",0,["#999999","#999999"],["#000","#000"],[1,0,0],false,true,[[{"x":-0.0432,"y":-0.0008},{"x":-0.0432,"y":-0.0008}],[{"x":0.0432,"y":0.0008},{"x":0.0432,"y":0.0008}]],[1,1],[0,0],[22,22],"",[0,0],true,false,false,[0.5,0.5],[0.2,0.2],false,true,false],[1,0.158,-3.223,0,"CarvedPumpkin","texture",1,"PumpkinCarved instance 10000",0,6.4538,1.5218,0,false,"#FFFFFF",1,1,1,0,0,0,true]]}',
    class: CarvedPumpkin,
    library: PrefabManager.LIBRARY_MISC
}
