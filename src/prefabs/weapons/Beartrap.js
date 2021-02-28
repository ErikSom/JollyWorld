import * as PrefabManager from '../PrefabManager';
import * as Box2D from '../../../libs/Box2D';
import * as AudioManager from '../../utils/AudioManager';
import {
    game
} from "../../Game";

class Beartrap extends PrefabManager.basePrefab {
    static BEARTRAP_RELEASE = 50;
	static BEARTRAP_RELEASED = 500;
	static BEARTRAP_FORCE = 100000;
	static BEARTRAP_SPEED = 50;
	static LIGHT_COUNT = 8;

    constructor(target) {
        super(target);
    }
    init(){
		super.init();
		this.base = this.lookupObject['base'];
		this.lever = this.lookupObject['lever'];

		this.ready = true;
		this.beartrapTimer = Number.POSITIVE_INFINITY;
        this.beartrapDelay = this.prefabObject.settings.delay * 1000.0;

		this.progressLights = this.base.myTexture.children.filter((light, index) => index > 0);

		this.setLights(0x00ff00, false);

        if(this.prefabObject.settings.isFixed){
            this.base.SetType(Box2D.b2BodyType.b2_staticBody);
        }else{
            this.base.SetType(Box2D.b2BodyType.b2_dynamicBody);
        }
	}

	setLights(color, visible){
		this.progressLights.forEach(light=>{
			light.tint = color;
			light.visible = visible;
		})
	}
	enableLights(progress){
		progress = Math.max(0, Math.min(1.0, progress));
		const lightsOn = Math.floor(Beartrap.LIGHT_COUNT * progress);
		this.progressLights.forEach((light, index)=>{
			light.visible = index<=lightsOn;
		})

		if(lightsOn != this.previousLightsOn) AudioManager.playSFX('drone-beep', 0.1, 1.0, this.base.GetPosition());

		this.previousLightsOn = lightsOn;
	}

	update(){
		super.update();
		if(!this.ready)	this.enableLights(this.beartrapTimer/this.beartrapDelay);
        if (PrefabManager.timerReady(this.beartrapTimer, this.beartrapDelay, true)) {
			this.setLights(0xff0000, true);
            this.lookupObject["spikeLeft_joint"].EnableMotor(true);
            this.lookupObject["spikeLeft_joint"].SetMaxMotorTorque(Beartrap.BEARTRAP_FORCE);
			this.lookupObject["spikeLeft_joint"].SetMotorSpeed(Beartrap.BEARTRAP_FORCE);
			this.lookupObject["spikeRight_joint"].EnableMotor(true);
            this.lookupObject["spikeRight_joint"].SetMaxMotorTorque(Beartrap.BEARTRAP_FORCE);
            this.lookupObject["spikeRight_joint"].SetMotorSpeed(-Beartrap.BEARTRAP_FORCE);
			AudioManager.playSFX('bear-trap', 0.2, 1.0 + 0.4 * Math.random()-0.2, this.base.GetPosition());
        } else if (PrefabManager.timerReady(this.beartrapTimer, this.beartrapDelay + Beartrap.BEARTRAP_RELEASE, true)) {
			this.lookupObject["spikeLeft_joint"].EnableMotor(false);
			this.lookupObject["spikeRight_joint"].EnableMotor(false);
        } else if (PrefabManager.timerReady(this.beartrapTimer, this.beartrapDelay + Beartrap.BEARTRAP_RELEASED, false)) {
			this.ready = true;
			this.setLights(0x00ff00, false);
        }
        this.beartrapTimer += game.editor.deltaTime;
	}

	initContactListener() {
        super.initContactListener();
        const self = this;
        this.contactListener.BeginContact = function(contact) {
            if(contact.GetFixtureA().GetBody() === self.lever || contact.GetFixtureB().GetBody() === self.lever){
				if (self.ready) {
					self.beartrapTimer = -0.001;
					self.ready = false;
				}
			}
        }
    }
}

Beartrap.settings = Object.assign({}, Beartrap.settings, {
	"isFixed": false,
	"delay": 0.0,
});
Beartrap.settingsOptions = Object.assign({}, Beartrap.settingsOptions, {
	"isFixed": false,
	"delay": {
        min: 0.0,
        max: 5.0,
        step: 0.1
    },
});

