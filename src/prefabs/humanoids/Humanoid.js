import * as PrefabManager from '../PrefabManager';
import * as Box2D from '../../../libs/Box2D'
import {
    game
} from "../../Game";
import {
    Settings
} from '../../Settings';
import * as emitterManager from '../../utils/EmitterManager';
import * as AudioManager from '../../utils/AudioManager';
import { clampAngleToRange, rotateVectorAroundPoint } from '../../b2Editor/utils/extramath';
import { editorSettings } from '../../b2Editor/utils/editorSettings';


const vec1 = new Box2D.b2Vec2();
const vec2 = new Box2D.b2Vec2();


export class Humanoid extends PrefabManager.basePrefab {
    static TIME_EYES_CLOSE = 3000;
    static TIME_EYES_OPEN = 3100;
    static TIME_EXPRESSION_PAIN = 500;
    static TIME_EXPRESSION_SPECIAL = 1000;
    static TIME_EXPRESSION_SPECIAL_MIN = 3000;
    static TIME_EXPRESSION_SPECIAL_MAX = 15000;
    static EXPRESSION_IDLE = 'Idle';
    static EXPRESSION_SPECIAL = 'Special';
    static EXPRESSION_PAIN = 'Pain';

    static JSON_ADULT = '{"objects":[[0,-0.107,1.404,-0.069,".character#Humanoid , .flesh","thigh_left",0,["#999999"],["#000"],[0],false,true,[[{"x":-0.202,"y":-1.031},{"x":0.196,"y":-1.044},{"x":0.17,"y":1.038},{"x":-0.164,"y":1.038}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[0,0.126,3.399,-0.087,".character#Humanoid , .flesh","leg_left",1,["#999999"],["#000"],[0],false,true,[[{"x":-0.161,"y":-0.912},{"x":0.161,"y":-0.925},{"x":0.084,"y":0.912},{"x":-0.084,"y":0.925}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[1,-3.4841,42.4292,-0.069,"","",2,"Normal_Thigh0000",0,0.413,-2.367,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,0.275,4.562,0.14,".character#Humanoid , .flesh","feet_left",3,["#999999"],["#000"],[0],false,true,[[{"x":-0.353,"y":-0.233},{"x":0.359,"y":0},{"x":0.359,"y":0.123},{"x":-0.365,"y":0.111}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[1,3.5822,101.9879,-0.087,"","",4,"Normal_Leg0000",1,0.199,-3.142,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,8.9725,135.5288,0.14,"","",5,"Normal_Feet0000",3,1.515,1.214,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.031,-1.817,-0.087,".character#Humanoid , .flesh","shoulder_left",6,["#999999"],["#000"],[0],false,true,[[{"x":-0.185,"y":-0.859},{"x":0.193,"y":-0.842},{"x":0.111,"y":0.851},{"x":-0.119,"y":0.851}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[0,0.261,-0.315,-0.314,".character#Humanoid , .flesh","arm_left",7,["#999999"],["#000"],[0],false,true,[[{"x":-0.136,"y":-0.686},{"x":0.144,"y":-0.703},{"x":0.127,"y":0.694},{"x":-0.136,"y":0.694}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[1,-0.3581,-54.467,-0.087,"","",8,"Normal_Shoulder0000",6,0.573,-0.161,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,8.0797,-9.286,-0.314,"","",9,"Normal_Arm0000",7,0.298,-0.894,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,0.396,0.547,-0.157,".character#Humanoid , .flesh","hand_left",10,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.513],"",[1],true,false,false,[0.5],[0.2],false,true],[1,10.0874,16.2767,-0.157,"","",11,"Normal_Hand0000",10,1.798,2.91,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.378,0.242,-0.279,".character#Humanoid , .flesh","belly",12,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[14.181],"",[1],true,false,false,[0.5],[0.2],false,true],[0,-0.261,-4.11,-0.279,".character#Humanoid , .flesh","head",13,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[30.393],"",[1],true,false,false,[0.5],[0.2],false,true],[0,-0.288,-1.555,0.07,".character#Humanoid , .flesh","body",14,["#999999"],["#000"],[0],false,true,[[{"x":-0.537,"y":1.202},{"x":-0.432,"y":-1.37},{"x":-0.15,"y":-1.828},{"x":0.132,"y":-1.793},{"x":0.555,"y":-1.123},{"x":0.555,"y":1.308},{"x":0.097,"y":1.801},{"x":-0.22,"y":1.801}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[1,-10.1727,-1.4082,-0.079,"","",15,"Normal_Belly0000",12,8.747,1.158,-0.2,false,"#FFFFFF",1,1,1,0,0,0,true],[1,-7.5807,-50.6816,0.07,"","",16,"Normal_Core0000",14,4.169,1.384,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,-6.3783,-125.9135,-0.279,"","",17,"Normal_Head_Idle0000",13,2.99,0.785,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.304,1.454,-0.017,".character#Humanoid , .flesh","thigh_right",18,["#999999"],["#000"],[0],false,true,[[{"x":-0.202,"y":-1.031},{"x":0.196,"y":-1.044},{"x":0.17,"y":1.038},{"x":-0.164,"y":1.038}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[0,-0.202,3.42,-0.069,".character#Humanoid , .flesh","leg_right",19,["#999999"],["#000"],[0],false,true,[[{"x":-0.161,"y":-0.912},{"x":0.161,"y":-0.925},{"x":0.084,"y":0.912},{"x":-0.084,"y":0.925}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[0,-0.0717,-4.2873,-0.279,".character#Humanoid","eye_left",20,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.534],"",[1],true,false,false,[0.5],[0.2],false,true],[1,-9.4098,43.9145,-0.017,"","",21,"Normal_Thigh0000",18,0.413,-2.367,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,-6.2581,102.6143,-0.069,"","",22,"Normal_Leg0000",19,0.199,-3.142,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,-2.135,-129.1791,-0.279,"","",23,"Normal_Eye0000",20,0.561,1.264,0,null,"#FFFFFF",1,1,1,0,0,0,true],[0,0.04,4.57,0,".character#Humanoid , .flesh","feet_right",24,["#999999"],["#000"],[0],false,true,[[{"x":-0.353,"y":-0.233},{"x":0.359,"y":0},{"x":0.359,"y":0.123},{"x":-0.365,"y":0.111}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[1,1.7296,135.6811,0,"","",25,"Normal_Feet0000",24,1.515,1.214,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.149,-1.642,-0.104,".character#Humanoid , .flesh","shoulder_right",26,["#999999"],["#000"],[0],false,true,[[{"x":-0.185,"y":-0.859},{"x":0.193,"y":-0.842},{"x":0.111,"y":0.851},{"x":-0.119,"y":0.851}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[0,0.091,-0.137,-0.192,".character#Humanoid , .flesh","arm_right",27,["#999999"],["#000"],[0],false,true,[[{"x":-0.136,"y":-0.686},{"x":0.144,"y":-0.703},{"x":0.127,"y":0.694},{"x":-0.136,"y":0.694}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true],[0,0.6226,-4.5006,-0.279,".character#Humanoid","eye_right",28,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.534],"",[1],true,false,false,[0.5],[0.2],false,true],[1,18.695,-135.5791,-0.279,"","",29,"Normal_Eye0000",28,0.561,1.264,0,null,"#FFFFFF",1,1,1,0,0,0,true],[1,-3.8975,-49.2267,-0.104,"","",30,"Normal_Shoulder0000",26,0.573,-0.161,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,2.958,-3.9169,-0.192,"","",31,"Normal_Arm0000",27,0.298,-0.894,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,0.099,0.757,-0.226,".character#Humanoid , .flesh","hand_right",32,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.513],"",[1],true,false,false,[0.5],[0.2],false,true],[1,1.1725,22.7006,-0.226,"","",33,"Normal_Hand0000",32,1.798,2.91,0,true,"#FFFFFF",1,1,1,0,0,0,true],[2,-0.361,73.3706,-0.558,".character#Humanoid","leg_left_joint",34,1,0,0,false,false,1,10,true,0,-149,0,0,0,0,false],[2,3.908,129.2436,-0.558,".character#Humanoid","feet_left_joint",35,3,1,0,false,false,1,10,true,0,0,0,0,0,0,false],[2,2.298,-30.9024,-0.279,".character#Humanoid","arm_left_joint",36,7,6,0,false,false,1,10,true,152,0,0,0,0,0,false],[2,14.811,8.3726,1.344,".character#Humanoid","hand_left_joint",37,10,7,0,false,false,1,10,true,60,-60,0,0,0,0,false],[2,-3.524,14.2656,-0.279,".character#Humanoid","thigh_left_joint",38,0,12,0,false,false,1,10,true,142,-16,0,0,0,0,false],[2,-2.71,-77.7224,-0.279,".character#Humanoid","shoulder_left_joint",39,6,14,0,false,false,1,10,true,180,-19,0,0,0,0,false],[2,-3.423,-95.5424,-0.279,".character#Humanoid","head_joint",40,13,14,0,false,false,1,10,true,58,-64,0,0,0,0,false],[2,-8.099,75.5486,-0.279,".character#Humanoid","leg_right_joint",41,19,18,0,false,false,1,10,true,0,-149,0,0,0,0,false],[2,-4.608,130.0736,-0.453,".character#Humanoid","feet_right_joint",42,24,19,0,false,false,1,10,true,0,0,0,0,0,0,false],[2,18.755,-134.5434,-0.279,".character#Humanoid","eye_right_joint",43,28,13,0,false,false,1,10,true,0,0,0,0,0,0,false],[2,-1.471,-24.8884,-0.279,".character#Humanoid","arm_right_joint",44,27,26,0,false,false,1,10,true,152,0,0,0,0,0,false],[2,5.513,15.2006,1.519,".character#Humanoid","hand_right_joint",45,32,27,0,false,false,1,10,true,60,-60,0,0,0,0,false],[2,-6.729,-71.7694,-0.279,".character#Humanoid","shoulder_right_joint",46,26,14,0,false,false,1,10,true,180,-19,0,0,0,0,false],[2,-2.411,-128.7924,-0.279,".character#Humanoid","eye_left_joint",47,20,13,0,false,false,1,10,true,0,0,0,0,0,0,false],[2,-11.07,1.1826,-0.279,".character#Humanoid","belly_joint",48,14,12,0,false,false,1,10,true,10,-10,0,0,0,0,false],[2,-10.057,15.6846,-0.279,".character#Humanoid","thigh_right_joint",49,18,12,0,false,false,1,10,true,142,-16,0,0,0,0,false]]}';

