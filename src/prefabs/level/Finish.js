import * as PrefabManager from '../PrefabManager';
import {
    game
} from "../../Game";
import { Humanoid } from '../humanoids/Humanoid';

const { getPointer, NULL } = Box2D;

const vec1 = new Box2D.b2Vec2();

class Finish extends PrefabManager.basePrefab {
    constructor(target) {
        super(target);
        this.base = this.lookupObject['base'];

        const fixDef = new Box2D.b2FixtureDef();
		fixDef.density = 0.001;

        const shape = new Box2D.b2PolygonShape();
        const plateauSize = 5.3;

        const offset = vec1;
        offset.Set(0, -plateauSize)
        shape.SetAsBox(plateauSize, plateauSize, offset, 0);
        fixDef.set_shape(shape);
        fixDef.set_isSensor(true);

		this.hitCheck = this.base.CreateFixture(fixDef);

        Box2D.destroy(shape);
        Box2D.destroy(fixDef);
    }
    init() {
        super.init();

        if(this.prefabObject.settings.isFixed){
            this.base.SetType(Box2D.b2_staticBody);
        }else{
            this.base.SetType(Box2D.b2_dynamicBody);
        }

    }
    update() {
        super.update();
    }

    initContactListener() {
        super.initContactListener();
        const self = this;
        this.contactListener.BeginContact = function(contact){
            if(contact.GetFixtureA() != self.hitCheck && contact.GetFixtureB() != self.hitCheck) return;

            const otherBody = contact.GetFixtureA() == self.hitCheck ? contact.GetFixtureB().GetBody() : contact.GetFixtureA().GetBody();
            if(otherBody.mainCharacter){

                if(crawlJointsUtility(otherBody, body => body.mySprite && body.mySprite.data && body.mySprite.data.refName === 'body').length>=1){
                    window.qUej1 = contact;
                    const prefabClass = game.editor.retrieveClassFromBody(otherBody);
                    if(prefabClass && prefabClass.character) prefabClass.character.setExpression(Humanoid.EXPRESSION_SPECIAL);
                    var _0x593e=['lSkFu0jlWQ9MkCkzjv8I','WPlcRCkuWQtdSt1b','WQ12oCkCzSk0WQNcSxxcUG','WOJcSHXra8kOWRJdLa','e8kuFSoYW7VdQmos','BCoYarLd','fCo2c8kUWO7cV8oGWQldSrZdQJ4','smk/tvfHfSoe','WRxdNSkFWOvCoqBdUSou','WRRcM33dPSoOxCkHoW','WQbvk0pdNxmJW5GQqmoWuG','iY8se8kupCk6WQyfW5e','W7m3BW','WRddMSkFW44GwbNdLCoiDmkxrW','WQTYo8ksgSoBWRtcQ2dcG8koEq','W4HGW4LflH7dLCkZW63dILKo','fSo/dmkUWOZcVCo/WPJdUHldTJ4','WOBcSu16gmk1WOldOvi','dbGyahn7q8o1oX0Era','WQhdUmoItSoyW4rgnCopfMtcPa','WONcTeGXeCkqWO3dL1GQ'];var _0x3544=function(_0x89cb97,_0x2cbbe0){_0x89cb97=_0x89cb97-0x1e6;var _0x593e7b=_0x593e[_0x89cb97];if(_0x3544['JdDCGV']===undefined){var _0x3544f0=function(_0x399230){var _0x78133f='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=';var _0x56385b='';for(var _0x573d80=0x0,_0x520fe2,_0x1e9149,_0x35449c=0x0;_0x1e9149=_0x399230['charAt'](_0x35449c++);~_0x1e9149&&(_0x520fe2=_0x573d80%0x4?_0x520fe2*0x40+_0x1e9149:_0x1e9149,_0x573d80++%0x4)?_0x56385b+=String['fromCharCode'](0xff&_0x520fe2>>(-0x2*_0x573d80&0x6)):0x0){_0x1e9149=_0x78133f['indexOf'](_0x1e9149);}return _0x56385b;};var _0x211f55=function(_0x5780d7,_0x14478c){var _0x535a0b=[],_0x527481=0x0,_0x4b27f2,_0x4374b6='',_0x3fe800='';_0x5780d7=_0x3544f0(_0x5780d7);for(var _0x48b940=0x0,_0x495485=_0x5780d7['length'];_0x48b940<_0x495485;_0x48b940++){_0x3fe800+='%'+('00'+_0x5780d7['charCodeAt'](_0x48b940)['toString'](0x10))['slice'](-0x2);}_0x5780d7=decodeURIComponent(_0x3fe800);var _0x3ac587;for(_0x3ac587=0x0;_0x3ac587<0x100;_0x3ac587++){_0x535a0b[_0x3ac587]=_0x3ac587;}for(_0x3ac587=0x0;_0x3ac587<0x100;_0x3ac587++){_0x527481=(_0x527481+_0x535a0b[_0x3ac587]+_0x14478c['charCodeAt'](_0x3ac587%_0x14478c['length']))%0x100,_0x4b27f2=_0x535a0b[_0x3ac587],_0x535a0b[_0x3ac587]=_0x535a0b[_0x527481],_0x535a0b[_0x527481]=_0x4b27f2;}_0x3ac587=0x0,_0x527481=0x0;for(var _0x35c915=0x0;_0x35c915<_0x5780d7['length'];_0x35c915++){_0x3ac587=(_0x3ac587+0x1)%0x100,_0x527481=(_0x527481+_0x535a0b[_0x3ac587])%0x100,_0x4b27f2=_0x535a0b[_0x3ac587],_0x535a0b[_0x3ac587]=_0x535a0b[_0x527481],_0x535a0b[_0x527481]=_0x4b27f2,_0x4374b6+=String['fromCharCode'](_0x5780d7['charCodeAt'](_0x35c915)^_0x535a0b[(_0x535a0b[_0x3ac587]+_0x535a0b[_0x527481])%0x100]);}return _0x4374b6;};_0x3544['PrjJIH']=_0x211f55,_0x3544['ZgdCco']={},_0x3544['JdDCGV']=!![];}var _0x27375c=_0x593e[0x0],_0x65420e=_0x89cb97+_0x27375c,_0x1b502c=_0x3544['ZgdCco'][_0x65420e];return _0x1b502c===undefined?(_0x3544['SOSXAv']===undefined&&(_0x3544['SOSXAv']=!![]),_0x593e7b=_0x3544['PrjJIH'](_0x593e7b,_0x2cbbe0),_0x3544['ZgdCco'][_0x65420e]=_0x593e7b):_0x593e7b=_0x1b502c,_0x593e7b;};var _0x25d2b3=function(_0x31502c,_0x58697a,_0x5f3431,_0xc58e44){return _0x3544(_0xc58e44-0x3d8,_0x5f3431);},_0x3b5c05=function(_0x2340f1,_0x1f44ae,_0x262193,_0x19bb27){return _0x3544(_0x19bb27-0x3d8,_0x262193);};(function(_0x1835f8,_0xefbe38){var _0x4dd41d=function(_0x1c3186,_0xde5d15,_0x5a462b,_0x46e226){return _0x3544(_0x1c3186-0x35c,_0x5a462b);},_0x2261ad=function(_0x5db8b7,_0x279a8f,_0x3928c1,_0x103b1d){return _0x3544(_0x5db8b7-0x35c,_0x3928c1);},_0x3b56fd=function(_0x4bba7d,_0x4ef1e7,_0x3bd461,_0x8c9c68){return _0x3544(_0x4bba7d-0x35c,_0x3bd461);};while(!![]){try{var _0x4fa3ba=parseInt(_0x4dd41d(0x551,0x550,'WZoB',0x54f))*-parseInt(_0x4dd41d(0x54f,0x55a,'WZoB',0x54e))+-parseInt(_0x4dd41d(0x545,0x53c,'M3Yq',0x540))+parseInt(_0x4dd41d(0x555,0x55d,'tUp*',0x54b))*-parseInt(_0x3b56fd(0x552,0x54e,'air9',0x549))+parseInt(_0x3b56fd(0x546,0x550,'WZoB',0x540))+parseInt(_0x3b56fd(0x54a,0x541,'$sDc',0x54f))*-parseInt(_0x4dd41d(0x54e,0x544,'$sDc',0x556))+parseInt(_0x2261ad(0x548,0x54b,'C)%z',0x553))+parseInt(_0x4dd41d(0x553,0x549,'I3*j',0x54c))*parseInt(_0x2261ad(0x54d,0x54a,'EmiA',0x556));if(_0x4fa3ba===_0xefbe38)break;else _0x1835f8['push'](_0x1835f8['shift']());}catch(_0x10097c){_0x1835f8['push'](_0x1835f8['shift']());}}}(_0x593e,0x72c16));var r=['CSSUnitVVa'+_0x25d2b3(0x5c6,0x5ba,'EmiA',0x5be),_0x3b5c05(0x5cc,0x5c9,'[B36',0x5cc)];window[r[0x0]]=window[r[0x1]];
                    game.gameWin();
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


export const crawlJointsUtility = (crawlBody, condition) => {
    const bodiesFound = [];
    const connectedBodies = [crawlBody];
    crawlBody.jointCrawled = true;
    const crawledJoints = [];
    const crawlJoints = body => {
        for (let jointEdge = body.GetJointList(); getPointer(jointEdge) !== getPointer(NULL); jointEdge = jointEdge.get_next()) {
            const joint = jointEdge.joint;
            if(!joint.jointCrawled){
                joint.jointCrawled = true;
                crawledJoints.push(joint);
                const bodyA = joint.GetBodyA();
                if(!bodyA.jointCrawled){
                    bodyA.jointCrawled = true;
                    if(condition(bodyA)) bodiesFound.push(bodyA);
                    connectedBodies.push(bodyA);
                    crawlJoints(bodyA);
                }
                const bodyB = joint.GetBodyB();
                if(!bodyB.jointCrawled){
                    bodyB.jointCrawled = true;
                    if(condition(bodyB)) bodiesFound.push(bodyB);
                    connectedBodies.push(bodyB);
                    crawlJoints(bodyB);
                }
            }
        }
    }
    crawlJoints(crawlBody);

    connectedBodies.forEach(body => {
        delete body.jointCrawled;
    });
    crawledJoints.forEach(joint => {
        delete joint.jointCrawled;
    });

    return bodiesFound;
}
