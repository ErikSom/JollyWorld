import * as PrefabManager from '../PrefabManager';
import * as Box2D from '../../../libs/Box2D'
import {
    game
} from "../../Game";

class Finish extends PrefabManager.basePrefab {
    constructor(target) {
        super(target);
    }
    init() {
        super.init();
        this.base = this.lookupObject['base'];

        if(this.prefabObject.settings.isFixed){
            this.base.SetType(Box2D.b2BodyType.b2_staticBody);
        }else{
            this.base.SetType(Box2D.b2BodyType.b2_dynamicBody);
        }
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

Finish.settings = Object.assign({}, Finish.settings, {
    "isFixed": false,
});
Finish.settingsOptions = Object.assign({}, Finish.settingsOptions, {
	"isFixed": false,
});

PrefabManager.prefabLibrary.Finish = {
    json: '{"objects":[[0,-0.009,0.007,0,"finish","base",0,["#999999"],["#000"],[0],false,true,[[[{"x":-6.103,"y":0.467},{"x":-5.225,"y":-0.456},{"x":5.225,"y":-0.478},{"x":6.103,"y":0.467}]]],[1],0,[0],"",[1],true,false,false,[0.5],[0.2]],[1,0.28,-0.197,0,"","",1,"Finish0000",0,0.684,0.612,0,false,"#FFFFFF",1,1,1,0,0,0,true]]}',
    class: Finish,
    library: PrefabManager.LIBRARY_LEVEL
}
