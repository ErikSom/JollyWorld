import * as PrefabManager from '../PrefabManager';
import {
    game
} from "../../Game";

class Finish extends PrefabManager.basePrefab {
    constructor(target) {
        super(target);
    }
    init() {
        super.init();
    }
    update() {
        super.update();
    }
    initContactListener() {
        super.initContactListener();
        var self = this;
        this.contactListener.PostSolve = function (contact, impulse) {
            if(game.levelWon) return;
            var bodies = [contact.GetFixtureA().GetBody(), contact.GetFixtureB().GetBody()];
            var body;
            for (var i = 0; i < bodies.length; i++) {
                body = bodies[i];
                if(body.mainCharacter){
                     game.win();
                }
            }
        }
    }
}

PrefabManager.prefabLibrary.Finish = {
    json: '{"objects":[[0,-0.1042397476443373,0.14423115765980263,0,"","",0,"#999999","#000",1,false,true,[{"x":-10.267669773237667,"y":0.1653912849846729},{"x":-9.342372584269363,"y":-0.5587543411644356},{"x":9.378132862103886,"y":-0.5185240286005962},{"x":10.263199738508352,"y":0.1788013891726193},{"x":10.249789634320406,"y":0.3665428478038697},{"x":-10.281079877425613,"y":0.3665428478038697}],1,0,null,"",1],[1,-3.1794621025849032,1.705075928252433,0,"","",1,"Finish0000",0,2.622379776836978,1.5907297991995843,0,false,"#FFFFFF"]]}',
    class: Finish,
    library: PrefabManager.LIBRARY_LEVEL
}