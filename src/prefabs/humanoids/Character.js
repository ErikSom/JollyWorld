import * as PrefabManager from '../PrefabManager';
import * as Box2D from '../../../libs/Box2D'
import {
    game
} from "../../Game";
import {
    Settings
} from '../../Settings';
import * as emitterManager from '../../utils/EmitterManager';
import {globalEvents, GLOBAL_EVENTS} from '../../utils/EventDispatcher'
import { RopeHat } from '../hats/ropeHat';

class Character extends PrefabManager.basePrefab {
    static TIME_EYES_CLOSE = 3000;
    static TIME_EYES_OPEN = 3100;
    constructor(target) {
        super(target);
        this.life = 300;
        this.hat = undefined;
    }

    init() {
        super.init();
        this.eyesTimer = 0.0;
        this.collisionUpdates = [];
        this.attachedToVehicle = true;
        this.alive = true;
        this.bleedTimer = -1;

        this.hat = new RopeHat(this, this.lookupObject.head);

        //** TEMP PORTAL GUN */
        // const gunPosition = this.lookupObject.shoulder_left.GetPosition();
        // const portalGunBodies = game.editor.buildRuntimePrefab("PortalGun", gunPosition.x * Settings.PTM, gunPosition.y * Settings.PTM);
        // const portalGun = game.editor.retrieveClassFromPrefabLookup(portalGunBodies);
        // portalGun.setOwner(this);
        // let revoluteJointDef = new Box2D.b2RevoluteJointDef;
        // revoluteJointDef.Initialize(portalGun.lookupObject.holder, this.lookupObject.shoulder_left, gunPosition);
        // revoluteJointDef.collideConnected = false;
        // let joint = game.world.CreateJoint(revoluteJointDef);
        //this.attachedGun = portalGun;
        /*****/

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
    update() {
        super.update();

        if (PrefabManager.timerReady(this.eyesTimer, Character.TIME_EYES_CLOSE, true) || !this.alive) {
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
        } else if (PrefabManager.timerReady(this.eyesTimer, Character.TIME_EYES_OPEN, false)) {
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
        if(this.alive){
            this.alive = false;
            this.detachFromVehicle();
            game.lose();
        }
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
                    type: Character.GORE_SNAP,
                    target: jointsToAnalyse[i].split('_joint')[0],
                });
            }
        }
    }
    lean(dir) {
        const velocity = Settings.characterLeanSpeed * dir;
        this.lookupObject['body'].SetAngularVelocity(velocity);
    }

    static GORE_BASH = 0;
    static GORE_SNAP = 1;

    dealDamage(damage){
        this.life -= damage;
        globalEvents.dispatchEvent({type:GLOBAL_EVENTS.CHARACTER_DAMAGE, data:damage});
    }

    initContactListener() {
        super.initContactListener();
        var self = this;
        this.contactListener.PostSolve = function (contact, impulse) {
            var bodies = [contact.GetFixtureA().GetBody(), contact.GetFixtureB().GetBody()];
            var body;
            for (var i = 0; i < bodies.length; i++) {
                body = bodies[i];

                if(body.GetMass()===0) continue;

                if ((bodies[0].mySprite.data.prefabID != bodies[1].mySprite.data.prefabID || bodies[0].mySprite.data.prefabID == undefined)) {


                    // Should the body break?
                        // var count:int = contact.GetManifold().m_pointCount;

                        // var maxImpulse:Number = 0.0;
                        // for (var i:int = 0; i < count; i++)
                        // {
                        //     maxImpulse = b2Math.Max(maxImpulse, impulse.normalImpulses[i]);
                        // }
                        // if (maxImpulse > 50)
                        // {
                        //     test.m_break = true;
                        // }
                    const count = contact.GetManifold().pointCount;

                    let force = 0;
                    for (let j = 0; j < count; j++) force = Math.max(force, impulse.normalImpulses[j]);

                    const minForceForDamage = 10.0;
                    const forceToDamageDivider = 50.0;

                    if(force> body.GetMass() * minForceForDamage){
                        self.dealDamage(force/forceToDamageDivider)
                    }

                    if (force > body.GetMass() * Settings.bashMaxForceMultiplier / 3) {
                        if (body == self.lookupObject["head"]) {
                            if (PrefabManager.chancePercent(30)) self.collisionUpdates.push({
                                type: Character.GORE_SNAP,
                                target: "eye_right"
                            });
                            if (PrefabManager.chancePercent(30)) self.collisionUpdates.push({
                                type: Character.GORE_SNAP,
                                target: "eye_left"
                            });
                        }
                    }
                    if (body.mySprite.data.refName != "" && force > body.GetMass() * Settings.bashMaxForceMultiplier) {
                        self.collisionUpdates.push({
                            type: Character.GORE_BASH,
                            target: body.mySprite.data.refName,
                        });
                        break;
                    }

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
        FEET_RIGHT: 'feet_left',
        FEET_RIGHT: 'feet_right',
        SHOULDER_LEFT: 'shoulder_left',
        SHOULDER_RIGHT: 'shoulder_right',
        ARM_LEFT: 'arm_left',
        ARM_RIGHT: 'arm_right',
        HAND_LEFT: 'hand_left',
        HAND_RIGHT: 'hand_right',
    }
    doCollisionUpdate(update) {
        if ((update.target == 'head' || update.target == 'body') && this.bleedTimer < 0) this.bleedTimer = 0;
            switch (update.type) {
                case Character.GORE_BASH:

                    var targetBody = this.lookupObject[update.target];
                    if (targetBody) {

                        for (var i = 1; i < this.collisionUpdates.length; i++) {
                            if (this.collisionUpdates[i].target === update.target) {
                                this.collisionUpdates.splice(i, 1);
                                i--;
                            }
                        }

                        this.generateGoreParticles(update.target);
                        emitterManager.playOnceEmitter("gorecloud", null, targetBody.GetPosition());

                        let connectedJointEdge = targetBody.GetJointList();
                        while(connectedJointEdge){
                            const joint = connectedJointEdge.joint;
                            if(joint.GetBodyA() != targetBody && joint.GetBodyA().isFlesh) game.editor.addDecalToBody(joint.GetBodyA(), joint.GetAnchorA(new Box2D.b2Vec2()), "Decal.png", true);
                            if(joint.GetBodyB() != targetBody && joint.GetBodyB().isFlesh) game.editor.addDecalToBody(joint.GetBodyB(), joint.GetAnchorA(new Box2D.b2Vec2()), "Decal.png", true);
                            connectedJointEdge = connectedJointEdge.next;
                        }

                        game.editor.deleteObjects([targetBody]);

                    }

                    break;
                case Character.GORE_SNAP:

                    const targetJoint = this.lookupObject[update.target + "_joint"];
                    if (targetJoint) {

                        if (targetJoint.GetBodyA().connectedSpike || targetJoint.GetBodyB().connectedSpike) break;

                        let revoluteJointDef;
                        let joint;

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


                        //carve bodies

                        if (targetJoint.GetBodyA().isFlesh) game.editor.addDecalToBody(targetJoint.GetBodyA(), targetJoint.GetAnchorA(new Box2D.b2Vec2()), "Decal.png", true);
                        if (targetJoint.GetBodyB().isFlesh) game.editor.addDecalToBody(targetJoint.GetBodyB(), targetJoint.GetAnchorA(new Box2D.b2Vec2()), "Decal.png", true);


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

    positionBody(direction) {
        const positions = {
            up: {
                thigh_right: {
                    angle: 0,
                    reference: "body",
                    clockwise: 1
                },
                thigh_left: {
                    angle: 0,
                    reference: "body",
                    clockwise: 1
                },
                leg_right: {
                    angle: 0,
                    reference: "thigh_right",
                    clockwise: -1
                },
                leg_left: {
                    angle: 0,
                    reference: "thigh_left",
                    clockwise: -1
                },
                shoulder_right: {
                    angle: 180,
                    reference: "body",
                    clockwise: -1
                },
                shoulder_left: {
                    angle: 180,
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
                    angle: 0,
                    reference: "body",
                    clockwise: 1
                },
                thigh_left: {
                    angle: 0,
                    reference: "body",
                    clockwise: 1
                },
                leg_right: {
                    angle: 0,
                    reference: "thigh_right",
                    clockwise: -1
                },
                leg_left: {
                    angle: 0,
                    reference: "thigh_left",
                    clockwise: -1
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
        }
        if (direction == 'set-random') {
            const randomPoses = ['up', 'down', 'right'];
            this.randomPose = randomPoses[Math.floor(Math.random() * randomPoses.length)];
            return;
        }

        let targetPosition = positions[direction];
        if (direction == 'random') targetPosition = positions[this.randomPose];

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
                const positioningSpeed = 10.0;
                let nextAngle = body.GetAngle() + body.GetAngularVelocity() / positioningSpeed;
                let totalRotation = desiredAngle - nextAngle;

                //rotation logic


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
                let torque = body.GetInertia() * desiredAngularVelocity / (1 / positioningSpeed);;
                body.ApplyTorque(torque);
            }
        }

    }
    detachFromVehicle(force) {
        if (!force) force = 0;
        if (!this.attachedToVehicle) return;

        this.mainPrefabClass.destroyConnectedJoints['head'].map((jointName) => {
            if (this.lookupObject[jointName]) {
                game.world.DestroyJoint(this.lookupObject[jointName]);
                delete this.lookupObject[jointName];
            }
        });



        //var compareClass = this.lookupObject._bodies[0].mySprite.data.subPrefabInstanceName;
        for (var i = 0; i < this.lookupObject._bodies.length; i++) {
            var body = this.lookupObject._bodies[i];
            // var jointEdge = body.GetJointList();

            // while (jointEdge) {
            //     var nextJoint = jointEdge.next;
            //     var joint = jointEdge.joint;
            //     if (joint.GetType() != 1) {
            //         game.world.DestroyJoint(joint);
            //     } else {
            //         var bodies = [joint.GetBodyA(), joint.GetBodyB()];
            //         for (var j = 0; j < bodies.length; j++) {
            //             if (!bodies[j]) continue;
            //             if (bodies[j].mySprite.data.subPrefabInstanceName != compareClass) {
            //                 game.world.DestroyJoint(joint);
            //                 break;
            //             }
            //         }
            //     }
            //     jointEdge = nextJoint;
            // }

            var body = this.lookupObject["body"];
            if(body){
                var bodyAngleVector = new Box2D.b2Vec2(Math.cos(body.GetAngle()), Math.sin(body.GetAngle()));
                var dirFore = new Box2D.b2Vec2(bodyAngleVector.y, -bodyAngleVector.x);
                dirFore.SelfMul(force);
                body.ApplyForce(dirFore, body.GetPosition());
            }
            this.attachedToVehicle = false;

        }
    }
}

PrefabManager.prefabLibrary.Character = {
    class: Character,
}