    constructor(target) {
        super(target);
        this.life = 300;
        this.flipped = false;
        this.mouthTextureName = 'Mouth';
        this.mouthPos = {x:41, y:59};

    }

    postConstructor(){
        if(!this.mouth){
            this.mouth = new PIXI.Sprite(PIXI.Texture.from(`${this.mouthTextureName}_Idle0000`))
            this.mouth.x = this.mouthPos.x; // magic numbers
            this.mouth.y = this.mouthPos.y;
            this.lookupObject[Humanoid.BODY_PARTS.HEAD].myTexture.addChild(this.mouth);
        }
    }

    init() {
        super.init();
        this.patchJointAngles();
        this.stabalizeJoints();
        this.eyesTimer = 0.0;
        this.collisionUpdates = [];

        this.bloodSprays = [];

        this.alive = true;
        this.bleedTimer = -1;

        this.expression = Humanoid.EXPRESSION_IDLE;
        this.expressionTimer = 0;
        this.targetExpressionTimer = 0;
        this.specialExpressionTimer = 0;
        this.targetSpecialExpressionTimer = Humanoid.TIME_EXPRESSION_SPECIAL_MIN + (Humanoid.TIME_EXPRESSION_SPECIAL_MAX-Humanoid.TIME_EXPRESSION_SPECIAL_MIN) * Math.random();

        this.lookupObject[Humanoid.BODY_PARTS.HAND_LEFT].noDamage = true;
        this.lookupObject[Humanoid.BODY_PARTS.HAND_RIGHT].noDamage = true;
        this.lookupObject[Humanoid.BODY_PARTS.FEET_LEFT].noDamage = true;
        this.lookupObject[Humanoid.BODY_PARTS.FEET_RIGHT].noDamage = true;

        this.vains = [];
        this.vainJoints = [];
        this.jointMaxForces = [1000000, 1000000, 800000, 800000];

        // game.editor.setBodyCollision(this.lookupObject.eye_left, [5]);
        // game.editor.setBodyCollision(this.lookupObject.eye_right, [5]);
        var i;
        for (i = 0; i < this.lookupObject._bodies.length; i++) {
            var body = this.lookupObject._bodies[i];
            if (body.mySprite.data.groups.indexOf('.flesh') >= 0) {

                body.isFlesh = true;
                body.isHumanoid = true;

                game.editor.prepareBodyForDecals(body);

                var texture = body.myTexture;
                //fix gore for Skin2, Skin3 etc
                var frameNumIndex = texture.data.textureName.indexOf('00');
                var fleshName = texture.data.textureName.substr(0, frameNumIndex);

                if (fleshName.indexOf('Head') > 0) fleshName = fleshName.substr(0, fleshName.indexOf('_')) + "_Head";

                var sprite = new PIXI.heaven.Sprite(PIXI.Texture.from(fleshName + "_Flesh0000"));
                texture.myFlesh = sprite;
                texture.addChildAt(sprite, 0);
            }
        }
    }

    setExpression(expression){
        if(this.expression === expression) return;
        if(!this.lookupObject.head) return;

        const textureName = this.mouth.texture.textureCacheIds[0];
        const textureSkin = textureName.substr(textureName.length - 4);
        this.mouth.texture = PIXI.Texture.from(`${this.mouthTextureName}_${expression}${textureSkin}`);

        this.expressionTimer = 0;

        if(expression === Humanoid.EXPRESSION_PAIN){
            // close eyes as well
            this.eyesTimer = Humanoid.TIME_EYES_CLOSE-1;
            this.targetExpressionTimer = Humanoid.TIME_EXPRESSION_PAIN;
        }else if(expression === Humanoid.EXPRESSION_SPECIAL){
            this.targetExpressionTimer = Humanoid.TIME_EXPRESSION_PAIN;
            this.targetSpecialExpressionTimer = Humanoid.TIME_EXPRESSION_SPECIAL_MIN + (Humanoid.TIME_EXPRESSION_SPECIAL_MAX-Humanoid.TIME_EXPRESSION_SPECIAL_MIN) * Math.random();
            this.specialExpressionTimer = 0;
        }
        this.expression = expression;

    }

    setSkin(skin){
        const targetFrame = String(skin).padStart(4, '0');
        for (let i = 0; i < this.lookupObject._bodies.length; i++) {
            const body = this.lookupObject._bodies[i];

            let targetTextureName = body.myTexture.data.textureName.substr(0, body.myTexture.data.textureName.length-4);
            let targetTexture = targetTextureName+targetFrame;

            body.myTexture.data.textureName = targetTexture;
            body.myTexture.originalSprite.texture = PIXI.Texture.from(targetTexture);
        }
        this.mouth.texture = PIXI.Texture.from(`${this.mouthTextureName}_Idle${targetFrame}`);
    }
    flip(){
        this.flipped = !this.flipped;
        game.editor.mirrorPrefab(this, 'body');
    }
    update() {
        super.update();

        if (PrefabManager.timerReady(this.eyesTimer, Humanoid.TIME_EYES_CLOSE, true) || !this.alive) {
            if (this.lookupObject.eye_left){
                const textureIndex = this.lookupObject.eye_left.myTexture.data.textureName.substr(this.lookupObject.eye_left.myTexture.data.textureName.length-4);
                const baseTextureName = this.lookupObject.eye_left.myTexture.data.textureName.split(textureIndex)[0];
                this.lookupObject.eye_left.myTexture.originalSprite.texture = PIXI.Texture.from(`${baseTextureName}_Closed${textureIndex}`);
            }
            if (this.lookupObject.eye_right){
                const textureIndex = this.lookupObject.eye_right.myTexture.data.textureName.substr(this.lookupObject.eye_right.myTexture.data.textureName.length-4);
                const baseTextureName = this.lookupObject.eye_right.myTexture.data.textureName.split(textureIndex)[0];
                this.lookupObject.eye_right.myTexture.originalSprite.texture = PIXI.Texture.from(`${baseTextureName}_Closed${textureIndex}`);
            }
        } else if (PrefabManager.timerReady(this.eyesTimer, Humanoid.TIME_EYES_OPEN, false)) {
            if (this.lookupObject.eye_left) this.lookupObject.eye_left.myTexture.originalSprite.texture = PIXI.Texture.from(this.lookupObject.eye_left.myTexture.data.textureName);
            if (this.lookupObject.eye_right) this.lookupObject.eye_right.myTexture.originalSprite.texture = PIXI.Texture.from(this.lookupObject.eye_right.myTexture.data.textureName);
            this.eyesTimer = -game.editor.deltaTime;
        }

        if (PrefabManager.timerReady(this.expressionTimer, this.targetExpressionTimer, true) && this.alive) {
            this.setExpression(Humanoid.EXPRESSION_IDLE);
        }

        if (PrefabManager.timerReady(this.specialExpressionTimer, this.targetSpecialExpressionTimer, true) && this.alive) {
            this.setExpression(Humanoid.EXPRESSION_SPECIAL);
        }

        this.processJointDamage();
        this.processBodySeparation();
        this.processBloodSprays();

        if (this.collisionUpdates.length > 0) {
            this.doCollisionUpdate(this.collisionUpdates[0]);
            this.collisionUpdates.shift();
            this.checkLimbs();
        }
        this.eyesTimer += game.editor.deltaTime;
        this.expressionTimer += game.editor.deltaTime;
        this.specialExpressionTimer += game.editor.deltaTime;

        if (this.bleedTimer >= 0) {
            if (this.bleedTimer == 0) {
                this.die();
            }
            this.bleedTimer--;
        }
        if(this.life<=0 && this.bleedTimer<0){
            this.bleedTimer = 0;
        }
    }
    die(){
        this.alive = false;
    }
    processJointDamage() {
        const jointsToAnalyse = ['leg_left_joint', 'leg_right_joint','arm_left_joint', 'arm_right_joint'/*,'head_joint', 'belly_joint'*/ ];
        for (var i = 0; i < jointsToAnalyse.length; i++) {
            let targetJoint = this.lookupObject[jointsToAnalyse[i]];
            if (!targetJoint) continue;

            let reactionForce = vec1;
            targetJoint.GetReactionForce(1 / Settings.physicsTimeStep, reactionForce);
            reactionForce = reactionForce.LengthSquared();
            let reactionTorque = targetJoint.GetReactionTorque(1 / Settings.physicsTimeStep);

            if (reactionForce > this.jointMaxForces[i] || Math.abs(reactionTorque) > 600) {
                this.collisionUpdates.push({
                    type: Humanoid.GORE_SNAP,
                    target: jointsToAnalyse[i].split('_joint')[0],
                });
            }
        }
    }

