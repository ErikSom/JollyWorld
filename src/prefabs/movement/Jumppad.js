import * as PrefabManager from '../PrefabManager';
import {
    game
} from "../../Game";

class Jumppad extends PrefabManager.basePrefab {
    static JUMPPAD_RELEASE = 50;
    static JUMPPAD_RELEASED = 100;

    constructor(target) {
        super(target);
    }
    init() {
        super.init();
        this.jumppadTimer = Jumppad.settingsOptions["delay"].max * 1000.0;
        this.jumppadDelay = this.prefabObject.settings.delay * 1000.0;
        this.ready = true;
    }
    update() {
        super.update();
        if (PrefabManager.timerReady(this.jumppadTimer, this.jumppadDelay, true)) {
            this.lookupObject["pad_engine"].EnableMotor(true);
            this.lookupObject["pad_engine"].SetMaxMotorForce(this.prefabObject.settings.force * 10.0);
            this.lookupObject["pad_engine"].SetMotorSpeed(50.0);
        } else if (PrefabManager.timerReady(this.jumppadTimer, this.jumppadDelay + Jumppad.JUMPPAD_RELEASE, true)) {
            this.lookupObject["pad_engine"].EnableMotor(false);
        } else if (PrefabManager.timerReady(this.jumppadTimer, this.jumppadDelay + Jumppad.JUMPPAD_RELEASED, false)) {
            this.ready = true;
        }
        this.jumppadTimer += game.editor.deltaTime;
    }
    set(property, value) {
        switch (property) {
            default:
                this.prefabObject.settings[property] = value;
                break;
        }
    }
    initContactListener() {
        super.initContactListener();
        var self = this;
        this.contactListener.PostSolve = function (contact, impulse) {
            var bodies = [contact.GetFixtureA().GetBody(), contact.GetFixtureB().GetBody()];
            var body;
            if (self.ready) {
                for (var i = 0; i < bodies.length; i++) {
                    body = bodies[i];
                    if (body === self.lookupObject["pad"]) {
                        self.jumppadTimer = -0.001;
                        self.ready = false;
                    }
                }
            }
        }
    }
}
Jumppad.settings = Object.assign({}, Jumppad.settings, {
    "delay": 0.0,
    "force": 0.0
});
Jumppad.settingsOptions = Object.assign({}, Jumppad.settingsOptions, {
    "delay": {
        min: 0.0,
        max: 3.0,
        step: 0.1
    },
    "force": {
        min: 100,
        max: 5000,
        step: 100
    }
});

PrefabManager.prefabLibrary.Jumppad = {
    json: '{"objects":[[0,-0.027441633202424764,-0.02527810336311545,0,"","pad",0,["#707070","#999999"],["#423f3f","#000"],[1,1],false,true,[[{"x":-3.942850401425633,"y":0.4035988599884508},{"x":-3.942850401425633,"y":-0.4035988599884508},{"x":3.942850401425633,"y":-0.4035988599884508},{"x":3.942850401425633,"y":0.4035988599884508}],[{"x":-5.146081262043283,"y":-0.37157711946319416},{"x":-5.146081262043283,"y":-0.5382437861298603},{"x":5.353918737956719,"y":-0.5382437861298603},{"x":5.353918737956719,"y":-0.37157711946319416}]],[1, 1],0,[null,null],""],[0,0.08887776809299597,0.04269412663622327,0,"","platform",1,"#999999","#000",1,false,true,[{"x":-5.2,"y":0.3999999999999999},{"x":-5.2,"y":-0.3999999999999999},{"x":5.2,"y":-0.3999999999999999},{"x":5.2,"y":0.3999999999999999}],10,0,null,""],[1,3.1663330427897654,2.2808237990868117,0,"","",2,"Jumping0000",1,1.1180339887499458,-1.107148717794227,0,false,"#FFFFFF"],[1,2.294313142628518,-14.905656684789344,0,"","",3,"Jumping_Pad0000",0,14.486741363389783,1.353898614790059,0,false,"#FFFFFF"],[2,3.0763512317790314,3.9213369271330984,-0.01745329251994333,"","pad_engine",4,0,1,1,false,false,1,10,true,0,0,0,0,23,0,0]]}',
    class: Jumppad,
    library: PrefabManager.LIBRARY_MOVEMENT
}
