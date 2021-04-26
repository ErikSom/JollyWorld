
import * as PrefabManager from '../PrefabManager';
import { game } from '../../Game';
import { Settings } from '../../Settings';
import * as emitterManager from '../../utils/EmitterManager';


class Jet extends PrefabManager.basePrefab {

    constructor(target) {
        super(target);
        this.isJet = true;
    }
    init(){
        super.init();
        this.base = this.lookupObject['base'];
        this.connectedBody = undefined;
        this.force = this.prefabObject.settings.force;
        this.engineOn = this.prefabObject.settings.engineOn;

		const pos = this.base.GetPosition();

        this.emitter = emitterManager.getLoopingEmitter("jetfire", this.base, pos, 0);
        this.positionJetEmitter();
        this.emitter.playOnce();

        if(!this.prefabObject.settings.isVisible){
            this.base.myTexture.visible = false;
        }

        const jointEdge = this.base.GetJointList();
        if(jointEdge){
            this.connectedBody = jointEdge.joint.GetBodyA() === this.base ? jointEdge.joint.GetBodyB() : jointEdge.joint.GetBodyA();
        }
    }
    update(){
        super.update();
        if(this.engineOn){
            const direction = this.base.GetAngle();
            const deltaForce = (this.force / Settings.targetFPS) * game.editor.deltaTime;
            const force = new Box2D.b2Vec2(deltaForce*Math.cos(direction), deltaForce*Math.sin(direction));
            const position = this.base.GetPosition();
            this.base.ApplyForce(force, position, true);
            if(this.connectedBody) this.connectedBody.ApplyForce(force, position, true);
        }

        this.positionJetEmitter();
        this.emitter.emit = this.engineOn && this.prefabObject.settings.isVisible;
        this.emitter.update(game.editor.deltaTime * 0.001);
    }
    destroy(){
        emitterManager.destroyEmitter(this.emitter);
        delete this.emitter;
        super.destroy();
    }
    positionJetEmitter(){
        const pos = this.base.GetPosition().Clone();
        const lengthOffset = 1.0;
        const angleOffset = Math.PI;
        const angle = this.base.GetAngle()+angleOffset;
        pos.x += lengthOffset * Math.cos(angle);
        pos.y += lengthOffset * Math.sin(angle);
        this.emitter.spawnPos.set(pos.x * Settings.PTM, pos.y * Settings.PTM);

        const emitterAngleOffset = (this.emitter.maxStartRotation - this.emitter.minStartRotation) / 2;
        this.emitter.minStartRotation = angle - emitterAngleOffset;
        this.emitter.maxStartRotation = angle + emitterAngleOffset;
        this.emitter.rotation = angle * game.editor.RAD2DEG;
    }
}

Jet.settings = Object.assign({}, Jet.settings, {
    "engineOn": false,
    "isVisible": true,
    "force": 5000
});
Jet.settingsOptions = Object.assign({}, Jet.settingsOptions, {
    "engineOn": false,
    "isVisible": true,
    "force": {
        min: 100.0,
        max: 10000.0,
        step: 1.0
    },
});

PrefabManager.prefabLibrary.Jet = {
    json: '{"objects":[[0,-0.045,0.032,0,"jet","base",0,["#999999"],["#000"],[0],false,true,[[[{"x":-0.894,"y":-0.42},{"x":0.936,"y":-0.256},{"x":0.949,"y":0.195},{"x":-0.882,"y":0.391}]]],[1],0,[0],"",[1],true,false,false],[1,3.696,1.125,0,"jet","texture",1,"Jet_mc0000",0,5.059,-0.031,0,false,"#FFFFFF",1,1,1,0,0,0,true]]}',
    class: Jet,
    library: PrefabManager.LIBRARY_MOVEMENT
}