    processBloodSprays(){
        for(let i = 0; i<this.bloodSprays.length; i++){
            const spray = this.bloodSprays[i];
            if(spray.body && !spray.body.destroyed){
                const spawnPos = new Box2D.b2Vec2();
                spray.body.GetWorldPoint(spray.anchor, spawnPos);

                 if(!spray.initialized){
                     spray.emitter = emitterManager.playOnceEmitter("bloodSpray", spray.body, spawnPos, spray.body.GetAngle()+spray.angle);
                     spray.initialized = true;
                 } else if(spray.emitter){
                    spray.emitter.spawnPos.set(spawnPos.x * Settings.PTM, spawnPos.y * Settings.PTM);

                    const angle = spray.body.GetAngle()+spray.angle;
                    const emitterAngleOffset = (spray.emitter.maxStartRotation - spray.emitter.minStartRotation) / 2;
                    spray.emitter.minStartRotation = angle - emitterAngleOffset;
                    spray.emitter.maxStartRotation = angle + emitterAngleOffset;
                    spray.emitter.rotation = angle * game.editor.RAD2DEG;
                 }
            }else if(spray.emitter){
                spray.emitter.spawnPos.set(-editorSettings.worldSize.width, -editorSettings.worldSize.height);
            }

            if(performance.now() > spray.time){
                this.bloodSprays.splice(i, 1);
                i--;
            }
        }
    }

    processBodySeparation(){
        const snapSeperation = 0.2;
        const maxSnapTicks = 30;
        let i;
        const jointsToAnalyse = ['leg_left_joint', 'leg_right_joint', 'head_joint', 'belly_joint', 'feet_left_joint', 'feet_right_joint', 'hand_left_joint', 'hand_right_joint', 'thigh_left_joint', 'thigh_right_joint', 'shoulder_left_joint', 'shoulder_right_joint'];

        // check num frames
        
        for (i = 0; i < jointsToAnalyse.length; i++) {
            let targetJoint = this.lookupObject[jointsToAnalyse[i]];
            if (!targetJoint) continue;

            const pos1 = vec1;
            targetJoint.GetAnchorA(pos1);
            const pos2 = vec2;
            targetJoint.GetAnchorB(pos2);

            const distance = pos1.SelfSub(pos2);

            if(distance.Length() > snapSeperation){
                if(targetJoint.snapTick === undefined) targetJoint.snapTick = 0;
                targetJoint.snapTick++;

                if(targetJoint.snapTick>= maxSnapTicks){

                    this.collisionUpdates.push({
                        type: Humanoid.GORE_SNAP,
                        target: jointsToAnalyse[i].split('_joint')[0],
                    });

                    targetJoint.snapTick = 0;


                }
            }else{
                targetJoint.snapTick = 0;
            }
        }


        for(i = 0; i<this.vains.length; i++){
            const vain = this.vains[i];

            let jointEdge = vain.GetJointList();

            while(jointEdge){

                let targetJoint = jointEdge.joint;

                if(targetJoint.GetType() !== Box2D.b2JointType.e_ropeJoint){

                    const pos1 = vec1;
                    targetJoint.GetAnchorA(pos1);
                    const pos2 = vec2;
                    targetJoint.GetAnchorB(pos2);

                    const distance = pos1.SelfSub(pos2);

                    if(distance.Length() > snapSeperation){
                        if(targetJoint.snapTick === undefined) targetJoint.snapTick = 0;
                        targetJoint.snapTick++;

                        if(targetJoint.snapTick>= maxSnapTicks){
                            game.editor.deleteObjects([targetJoint]);
                            if(!vain.vainRopeJoint.destroyed){
                                game.editor.deleteObjects([vain.vainRopeJoint]);
                            }
                        }
                    }else{
                        targetJoint.snapTick = 0;
                    }

                }


                jointEdge = jointEdge.next;
            }

        }
    }

    static GORE_BASH = 0;
    static GORE_SNAP = 1;

    dealDamage(damage){
        this.life -= damage;

        this.setExpression(Humanoid.EXPRESSION_PAIN);

        if(damage >= 10000){
            for(let part in Humanoid.BODY_PARTS){
                this.collisionUpdates.push({
                    type: Humanoid.GORE_BASH,
                    target: Humanoid.BODY_PARTS[part]
                });
            }
        }
    }

    initContactListener() {
        super.initContactListener();
        var self = this;
        this.contactListener.PreSolve = function (contact, impulse) {
            const bodyA = contact.GetFixtureA().GetBody();
            const bodyB = contact.GetFixtureB().GetBody();
            bodyA.preSolveVelicity = bodyA.GetLinearVelocity().Clone();
            bodyA.preSolveVelicityCounter = bodyA.preSolveVelicityCounter !== undefined ? bodyA.preSolveVelicityCounter + 1 : 1;
            bodyB.preSolveVelicity = bodyB.GetLinearVelocity().Clone();
            bodyB.preSolveVelicityCounter = bodyB.preSolveVelicityCounter !== undefined ? bodyB.preSolveVelicityCounter + 1 : 1;

        }
        this.contactListener.PostSolve = function (contact, impulse) {

            if(!contact.GetFixtureA().GetBody().mySprite || !contact.GetFixtureB().GetBody().mySprite) return;

            let characterBody;
            let otherBody;
            let otherFixture;

            if(game.editor.retrieveSubClassFromBody(contact.GetFixtureA().GetBody()) === self){
                characterBody = contact.GetFixtureA().GetBody();
                otherBody = contact.GetFixtureB().GetBody();
                otherFixture = contact.GetFixtureB();
            }else{
                characterBody = contact.GetFixtureB().GetBody();
                otherBody = contact.GetFixtureA().GetBody();
                otherFixture = contact.GetFixtureA();
            }

            if(otherFixture.GetDensity() <= 0.001) return;
            if(otherBody.GetMass()===0 || (otherBody.isVehiclePart && characterBody.mainHumanoid) || otherBody.noImpactDamage) return;

            if ((otherBody.mySprite.data.prefabID != characterBody.mySprite.data.prefabID || otherBody.mySprite.data.prefabID == undefined)) {

                const count = contact.GetManifold().pointCount;

                let force = 0;
                for (let j = 0; j < count; j++) force = Math.max(force, impulse.normalImpulses[j]);

                const minForceForDamage = 10.0;
                const forceToDamageDivider = 50.0;

                const bodyA = contact.GetFixtureA().GetBody();
                const bodyB = contact.GetFixtureB().GetBody();
                const velocityA = bodyA.GetLinearVelocity().Length();
                const velocityB = bodyB.GetLinearVelocity().Length();
                let impactAngle = (velocityA > velocityB) ? Math.atan2(bodyA.GetLinearVelocity().y, bodyA.GetLinearVelocity().x) : Math.atan2(bodyB.GetLinearVelocity().y, bodyB.GetLinearVelocity().x);
                impactAngle *= game.editor.RAD2DEG + 180;
                const velocitySum = velocityA + velocityB;


                let allowSound = true;
                if(bodyA.recentlyImpactedBodies && bodyA.recentlyImpactedBodies.includes(bodyB)) allowSound = false;
                if(bodyB.recentlyImpactedBodies && bodyB.recentlyImpactedBodies.includes(bodyA)) allowSound = false;

                if(velocitySum > 10 && force> characterBody.GetMass() * minForceForDamage && !characterBody.noDamage){
                    self.dealDamage(force/forceToDamageDivider);

                    if(!bodyA.recentlyImpactedBodies) bodyA.recentlyImpactedBodies = [];
                    bodyA.recentlyImpactedBodies.push(bodyB);

                    if(allowSound) AudioManager.playSFX(['bodyhit1', 'bodyhit2','bodyhit3'], 0.3, 1.0 + 0.4 * Math.random()-0.2, characterBody.GetPosition());
                }

                let forceDamage = 0;

                if(characterBody.preSolveVelicity && otherBody.preSolveVelicity){
                    const charOtherBodyDiff = characterBody.GetPosition().Clone().SelfSub(otherBody.GetPosition());
                    const dotProductChar = characterBody.preSolveVelicity.Dot(charOtherBodyDiff)*-1;

                    const otherBodyCharDiff = otherBody.GetPosition().Clone().SelfSub(characterBody.GetPosition());
                    const dotProductOther = otherBody.preSolveVelicity.Dot(otherBodyCharDiff)*-1;

                    if(dotProductChar>0){
                        forceDamage += characterBody.preSolveVelicity.LengthSquared() * characterBody.GetMass();
                    }
                    if(dotProductOther>0){
                        forceDamage += otherBody.preSolveVelicity.LengthSquared() * otherBody.GetMass();
                    }

                    if(characterBody == self.lookupObject["belly"]) forceDamage /= 3;

                    if (forceDamage > Settings.bashForce / 2) {
                        if (characterBody == self.lookupObject["head"]) {
                            if (PrefabManager.chancePercent(30)) self.collisionUpdates.push({
                                type: Humanoid.GORE_SNAP,
                                target: "eye_right"
                            });
                            if (PrefabManager.chancePercent(30)) self.collisionUpdates.push({
                                type: Humanoid.GORE_SNAP,
                                target: "eye_left"
                            });
                        }
                    }

                    if (characterBody.mySprite.data.refName != "" && forceDamage > Settings.bashForce) {
                        self.collisionUpdates.push({
                            type: Humanoid.GORE_BASH,
                            target: characterBody.mySprite.data.refName,
                        });
                    }
                }
            }
            characterBody.preSolveVelicityCounter--;
            if(characterBody.preSolveVelicityCounter <= 0){
                delete characterBody.preSolveVelicity;
                delete characterBody.preSolveVelicityCounter;
            }
            otherBody.preSolveVelicityCounter--;
            if(otherBody.preSolveVelicityCounter <= 0){
                delete otherBody.preSolveVelicity;
                delete otherBody.preSolveVelicityCounter;
            }
        }
    }
    static connectedBodyRefs = {}
    static BODY_PARTS = {
        HEAD: 'head',
        BODY: 'body',
        THIGH_LEFT: 'thigh_left',
        THIGH_RIGHT: 'thigh_right',
        LEG_LEFT: 'leg_left',
        LEG_RIGHT: 'leg_right',
        FEET_LEFT: 'feet_left',
        FEET_RIGHT: 'feet_right',
        SHOULDER_LEFT: 'shoulder_left',
        SHOULDER_RIGHT: 'shoulder_right',
        ARM_LEFT: 'arm_left',
        ARM_RIGHT: 'arm_right',
        HAND_LEFT: 'hand_left',
        HAND_RIGHT: 'hand_right',
        BELLY: 'belly',
    }

