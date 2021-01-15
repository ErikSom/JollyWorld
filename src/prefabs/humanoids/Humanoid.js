import * as PrefabManager from '../PrefabManager';
import * as Box2D from '../../../libs/Box2D'
import {
    game
} from "../../Game";
import {
    Settings
} from '../../Settings';
import * as emitterManager from '../../utils/EmitterManager';
import { rotateVectorAroundPoint } from '../../b2Editor/utils/extramath';

export class Humanoid extends PrefabManager.basePrefab {
    static TIME_EYES_CLOSE = 3000;
    static TIME_EYES_OPEN = 3100;
    constructor(target) {
        super(target);
        this.life = 300;
        this.flipped = false;
    }

    init() {
        super.init();
        this.patchJointAngles();
        this.eyesTimer = 0.0;
        this.collisionUpdates = [];
        this.alive = true;
        this.bleedTimer = -1;

        this.lookupObject[Humanoid.BODY_PARTS.HAND_LEFT].noDamage = true;
        this.lookupObject[Humanoid.BODY_PARTS.HAND_RIGHT].noDamage = true;
        this.lookupObject[Humanoid.BODY_PARTS.FEET_LEFT].noDamage = true;
        this.lookupObject[Humanoid.BODY_PARTS.FEET_RIGHT].noDamage = true;

        var i;
        for (i = 0; i < this.lookupObject._bodies.length; i++) {
            var body = this.lookupObject._bodies[i];
            if (body.mySprite.data.groups.indexOf('.flesh') >= 0) {

                body.isFlesh = true;
                game.editor.prepareBodyForDecals(body);

                var texture = body.myTexture;
                //fix gore for Skin2, Skin3 etc
                var frameNumIndex = texture.data.textureName.indexOf('00');
                var fleshName = texture.data.textureName.substr(0, frameNumIndex);

                if (fleshName.indexOf('Head') > 0) fleshName = fleshName.substr(0, fleshName.indexOf('_')) + "_Head";

                var sprite = new PIXI.heaven.Sprite(PIXI.Texture.fromFrame(fleshName + "_Flesh0000"));
                texture.myFlesh = sprite;
                texture.addChildAt(sprite, 0);
            }
        }
    }
    setSkin(skin){
        const targetFrame = String(skin).padStart(4, '0');
        for (let i = 0; i < this.lookupObject._bodies.length; i++) {
            const body = this.lookupObject._bodies[i];

            let targetTextureName = body.myTexture.data.textureName.substr(0, body.myTexture.data.textureName.length-4);
            let targetTexture = targetTextureName+targetFrame;


            body.myTexture.data.textureName = targetTexture;
            body.myTexture.originalSprite.texture = PIXI.Texture.fromFrame(targetTexture);
        }
    }
    flip(){
        this.flipped = !this.flipped;
        game.editor.mirrorPrefab(this, 'body');
    }
    update() {
        super.update();
        console.log(this.lookupObject['thigh_left_joint'].GetJointAngle(), this.lookupObject['thigh_left_joint'].GetUpperLimit(), this.lookupObject['thigh_left_joint'].GetLowerLimit())

        if (PrefabManager.timerReady(this.eyesTimer, Humanoid.TIME_EYES_CLOSE, true) || !this.alive) {
            if (this.lookupObject.eye_left){
                const textureIndex = this.lookupObject.eye_left.myTexture.data.textureName.substr(this.lookupObject.eye_left.myTexture.data.textureName.length-4);
                const baseTextureName = this.lookupObject.eye_left.myTexture.data.textureName.split(textureIndex)[0];
                this.lookupObject.eye_left.myTexture.originalSprite.texture = PIXI.Texture.fromFrame(`${baseTextureName}_Closed${textureIndex}`);
            }
            if (this.lookupObject.eye_right){
                const textureIndex = this.lookupObject.eye_right.myTexture.data.textureName.substr(this.lookupObject.eye_right.myTexture.data.textureName.length-4);
                const baseTextureName = this.lookupObject.eye_right.myTexture.data.textureName.split(textureIndex)[0];
                this.lookupObject.eye_right.myTexture.originalSprite.texture = PIXI.Texture.fromFrame(`${baseTextureName}_Closed${textureIndex}`);
            }
        } else if (PrefabManager.timerReady(this.eyesTimer, Humanoid.TIME_EYES_OPEN, false)) {
            if (this.lookupObject.eye_left) this.lookupObject.eye_left.myTexture.originalSprite.texture = PIXI.Texture.fromFrame(this.lookupObject.eye_left.myTexture.data.textureName);
            if (this.lookupObject.eye_right) this.lookupObject.eye_right.myTexture.originalSprite.texture = PIXI.Texture.fromFrame(this.lookupObject.eye_right.myTexture.data.textureName);
            this.eyesTimer = -game.editor.deltaTime;
        }

        this.processJointDamage();

        if (this.collisionUpdates.length > 0) {
            this.doCollisionUpdate(this.collisionUpdates[0]);
            this.collisionUpdates.shift();
        }
        this.eyesTimer += game.editor.deltaTime;

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
        var jointsToAnalyse = ['leg_left_joint', 'leg_right_joint','arm_left_joint', 'arm_right_joint'/*,'head_joint', 'belly_joint'*/ ];
        var maxForce = [1000000, 1000000, 800000, 800000, /*,2000000000, 5000000*/];
        for (var i = 0; i < jointsToAnalyse.length; i++) {
            let targetJoint = this.lookupObject[jointsToAnalyse[i]];
            if (!targetJoint) continue;

            let reactionForce = new Box2D.b2Vec2();
            targetJoint.GetReactionForce(1 / Settings.physicsTimeStep, reactionForce);
            reactionForce = reactionForce.LengthSquared();
            let reactionTorque = targetJoint.GetReactionTorque(1 / Settings.physicsTimeStep);

            if (reactionForce > maxForce[i] || Math.abs(reactionTorque) > 600) {
                this.collisionUpdates.push({
                    type: Humanoid.GORE_SNAP,
                    target: jointsToAnalyse[i].split('_joint')[0],
                });
            }
        }
    }

