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
    json: '{"objects":[[0,8.094873589457737,-2.254995896543842,0,"","",0,["#999999"],["#000"],[0],false,true,[[[{"x":-6.103477081189789,"y":0.46654276250101745},{"x":-5.225278940011403,"y":-0.4555652857362884},{"x":5.2252789400114,"y":-0.4775202392657478},{"x":6.103477081189789,"y":0.46654276250101745}]]],[1],0,[0],"",[1]],[1,243.40620988967476,-68.04271954341813,0,"","",1,"Finish0000",0,0.6840524950933171,0.6117332825421953,0,false,"#FFFFFF",1,1,1,0,0,0]]}',
    class: Finish,
    library: PrefabManager.LIBRARY_LEVEL
}