    addBloodEmitters(target, type){
        const bloodTime = 3000;
        const baseBody = this.lookupObject[target];

        if(type === Humanoid.GORE_SNAP){

            const targetJoint = this.lookupObject[target + "_joint"];
            if(baseBody && targetJoint){

                let targetAngle = 0;
                if([Humanoid.BODY_PARTS.HEAD].includes(target)){
                    targetAngle = -Settings.pihalve;
                }else{
                    targetAngle = Settings.pihalve;
                }

                const targetBody1 = targetJoint.GetBodyA() == baseBody ? targetJoint.GetBodyB() : targetJoint.GetBodyA();
                const targetBody2 = targetJoint.GetBodyA() == baseBody ? targetJoint.GetBodyA() : targetJoint.GetBodyB();
                const targetAnchor1 = targetJoint.GetBodyA() == baseBody ? targetJoint.GetLocalAnchorB() : targetJoint.GetLocalAnchorA();
                const targetAnchor2 = targetJoint.GetBodyA() == baseBody ? targetJoint.GetLocalAnchorA() : targetJoint.GetLocalAnchorB();

                this.bloodSprays.push({body:targetBody1, anchor:targetAnchor1, angle:targetAngle, time:performance.now()+bloodTime});
                this.bloodSprays.push({body:targetBody2, anchor:targetAnchor2, angle:-targetAngle, time:performance.now()+bloodTime});
            }

        }else{
            let jointEdge = baseBody.GetJointList();
            while(jointEdge){
                const joint = jointEdge.joint;
                const body = joint.GetBodyA() === baseBody ? joint.GetBodyB() : joint.GetBodyA();

                if(body.isFlesh && joint.GetType() === Box2D.b2JointType.e_revoluteJoint && !['eye_left', 'eye_right'].includes(body.mySprite.data.refName)){
                    let angle = Settings.pihalve;
                    if(joint === this.lookupObject[body.mySprite.data.refName+'_joint']){
                        angle = -Settings.pihalve;
                    }
                    if(body.mySprite.data.refName === 'head') angle *= -1;
                    const anchor = joint.GetBodyA() === baseBody ? joint.GetLocalAnchorB() : joint.GetLocalAnchorA();
                    this.bloodSprays.push({body, anchor, angle, time:performance.now()+bloodTime});
                }

                jointEdge = jointEdge.next;
            }

        }



    }
    doCollisionUpdate(update) {
        if ((update.target == 'head' || update.target == 'body') && this.bleedTimer < 0) this.bleedTimer = 0;
        switch (update.type) {
            case Humanoid.GORE_BASH:

                var targetBody = this.lookupObject[update.target];
                if (targetBody) {

                    this.addBloodEmitters(update.target, update.type);
                    for (var i = 1; i < this.collisionUpdates.length; i++) {
                        if (this.collisionUpdates[i].target === update.target) {
                            this.collisionUpdates.splice(i, 1);
                            i--;
                        }
                    }

                    this.generateGoreParticles(update.target);
                    emitterManager.playOnceEmitter("gorecloud", targetBody, targetBody.GetPosition());
                    AudioManager.playSFX(['bash1', 'bash2', 'bash3', 'bash4'], 0.3, 1.0+Math.random()*.2-.1, targetBody.GetPosition());

                    let connectedJointEdge = targetBody.GetJointList();
                    while(connectedJointEdge){
                        const joint = connectedJointEdge.joint;
                        if(joint.GetBodyA() != targetBody && joint.GetBodyA().isFlesh) game.editor.addDecalToBody(joint.GetBodyA(), joint.GetAnchorA(new Box2D.b2Vec2()), "Decal.png", true);
                        if(joint.GetBodyB() != targetBody && joint.GetBodyB().isFlesh) game.editor.addDecalToBody(joint.GetBodyB(), joint.GetAnchorA(new Box2D.b2Vec2()), "Decal.png", true);
                        connectedJointEdge = connectedJointEdge.next;
                    }

                    // Fix bash damaage & also set snapped for objects that got detached from the player
                    if(this.lookupObject[Humanoid.BODY_PARTS.SHOULDER_LEFT] === targetBody){
                        if(this.lookupObject[Humanoid.BODY_PARTS.ARM_LEFT]) this.lookupObject[Humanoid.BODY_PARTS.ARM_LEFT].snapped = true;
                        if(this.lookupObject[Humanoid.BODY_PARTS.HAND_LEFT]) this.lookupObject[Humanoid.BODY_PARTS.HAND_LEFT].snapped = true;
                    } else if(this.lookupObject[Humanoid.BODY_PARTS.SHOULDER_RIGHT] === targetBody){
                        if(this.lookupObject[Humanoid.BODY_PARTS.ARM_RIGHT]) this.lookupObject[Humanoid.BODY_PARTS.ARM_RIGHT].snapped = true;
                        if(this.lookupObject[Humanoid.BODY_PARTS.HAND_RIGHT]) this.lookupObject[Humanoid.BODY_PARTS.HAND_RIGHT].snapped = true;
                    } else if(this.lookupObject[Humanoid.BODY_PARTS.THIGH_LEFT] === targetBody){
                        if(this.lookupObject[Humanoid.BODY_PARTS.LEG_LEFT]) this.lookupObject[Humanoid.BODY_PARTS.LEG_LEFT].snapped = true;
                        if(this.lookupObject[Humanoid.BODY_PARTS.FEET_LEFT]) this.lookupObject[Humanoid.BODY_PARTS.FEET_LEFT].snapped = true;
                    } else if(this.lookupObject[Humanoid.BODY_PARTS.THIGH_RIGHT] === targetBody){
                        if(this.lookupObject[Humanoid.BODY_PARTS.LEG_RIGHT]) this.lookupObject[Humanoid.BODY_PARTS.LEG_RIGHT].snapped = true;
                        if(this.lookupObject[Humanoid.BODY_PARTS.FEET_RIGHT]) this.lookupObject[Humanoid.BODY_PARTS.FEET_RIGHT].snapped = true;
                    } else if(this.lookupObject[Humanoid.BODY_PARTS.ARM_LEFT] === targetBody){
                        if(this.lookupObject[Humanoid.BODY_PARTS.HAND_LEFT]) this.lookupObject[Humanoid.BODY_PARTS.HAND_LEFT].snapped = true;
                    } else if(this.lookupObject[Humanoid.BODY_PARTS.ARM_RIGHT] === targetBody){
                        if(this.lookupObject[Humanoid.BODY_PARTS.HAND_RIGHT]) this.lookupObject[Humanoid.BODY_PARTS.HAND_RIGHT].snapped = true;
                    } else if(this.lookupObject[Humanoid.BODY_PARTS.LEG_LEFT] === targetBody){
                        if(this.lookupObject[Humanoid.BODY_PARTS.FEET_LEFT]) this.lookupObject[Humanoid.BODY_PARTS.FEET_LEFT].snapped = true;
                    } else if(this.lookupObject[Humanoid.BODY_PARTS.LEG_RIGHT] === targetBody){
                        if(this.lookupObject[Humanoid.BODY_PARTS.FEET_RIGHT]) this.lookupObject[Humanoid.BODY_PARTS.FEET_RIGHT].snapped = true;
                    }

                    this.dealDamage(30);
                    if([this.lookupObject[Humanoid.BODY_PARTS.HEAD], this.lookupObject[Humanoid.BODY_PARTS.BODY]].includes(targetBody)){
                        if(this.hat) this.hat.detach();
                        this.dealDamage(1000);
                    }

                    if(targetBody.grabJoints){
                        targetBody.grabJoints.forEach(grabJoint=>{
                            game.world.DestroyJoint(grabJoint);
                            delete targetBody.grabJoints;
                        })
                    }

                    game.editor.deleteObjects([targetBody]);

                }

                break;
            case Humanoid.GORE_SNAP:
                const targetJoint = this.lookupObject[update.target + "_joint"];
                if (targetJoint) {
                    this.addBloodEmitters(update.target, update.type);

                    if (targetJoint.GetBodyA().connectedSpike || targetJoint.GetBodyB().connectedSpike) break;


                    const anchorAPos = targetJoint.GetAnchorA(vec1);
                    const anchorBPos = targetJoint.GetAnchorB(vec2);

                    let revoluteJointDef, joint;

                    let vainPrefab = '{"objects":[[4,' + anchorAPos.x * Settings.PTM + ',' + anchorAPos.y * Settings.PTM + ',0,{},"Vain"]]}'

                    let vainBodies = game.editor.buildJSON(JSON.parse(vainPrefab));

                    let vainSize = (vainBodies._bodies[0].originalGraphic.height * vainBodies._bodies.length) / Settings.PTM;


                    revoluteJointDef = new Box2D.b2RevoluteJointDef;

                    vainBodies._bodies[0].SetPosition(anchorAPos);

                    revoluteJointDef.Initialize(targetJoint.GetBodyA(), vainBodies._bodies[0], anchorAPos);

                    revoluteJointDef.collideConnected = false;
                    joint = game.world.CreateJoint(revoluteJointDef);

                    revoluteJointDef = new Box2D.b2RevoluteJointDef;
                    vainBodies._bodies[3].SetPosition(anchorBPos);
                    revoluteJointDef.Initialize(targetJoint.GetBodyB(), vainBodies._bodies[3], anchorBPos);


                    revoluteJointDef.collideConnected = false;
                    joint = game.world.CreateJoint(revoluteJointDef);

                    let ropeJointDef;


                    ropeJointDef = new Box2D.b2RopeJointDef;
                    ropeJointDef.Initialize(targetJoint.GetBodyA(), targetJoint.GetBodyB(), anchorAPos, anchorAPos);
                    ropeJointDef.maxLength = vainSize;

                    joint = game.world.CreateJoint(ropeJointDef);

                    [targetJoint.GetBodyA(), targetJoint.GetBodyB()].forEach(body => {
                        if(this.lookupObject[Humanoid.BODY_PARTS.SHOULDER_LEFT] === body){
                            if(this.lookupObject[Humanoid.BODY_PARTS.ARM_LEFT])this.lookupObject[Humanoid.BODY_PARTS.ARM_LEFT].snapped = true;
                            if(this.lookupObject[Humanoid.BODY_PARTS.HAND_LEFT])this.lookupObject[Humanoid.BODY_PARTS.HAND_LEFT].snapped = true;
                        } else if(this.lookupObject[Humanoid.BODY_PARTS.SHOULDER_RIGHT] === body){
                            if(this.lookupObject[Humanoid.BODY_PARTS.ARM_RIGHT])this.lookupObject[Humanoid.BODY_PARTS.ARM_RIGHT].snapped = true;
                            if(this.lookupObject[Humanoid.BODY_PARTS.HAND_RIGHT])this.lookupObject[Humanoid.BODY_PARTS.HAND_RIGHT].snapped = true;
                        } else if(this.lookupObject[Humanoid.BODY_PARTS.THIGH_LEFT] === body){
                            if(this.lookupObject[Humanoid.BODY_PARTS.LEG_LEFT])this.lookupObject[Humanoid.BODY_PARTS.LEG_LEFT].snapped = true;
                            if(this.lookupObject[Humanoid.BODY_PARTS.FEET_LEFT])this.lookupObject[Humanoid.BODY_PARTS.FEET_LEFT].snapped = true;
                        } else if(this.lookupObject[Humanoid.BODY_PARTS.THIGH_RIGHT] === body){
                            if(this.lookupObject[Humanoid.BODY_PARTS.LEG_RIGHT])this.lookupObject[Humanoid.BODY_PARTS.LEG_RIGHT].snapped = true;
                            if(this.lookupObject[Humanoid.BODY_PARTS.FEET_RIGHT])this.lookupObject[Humanoid.BODY_PARTS.FEET_RIGHT].snapped = true;
                        }
                    })
                    //carve bodies

                    if (targetJoint.GetBodyA().isFlesh) game.editor.addDecalToBody(targetJoint.GetBodyA(), anchorAPos, "Decal.png", true);
                    if (targetJoint.GetBodyB().isFlesh) game.editor.addDecalToBody(targetJoint.GetBodyB(), anchorBPos, "Decal.png", true);

                    game.world.DestroyJoint(targetJoint);
                    delete this.lookupObject[update.target + "_joint"];

                    AudioManager.playSFX(['snap1', 'snap2', 'snap3', 'snap4'], 0.3, 1.0+Math.random()*.2-.1, targetJoint.GetBodyA().GetPosition());

                    this.vains.push(...vainBodies._bodies);

                    //fix display positions:
                    const swapBodies = vainBodies._bodies.concat().reverse();
                    let tarSprite;
                    const tarIndex = this.lookupObject[update.target].myTexture.parent.getChildIndex(this.lookupObject[update.target].myTexture);
                    for (var i = 0; i < swapBodies.length; i++) {
                        tarSprite = swapBodies[i].mySprite;
                        swapBodies[i].isVain = true;
                        swapBodies[i].vainRopeJoint = joint;
                        tarSprite.parent.removeChild(tarSprite);
                        this.lookupObject[update.target].myTexture.parent.addChildAt(tarSprite, tarIndex);
                    }
                }
                break;
        }

    }
    generateGoreParticles(targetBodyPart){
        let meatParticles = ["Gore_Meat", "Gore_Meat", "Gore_Meat"];
        let extraParticles = [];
        switch(targetBodyPart){
            case 'head':
                extraParticles.push('Gore_Brain');
                meatParticles.push("Gore_Meat", "Gore_Meat");
            break
            case 'body':
                extraParticles.push('Gore_LungRight', 'Gore_LungLeft', 'Gore_Stomach','Gore_Liver');
                meatParticles.push("Gore_Meat", "Gore_Meat","Gore_Meat", "Gore_Meat");
            break;
            case 'belly':
                extraParticles.push('Gore_Intestine');
            break;
            case 'thigh_left':
            case 'thigh_right':
            case 'leg_left':
            case 'leg_right':
                meatParticles.push("Gore_Meat");
            break;
            case 'hand_left':
            case 'hand_right':
                meatParticles = ['Gore_Meat'];
            break;
            case 'feet_left':
            case 'feet_right':
                meatParticles = ['Gore_Meat', 'Gore_Meat'];
            break;
        }
        const goreParticleMaxSpeed = 50;
        const particlesToGenerate = meatParticles.concat(extraParticles);
        const targetBody = this.lookupObject[targetBodyPart];
        particlesToGenerate.forEach((particle)=>{
            const gorePrefab = `{"objects":[[4,${targetBody.GetPosition().x * Settings.PTM},${targetBody.GetPosition().y * Settings.PTM},0,{},"${particle}"]]}`;
            const goreLookupObject = game.editor.buildJSON(JSON.parse(gorePrefab));
            const impulse = new Box2D.b2Vec2((Math.random()*(goreParticleMaxSpeed*2)-goreParticleMaxSpeed), (Math.random()*(goreParticleMaxSpeed*2)-goreParticleMaxSpeed));
            goreLookupObject._bodies.forEach((body)=>{
                body.ApplyForce(impulse, targetBody.GetPosition());
            });

            if(particle == 'Gore_Meat'){
                const ranId = Math.floor(Math.random()*4)+1;
                goreLookupObject._textures[0].children[0].texture = PIXI.Texture.from(particle+ranId+'0000');
            }
        });
    }

