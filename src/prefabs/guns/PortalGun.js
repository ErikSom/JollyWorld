import * as PrefabManager from '../PrefabManager';
import {
    game
} from "../../Game";
import { Settings } from '../../Settings';
import * as Box2D from "../../../libs/Box2D";


class PortalGun extends PrefabManager.basePrefab {
    constructor(target){
        super(target);
    }
    init(){
        super.init();
        this.colorA = '#0093ff';
        this.colorB = '#ff9800';
        this.activePortals = [];
    }
    setOwner(characterReference){
        this.characterReference = characterReference;
    }
    shoot(){
        const characterWeapon = this.lookupObject.gun;
        const weaponAngle = characterWeapon.GetAngle()-90*game.editor.RAD2DEG;
        const bodyAngleVector = new Box2D.b2Vec2(Math.cos(weaponAngle), Math.sin(weaponAngle));
        const gunLength = 2;
        let gunExtent = new Box2D.b2Vec2(bodyAngleVector.y, -bodyAngleVector.x);
        gunExtent.SelfMul(gunLength);
        const bulletSpawnPosition = new Box2D.b2Vec2(characterWeapon.GetPosition().x+gunExtent.x, characterWeapon.GetPosition().y+gunExtent.y);
        const bullet = game.editor.buildRuntimePrefab("PortalBullet", bulletSpawnPosition.x * Settings.PTM, bulletSpawnPosition.y * Settings.PTM);
        game.editor.retrieveClassFromPrefabLookup(bullet).setOwner(this);

        const bulletForce = 1000;
        let dirFore = new Box2D.b2Vec2(bodyAngleVector.y, -bodyAngleVector.x);
        dirFore.SelfMul(bulletForce);
        bullet._bodies[0].ApplyForce(dirFore, characterWeapon.GetPosition());
    }
    spawnPortal(x, y, angle){
        console.log(x, y, angle);
        const portalBodies = game.editor.buildRuntimePrefab("Portal", x, y, angle);
        const portal = game.editor.retrieveClassFromPrefabLookup(portalBodies);

        this.activePortals.push(portal);

        if(this.activePortals.length>2){
            var portalToDelete = this.activePortals.shift();
            portal.setColor(portalToDelete.color);
            portalToDelete.destroy();
        }else if(this.activePortals.length == 2) portal.setColor(this.colorB);
        else portal.setColor(this.colorA);
        //game.editor.retrieveClassFromPrefabLookup(portal).setOwner(this);
    }
}
PrefabManager.prefabLibrary.PortalGun = {
    json: '{"objects":[[0,0.08928090525907337,0.011235677645716754,0,".portalgun","holder",0,["#14a043"],["#000"],[1],false,true,[[[{"x":-0.5574693674933585,"y":0.25041404743017165},{"x":-0.49486585563581564,"y":-0.06260351185754298},{"x":-0.2235839709197962,"y":-0.3338853965735624},{"x":0.13116926293961376,"y":-0.27128188471601944},{"x":0.3398476357980902,"y":-0.06260351185754298},{"x":0.40245114765563317,"y":0.18781053557262872},{"x":0.40245114765563317,"y":0.29214972200186695}]]],[1],0,[0],"",[1]],[0,0.67938553288234,-0.03544140003599332,0,".portalgun","gun",1,["#fcfcfc"],["#000"],[1],false,true,[[[{"x":-0.833733223095262,"y":-0.1177935012446516},{"x":-0.5338952199270577,"y":-0.38550600407340574},{"x":0.22640828810660296,"y":-0.4283400045260064},{"x":0.9760032960271134,"y":-0.2141700022630031},{"x":1.1152137974980658,"y":0.36408900384710496},{"x":-0.15909771596680244,"y":0.5247165055443574},{"x":-0.7908992226426614,"y":0.25700400271560353}]]],[1],0,[0],"",[1]],[2,-0.4541156622590956,0.2217780124982292,0,".portalgun","gun_joint",2,0,1,0,false,false,1,10,false,0,0,0,0,0,0]]}',
    class: PortalGun,
}



