import * as PrefabManager from '../PrefabManager';
import * as Box2D from '../../../libs/Box2D'
import {
    game
} from "../../Game";
import {
    Settings
} from '../../Settings';

class Character extends PrefabManager.basePrefab {
    static TIME_EYES_CLOSE = 3000;
    static TIME_EYES_OPEN = 3100;
    constructor(target) {
        super(target);
    }
    init() {
        super.init();
        this.eyesTimer = 0.0;
        this.collisionUpdates = [];
        this.attachedToVehicle = true;
        var i;
        for (i = 0; i < this.lookupObject._bodies.length; i++) {
            var body = this.lookupObject._bodies[i];
            if (body.mySprite.data.groups.indexOf('.flesh') >= 0) {

                body.isFlesh = true;
                game.editor.prepareBodyForDecals(body);

                var texture = body.myTexture;
                //fix gore for Skin2, Skin3 etc

                var fleshName = texture.data.textureName.split('0000')[0];
                if (fleshName.indexOf('Head') > 0) fleshName = fleshName.substr(0, fleshName.indexOf('_')) + "_Head";

                var sprite = new PIXI.Sprite(PIXI.Texture.fromFrame(fleshName + "_Flesh0000"));
                texture.addChildAt(sprite, 0);
            }
        }
    }
    update() {
        super.update();
        if (PrefabManager.timerReady(this.eyesTimer, Character.TIME_EYES_CLOSE, true)) {
            this.lookupObject.eye_left.myTexture.originalSprite.texture = PIXI.Texture.fromFrame(this.lookupObject.eye_left.myTexture.data.textureName.replace("0000", "_Closed0000"));
            this.lookupObject.eye_right.myTexture.originalSprite.texture = PIXI.Texture.fromFrame(this.lookupObject.eye_left.myTexture.data.textureName.replace("0000", "_Closed0000"));
        } else if (PrefabManager.timerReady(this.eyesTimer, Character.TIME_EYES_OPEN, false)) {
            this.lookupObject.eye_left.myTexture.originalSprite.texture = PIXI.Texture.fromFrame(this.lookupObject.eye_left.myTexture.data.textureName);
            this.lookupObject.eye_right.myTexture.originalSprite.texture = PIXI.Texture.fromFrame(this.lookupObject.eye_right.myTexture.data.textureName);
            this.eyesTimer = -game.editor.deltaTime;
        }

        for (var i = 0; i < this.collisionUpdates.length; i++) {
            this.doCollisionUpdate(this.collisionUpdates[i]);
        }
        this.collisionUpdates = [];
        this.eyesTimer += game.editor.deltaTime;

        this.processJointDamage();
    }
    processJointDamage() {
        var jointsToAnalyse = ['leg_left_joint', 'leg_right_joint', 'head_joint', 'belly_joint', 'arm_left_joint', , 'arm_right_joint'];
        var maxForce = [1000000, 1000000, 14000000, 3000000, 800000, 800000];
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

    initContactListener() {
        super.initContactListener();
        var self = this;
        this.contactListener.PostSolve = function (contact, impulse) {
            var bodies = [contact.GetFixtureA().GetBody(), contact.GetFixtureB().GetBody()];
            var body;
            for (var i = 0; i < bodies.length; i++) {
                body = bodies[i];

                if ((bodies[0].mySprite.data.prefabID != bodies[1].mySprite.data.prefabID || bodies[0].mySprite.data.prefabID == undefined)) {

                    var force = 0;
                    for (var j = 0; j < impulse.normalImpulses.length; j++) force = Math.max(force, impulse.normalImpulses[j]);
                    if (force > 100) {
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
                    if(force > 400){
                        console.log(body.mySprite.data.refName);
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

    doCollisionUpdate(update) {
        switch (update.type) {
            case Character.GORE_BASH:

                var targetBody = this.lookupObject[update.target];
                if(targetBody){
                    console.log(targetBody);
                    game.editor.deleteObjects([targetBody]);
                    if(targetBody.data){
                        console.log("THIS MTFFF *************************");
                        console.log(targetBody);
                    }
                }

                break;
            case Character.GORE_SNAP:
                var targetJoint = this.lookupObject[update.target + "_joint"];
                if (targetJoint) {

                    var revoluteJointDef;
                    var joint;

                    var vainPrefab = '{"objects":[[4,' + targetJoint.GetAnchorA(new Box2D.b2Vec2()).x * Settings.PTM + ',' + targetJoint.GetAnchorA(new Box2D.b2Vec2()).y * Settings.PTM + ',0,{},"Vain",' + (game.editor.prefabCounter++) + ']]}'

                    var vainBodies = game.editor.buildJSON(JSON.parse(vainPrefab));

                    var vainSize = (vainBodies._bodies[0].originalGraphic.height * vainBodies._bodies.length) / Settings.PTM;

                    revoluteJointDef = new Box2D.b2RevoluteJointDef;
                    revoluteJointDef.Initialize(targetJoint.GetBodyA(), vainBodies._bodies[0], targetJoint.GetAnchorA(new Box2D.b2Vec2()));
                    revoluteJointDef.collideConnected = false;
                    joint = game.world.CreateJoint(revoluteJointDef);

                    revoluteJointDef = new Box2D.b2RevoluteJointDef;
                    revoluteJointDef.Initialize(targetJoint.GetBodyB(), vainBodies._bodies[3], targetJoint.GetAnchorA(new Box2D.b2Vec2()));
                    revoluteJointDef.collideConnected = false;
                    joint = game.world.CreateJoint(revoluteJointDef);

                    var ropeJointDef;

                    ropeJointDef = new Box2D.b2RopeJointDef;
                    ropeJointDef.Initialize(targetJoint.GetBodyA(), targetJoint.GetBodyB(), targetJoint.GetAnchorA(new Box2D.b2Vec2()), targetJoint.GetAnchorA(new Box2D.b2Vec2()));
                    ropeJointDef.maxLength = vainSize;

                    joint = game.world.CreateJoint(ropeJointDef);


                    //carve bodies

                    if (targetJoint.GetBodyA().isFlesh) game.editor.addDecalToBody(targetJoint.GetBodyA(), targetJoint.GetAnchorA(new Box2D.b2Vec2()), "Decal10000", true);
                    if (targetJoint.GetBodyB().isFlesh) game.editor.addDecalToBody(targetJoint.GetBodyB(), targetJoint.GetAnchorA(new Box2D.b2Vec2()), "Decal10000", true);


                    game.world.DestroyJoint(targetJoint);
                    delete this.lookupObject[update.target + "_joint"];

                    //fix display positions:
                    var swapBodies = vainBodies._bodies.concat().reverse();
                    var tarSprite;
                    var tarIndex = this.lookupObject[update.target].myTexture.parent.getChildIndex(this.lookupObject[update.target].myTexture);
                    for (var i = 0; i < swapBodies.length; i++) {
                        tarSprite = swapBodies[i].mySprite;
                        tarSprite.parent.removeChild(tarSprite);
                        this.lookupObject[update.target].myTexture.parent.addChildAt(tarSprite, tarIndex);
                    }
                }
                break;
        }
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
                let refBody = this.lookupObject[targetPosition[body_part].reference];
                let refJoint = this.lookupObject[body_part + '_joint'];
                if (!refJoint) continue;
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
    detachFromVehicle() {
        if (!this.attachedToVehicle) return;

        var compareClass = this.lookupObject._bodies[0].mySprite.data.subPrefabInstanceName;
        for (var i = 0; i < this.lookupObject._bodies.length; i++) {
            var body = this.lookupObject._bodies[i];
            var jointEdge = body.GetJointList();

            while (jointEdge) {
                var nextJoint = jointEdge.next;
                var joint = jointEdge.joint;
                if (joint.GetType() != 1) {
                    game.world.DestroyJoint(joint);
                } else {
                    var bodies = [joint.GetBodyA(), joint.GetBodyB()];
                    for (var j = 0; j < bodies.length; j++) {
                        if (!bodies[j]) continue;
                        if (bodies[j].mySprite.data.subPrefabInstanceName != compareClass) {
                            game.world.DestroyJoint(joint);
                            break;
                        }
                    }
                }
                jointEdge = nextJoint;
            }

            // Launch Character a little bit in the air
            var body = this.lookupObject["body"];
            var bodyAngleVector = new Box2D.b2Vec2(Math.cos(body.GetAngle()), Math.sin(body.GetAngle()));
            var dirFore = new Box2D.b2Vec2(bodyAngleVector.y, -bodyAngleVector.x);
            dirFore.SelfMul(Settings.detachForce);
            body.ApplyForce(dirFore, body.GetPosition());
            this.attachedToVehicle = false;

        }
    }
}

PrefabManager.prefabLibrary.Character = {
    class: Character,
}