    addJoint(joint, bodyB){
    }

    positionBody(direction) {
        const positions = {
            up: {
                thigh_right: {
                    angle: 10,
                    reference: "body",
                    clockwise: 1
                },
                thigh_left: {
                    angle: 10,
                    reference: "body",
                    clockwise: 1
                },
                leg_right: {
                    angle: 10,
                    reference: "thigh_right",
                    clockwise: 1
                },
                leg_left: {
                    angle: 10,
                    reference: "thigh_left",
                    clockwise: 1
                },
                shoulder_right: {
                    angle: 170,
                    reference: "body",
                    clockwise: -1
                },
                shoulder_left: {
                    angle: 170,
                    reference: "body",
                    clockwise: -1
                },
                arm_right: {
                    angle: 10,
                    reference: "shoulder_right",
                    clockwise: -1
                },
                arm_left: {
                    angle: 10,
                    reference: "shoulder_left",
                    clockwise: -1
                },
                head: {
                    angle: 40,
                    reference: "body",
                    clockwise: 0
                },
                belly: {
                    angle: 0,
                    reference: "body",
                    clockwise: 0,
                }
            },
            down: {
                thigh_right: {
                    angle: 120,
                    reference: "body",
                    clockwise: -1
                },
                thigh_left: {
                    angle: 120,
                    reference: "body",
                    clockwise: -1
                },
                leg_right: {
                    angle: -140,
                    reference: "thigh_right",
                    clockwise: 1
                },
                leg_left: {
                    angle: -140,
                    reference: "thigh_left",
                    clockwise: 1
                },
                shoulder_right: {
                    angle: 0,
                    reference: "body",
                    clockwise: 1
                },
                shoulder_left: {
                    angle: 0,
                    reference: "body",
                    clockwise: 1
                },
                arm_right: {
                    angle: 60,
                    reference: "shoulder_right",
                    clockwise: -1
                },
                arm_left: {
                    angle: 60,
                    reference: "shoulder_left",
                    clockwise: -1
                },
                head: {
                    angle: -64,
                    reference: "body",
                    clockwise: 0
                },
                belly: {
                    angle: 0,
                    reference: "body",
                    clockwise: 0,
                }
            },
            right: {
                thigh_right: {
                    angle: 10,
                    reference: "body",
                    clockwise: 1
                },
                thigh_left: {
                    angle: 10,
                    reference: "body",
                    clockwise: 1
                },
                leg_right: {
                    angle: 10,
                    reference: "thigh_right",
                    clockwise: 1
                },
                leg_left: {
                    angle: 10,
                    reference: "thigh_left",
                    clockwise: 1
                },
                shoulder_right: {
                    angle: 90,
                    reference: "body",
                    clockwise: -1
                },
                shoulder_left: {
                    angle: 90,
                    reference: "body",
                    clockwise: -1
                },
                arm_right: {
                    angle: 0,
                    reference: "shoulder_right",
                    clockwise: -1
                },
                arm_left: {
                    angle: 0,
                    reference: "shoulder_left",
                    clockwise: -1
                },
                head: {
                    angle: 40,
                    reference: "body",
                    clockwise: 0
                },
                belly: {
                    angle: 0,
                    reference: "body",
                    clockwise: 0,
                }
            },
            left: {
                thigh_right: {
                    angle: 10,
                    reference: "body",
                    clockwise: 1
                },
                thigh_left: {
                    angle: 10,
                    reference: "body",
                    clockwise: 1
                },
                leg_right: {
                    angle: -90,
                    reference: "thigh_right",
                    clockwise: 1
                },
                leg_left: {
                    angle: -90,
                    reference: "thigh_left",
                    clockwise: 1
                },
                shoulder_right: {
                    angle: 190,
                    reference: "body",
                    clockwise: -1
                },
                shoulder_left: {
                    angle: 190,
                    reference: "body",
                    clockwise: -1
                },
                arm_right: {
                    angle: 90,
                    reference: "shoulder_right",
                    clockwise: -1
                },
                arm_left: {
                    angle: 90,
                    reference: "shoulder_left",
                    clockwise: -1
                },
                head: {
                    angle: 40,
                    reference: "body",
                    clockwise: 0
                },
                belly: {
                    angle: 0,
                    reference: "body",
                    clockwise: 0,
                }
            },
        }
        // if (direction == 'set-random') {
        //     const randomPoses = ['up', 'down', 'right'];
        //     this.randomPose = randomPoses[Math.floor(Math.random() * randomPoses.length)];
        //     return;
        // }

        let targetPosition = positions[direction];
        // if (direction == 'random') targetPosition = positions[this.randomPose];

        for (let body_part in targetPosition) {
            if (targetPosition.hasOwnProperty(body_part)) {

                let body = this.lookupObject[body_part];
                if (!body) continue;
                let refBody = this.lookupObject[targetPosition[body_part].reference];
                if (!refBody) continue;
                let refJoint = this.lookupObject[body_part + '_joint'];
                if (!refJoint) continue;

                if (targetPosition[body_part].reference != 'body' && !this.lookupObject[targetPosition[body_part].reference + '_joint']) continue;

                let limbAngle = this.flipped ? targetPosition[body_part].angle : - targetPosition[body_part].angle;
                let desiredAngle = refBody.GetAngle() + limbAngle * game.editor.DEG2RAD;
                let nextAngle = body.GetAngle() + body.GetAngularVelocity() / 15;
                let totalRotation = desiredAngle - nextAngle;

                if (targetPosition[body_part].clockwise == 0 || !refJoint || !refJoint.IsLimitEnabled()) {
                    while (totalRotation < -180 * game.editor.DEG2RAD) totalRotation += 360 * game.editor.DEG2RAD;
                    while (totalRotation > 180 * game.editor.DEG2RAD) totalRotation -= 360 * game.editor.DEG2RAD;
                } else if (targetPosition[body_part].clockwise == 1) {
                    if (totalRotation < 0) {

                        var upperLimit = refJoint.GetUpperLimit();
                        var lowerLimit = refJoint.GetLowerLimit();

                        let upperRotDif = body.GetAngle() - upperLimit;
                        let lowerRotDif = body.GetAngle() - lowerLimit;

                        while (upperRotDif < -180 * game.editor.DEG2RAD) upperRotDif += 360 * game.editor.DEG2RAD;
                        while (upperRotDif > 180 * game.editor.DEG2RAD) upperRotDif -= 360 * game.editor.DEG2RAD;

                        while (lowerRotDif < -180 * game.editor.DEG2RAD) lowerRotDif += 360 * game.editor.DEG2RAD;
                        while (lowerRotDif > 180 * game.editor.DEG2RAD) lowerRotDif -= 360 * game.editor.DEG2RAD;

                        if (lowerLimit > upperLimit) {
                            while (totalRotation < 0 * game.editor.DEG2RAD) totalRotation += 360 * game.editor.DEG2RAD;
                        }
                    }
                } else if (targetPosition[body_part].clockwise == -1) {
                    if (totalRotation > 0) {

                        var upperLimit = refJoint.GetUpperLimit();
                        var lowerLimit = refJoint.GetLowerLimit();

                        let upperRotDif = body.GetAngle() - upperLimit;
                        let lowerRotDif = body.GetAngle() - lowerLimit;

                        while (upperRotDif < -180 * game.editor.DEG2RAD) upperRotDif += 360 * game.editor.DEG2RAD;
                        while (upperRotDif > 180 * game.editor.DEG2RAD) upperRotDif -= 360 * game.editor.DEG2RAD;

                        while (lowerRotDif < -180 * game.editor.DEG2RAD) lowerRotDif += 360 * game.editor.DEG2RAD;
                        while (lowerRotDif > 180 * game.editor.DEG2RAD) lowerRotDif -= 360 * game.editor.DEG2RAD;

                        if (lowerLimit > upperLimit) {
                            while (totalRotation > 0 * game.editor.DEG2RAD) totalRotation -= 360 * game.editor.DEG2RAD;
                        }
                    }
                }
                const torqueLimiter = .15;
                let desiredAngularVelocity = totalRotation * 60;
                let torque = body.GetInertia() * desiredAngularVelocity / (1/30.0);
                if(Math.abs(torque) > 1) body.ApplyTorque(torque * torqueLimiter);
            }
        }
    }