PrefabManager.prefabLibrary.Beartrap = {
    json: JSON.stringify({"objects":[[0,-0.022,1.233,0,"beartrap","base",0,["#999999"],["#000"],[0],false,true,[[{"x":-2.833,"y":1.042},{"x":-2.833,"y":-1.042},{"x":2.833,"y":-1.042},{"x":2.833,"y":1.042}]],[1],0,[0],"",[1],true,false,false,[0.5],[0.2]],[0,-8.597,-0.045,0,"beartrap","spikeLeft",1,["#999999"],["#000"],[0],false,true,[[{"x":-4.768,"y":0.919},{"x":-4.768,"y":-0.919},{"x":4.768,"y":-0.919},{"x":4.768,"y":0.919}]],[0.5],3,[0],"",[1],true,false,false,[0.5],[0.2]],[0,0.226,-1.177,0,"beartrap","lever",2,["#999999"],["#000"],[0],false,true,[[{"x":-4.559,"y":0.742},{"x":-4.559,"y":-0.742},{"x":4.559,"y":-0.742},{"x":4.559,"y":0.742}]],[1],3,[0],"",[1],true,false,false,[0.5],[0.2]],[0,8.445,-0.037,0,"beartrap","spikeRight",3,["#999999"],["#000"],[0],false,true,[[{"x":-4.768,"y":0.919},{"x":-4.768,"y":-0.919},{"x":4.768,"y":-0.919},{"x":4.768,"y":0.919}]],[0.5],3,[0],"",[1],true,false,false,[0.5],[0.2]],[1,6.513,-18.244,0,"beartrap","floor_texture",4,"BearTrapPart_40000",2,17.063,-1.587,0,false,"#FFFFFF",1,1,1,0,0,0,true],[7,-1.126,26.015,0,"","",5,["[1,0.474,0.98,0,\"beartrap\",\"base_texture\",72,\"BearTrapClock0000\",null,null,null,null,false,\"#FFFFFF\",1,1,1,0,0,0,true]","[1,9.42,-19.174,0,\"beatrap\",\"progress1\",76,\"BearTrapTimerPart0000\",null,null,null,null,false,\"#00ff00\",1,1,1,0,0,0,true]","[1,20.292,-6.651,0.803,\"beatrap\",\"progress2\",77,\"BearTrapTimerPart0000\",null,null,null,null,false,\"#00ff00\",1,1,1,0,0,0,true]","[1,19.493,9.611,1.588,\"beatrap\",\"progress3\",78,\"BearTrapTimerPart0000\",null,null,null,null,false,\"#00ff00\",1,1,1,0,0,0,true]","[1,7.432,20.115,2.373,\"beatrap\",\"progress4\",79,\"BearTrapTimerPart0000\",null,null,null,null,false,\"#00ff00\",1,1,1,0,0,0,true]","[1,-9.576,18.929,3.142,\"beatrap\",\"progress5\",80,\"BearTrapTimerPart0000\",null,null,null,null,false,\"#00ff00\",1,1,1,0,0,0,true]","[1,-20.448,6.406,3.945,\"beatrap\",\"progress6\",81,\"BearTrapTimerPart0000\",null,null,null,null,false,\"#00ff00\",1,1,1,0,0,0,true]","[1,-19.649,-9.855,4.73,\"beatrap\",\"progress7\",82,\"BearTrapTimerPart0000\",null,null,null,null,false,\"#00ff00\",1,1,1,0,0,0,true]","[1,-7.441,-20.359,5.515,\"beatrap\",\"progress8\",83,\"BearTrapTimerPart0000\",null,null,null,null,false,\"#00ff00\",1,1,1,0,0,0,true]"],0,10.99,1.614,0,1,0,0,0,true],[1,-239.861,-33.839,0,"beartrap","spikeLeft_texture",6,"BearTrapPart_10000",1,37.166,1.064,0,false,"#FFFFFF",1,1,1,0,0,0,true],[1,237.372,-33.276,0,"beartrap","spikeRight_texture",7,"BearTrapPart_20000",3,35.924,2.032,0,false,"#FFFFFF",1,1,1,0,0,0,true],[2,-75.21,12.639,0,"beartrap","spring1",8,2,0,2,false,false,1,10,false,0,0,0.3,3,0,0],[2,73.28,16.689,0,"beartrap","spring2",9,2,0,2,false,false,1,10,false,0,0,0.3,3,0,0],[2,-76.209,15.208,-3.142,"beartrap","spikeLeft_joint",10,0,1,0,false,false,1,10,true,90,0,0,0,0,0],[2,73.645,15.566,0,"beartrap","spikeRight_joint",11,0,3,0,false,false,1,10,true,0,-90,0,0,0,0]]}),
    class: Beartrap,
    library: PrefabManager.LIBRARY_WEAPON
}