    static GORE_BASH = 0;
    static GORE_SNAP = 1;

    dealDamage(damage){
        this.life -= damage;

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
        this.contactListener.PostSolve = function (contact, impulse) {

            if(!contact.GetFixtureA().GetBody().mySprite || !contact.GetFixtureB().GetBody().mySprite) return;

            let characterBody;
            let otherBody;

            if(game.editor.retrieveSubClassFromBody(contact.GetFixtureA().GetBody()) === self){
                characterBody = contact.GetFixtureA().GetBody();
                otherBody = contact.GetFixtureB().GetBody();
            }else{
                characterBody = contact.GetFixtureB().GetBody();
                otherBody = contact.GetFixtureA().GetBody();
            }

            if(otherBody.GetMass()===0 || (otherBody.isVehiclePart && characterBody.mainHumanoid) || otherBody.noImpactDamage) return;

            if ((otherBody.mySprite.data.prefabID != characterBody.mySprite.data.prefabID || otherBody.mySprite.data.prefabID == undefined)) {

                const count = contact.GetManifold().pointCount;

                let force = 0;
                for (let j = 0; j < count; j++) force = Math.max(force, impulse.normalImpulses[j]);

                const minForceForDamage = 10.0;
                const forceToDamageDivider = 50.0;

                if(force> characterBody.GetMass() * minForceForDamage && !characterBody.noDamage){
                    self.dealDamage(force/forceToDamageDivider);
                }

                let forceDamage = 0;

                const charOtherBodyDiff = characterBody.GetPosition().Clone().SelfSub(otherBody.GetPosition());
                const dotProductChar = characterBody.GetLinearVelocity().Dot(charOtherBodyDiff)*-1;

                const otherBodyCharDiff = otherBody.GetPosition().Clone().SelfSub(characterBody.GetPosition());
                const dotProductOther = otherBody.GetLinearVelocity().Dot(otherBodyCharDiff)*-1;

                if(dotProductChar>0){
                    forceDamage += characterBody.GetLinearVelocity().LengthSquared() * characterBody.GetMass();
                }
                if(dotProductOther>0){
                    forceDamage += otherBody.GetLinearVelocity().LengthSquared() * otherBody.GetMass();
                }

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
    doCollisionUpdate(update) {
        if ((update.target == 'head' || update.target == 'body') && this.bleedTimer < 0) this.bleedTimer = 0;
            switch (update.type) {
                case Humanoid.GORE_BASH:

                    var targetBody = this.lookupObject[update.target];
                    if (targetBody) {

                        for (var i = 1; i < this.collisionUpdates.length; i++) {
                            if (this.collisionUpdates[i].target === update.target) {
                                this.collisionUpdates.splice(i, 1);
                                i--;
                            }
                        }

                        this.generateGoreParticles(update.target);
                        emitterManager.playOnceEmitter("gorecloud", targetBody, targetBody.GetPosition());

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

                        if (targetJoint.GetBodyA().connectedSpike || targetJoint.GetBodyB().connectedSpike) break;

                        let revoluteJointDef, joint;

                        let vainPrefab = '{"objects":[[4,' + targetJoint.GetAnchorA(new Box2D.b2Vec2()).x * Settings.PTM + ',' + targetJoint.GetAnchorA(new Box2D.b2Vec2()).y * Settings.PTM + ',0,{},"Vain"]]}'

                        let vainBodies = game.editor.buildJSON(JSON.parse(vainPrefab));

                        let vainSize = (vainBodies._bodies[0].originalGraphic.height * vainBodies._bodies.length) / Settings.PTM;

                        revoluteJointDef = new Box2D.b2RevoluteJointDef;
                        revoluteJointDef.Initialize(targetJoint.GetBodyA(), vainBodies._bodies[0], targetJoint.GetAnchorA(new Box2D.b2Vec2()));
                        revoluteJointDef.collideConnected = false;
                        joint = game.world.CreateJoint(revoluteJointDef);

                        revoluteJointDef = new Box2D.b2RevoluteJointDef;
                        revoluteJointDef.Initialize(targetJoint.GetBodyB(), vainBodies._bodies[3], targetJoint.GetAnchorA(new Box2D.b2Vec2()));
                        revoluteJointDef.collideConnected = false;
                        joint = game.world.CreateJoint(revoluteJointDef);

                        let ropeJointDef;

                        ropeJointDef = new Box2D.b2RopeJointDef;
                        ropeJointDef.Initialize(targetJoint.GetBodyA(), targetJoint.GetBodyB(), targetJoint.GetAnchorA(new Box2D.b2Vec2()), targetJoint.GetAnchorA(new Box2D.b2Vec2()));
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

                        if (targetJoint.GetBodyA().isFlesh) game.editor.addDecalToBody(targetJoint.GetBodyA(), targetJoint.GetAnchorA(new Box2D.b2Vec2()), "Decal.png", true);
                        if (targetJoint.GetBodyB().isFlesh) game.editor.addDecalToBody(targetJoint.GetBodyB(), targetJoint.GetAnchorA(new Box2D.b2Vec2()), "Decal.png", true);

                        const targetBody = this.lookupObject[update.target];
                        if(targetBody.grabJoints){
                            targetBody.grabJoints.forEach(grabJoint=>{
                                game.world.DestroyJoint(grabJoint);
                                delete targetBody.grabJoints;
                            })
                        }


                        game.world.DestroyJoint(targetJoint);
                        delete this.lookupObject[update.target + "_joint"];

                        //fix display positions:
                        const swapBodies = vainBodies._bodies.concat().reverse();
                        let tarSprite;
                        const tarIndex = this.lookupObject[update.target].myTexture.parent.getChildIndex(this.lookupObject[update.target].myTexture);
                        for (var i = 0; i < swapBodies.length; i++) {
                            tarSprite = swapBodies[i].mySprite;
                            tarSprite.parent.removeChild(tarSprite);
                            this.lookupObject[update.target].myTexture.parent.addChildAt(tarSprite, tarIndex);
                        }
                    }
                    break;
            }


        //Destroy connected joints
        if(!this.mainPrefabClass.destroyConnectedJoints[update.target]) return;
        this.mainPrefabClass.destroyConnectedJoints[update.target].map((targetJointName) => {
            if (targetJointName instanceof String || typeof(targetJointName) === 'string') {
                if (this.lookupObject[targetJointName]) {
                    game.world.DestroyJoint(this.lookupObject[targetJointName]);
                    delete this.lookupObject[targetJointName];
                }
            } else if (!this.lookupObject[targetJointName.ifno]) {
                targetJointName.destroy.map((connectedJointName) => {
                    if (this.lookupObject[connectedJointName]) {
                        game.world.DestroyJoint(this.lookupObject[connectedJointName]);
                        delete this.lookupObject[connectedJointName];
                    }
                });
            }
        });
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
        particlesToGenerate.map((particle)=>{
            const gorePrefab = `{"objects":[[4,${targetBody.GetPosition().x * Settings.PTM},${targetBody.GetPosition().y * Settings.PTM},0,{},"${particle}"]]}`;
            const goreLookupObject = game.editor.buildJSON(JSON.parse(gorePrefab));
            const impulse = new Box2D.b2Vec2((Math.random()*(goreParticleMaxSpeed*2)-goreParticleMaxSpeed), (Math.random()*(goreParticleMaxSpeed*2)-goreParticleMaxSpeed));
            goreLookupObject._bodies.map((body)=>{
                body.ApplyForce(impulse, targetBody.GetPosition());
            });

            if(particle == 'Gore_Meat'){
                const ranId = Math.floor(Math.random()*4)+1;
                goreLookupObject._textures[0].children[0].texture = PIXI.Texture.fromFrame(particle+ranId+'0000');
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
                    angle: -20,
                    reference: "body",
                    clockwise: -1
                },
                shoulder_left: {
                    angle: -20,
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

                let desiredAngle = refBody.GetAngle() - targetPosition[body_part].angle * game.editor.DEG2RAD;
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

                let desiredAngularVelocity = totalRotation * 60;
                let torque = body.GetInertia() * desiredAngularVelocity / (1/30.0);
                if(Math.abs(torque) > 1) body.ApplyTorque(torque * .6);
            }
        }
    }

    correctLimbAngle(limb, angleDiff){
        let angleDiffCircles = Math.signedFloor(angleDiff / Settings.pidouble);
        if(angleDiff<0) angleDiffCircles -= 1;
        const angleCorrection = angleDiffCircles*Settings.pidouble;
        if(limb.mySprite.data.refName === 'shoulder_left') console.log('correction shoulder:', angleDiff, angleCorrection, angleDiffCircles);
        if(limb.mySprite.data.refName === 'hand_left') console.log('correction hand:', angleDiff, angleCorrection, angleDiffCircles);
        limb.SetAngle(limb.GetAngle()+angleCorrection);
        return angleCorrection;
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

        const normalizePI = angle => {
            while (angle <= -Math.PI) angle += Settings.pidouble;
            while (angle > Math.PI) angle -= Settings.pidouble;
            return angle;
        }
        const clampAngleToRange = (angle, min, max) => Math.min(max, Math.max(min, normalizePI(angle)));

        const jointAngle = joint.GetJointAngle();

        const clampedAngle = clampAngleToRange(jointAngle,joint.GetLowerLimit(), joint.GetUpperLimit());
        const angleCorrection = clampedAngle-jointAngle;
        const rotationPoint = joint.GetAnchorA(new Box2D.b2Vec2());




        if(refNames[0] === 'thigh_left'){
            console.log('before:');
            console.log('jointAngle', jointAngle)
            console.log('clampedAngle', clampedAngle)
            console.log('angleCorrection', angleCorrection)
            console.log('joint.GetLowerLimit()', joint.GetLowerLimit())
            console.log('joint.GetUpperLimit()', joint.GetUpperLimit())
        }


        refNames.forEach(linkedBodyRef=> {
            const linkedBody =  this.lookupObject[linkedBodyRef];
            const dx = linkedBody.GetPosition().x-rotationPoint.x;
            const dy = linkedBody.GetPosition().y-rotationPoint.y;
            const da = Math.atan2(dy, dx);
            const dl = Math.sqrt(dx*dx + dy*dy);
            const newRot = da-angleCorrection;
            const newX = rotationPoint.x + dl * Math.cos(newRot);
            const newY = rotationPoint.y + dl * Math.sin(newRot);

            console.log(newRot, newX, linkedBody.GetPosition().x, newY, linkedBody.GetPosition().y, angleCorrection);
            linkedBody.GetPosition().x = newX;
            linkedBody.GetPosition().y = newY;
            linkedBody.SetAngle(linkedBody.GetAngle()-angleCorrection);
        });

        if(refNames[0] === 'thigh_left'){
            console.log('after:');
            console.log('jointAngle', joint.GetJointAngle())
            console.log('clampedAngle', clampedAngle)
            console.log('angleCorrection', angleCorrection)
            console.log('joint.GetLowerLimit()', joint.GetLowerLimit())
            console.log('joint.GetUpperLimit()', joint.GetUpperLimit())
        }
    };

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
                invertAngle = false;
            break;
            case Humanoid.BODY_PARTS.ARM_RIGHT:
                baseJoint = this.lookupObject[Humanoid.BODY_PARTS.SHOULDER_RIGHT+"_joint"];
                upperPart = this.lookupObject[Humanoid.BODY_PARTS.SHOULDER_RIGHT];
                lowerJoint = this.lookupObject[Humanoid.BODY_PARTS.ARM_RIGHT+"_joint"];
                lowerPart = this.lookupObject[Humanoid.BODY_PARTS.ARM_RIGHT];
                endJoint = this.lookupObject[Humanoid.BODY_PARTS.HAND_RIGHT+"_joint"];
                endPart = this.lookupObject[Humanoid.BODY_PARTS.HAND_RIGHT];
                invertAngle = false;
            break;
            case Humanoid.BODY_PARTS.LEG_LEFT:
                baseJoint = this.lookupObject[Humanoid.BODY_PARTS.THIGH_LEFT+"_joint"];
                upperPart = this.lookupObject[Humanoid.BODY_PARTS.THIGH_LEFT];
                lowerJoint = this.lookupObject[Humanoid.BODY_PARTS.LEG_LEFT+"_joint"];
                lowerPart = this.lookupObject[Humanoid.BODY_PARTS.LEG_LEFT];
                endJoint = this.lookupObject[Humanoid.BODY_PARTS.FEET_LEFT+"_joint"];
                endPart = this.lookupObject[Humanoid.BODY_PARTS.FEET_LEFT];
                invertAngle = true;
            break;
            case Humanoid.BODY_PARTS.LEG_RIGHT:
                baseJoint = this.lookupObject[Humanoid.BODY_PARTS.THIGH_RIGHT+"_joint"];
                upperPart = this.lookupObject[Humanoid.BODY_PARTS.THIGH_RIGHT];
                lowerJoint = this.lookupObject[Humanoid.BODY_PARTS.LEG_RIGHT+"_joint"];
                lowerPart = this.lookupObject[Humanoid.BODY_PARTS.LEG_RIGHT];
                endJoint = this.lookupObject[Humanoid.BODY_PARTS.FEET_RIGHT+"_joint"];
                endPart = this.lookupObject[Humanoid.BODY_PARTS.FEET_RIGHT];
                invertAngle = true;
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

            // const bodyAngle = this.lookupObject[Humanoid.BODY_PARTS.BODY].GetAngle();
            // const angleDiffUpper = bodyAngle - upperPart.GetAngle();

            // if(Math.abs(angleDiffUpper) > Settings.pihalve){
            //     const angleCorrection = this.correctLimbAngle(upperPart, angleDiffUpper);

            //     if(upperPart === this.lookupObject[Humanoid.BODY_PARTS.HEAD]){
            //         eyeObjects.forEach(key => {
            //             const eyeObject = this.lookupObject[key];
            //             if(eyeObject.SetAngle){
            //                 eyeObject.SetAngle(eyeObject.GetAngle()+angleCorrection);
            //             }
            //         });
            //     }
            // }
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

            const anchorDistanceEnd = endJointPos.Clone().SelfSub(endPart.GetPosition()).Length();

            const endJointPosRotated = rotateVectorAroundPoint(new Box2D.b2Vec2(lowerJointPos.x-lowerLength, lowerJointPos.y), lowerJointPos, lowerAngle*game.editor.RAD2DEG);
            endJointPos.x = endJointPosRotated.x;
            endJointPos.y = endJointPosRotated.y;
            endJoint.position.x = endJointPos.x*Settings.PTM;
            endJoint.position.y = endJointPos.y*Settings.PTM;

            endPart.SetPosition(new Box2D.b2Vec2(endJointPos.x+anchorDistanceEnd*Math.cos(lowerAngle), endJointPos.y+anchorDistanceEnd*Math.sin(lowerAngle)));
            endPart.SetAngle(lowerAngle-Settings.pihalve);

            // const bodyAngle = this.lookupObject[Humanoid.BODY_PARTS.BODY].GetAngle();
            // const angleDiffUpper = bodyAngle - upperPart.GetAngle();

            // if(Math.abs(angleDiffUpper) > Settings.pihalve){
            //     this.correctLimbAngle(upperPart, angleDiffUpper);
            // }

            // const angleDiffLower = bodyAngle - lowerPart.GetAngle();
            // if(Math.abs(angleDiffLower) > Settings.pihalve){
            //     this.correctLimbAngle(lowerPart, angleDiffLower);
            // }

            // const angleDiffEnd = lowerPart.GetAngle() - endPart.GetAngle();
            // if(Math.abs(angleDiffEnd) > Settings.pihalve){
            //     this.correctLimbAngle(endPart, angleDiffEnd);
            // }
        }
    }
}

PrefabManager.prefabLibrary.Humanoid = {
    class: Humanoid,
}