    patchJointAngles(){
        this.patchJointAngle([Humanoid.BODY_PARTS.HEAD, 'eye_left', 'eye_right']);
        this.patchJointAngle(['eye_left']);
        this.patchJointAngle(['eye_right']);

        this.patchJointAngle([Humanoid.BODY_PARTS.SHOULDER_LEFT, Humanoid.BODY_PARTS.ARM_LEFT, Humanoid.BODY_PARTS.HAND_LEFT]);
        this.patchJointAngle([Humanoid.BODY_PARTS.ARM_LEFT, Humanoid.BODY_PARTS.HAND_LEFT]);
        this.patchJointAngle([Humanoid.BODY_PARTS.HAND_LEFT]);

        this.patchJointAngle([Humanoid.BODY_PARTS.SHOULDER_RIGHT, Humanoid.BODY_PARTS.ARM_RIGHT, Humanoid.BODY_PARTS.HAND_RIGHT]);
        this.patchJointAngle([Humanoid.BODY_PARTS.ARM_RIGHT, Humanoid.BODY_PARTS.HAND_RIGHT]);
        this.patchJointAngle([Humanoid.BODY_PARTS.HAND_RIGHT]);

        this.patchJointAngle([Humanoid.BODY_PARTS.THIGH_LEFT, Humanoid.BODY_PARTS.LEG_LEFT, Humanoid.BODY_PARTS.FEET_LEFT]);
        this.patchJointAngle([Humanoid.BODY_PARTS.LEG_LEFT, Humanoid.BODY_PARTS.FEET_LEFT]);
        this.patchJointAngle([Humanoid.BODY_PARTS.FEET_LEFT]);

        this.patchJointAngle([Humanoid.BODY_PARTS.THIGH_RIGHT, Humanoid.BODY_PARTS.LEG_RIGHT, Humanoid.BODY_PARTS.FEET_RIGHT]);
        this.patchJointAngle([Humanoid.BODY_PARTS.LEG_RIGHT, Humanoid.BODY_PARTS.FEET_RIGHT]);
        this.patchJointAngle([Humanoid.BODY_PARTS.FEET_RIGHT]);
    }

