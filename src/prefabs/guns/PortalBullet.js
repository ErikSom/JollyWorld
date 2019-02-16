
import * as PrefabManager from '../PrefabManager';
import {
    game
} from "../../Game";
import * as Box2D from "../../../libs/Box2D";


class PortalBullet extends PrefabManager.basePrefab {
    constructor(target) {
        super(target);
    }
    init(){
        super.init();
        this.portalGun = undefined;
        this.destroyMe = false;
    }
    setOwner(owner){
        this.portalGun = owner; 
    }
    initContactListener() {
        super.initContactListener();
        const self = this;
        this.contactListener.PostSolve = function (contact, impulse) {
            var worldManifold = new Box2D.b2WorldManifold();
            contact.GetWorldManifold(worldManifold);
            self.destroyMe = {x:worldManifold.points[0].x*game.editor.PTM, y:worldManifold.points[0].y*game.editor.PTM, a:Math.atan2(worldManifold.normal.y, worldManifold.normal.x)};
        }
    }
    update(){
        super.update();
        if(this.destroyMe){
            this.portalGun.spawnPortal(this.destroyMe.x, this.destroyMe.y, this.destroyMe.a*game.editor.RAD2DEG);
            game.editor.deleteObjects([this.prefabObject]);
        }
    }
}
PrefabManager.prefabLibrary.PortalBullet = {
    json: '{"objects":[[0,0,0,0,"","bullet",0,["#18d5ff"],["#000"],[1],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],5,[14.273075971261724],"",[1]]]}',
    class: PortalBullet,
}