    patchJointAngle(refNames){
        const joint = this.lookupObject[refNames[0]+'_joint'];

        const jointAngle = joint.GetJointAngle();

        const clampedAngle = clampAngleToRange(jointAngle,joint.GetLowerLimit(), joint.GetUpperLimit());
        const angleCorrection = clampedAngle-jointAngle;
        const rotationPoint = joint.GetAnchorA(new Box2D.b2Vec2());

        refNames.forEach(linkedBodyRef=> {
            const linkedBody =  this.lookupObject[linkedBodyRef];
            const dx = linkedBody.GetPosition().x-rotationPoint.x;
            const dy = linkedBody.GetPosition().y-rotationPoint.y;
            const da = Math.atan2(dy, dx);
            const dl = Math.sqrt(dx*dx + dy*dy);
            const newRot = da-angleCorrection;
            const newX = rotationPoint.x + dl * Math.cos(newRot);
            const newY = rotationPoint.y + dl * Math.sin(newRot);

            linkedBody.GetPosition().x = newX;
            linkedBody.GetPosition().y = newY;
            linkedBody.SetAngle(linkedBody.GetAngle()-angleCorrection);
        });
    };

    stabalizeJoints(){
        // stabalize shoulders
        this.stabalizeJoint(Humanoid.BODY_PARTS.HAND_LEFT, Humanoid.BODY_PARTS.BODY, Humanoid.BODY_PARTS.SHOULDER_LEFT, [Humanoid.BODY_PARTS.HAND_LEFT, Humanoid.BODY_PARTS.ARM_LEFT]);
        this.stabalizeJoint(Humanoid.BODY_PARTS.ARM_LEFT, Humanoid.BODY_PARTS.BODY, Humanoid.BODY_PARTS.SHOULDER_LEFT, [Humanoid.BODY_PARTS.ARM_LEFT]);

        this.stabalizeJoint(Humanoid.BODY_PARTS.HAND_RIGHT, Humanoid.BODY_PARTS.BODY, Humanoid.BODY_PARTS.SHOULDER_RIGHT, [Humanoid.BODY_PARTS.HAND_RIGHT, Humanoid.BODY_PARTS.ARM_RIGHT]); // add stabalize joints to bodies delete on snap 
        this.stabalizeJoint(Humanoid.BODY_PARTS.ARM_RIGHT, Humanoid.BODY_PARTS.BODY, Humanoid.BODY_PARTS.SHOULDER_RIGHT, [Humanoid.BODY_PARTS.HAND_RIGHT, Humanoid.BODY_PARTS.ARM_RIGHT]);

        this.stabalizeJoint(Humanoid.BODY_PARTS.FEET_LEFT, Humanoid.BODY_PARTS.BODY, Humanoid.BODY_PARTS.THIGH_LEFT, [Humanoid.BODY_PARTS.FEET_LEFT, Humanoid.BODY_PARTS.LEG_LEFT]);
        this.stabalizeJoint(Humanoid.BODY_PARTS.LEG_LEFT, Humanoid.BODY_PARTS.BODY, Humanoid.BODY_PARTS.THIGH_LEFT, [Humanoid.BODY_PARTS.LEG_LEFT]);

        this.stabalizeJoint(Humanoid.BODY_PARTS.FEET_RIGHT, Humanoid.BODY_PARTS.BODY, Humanoid.BODY_PARTS.THIGH_RIGHT,[Humanoid.BODY_PARTS.FEET_RIGHT, Humanoid.BODY_PARTS.LEG_RIGHT]);
        this.stabalizeJoint(Humanoid.BODY_PARTS.LEG_RIGHT, Humanoid.BODY_PARTS.BODY, Humanoid.BODY_PARTS.THIGH_RIGHT, [Humanoid.BODY_PARTS.LEG_RIGHT]);
    }
    stabalizeJoint(target, base, baseRefJoint, linkedBodies){
        const targetBody = this.lookupObject[target];
        base = this.lookupObject[base];
        const refJoint = this.lookupObject[`${baseRefJoint}_joint`]

        let anchor = null;
        if(refJoint.GetBodyA() === base){
            anchor = refJoint.GetAnchorA(new Box2D.b2Vec2());
        }else{
            anchor = refJoint.GetAnchorB(new Box2D.b2Vec2());
        }

        const ropeJointDef = new Box2D.b2RopeJointDef();

        const targetAnchor = this.lookupObject[`${target}_joint`].GetAnchorA(new Box2D.b2Vec2());

        ropeJointDef.Initialize(targetBody, base, targetAnchor, anchor);
        const newJoint = game.world.CreateJoint(ropeJointDef);

        let maxLength = 0;
        linkedBodies.forEach((linkedBody, index)=>{

            let nextLinkedBody = index+1 === linkedBodies.length ? baseRefJoint : linkedBodies[index+1];
            const j1 = this.lookupObject[linkedBody+'_joint'].GetAnchorA(new Box2D.b2Vec2());
            const j2 = this.lookupObject[nextLinkedBody+'_joint'].GetAnchorA(new Box2D.b2Vec2());

            maxLength += j1.SelfSub(j2).Length();

        });
        newJoint.SetMaxLength(maxLength);

        [...linkedBodies, baseRefJoint].forEach(linkedBodyKey => {
            const linkedJoint = this.lookupObject[`${linkedBodyKey}_joint`]
            if(!linkedJoint.linkedJoints) linkedJoint.linkedJoints = [];
            linkedJoint.linkedJoints.push(newJoint);
        });
    }

    checkLimbs(){
        // only intereresting for character
    }

    positionLimb(limb, x, y){
        let baseJoint,
        upperPart,
        lowerJoint,
        lowerPart,
        endJoint,
        endPart,
        invertAngle;

        switch(limb){
            case Humanoid.BODY_PARTS.ARM_LEFT:
                baseJoint = this.lookupObject[Humanoid.BODY_PARTS.SHOULDER_LEFT+"_joint"];
                upperPart = this.lookupObject[Humanoid.BODY_PARTS.SHOULDER_LEFT];
                lowerJoint = this.lookupObject[Humanoid.BODY_PARTS.ARM_LEFT+"_joint"];
                lowerPart = this.lookupObject[Humanoid.BODY_PARTS.ARM_LEFT];
                endJoint = this.lookupObject[Humanoid.BODY_PARTS.HAND_LEFT+"_joint"];
                endPart = this.lookupObject[Humanoid.BODY_PARTS.HAND_LEFT];
                invertAngle = this.flipped;
            break;
            case Humanoid.BODY_PARTS.ARM_RIGHT:
                baseJoint = this.lookupObject[Humanoid.BODY_PARTS.SHOULDER_RIGHT+"_joint"];
                upperPart = this.lookupObject[Humanoid.BODY_PARTS.SHOULDER_RIGHT];
                lowerJoint = this.lookupObject[Humanoid.BODY_PARTS.ARM_RIGHT+"_joint"];
                lowerPart = this.lookupObject[Humanoid.BODY_PARTS.ARM_RIGHT];
                endJoint = this.lookupObject[Humanoid.BODY_PARTS.HAND_RIGHT+"_joint"];
                endPart = this.lookupObject[Humanoid.BODY_PARTS.HAND_RIGHT];
                invertAngle = this.flipped;
            break;
            case Humanoid.BODY_PARTS.LEG_LEFT:
                baseJoint = this.lookupObject[Humanoid.BODY_PARTS.THIGH_LEFT+"_joint"];
                upperPart = this.lookupObject[Humanoid.BODY_PARTS.THIGH_LEFT];
                lowerJoint = this.lookupObject[Humanoid.BODY_PARTS.LEG_LEFT+"_joint"];
                lowerPart = this.lookupObject[Humanoid.BODY_PARTS.LEG_LEFT];
                endJoint = this.lookupObject[Humanoid.BODY_PARTS.FEET_LEFT+"_joint"];
                endPart = this.lookupObject[Humanoid.BODY_PARTS.FEET_LEFT];
                invertAngle = !this.flipped;
            break;
            case Humanoid.BODY_PARTS.LEG_RIGHT:
                baseJoint = this.lookupObject[Humanoid.BODY_PARTS.THIGH_RIGHT+"_joint"];
                upperPart = this.lookupObject[Humanoid.BODY_PARTS.THIGH_RIGHT];
                lowerJoint = this.lookupObject[Humanoid.BODY_PARTS.LEG_RIGHT+"_joint"];
                lowerPart = this.lookupObject[Humanoid.BODY_PARTS.LEG_RIGHT];
                endJoint = this.lookupObject[Humanoid.BODY_PARTS.FEET_RIGHT+"_joint"];
                endPart = this.lookupObject[Humanoid.BODY_PARTS.FEET_RIGHT];
                invertAngle = !this.flipped;
            break;
            case Humanoid.BODY_PARTS.HEAD:
                baseJoint = this.lookupObject[Humanoid.BODY_PARTS.HEAD+"_joint"];
                upperPart = this.lookupObject[Humanoid.BODY_PARTS.HEAD];
                lowerJoint = null;
                lowerPart = null;
                endJoint = null;
                endPart = null;
            break;
        }

        const baseJointPos = new Box2D.b2Vec2(baseJoint.position.x/Settings.PTM, baseJoint.position.y/Settings.PTM);
        let dx = x-baseJointPos.x;
        let dy = y-baseJointPos.y;
        let dl = Math.sqrt(dx*dx+dy*dy);

       const angle = Math.atan2(dy, dx);

        if(!lowerJoint){
            const anchorDistanceUpper = baseJointPos.Clone().SelfSub(upperPart.GetPosition()).Length();

            const eyeObjects = ['eye_left', 'eye_left_joint', 'eye_right', 'eye_right_joint'];

            if(upperPart === this.lookupObject[Humanoid.BODY_PARTS.HEAD]){
                eyeObjects.forEach(key => {
                    const eyeObject = this.lookupObject[key];
                    let anchorEye;
                    if(eyeObject.GetPosition) anchorEye = baseJointPos.Clone().SelfSub(eyeObject.GetPosition());
                    else anchorEye = baseJointPos.Clone().SelfSub(new Box2D.b2Vec2(eyeObject.position.x/Settings.PTM, eyeObject.position.y/Settings.PTM));
                    const anchorAngle = Math.atan2(anchorEye.y, anchorEye.x)-upperPart.GetAngle()-Settings.pihalve;
                    const anchorLength = anchorEye.Length();
                    if(eyeObject.SetPosition){
                        eyeObject.SetPosition(new Box2D.b2Vec2(baseJointPos.x + anchorLength * Math.cos(angle+anchorAngle), baseJointPos.y + anchorLength * Math.sin(angle+anchorAngle)));
                        eyeObject.SetAngle(angle+Settings.pihalve);
                    } else{
                        eyeObject.position.x = (baseJointPos.x + anchorLength * Math.cos(angle+anchorAngle)) * Settings.PTM;
                        eyeObject.position.y = (baseJointPos.y + anchorLength * Math.sin(angle+anchorAngle)) * Settings.PTM;
                    }
                });
            }


            upperPart.SetPosition(new Box2D.b2Vec2(baseJointPos.x+anchorDistanceUpper*Math.cos(angle), baseJointPos.y+anchorDistanceUpper*Math.sin(angle)));
            upperPart.SetAngle(angle+Settings.pihalve);

        }else{
            // IK position
            const lowerJointPos = new Box2D.b2Vec2(lowerJoint.position.x/Settings.PTM, lowerJoint.position.y/Settings.PTM);
            const endJointPos = new Box2D.b2Vec2(endJoint.position.x/Settings.PTM, endJoint.position.y/Settings.PTM);

            const upperLength = lowerJointPos.Clone().SelfSub(baseJointPos).Length();
            const lowerLength = endJointPos.Clone().SelfSub(lowerJointPos).Length();
            const totalLength = upperLength+lowerLength;
            const upperLengthShare = upperLength/totalLength;
            const lowerLengthShare = lowerLength/totalLength;

            const baseDiff = Math.min(dl, totalLength);

            const upperAngleChange = Math.acos(Math.max(-1.0, Math.min(1.0, (baseDiff * upperLengthShare) / upperLength)));

            let upperAngle = invertAngle ? angle-upperAngleChange  : angle+upperAngleChange;

            const anchorDistanceUpper = baseJointPos.Clone().SelfSub(upperPart.GetPosition()).Length();
            upperPart.SetPosition(new Box2D.b2Vec2(baseJointPos.x+anchorDistanceUpper*Math.cos(upperAngle), baseJointPos.y+anchorDistanceUpper*Math.sin(upperAngle)));
            upperPart.SetAngle(upperAngle-Settings.pihalve);

            const anchorDistanceLower = lowerJointPos.Clone().SelfSub(lowerPart.GetPosition()).Length();

            const lowerJointPosRotated = rotateVectorAroundPoint(lowerJointPos, baseJointPos, upperAngle*game.editor.RAD2DEG);
            lowerJointPos.x = lowerJointPosRotated.x;
            lowerJointPos.y = lowerJointPosRotated.y;
            lowerJoint.position.x = lowerJointPos.x*Settings.PTM;
            lowerJoint.position.y = lowerJointPos.y*Settings.PTM;

            const lowerAngleChange = Math.acos(Math.max(-1.0, Math.min(1.0, (baseDiff * lowerLengthShare) / lowerLength)));
            const lowerAngle = invertAngle ? angle+lowerAngleChange : angle-lowerAngleChange;

            lowerPart.SetPosition(new Box2D.b2Vec2(lowerJointPos.x+anchorDistanceLower*Math.cos(lowerAngle), lowerJointPos.y+anchorDistanceLower*Math.sin(lowerAngle)));
            lowerPart.SetAngle(lowerAngle-Settings.pihalve);

            const endJointPosRotated = rotateVectorAroundPoint(new Box2D.b2Vec2(lowerJointPos.x-lowerLength, lowerJointPos.y), lowerJointPos, lowerAngle*game.editor.RAD2DEG);
            endJointPos.x = endJointPosRotated.x;
            endJointPos.y = endJointPosRotated.y;
            endJoint.position.x = endJointPos.x*Settings.PTM;
            endJoint.position.y = endJointPos.y*Settings.PTM;

            const endPos = new Box2D.b2Vec2(endJointPos.x, endJointPos.y);


            const offsetAngle = this.flipped ? Math.PI-endPart.jointOffsetAngle+this.lookupObject.body.GetAngle() : endPart.jointOffsetAngle-this.lookupObject.body.GetAngle();


            let targetOffsetAngle = lowerPart.GetAngle()+offsetAngle;
            endPos.x += endPart.jointOffsetLength * Math.cos(targetOffsetAngle);
            endPos.y += endPart.jointOffsetLength * Math.sin(targetOffsetAngle);

            endPart.SetPosition(endPos);
            endPart.SetAngle(lowerAngle-Settings.pihalve);
        }
    }

    calculateJointOffsets(){
        [Humanoid.BODY_PARTS.HAND_LEFT, Humanoid.BODY_PARTS.HAND_RIGHT, Humanoid.BODY_PARTS.FEET_LEFT, Humanoid.BODY_PARTS.FEET_RIGHT].forEach(part => {
            const joint = this.lookupObject[part+"_joint"];
            const jointWorldPos = new Box2D.b2Vec2(joint.position.x / Settings.PTM, joint.position.y / Settings.PTM);
            const bodyPart = this.lookupObject[part];
            const jointOffset = bodyPart.GetPosition().Clone().SelfSub(jointWorldPos);
            bodyPart.jointOffsetAngle = Math.atan2(jointOffset.y, jointOffset.x);
            bodyPart.jointOffsetLength = jointOffset.Length();
        });
    }
}

PrefabManager.prefabLibrary.Humanoid = {
    class: Humanoid,
}
