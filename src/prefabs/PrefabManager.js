import * as Box2D from "../../libs/Box2D";
import {
    game
} from "../Game";
import {
    Settings
} from "../Settings";

import * as extramath from '../b2Editor/utils/extramath';

class basePrefab {
    static settings = {};
    static settingsOptions = {};
    static forceUnique = false;
    constructor(target) {
        this.prefabObject = target;
        this.lookupObject = game.editor.lookupGroups[this.prefabObject.prefabName + "_" + this.prefabObject.instanceID];
        this.contactListener;
    }
    init() {
        this.lookupObject = game.editor.lookupGroups[this.prefabObject.prefabName + "_" + this.prefabObject.instanceID];
        this.initContactListener();
    }
    set(property, value) {}
    update() {}
    initContactListener() {
        this.contactListener = new Box2D.b2ContactListener();
        this.contactListener.BeginContact = function (contact, target) {}
        this.contactListener.EndContact = function (contact, target) {}
        this.contactListener.PreSolve = function (contact, oldManifold) {}
        this.contactListener.PostSolve = function (contact, impulse) {}
    }
}

class character extends basePrefab {
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
        if (timerReady(this.eyesTimer, character.TIME_EYES_CLOSE, true)) {
            this.lookupObject.eye_left.myTexture.originalSprite.texture = PIXI.Texture.fromFrame(this.lookupObject.eye_left.myTexture.data.textureName.replace("0000", "_Closed0000"));
            this.lookupObject.eye_right.myTexture.originalSprite.texture = PIXI.Texture.fromFrame(this.lookupObject.eye_left.myTexture.data.textureName.replace("0000", "_Closed0000"));
        } else if (timerReady(this.eyesTimer, character.TIME_EYES_OPEN, false)) {
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
        var jointsToAnalyse = ["leg_left_joint", "leg_right_joint"];
        var maxForce = [1000000, 1000000];
        for (var i = 0; i < jointsToAnalyse.length; i++) {
            let targetJoint = this.lookupObject[jointsToAnalyse[i]];
            if (!targetJoint) continue;

            let reactionForce = new Box2D.b2Vec2();
            targetJoint.GetReactionForce(1 / Settings.physicsTimeStep, reactionForce);
            reactionForce = reactionForce.LengthSquared();
            let reactionTorque = targetJoint.GetReactionTorque(1 / Settings.physicsTimeStep);

            //console.log(reactionForce, reactionTorque);

            // if(targetJoint.getReactionTorque(1/Settings.physicsTimeStep) > 100){
            //     console.log("BREAK")
            // }
            if (reactionForce > maxForce[i]) {
                this.collisionUpdates.push({
                    type: character.GORE_SNAP,
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

                if (body == self.lookupObject["head"] && (bodies[0].mySprite.data.prefabID != bodies[1].mySprite.data.prefabID || bodies[0].mySprite.data.prefabID == undefined)) {
                    var force = 0;
                    for (var j = 0; j < impulse.normalImpulses.length; j++) force = Math.max(force, impulse.normalImpulses[j]);
                    if (force > 8) {
                        self.collisionUpdates.push({
                            type: character.GORE_SNAP,
                            target: "eye_right"
                        });
                        self.collisionUpdates.push({
                            type: character.GORE_SNAP,
                            target: "eye_left"
                        });
                        self.collisionUpdates.push({
                            type: character.GORE_SNAP,
                            target: "arm_left"
                        });
                    }
                }
            }
        }
    }

    doCollisionUpdate(update) {
        switch (update.type) {
            case character.GORE_BASH:
                break;
            case character.GORE_SNAP:
                var targetJoint = this.lookupObject[update.target + "_joint"];
                if (targetJoint) {

                    var revoluteJointDef;
                    var joint;

                    var vainPrefab = '{"objects":[[4,' + targetJoint.GetAnchorA(new Box2D.b2Vec2()).x * Settings.PTM + ',' + targetJoint.GetAnchorA(new Box2D.b2Vec2()).y * Settings.PTM + ',0,{},"vain",' + (game.editor.prefabCounter++) + ']]}'

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

            // Launch character a little bit in the air
            var body = this.lookupObject["body"];
            var bodyAngleVector = new Box2D.b2Vec2(Math.cos(body.GetAngle()), Math.sin(body.GetAngle()));
            var dirFore = new Box2D.b2Vec2(bodyAngleVector.y, -bodyAngleVector.x);
            dirFore.SelfMul(Settings.detachForce);
            body.ApplyForce(dirFore, body.GetPosition());
            this.attachedToVehicle = false;

        }
    }
}
class horseanimal extends basePrefab {
    static TIME_EYES_CLOSE = 3000;
    static TIME_EYES_OPEN = 3100;
    constructor(target) {
        super(target);
    }
    init() {
        super.init();
        this.eyesTimer = 0.0;
        this.collisionUpdates = [];
        var i;
        for (i = 0; i < this.lookupObject._bodies.length; i++) {
            var body = this.lookupObject._bodies[i];
            // if (body.mySprite.data.groups.indexOf('.flesh') >= 0) {

            //     body.isFlesh = true;
            //     game.editor.prepareBodyForDecals(body);

            //     var texture = body.myTexture;
            //     //fix gore for Skin2, Skin3 etc

            //     var fleshName = texture.data.textureName.split('0000')[0];
            //     if (fleshName.indexOf('Head') > 0) fleshName = fleshName.substr(0, fleshName.indexOf('_')) + "_Head";

            //     var sprite = new PIXI.Sprite(PIXI.Texture.fromFrame(fleshName + "_Flesh0000"));
            //     texture.addChildAt(sprite, 0);
            // }
        }
    }
    update() {
        super.update();
        if (timerReady(this.eyesTimer, character.TIME_EYES_CLOSE, true)) {
            //this.lookupObject.eye.myTexture.originalSprite.texture = PIXI.Texture.fromFrame(this.lookupObject.eye.myTexture.data.textureName.replace("0000", "_Closed0000"));
        } else if (timerReady(this.eyesTimer, character.TIME_EYES_OPEN, false)) {
            //this.lookupObject.eye.myTexture.originalSprite.texture = PIXI.Texture.fromFrame(this.lookupObject.eye.myTexture.data.textureName);
            this.eyesTimer = -game.editor.deltaTime;
        }

        for (var i = 0; i < this.collisionUpdates.length; i++) {
            this.doCollisionUpdate(this.collisionUpdates[i]);
        }
        this.collisionUpdates = [];
        this.eyesTimer += game.editor.deltaTime;
    }
    static GORE_BASH = 0;
    static GORE_SNAP = 1;

    initContactListener() {
        super.initContactListener();
        var self = this;
        this.contactListener.PostSolve = function (contact, impulse) {
            // var bodies = [contact.GetFixtureA().GetBody(), contact.GetFixtureB().GetBody()];
            // var body;
            // for (var i = 0; i < bodies.length; i++) {
            //     body = bodies[i];
            // }
        }
    }

    doCollisionUpdate(update) {
        switch (update.type) {
            case character.GORE_BASH:
                break;
            case character.GORE_SNAP:
                break;
        }
    }
}
class vehicle extends basePrefab {
    static forceUnique = true;
    static playableCharacter = true;

    constructor(target) {
        super(target);
    }

    init() {
        super.init();
        var i;
        for (i = 0; i < this.lookupObject._bodies.length; i++) {
            var body = this.lookupObject._bodies[i];
            body.mySprite.data.prefabID = this.prefabObject.instanceID;
        }
        this.initContactListener();

        this.leanSpeed = 0.2;
        this.engines = [];
        this.wheels = [];
        this.desiredVehicleTorques = [];
        this.desiredVehicleSpeeds = [];

        this.RaycastCallbackWheel = function () {
            this.m_hit = false;
        }
        this.RaycastCallbackWheel.prototype.ReportFixture = function (fixture, point, normal, fraction) {
            if (fixture.GetFilterData().groupIndex == game.editor.GROUPINDEX_CHARACTER) return -1;
            if (fixture.IsSensor()) return -1;
            this.m_hit = true;
            this.m_point = point.Clone();
            this.m_normal = normal;
            this.m_fixture = fixture;
            return fraction;
        };

        var i;
        var maxEngines = 4;
        for (i = 1; i <= maxEngines; i++) {
            var engine = this.lookupObject["engine" + i.toString()];
            if (engine != null) {
                this.engines.push(engine);
                this.desiredVehicleTorques.push(engine.GetMotorTorque());
                this.desiredVehicleSpeeds.push(engine.GetMotorSpeed());
                var tarBody = engine.GetBodyA();
                var fixture = tarBody.GetFixtureList();
                while (fixture != null) {
                    if (fixture.GetShape() instanceof Box2D.b2CircleShape) {
                        this.wheels.push(fixture)
                    }
                    fixture = fixture.GetNext();
                }
            }
        }
        if (this.lookupObject.frame) this.lookupObject.frame.SetAngularDamping(0.8);
        this.stopAccelerateWheels();
    }
    update() {
        super.update();
    }
    set(property, value) {
        switch (property) {
            case "selectedVehicle":
                if (this.prefabObject.settings.selectedVehicle != value) {
                    this.prefabObject.settings.selectedVehicle = value;

                    var vehicleDepth = game.editor.getLowestChildIndex([].concat(this.lookupObject._bodies, this.lookupObject._textures, this.lookupObject._joints));

                    var vehiclePrefab = `{"objects":[[4,${this.prefabObject.x},${this.prefabObject.y},${this.prefabObject.rotation},${JSON.stringify(this.prefabObject.settings)},"${value}",${this.prefabObject.instanceID}]]}`;
                    var newObjects = game.editor.buildJSON(JSON.parse(vehiclePrefab));
                    game.editor.applyToObjects(game.editor.TRANSFORM_FORCEDEPTH, vehicleDepth, [].concat(newObjects._bodies, newObjects._textures, newObjects._joints));

                    game.editor.deleteSelection();

                    var instanceName;
                    if (newObjects._bodies.length > 0) instanceName = newObjects._bodies[0].mySprite.data.prefabInstanceName;
                    else if (newObjects._textures.length > 0) instanceName = newObjects._textures[0].data.prefabInstanceName;

                    game.editor.selected[instanceName] = true;
                    game.editor.updateSelection();
                }
                break;
        }
    }

    accelerate(dir) {
        this.accelerateWheels(dir);
        var i;
        var j;
        var wheel;
        const offset = 0.5;

        for (i = 0; i < this.wheels.length; i++) {
            wheel = this.wheels[i];

            var rayStart = wheel.GetBody().GetPosition();
            var rayEnd;
            // add 360 scope
            var wheelRadius = wheel.GetShape().GetRadius();
            var rayLength = wheelRadius + offset;
            var checkSlize = (360 / 20) * game.editor.DEG2RAD;
            var totalCircleRad = 360 * game.editor.DEG2RAD;
            for (j = 0; j < totalCircleRad; j += checkSlize) {
                rayEnd = rayStart.Clone();
                rayEnd.SelfAdd(new Box2D.b2Vec2(Math.cos(j) * rayLength, Math.sin(j) * rayLength));
                var callback = new this.RaycastCallbackWheel();
                wheel.GetBody().GetWorld().RayCast(callback, rayStart, rayEnd);
                if (callback.m_hit) {
                    var forceDir = extramath.rotateVector(callback.m_normal, 90);
                    this.applyImpulse(this.desiredVehicleSpeeds[i] * dir, forceDir);
                    //grounded = true;
                    break;
                }
            }
        }
    }
    applyImpulse(force, angle) {
        console.log(force, angle);
        var i;
        var body;
        var dirFore = angle.Clone();
        dirFore.SelfMul(force * 0.01)
        for (i = 0; i < this.lookupObject._bodies.length; i++) {
            body = this.lookupObject._bodies[i];
            var oldVelocity = body.GetLinearVelocity();
            var newVelocity = new Box2D.b2Vec2(oldVelocity.x + dirFore.x, oldVelocity.y + dirFore.y);
            body.SetLinearVelocity(newVelocity);
        }

    }
    accelerateWheels(dir) {
        var i;
        var engine;
        for (i = 0; i < this.engines.length; i++) {
            engine = this.engines[i];
            engine.SetMaxMotorTorque(this.desiredVehicleTorques[i]);
            engine.SetMotorSpeed(-dir * this.desiredVehicleSpeeds[i]);
        }
        if (this.lookupObject.pedal_engine) {
            this.lookupObject.pedal_engine.SetMaxMotorTorque(10000);
            const desiredPedalSpeed = 20;
            this.lookupObject.pedal_engine.SetMotorSpeed(Math.min(desiredPedalSpeed, Math.max(-desiredPedalSpeed, -this.wheels[0].GetBody().GetAngularVelocity() * 3.0)));
        }
    }
    stopAccelerateWheels() {
        var i;
        var engine;
        for (i = 0; i < this.engines.length; i++) {
            engine = this.engines[i];
            engine.SetMaxMotorTorque(0);
            engine.SetMotorSpeed(0);
        }
        if (this.lookupObject.pedal_engine) {
            this.lookupObject.pedal_engine.SetMaxMotorTorque(0);
            this.lookupObject.pedal_engine.SetMotorSpeed(0);
        }
    }

    stopAccelerate() {
        this.stopAccelerateWheels();
    }
    lean(dir) {
        if (this.lookupObject.frame) {
            var velocity = this.leanSpeed * dir;
            this.lookupObject.frame.SetAngularVelocity(velocity * 10);
        }
    }
}
vehicle.settings = Object.assign({}, vehicle.settings, {
    "selectedVehicle": "vehicle1"
});
vehicle.settingsOptions = Object.assign({}, vehicle.settingsOptions, {
    "selectedVehicle": ["vehicle1", "vehicle2", "vehicle_horse", "vehicle_character"]
});
class vehicle2 extends vehicle {
    constructor(target) {
        super(target);
    }
    update() {
        super.update();
        var drone = this.lookupObject["drone"];
        var dirFore = new Box2D.b2Vec2(0, -1);
        dirFore.SelfMul(400.0);
        drone.ApplyForce(dirFore, drone.GetPosition());

        var desiredAngle = 0;
        var nextAngle = drone.GetAngle() + drone.GetAngularVelocity() / 60.0;
        var totalRotation = desiredAngle - nextAngle;
        while (totalRotation < -180 * game.editor.DEG2RAD) totalRotation += 360 * game.editor.DEG2RAD;
        while (totalRotation > 180 * game.editor.DEG2RAD) totalRotation -= 360 * game.editor.DEG2RAD;
        var desiredAngularVelocity = totalRotation * 60;
        var change = 100 * game.editor.DEG2RAD;
        desiredAngularVelocity = Math.min(change, Math.max(-change, desiredAngularVelocity));
        var impulse = drone.GetInertia() * desiredAngularVelocity;
        drone.m_angularVelocity += drone.m_invI * impulse;
    }
}
class vehicle_horse extends vehicle {
    constructor(target) {
        super(target);
        this.leanSpeed = 1.0;
    }
    init() {
        super.init();
        this.stopLegEngines();
    }
    update() {
        super.update();
        this.moveLegs();
    }
    static legEngines = ['back_right_engine', 'back_left_engine', 'front_right_engine', 'front_left_engine'];
    static legWheels = ['back_right_feetwheel', 'back_left_feetwheel', 'front_right_feetwheel', 'front_left_feetwheel']

    moveLegs() {

        const frontLegDelay = 20;
        const tarAngleOffsets = [180, 0 - frontLegDelay, 180 - frontLegDelay];
        let vehicleSpeed = this.lookupObject["frame"].GetLinearVelocity().Clone().SelfNormalize();
        let vehicleDirection = this.lookupObject["frame"].GetTransform().GetRotation().GetXAxis(new Box2D.b2Vec2());
        let moveForward = (vehicleSpeed.Dot(vehicleDirection) > 0);
        const motionToRotationSmoothing = 0.4;
        let legSpeed = this.lookupObject["frame"].GetLinearVelocity().Length() * motionToRotationSmoothing;

        let backFeetGrounded = false;
        let frontFeetGrounded = false;
        const offset = 0.5;
        const wheels = [this.lookupObject["wheel_back"].GetFixtureList(), this.lookupObject["wheel_front"].GetFixtureList()];
        for (var i = 0; i < wheels.length; i++) {
            var wheel = wheels[i];
            var rayStart = wheel.GetBody().GetPosition();
            var rayEnd;
            var wheelRadius = wheel.GetShape().GetRadius();
            var rayLength = wheelRadius + offset;
            const checkSlize = (360 / 20) * game.editor.DEG2RAD;
            const totalCircleRad = 360 * game.editor.DEG2RAD;
            for (var j = 0; j < totalCircleRad; j += checkSlize) {
                rayEnd = rayStart.Clone();
                rayEnd.SelfAdd(new Box2D.b2Vec2(Math.cos(j) * rayLength, Math.sin(j) * rayLength));
                let callback = new RaycastCallbackWheel();
                wheel.GetBody().GetWorld().RayCast(callback, rayStart, rayEnd);
                if (callback.m_hit) {
                    if (i == 0) backFeetGrounded = true;
                    else frontFeetGrounded = true;
                    break;
                }
            }
        }

        this.stopLegEngines();
        let activeLeg = -1;
        if (backFeetGrounded) activeLeg = 0;
        else if (frontFeetGrounded) activeLeg = 2;

        if (activeLeg >= 0) {
            this.lookupObject[vehicle_horse.legEngines[activeLeg]].EnableMotor(true);
            this.lookupObject[vehicle_horse.legEngines[activeLeg]].SetMaxMotorTorque(5000);
            this.lookupObject[vehicle_horse.legEngines[activeLeg]].SetMotorSpeed(moveForward ? -legSpeed : legSpeed);
            for (var i = 1; i < vehicle_horse.legWheels.length; i++) {
                if (!backFeetGrounded && i == 1) continue;
                if (!frontFeetGrounded && i > 1) break;
                var body = this.lookupObject[vehicle_horse.legWheels[i]];
                var desiredAngle = this.lookupObject[vehicle_horse.legWheels[activeLeg]].GetAngle() + tarAngleOffsets[i - 1] * game.editor.DEG2RAD;
                var angleDif = desiredAngle - body.GetAngle();
                const smoothing = 0.8;
                var targetAngle = body.GetAngle() + angleDif * smoothing;
                body.SetAngle(targetAngle);
            }
        }
    }
    accelerate(dir) {}
    stopLegEngines() {
        for (var i = 0; i < vehicle_horse.legEngines.length; i++) {
            this.lookupObject[vehicle_horse.legEngines[i]].SetMaxMotorTorque(0);
            this.lookupObject[vehicle_horse.legEngines[i]].SetMotorSpeed(0);
            this.lookupObject[vehicle_horse.legEngines[i]].EnableMotor(false);
        }
    }
}
export class vehicle_character extends vehicle {
    constructor(target) {
        super(target);
        this.character;
    }
    init() {
        super.init();
        this.character = game.editor.activePrefabs[this.lookupObject.character.body.mySprite.data.subPrefabInstanceName].class;
    }
    update() {
        super.update();
        if (this.character.attachedToVehicle) {
            this.character.attachedToVehicle = false;
        }
    }
}

const RaycastCallbackWheel = function () {
    this.m_hit = false;
}
RaycastCallbackWheel.prototype.ReportFixture = function (fixture, point, normal, fraction) {
    //if ( ... not interested in this fixture ... )
    //  return -1;
    if (fixture.GetFilterData().groupIndex == game.editor.GROUPINDEX_CHARACTER) return -1;
    if (fixture.IsSensor()) return -1;

    this.m_hit = true;
    this.m_point = point.Clone();
    this.m_normal = normal;
    this.m_fixture = fixture;
    return fraction;
};

class vain extends basePrefab {
    constructor(target) {
        super(target);
    }
}

class jumppad extends basePrefab {
    static JUMPPAD_RELEASE = 50;
    static JUMPPAD_RELEASED = 100;

    constructor(target) {
        super(target);
    }
    init() {
        super.init();
        this.jumppadTimer = jumppad.settingsOptions["delay"].max * 1000.0;
        this.jumppadDelay = this.prefabObject.settings.delay * 1000.0;
        this.ready = true;
    }
    update() {
        super.update();
        if (timerReady(this.jumppadTimer, this.jumppadDelay, true)) {
            this.lookupObject["pad_engine"].EnableMotor(true);
            this.lookupObject["pad_engine"].SetMaxMotorForce(this.prefabObject.settings.force * 10.0);
            this.lookupObject["pad_engine"].SetMotorSpeed(50.0);
        } else if (timerReady(this.jumppadTimer, this.jumppadDelay + jumppad.JUMPPAD_RELEASE, true)) {
            this.lookupObject["pad_engine"].EnableMotor(false);
        } else if (timerReady(this.jumppadTimer, this.jumppadDelay + jumppad.JUMPPAD_RELEASED, false)) {
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
jumppad.settings = Object.assign({}, jumppad.settings, {
    "delay": 0.0,
    "force": 0.0
});
jumppad.settingsOptions = Object.assign({}, jumppad.settingsOptions, {
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

export const LIBRARY_ADMIN = "admin";
export const LIBRARY_MOVEMENT = "movement";

export var prefabLibrary = {
    libraryKeys: [],
    libraryDictionary: {},
    vehicle1: { /*Character Bike*/
        json: '{"objects":[[0,-1.4881290485477856,-0.20601457546639562,0,".character#character , .flesh","belly",0,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,7,14.181497764354457,"",1],[0,-2.920810985896667,3.0917373915784503,0,".vehicle","wheel_back",1,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,7,55.342622382700604,"",1],[0,-0.03955553222104535,-2.277293681725032,-0.7679448708775047,".character#character , .flesh","shoulder_left",2,"#999999","#000",0,false,true,[{"x":-0.18491373990083915,"y":-0.8588215919838902},{"x":0.19313212834087423,"y":-0.8423848151038147},{"x":0.11094824394050207,"y":0.8506032035438524},{"x":-0.11916663238053715,"y":0.8506032035438524}],1,7,null,"",1],[0,-0.36917814847328745,3.415442212226376,0,".vehicle","pedal",3,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,7,15.695946924915829,"",1],[0,-0.0024367989173880167,1.7711747161382954,0,".vehicle","frame",4,"#999999","#000",0,false,true,[{"x":-1.866666666666669,"y":-1.666666666666667},{"x":1.966666666666665,"y":-2.7666666666666666},{"x":3.066666666666663,"y":1.299999999999999},{"x":-0.23333333333333428,"y":1.7666666666666657},{"x":-2.9333333333333353,"y":1.3666666666666671}],1,7,null,"",1],[0,3.0307281006448505,3.0622425654175935,0,".vehicle","wheel_front",5,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,7,54.82895314162905,"",1],[0,1.1978604828584272,-1.609188225246529,-1.4660765716752366,".character#character , .flesh","arm_left",6,"#999999","#000",0,false,true,[{"x":-0.13560340926061798,"y":-0.6862354347431072},{"x":0.14382179770064596,"y":-0.7026722116231809},{"x":0.12738502082057224,"y":0.6944538231831459},{"x":-0.13560340926061798,"y":0.6944538231831459}],1,7,null,"",1],[1,-0.7160443489714556,-68.645859238965,-0.7679448708775047,"","",7,"Normal_Shoulder0000",2,0.5731017503262358,-0.16063012257496162,0,true,"#FFFFFF"],[1,36.1859955572582,-48.436827005807,-1.4660765716752366,"","",8,"Normal_Arm0000",6,0.29760652045521085,-0.8937510689744023,0,true,"#FFFFFF"],[2,17.416513728842347,-50.266620396764175,0,".character#character","arm_left_joint",9,6,2,0,false,false,1,10,true,152,0,0,0,0,0],[0,2.0984960915311635,-1.3468220706618923,-1.5009831567151235,".character#character , .flesh","hand_left",10,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,7,7.512582183874799,"",1],[1,62.42196782222551,-38.68795758796856,-1.5009831567151235,"","",11,"Normal_Hand0000",10,1.7975185021906417,2.9104087855451417,0,true,"#FFFFFF"],[2,56.47732156051729,-44.82853576963867,0,".character#character","hand_left_joint",12,10,6,0,false,false,1,10,true,60,-60,0,0,0,0],[0,-0.5588139425124747,0.5365243275043186,-0.9075712110370522,".character#character , .flesh","thigh_left",13,"#999999","#000",0,false,true,[{"x":-0.20241022695050503,"y":-1.031328299223996},{"x":0.1959845054600109,"y":-1.0441797422049808},{"x":0.17028161949803788,"y":1.0377540207144893},{"x":-0.16385589800755085,"y":1.0377540207144893}],1,7,null,"",1],[0,0.09544964279849022,2.0289178508961574,0.24434609527920528,".character#character , .flesh","leg_left",14,"#999999","#000",0,false,true,[{"x":-0.16064303726230378,"y":-0.9124524516498909},{"x":0.16064303726230378,"y":-0.9253038946308756},{"x":0.08353437937639896,"y":0.9124524516498909},{"x":-0.08353437937639896,"y":0.9253038946308738}],1,7,null,"",1],[1,-16.718291009464384,16.506359197979467,-0.9075712110370522,"","",15,"Normal_Thigh0000",13,0.4132120599733628,-2.3665034033387577,0,true,"#FFFFFF"],[0,0.02931587646287237,3.1040822873389744,0.10471975511965961,".character#character , .flesh","feet_right",16,"#999999","#000",0,false,true,[{"x":-0.3532003169100655,"y":-0.2334193398709985},{"x":0.3593429311171974,"y":0},{"x":0.3593429311171974,"y":0.12285228414263472},{"x":-0.3654855453243293,"y":0.11056705572837089}],1,7,null,"",1],[1,2.670598608971157,60.819442480124174,0.24434609527920528,"","",17,"Normal_Leg0000",14,0.19879575861250487,-3.1415926535889356,0,true,"#FFFFFF"],[2,6.080191949668233,34.84420049102433,0,".character#character","leg_left_joint",18,14,13,0,false,false,1,10,true,0,-149,0,0,0,0],[1,1.553752298147555,91.76572057838662,0.10471975511965961,"","",19,"Normal_Feet0000",16,1.515062169946712,1.2142877670861258,0,true,"#FFFFFF"],[1,-10.718575303802263,102.41178466834725,0,"","",20,"Bicycle_Pedals0000",3,0.36046441148776853,0.1433105210885714,0,null,"#FFFFFF"],[1,90.91636655216612,91.86727696252792,0,"","",21,"Bicycle_WheelFront0000",5,0.005476467179391875,-3.141592653569034,0,null,"#FFFFFF"],[1,-87.04193017482575,92.21545703335131,0,"","",22,"Bicycle_WheelBack0000",1,0.7919583819819808,0.7445522010315536,0,null,"#FFFFFF"],[1,0.926896032478245,33.13524148414858,0,"","",23,"Bicycle_Body0000",4,20.024984394501065,1.5208379310729603,0,null,"#FFFFFF"],[2,-4.550705044708597,87.37277584095949,0,".character#character","feet_left_joint",24,16,14,0,false,false,1,10,true,0,0,0,0,0,0],[2,-87.48425324044659,91.4420717514557,0,".vehicle","engine1",25,1,4,0,false,true,100,20,false,0,0,0,0,0,0],[2,-11.344974603786799,102.19192260910702,0,".vehicle","pedal_engine",26,3,4,0,false,true,100,20,false,0,0,0,0,0,0],[2,90.8350407622511,91.71118831367843,0,".vehicle","engine2",27,5,4,0,false,true,100,20,false,0,0,0,0,0,0],[0,-0.1758038624307754,-4.356680473333219,0,".character#character , .flesh","head",28,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,7,30.393075689479595,"",1],[0,-0.8956772643041511,-1.9211056898254968,0.3490658503988659,".character#character , .flesh","body",29,"#999999","#000",0,false,true,[{"x":-0.5373137876370677,"y":1.2023497051222813},{"x":-0.4316127146592841,"y":-1.3697097373371037},{"x":-0.1497431867185277,"y":-1.82774772024083},{"x":0.1321263412222251,"y":-1.7925140292482356},{"x":0.5549306331333597,"y":-1.1230739003889436},{"x":0.5549306331333597,"y":1.308050778100065},{"x":0.09689265022963056,"y":1.801322451996385},{"x":-0.2202105687037168,"y":1.801322451996385}],1,7,null,"",1],[1,-41.13422078907006,-14.192199759023456,0.2,"","",30,"Normal_Belly0000",0,8.746770037203438,1.1579140652818587,-0.2,false,"#FFFFFF"],[1,-24.74000283543914,-61.216582791160576,0.3490658503988659,"","",31,"Normal_Core0000",29,4.16882293351236,1.3835014335302833,0,true,"#FFFFFF"],[1,-3.160094413368342,-132.81443565955223,0,"","",32,"Normal_Head_Idle0000",28,2.989677819250855,0.785398163397623,0,true,"#FFFFFF"],[2,-8.694490254222277,-102.80460570208368,0,".character#character","head_joint",33,28,29,0,false,false,1,10,true,58,-64,0,0,0,0],[0,-0.9747147864807904,0.9190024212953947,-0.45378560551852554,".character#character , .flesh","thigh_right",34,"#999999","#000",0,false,true,[{"x":-0.20241022695050503,"y":-1.031328299223996},{"x":0.1959845054600109,"y":-1.0441797422049808},{"x":0.17028161949803788,"y":1.0377540207144893},{"x":-0.16385589800755085,"y":1.0377540207144893}],1,7,null,"",1],[0,-0.6535186114599003,2.730751467419776,0.17453292519943295,".character#character , .flesh","leg_right",35,"#999999","#000",0,false,true,[{"x":-0.16064303726230378,"y":-0.9124524516498909},{"x":0.16064303726230378,"y":-0.9253038946308756},{"x":0.08353437937639896,"y":0.9124524516498909},{"x":-0.08353437937639896,"y":0.9253038946308738}],1,7,null,"",1],[0,0.013527587320195766,-4.45222602219477,0,".character#character","eye_left",36,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,7,7.534037070968986,"",1],[1,-29.379992751533365,27.95936473687005,-0.45378560551852554,"","",37,"Normal_Thigh0000",34,0.4132120599733628,-2.3665034033387577,0,true,"#FFFFFF"],[1,-19.801333948144578,81.88802350138246,0.17453292519943295,"","",38,"Normal_Leg0000",35,0.19879575861250487,-3.1415926535889356,0,true,"#FFFFFF"],[1,0.5755116198004658,-134.1016627995932,0,"","",39,"Normal_Eye0000",36,0.5611519909321366,1.2636024235635333,0,null,"#FFFFFF"],[2,-15.60460377183313,55.96284374603815,0,".character#character","leg_right_joint",40,35,34,0,false,false,1,10,true,0,-149,0,0,0,0],[0,-0.6013410814276934,3.800669590829147,0,".character#character , .flesh","feet_right",41,"#999999","#000",0,false,true,[{"x":-0.3532003169100655,"y":-0.2334193398709985},{"x":0.3593429311171974,"y":0},{"x":0.3593429311171974,"y":0.12285228414263472},{"x":-0.3654855453243293,"y":0.11056705572837089}],1,7,null,"",1],[1,-17.51146898092036,112.60029105627989,0,"","",42,"Normal_Feet0000",41,1.515062169946712,1.2142877670861258,0,true,"#FFFFFF"],[2,-24.302431730465734,108.76090925482245,0,".character#character","feet_right_joint",43,41,35,0,false,false,1,10,true,0,0,0,0,0,0],[0,-0.2913189083160428,-2.116475866987431,-0.5235987755982988,".character#character , .flesh","shoulder_right",44,"#999999","#000",0,false,true,[{"x":-0.18491373990083915,"y":-0.8588215919838902},{"x":0.19313212834087423,"y":-0.8423848151038147},{"x":0.11094824394050207,"y":0.8506032035438524},{"x":-0.11916663238053715,"y":0.8506032035438524}],1,7,null,"",1],[0,0.7674060221504146,-1.3587035285866276,-1.4835298641951802,".character#character , .flesh","arm_right",45,"#999999","#000",0,false,true,[{"x":-0.13560340926061798,"y":-0.6862354347431072},{"x":0.14382179770064596,"y":-0.7026722116231809},{"x":0.12738502082057224,"y":0.6944538231831459},{"x":-0.13560340926061798,"y":0.6944538231831459}],1,7,null,"",1],[0,0.698014487908662,-4.442322400630774,0,".character#character","eye_right",46,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,7,7.534037070968986,"",1],[1,21.110118637454455,-133.80455415267332,0,"","",47,"Normal_Eye0000",46,0.5611519909321366,1.2636024235635333,0,null,"#FFFFFF"],[2,20.900219512693862,-132.8095744769817,0,".character#character","eye_right_joint",48,46,28,0,false,false,1,10,true,0,0,0,0,0,0],[1,-8.20380484261639,-63.69775637628599,-0.5235987755982988,"","",49,"Normal_Shoulder0000",44,0.5731017503262358,-0.16063012257496162,0,true,"#FFFFFF"],[1,23.26951064902393,-40.92662781922026,-1.4835298641951802,"","",50,"Normal_Arm0000",45,0.29760652045521085,-0.8937510689744023,0,true,"#FFFFFF"],[2,4.452407532936377,-42.06868058388569,0,".character#character","arm_right_joint",51,45,44,0,false,false,1,10,true,152,0,0,0,0,0],[0,1.6142293071474496,-1.2288497792194542,-1.7453292519943295,".character#character , .flesh","hand_right",52,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,7,7.512582183874799,"",1],[1,48.3251025560185,-35.070858517476736,-1.7453292519943295,"","",53,"Normal_Hand0000",52,1.7975185021906417,2.9104087855451417,0,true,"#FFFFFF"],[2,41.047027389191896,-39.782258786761524,0,".character#character","hand_right_joint",54,52,45,0,false,false,1,10,true,60,-60,0,0,0,0],[2,-18.426156553864757,-80.86404422851663,0,".character#character","shoulder_right_joint",55,44,29,0,false,false,1,10,true,180,-19,0,0,0,0],[2,0.20593900816288624,-133.80202874938874,0,".character#character","eye_left_joint",56,36,28,0,false,false,1,10,true,0,0,0,0,0,0],[2,-12.921286659664478,-85.47865823194277,0,".character#character","shoulder_left_joint",57,2,29,0,false,false,1,10,true,180,-19,0,0,0,0],[2,-18.49355094501061,113.74126702226283,0,".character#character","pedal_right_joint",58,41,3,0,false,false,1,10,false,0,0,0,0,0,0],[2,-0.8655909460089788,92.6312408506183,0,".character#character","pedal_left_joint",59,16,3,0,false,false,1,10,false,0,0,0,0,0,0],[2,64.20863172995293,-40.41550229109624,0,".character#character","grip_left_joint",60,4,10,0,false,false,1,10,false,0,0,0,0,0,0],[2,51.476059015688755,-34.80283447309619,0,".character#character","grip_right_joint",61,4,52,0,false,false,1,10,false,0,0,0,0,0,0],[2,-40.15504316702884,-112.59470576523498,0,".character#character","neck_joint",62,29,28,2,false,false,1,10,false,0,0,0.25,3,0,0],[2,-96.05584504862951,-149.53615887833575,0,".character#character","back_joint",63,4,29,2,false,false,1,10,false,0,0,0.25,4,0,0],[2,-42.70650479921925,-11.93468248655901,0,".character#character","core_joint",64,29,0,0,false,false,1,10,true,10,-10,0,0,0,0],[2,-46.94748098294405,0.36414844624303555,0,".character#character","sit_joint",65,4,0,2,false,false,1,10,false,0,0,0.5,10,0,0],[2,-41.43421194410137,0.3641484462430604,0,".character#character","thigh_right_joint",66,34,0,0,false,false,1,10,true,142,-16,0,0,0,0],[2,-36.34504052363035,-3.8768277374817988,0,".character#character","thigh_left_joint",67,13,0,0,false,false,1,10,true,142,-16,0,0,0,0]]}',
        class: vehicle,
        library: LIBRARY_ADMIN,
    },
    vehicle2: {
        json: '{"objects":[[0,1.646576341865587,2.7078634602708207,-0.8726646259971647,".baby#character, .flesh","belly",0,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,7,12.528310919669748,"",1],[0,0.8862136262722191,1.933582874956866,-0.8377580409572781,".baby#character, .flesh","body",1,"#999999","#000",1,false,true,[{"x":-0.3386843580322676,"y":-0.7855595526581733},{"x":0.22578957202151173,"y":-0.766743754989714},{"x":0.48921073937993853,"y":0.7761516538239436},{"x":-0.3763159533691862,"y":0.7761516538239436}],1,7,null,"",1],[0,0.06397798563134283,0.9014257871637485,-0.5235987755982988,".baby#character, .flesh","head",2,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,7,18.818110580123538,"",1],[0,2.0891360917792783,2.9425269214445007,-1.1519173063162573,".baby#character, .flesh","thigh_right",3,"#999999","#000",0,false,true,[{"x":-0.14457873353607198,"y":-0.40803331464625425},{"x":0.13815301204558494,"y":-0.40803331464625425},{"x":0.13815301204558494,"y":0.4144590361367464},{"x":-0.13172729055508725,"y":0.40160759315576167}],1,7,null,"",1],[0,2.4974082889637916,3.4753512496101773,0,".baby#character, .flesh","leg_right",4,"#999999","#000",0,false,true,[{"x":-0.13494015130033432,"y":-0.3534146819770707},{"x":0.13494015130033432,"y":-0.340563238996086},{"x":0.10923726533836842,"y":0.35341468197707027},{"x":-0.10923726533836842,"y":0.340563238996086}],1,7,null,"",1],[0,2.6516256047356084,4.037601880028248,0,".baby#character, .flesh","feet_right",5,"#999999","#000",0,false,true,[{"x":-0.2506031381291933,"y":-0.26024172036493365},{"x":0.2506031381291933,"y":-0.02891574670721475},{"x":0.2506031381291933,"y":0.13815301204558228},{"x":-0.2506031381291933,"y":0.151004455026567}],1,7,null,"",1],[0,0.741578554418712,2.0011902045264773,-0.8726646259971648,".baby#character, .flesh","shoulder_right",6,"#999999","#000",0,false,true,[{"x":-0.1542173157718132,"y":-0.34698896048657835},{"x":0.1542173157718132,"y":-0.34698896048657835},{"x":0.10281154384787783,"y":0.3469889604865781},{"x":-0.10281154384787428,"y":0.3469889604865781}],1,7,null,"",1],[0,1.2240269276702485,2.409109927565209,-0.8726646259971648,".baby#character, .flesh","arm_right",7,"#999999","#000",0,false,true,[{"x":-0.08674724012164603,"y":-0.3277117960151017},{"x":0.08032151863115189,"y":-0.3277117960151017},{"x":0.08032151863115189,"y":0.3277117960151018},{"x":-0.07389579714065775,"y":0.3277117960151018}],1,7,null,"",1],[0,1.5961626181491413,2.7069246724171436,-1.5707963267948966,".baby#character, .flesh","hand_right",8,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,7,4.140732332099213,"",1],[0,0.11460707892318889,0.9081706245436574,-0.5235987755982988,".baby#character","eye_left",9,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,7,4.90749138418765,"",1],[0,2.19873291799603,2.8892077070187026,-1.1519173063162573,".baby#character, .flesh","thigh_left",10,"#999999","#000",0,false,true,[{"x":-0.14457873353607198,"y":-0.40803331464625425},{"x":0.13815301204558494,"y":-0.40803331464625425},{"x":0.13815301204558494,"y":0.4144590361367464},{"x":-0.13172729055508725,"y":0.40160759315576167}],1,7,null,"",1],[0,2.5994481596076984,3.422032035184379,0,".baby#character, .flesh","leg_left",11,"#999999","#000",0,false,true,[{"x":-0.13494015130033432,"y":-0.3534146819770707},{"x":0.13494015130033432,"y":-0.340563238996086},{"x":0.10923726533836842,"y":0.35341468197707027},{"x":-0.10923726533836842,"y":0.340563238996086}],1,7,null,"",1],[0,2.753665475379515,3.98428266560245,0,".baby#character, .flesh","feet_left",12,"#999999","#000",0,false,true,[{"x":-0.2506031381291933,"y":-0.26024172036493365},{"x":0.2506031381291933,"y":-0.02891574670721475},{"x":0.2506031381291933,"y":0.13815301204558228},{"x":-0.2506031381291933,"y":0.151004455026567}],1,7,null,"",1],[0,0.8705419257810649,1.846045267533364,-0.8726646259971648,".baby#character, .flesh","shoulder_left",13,"#999999","#000",0,false,true,[{"x":-0.1542173157718132,"y":-0.34698896048657835},{"x":0.1542173157718132,"y":-0.34698896048657835},{"x":0.10281154384787783,"y":0.3469889604865781},{"x":-0.10281154384787428,"y":0.3469889604865781}],1,7,null,"",1],[0,1.4111772153535798,2.258204865744935,-0.8726646259971648,".baby#character, .flesh","arm_left",14,"#999999","#000",0,false,true,[{"x":-0.08674724012164603,"y":-0.3277117960151017},{"x":0.08032151863115189,"y":-0.3277117960151017},{"x":0.08032151863115189,"y":0.3277117960151018},{"x":-0.07389579714065775,"y":0.3277117960151018}],1,7,null,"",1],[0,1.7734991211593512,2.568866884637304,-1.3962634015954636,".baby#character, .flesh","hand_left",15,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,7,4.140732332099213,"",1],[1,27.54273911115958,55.27123137233144,-0.8726646259971648,"","",16,"Baby_Shoulder0000",13,1.4307259998803614,-0.7956158475446496,0,false,"#FFFFFF"],[1,43.08720626503048,67.74626332575113,-0.8726646259971648,"","",17,"Baby_Arm0000",14,0.7518898135812221,-0.8728207039243283,0,false,"#FFFFFF"],[1,53.93493015901952,76.72852172395653,-1.3962634015954636,"","",18,"Baby_Hand0000",15,0.8041968215209448,-0.9631987539716846,0,false,"#FFFFFF"],[2,34.50415513763,62.02295749923047,0,".baby#character","arm_left_joint",19,14,13,0,false,false,1,10,true,152,0,0,0,0,0],[2,49.6435812666197,73.66771556277241,0,".baby#character","hand_left_joint",20,15,14,0,false,false,1,10,true,90,-90,0,0,0,0],[1,63.284647317944106,86.39653933677222,-1.1519173063162573,"","",21,"Baby_Thigh0000",10,2.6919097697107235,1.8855865816231236,0,false,"#FFFFFF"],[2,19.449904832915024,49.71114832745725,0,".baby#character","shouler_left_joint",22,13,1,0,false,false,1,10,true,180,-19,0,0,0,0],[1,78.210227700759,102.3301252662037,0,"","",23,"Baby_Leg0000",11,0.4011019931573195,0.9698786643381986,0,false,"#FFFFFF"],[1,83.46326664706724,121.49872487442522,0,"","",24,"Baby_Feet0000",12,2.1470887155437106,-1.1620895257072459,0,false,"#FFFFFF"],[2,77.4681217486429,91.92229986386494,0,".baby#character","leg_left_joint",25,11,10,0,false,false,1,10,true,0,-149,0,0,0,0],[2,78.17621643294588,114.4200313831328,0,".baby#character","feet_left_joint",26,12,11,0,false,false,1,10,true,60,-60,0,0,0,0],[1,45.80814375310405,74.28741617188824,-0.8726646259971647,"","",27,"Baby_Belly0000",0,7.820706684817398,1.1749207109300004,0,false,"#FFFFFF"],[1,22.602473223557325,57.6108999171532,-0.8377580409572781,"","",28,"Baby_Core0000",1,4.003626268938311,2.2046151169642796,0,false,"#FFFFFF"],[1,3.005817504479519,28.1825043207839,-0.5235987755982988,"","",29,"Baby_Head_Idle0000",2,1.5746175365211126,-1.3329132133449955,0,false,"#FFFFFF"],[1,59.99674253144156,87.99611576954617,-1.1519173063162573,"","",30,"Baby_Thigh0000",3,2.6919097697107235,1.8855865816231236,0,false,"#FFFFFF"],[1,75.1490315814418,103.92970169897764,0,"","",31,"Baby_Leg0000",4,0.4011019931573195,0.9698786643381986,0,false,"#FFFFFF"],[1,80.40207052775004,123.09830130719916,0,"","",32,"Baby_Feet0000",5,2.1470887155437106,-1.1620895257072459,0,false,"#FFFFFF"],[1,2.420596477758496,26.564329746937634,-0.5235987755982988,"","",33,"Baby_Eye0000",9,1.2243429860553319,2.0283749414039507,0,false,"#FFFFFF"],[1,23.673837970288993,59.92557948212484,-0.8726646259971648,"","",34,"Baby_Shoulder0000",6,1.4307259998803614,-0.7956158475446496,0,false,"#FFFFFF"],[1,37.47269763453054,72.27341518035935,-0.8726646259971648,"","",35,"Baby_Arm0000",7,0.7518898135812221,-0.8728207039243283,0,false,"#FFFFFF"],[1,48.5451417657634,80.74862688980811,-1.5707963267948966,"","",36,"Baby_Hand0000",8,0.8041968215209448,-0.9631987539716846,0,false,"#FFFFFF"],[2,73.95350829495668,94.20200229819513,0,".baby#character","leg_right_joint",37,4,3,0,false,false,1,10,true,0,-149,0,0,0,0],[2,75.11502031362873,116.01960781590674,0,".baby#character","feet_right_joint",38,5,4,0,false,false,1,10,true,60,-60,0,0,0,0],[2,29.311256302508987,66.48102991556101,0,".baby#character","arm_right_joint",39,7,6,0,false,false,1,10,true,152,0,0,0,0,0],[2,44.80704224425988,78.48214779186219,0,".baby#character","hand_right_joint",40,8,7,0,false,false,1,10,true,90,-90,0,0,0,0],[2,9.95588608104726,45.554249346434986,0,".baby#character","head_joint",41,2,1,0,false,false,1,10,true,64,-58,0,0,0,0],[2,44.84192174766047,74.07171932173266,0,".baby#character","core_joint",42,0,1,0,false,false,1,10,true,20,-20,0,0,0,0],[0,0.5410561306860832,0.6587159351327361,-0.5235987755982988,".baby#character","eye_right",43,"#999999","#000",1,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,7,4.90749138418765,"",1],[1,15.214068030645324,19.080689064609995,-0.5235987755982988,"","",44,"Baby_Eye0000",43,1.2243429860553319,2.0283749414039507,0,false,"#FFFFFF"],[2,3.98772153744011,26.948879834542222,0,".baby#character","eye_left_joint",45,9,2,0,false,false,1,10,true,0,0,0,0,0,0],[2,16.404620292344767,19.896543637784266,0,".baby#character","eye_right_joint",46,43,2,0,false,false,1,10,true,0,0,0,0,0,0],[2,55.46082812823607,78.06322011654055,0,".baby#character","thigh_right_joint",47,3,0,0,false,false,1,10,true,142,-16,0,0,0,0],[2,51.795018798421815,80.33030678839398,0,".baby#character","thigh_left_joint",48,10,0,0,false,false,1,10,true,142,-16,0,0,0,0],[2,16.139629349853912,54.96248190664494,0,".baby#character","shoulder_right_joint",49,6,1,0,false,false,1,10,true,180,-19,0,0,0,0],[0,-0.20124556695939,-3.2958236400495786,0,".vehicle","",50,"#000000","#000",1,false,true,[{"x":-0.025702885961969457,"y":0.23775169514821037},{"x":-0.025702885961969457,"y":-0.23775169514821037},{"x":0.025702885961969457,"y":-0.23775169514821037},{"x":0.025702885961969457,"y":0.23775169514821037}],30,2,null,"",1],[0,-0.19620117749243016,-2.8234500838686727,0,".vehicle","",51,"#000000","#000",1,false,true,[{"x":-0.025702885961969457,"y":0.23775169514821037},{"x":-0.025702885961969457,"y":-0.23775169514821037},{"x":0.025702885961969457,"y":-0.23775169514821037},{"x":0.025702885961969457,"y":0.23775169514821037}],30,2,null,"",1],[2,-6.125427374146343,-91.99413044860418,0,".vehicle","",52,51,50,0,false,false,1,10,false,0,0,0,0,0,0],[0,-0.19690419214407862,-2.324673477316676,0,".vehicle","",53,"#000000","#000",1,false,true,[{"x":-0.025702885961969457,"y":0.23775169514821037},{"x":-0.025702885961969457,"y":-0.23775169514821037},{"x":0.025702885961969457,"y":-0.23775169514821037},{"x":0.025702885961969457,"y":0.23775169514821037}],30,2,null,"",1],[0,-0.19185980267711167,-1.8479490678724475,0,".vehicle","",54,"#000000","#000",1,false,true,[{"x":-0.025702885961969457,"y":0.23775169514821037},{"x":-0.025702885961969457,"y":-0.23775169514821037},{"x":0.025702885961969457,"y":-0.23775169514821037},{"x":0.025702885961969457,"y":0.23775169514821037}],30,2,null,"",1],[2,-5.995186129686605,-62.72909996871809,0,".vehicle","",55,54,53,0,false,false,1,10,false,0,0,0,0,0,0],[2,-6.125427374146343,-77.15182338771623,0,".vehicle","",56,53,51,0,false,false,1,10,false,0,0,0,0,0,0],[0,-0.19026528063401238,-1.3602531726105624,0,".vehicle","",57,"#000000","#000",1,false,true,[{"x":-0.025702885961969457,"y":0.23775169514821037},{"x":-0.025702885961969457,"y":-0.23775169514821037},{"x":0.025702885961969457,"y":-0.23775169514821037},{"x":0.025702885961969457,"y":0.23775169514821037}],30,2,null,"",1],[0,-0.18522089116704543,-0.8835287631663249,0,".vehicle","",58,"#000000","#000",1,false,true,[{"x":-0.025702885961969457,"y":0.23775169514821037},{"x":-0.025702885961969457,"y":-0.23775169514821037},{"x":0.025702885961969457,"y":-0.23775169514821037},{"x":0.025702885961969457,"y":0.23775169514821037}],30,2,null,"",1],[2,-5.796018784384447,-33.79649082753441,0,".vehicle","",59,58,57,0,false,false,1,10,false,0,0,0,0,0,0],[0,-0.23712905851266097,-3.775403290522619,0,".vehicle","drone",60,["#999999","#999999"],["#000","#000"],[0,0],false,true,[[{"x":-0.8579563683010285,"y":-0.6193802658857717},{"x":0.867132372240075,"y":-0.6377322737638682},{"x":0.8304283564838819,"y":0.6469082777029147},{"x":-0.839604360422932,"y":0.6102042619467216}],[{"x":-2.326116998548784,"y":-1.3534605810096458},{"x":2.39034902612212,"y":-1.3351085731315493},{"x":1.7113247346325338,"y":-0.6193802658857717},{"x":-1.738852746449684,"y":-0.6927882973981578}]],1,0,[null,null],"",1],[0,-0.1859239058186939,-0.3847521566143297,0,".vehicle","",61,"#000000","#000",1,false,true,[{"x":-0.025702885961969457,"y":0.23775169514821037},{"x":-0.025702885961969457,"y":-0.23775169514821037},{"x":0.025702885961969457,"y":-0.23775169514821037},{"x":0.025702885961969457,"y":0.23775169514821037}],30,2,null,"",1],[0,-0.18087951635173405,0.09197225282990074,0,".vehicle","",62,"#000000","#000",1,false,true,[{"x":-0.025702885961969457,"y":0.23775169514821037},{"x":-0.025702885961969457,"y":-0.23775169514821037},{"x":0.025702885961969457,"y":-0.23775169514821037},{"x":0.025702885961969457,"y":0.23775169514821037}],30,2,null,"",1],[0,-0.2152149483437179,2.5743822336180604,0,".vehicle","frame",63,"#999999","#000",0,false,true,[{"x":-1.8999999999999986,"y":-2.2750000000000004},{"x":0.466666666666665,"y":-2.408333333333334},{"x":2.4333333333333336,"y":2.3249999999999993},{"x":-1,"y":2.358333333333333}],1,7,null,"",1],[0,1.6254126599664476,5.022921712593645,0,".vehicle","wheel_front",64,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],45,7,14.270921975981269,"",1],[1,49.41984490045456,150.99637803143293,0,"","",65,"Trolley_WheelFront0000",64,0.726341865994865,-0.439009584300533,0,false,"#FFFFFF"],[0,-1.0927715463571954,4.943922336301817,0,".vehicle","wheel_back",66,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],20,7,17.067622731811838,"",1],[1,-31.85654625292161,148.9786839571797,0,"","",67,"Trolley_WheelBack0000",66,1.1382122601756437,-0.6196465395626374,0,false,"#FFFFFF"],[1,3.043551549688292,77.98146700854181,0,"","",68,"Trolley_Body0000",63,9.529559276272789,-0.07878396098914521,0,false,"#FFFFFF"],[2,-32.25648388210763,147.26434507183083,0,".vehicle","engine1",69,66,63,0,false,false,1,10,false,0,0,0,0,0,0],[2,48.376204952776725,150.1609888691975,0,".vehicle","engine2",70,64,63,0,false,false,1,10,false,0,0,0,0,0,0],[2,-5.665777539924708,-4.531460347647596,0,".vehicle","",71,62,61,0,false,false,1,10,false,0,0,0,0,0,0],[2,-5.796018784384447,-18.95418376664631,0,".vehicle","",72,61,58,0,false,false,1,10,false,0,0,0,0,0,0],[2,-5.575062131815063,-48.11380427045533,0,".vehicle","",73,57,54,0,false,false,1,10,false,0,0,0,0,0,0],[2,6.9131536435835885,-49.264945669935585,0,".vehicle","",74,62,50,3,false,false,1,10,false,0,0,0,0,0,0],[1,-6.1049035518769985,-124.95765811448365,0,"","",75,"Trolley_Drone0000",60,11.73900023369356,1.4847400519934932,0,false,"#FFFFFF"],[2,-6.174372766209959,-104.90111528346515,0,".vehicle","",76,50,60,0,false,false,1,10,false,0,0,0,0,0,0],[2,-5.705053042965407,10.853965393929219,0,".vehicle","",77,62,63,0,false,false,1,10,false,0,0,0,0,0,0],[0,-4.041736699793621,0.8972756507244921,-0.2617993877991494,".character#character , .flesh","belly",78,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,7,14.181497764354457,"",1],[0,-3.64527527618453,-1.1450114123868218,-0.06981317007977322,".character#character , .flesh","shoulder_left",79,"#999999","#000",0,false,true,[{"x":-0.18491373990083915,"y":-0.8588215919838902},{"x":0.19313212834087423,"y":-0.8423848151038147},{"x":0.11094824394050207,"y":0.8506032035438524},{"x":-0.11916663238053715,"y":0.8506032035438524}],1,7,null,"",1],[0,-2.893691142650372,-0.12610442891503615,-1.3439035240356332,".character#character , .flesh","arm_left",80,"#999999","#000",0,false,true,[{"x":-0.13560340926061798,"y":-0.6862354347431072},{"x":0.14382179770064596,"y":-0.7026722116231809},{"x":0.12738502082057224,"y":0.6944538231831459},{"x":-0.13560340926061798,"y":0.6944538231831459}],1,7,null,"",1],[1,-108.78751830233169,-34.29836653299634,-0.06981317007977322,"","",81,"Normal_Shoulder0000",79,0.5731017503262358,-0.16063012257496162,0,true,"#FFFFFF"],[1,-86.54277508873125,-3.9126222998153817,-1.3439035240356332,"","",82,"Normal_Arm0000",80,0.29760652045521085,-0.8937510689744023,0,true,"#FFFFFF"],[2,-106.9445565522196,-10.98747223235937,-0.2617993877991494,".character#character","arm_left_joint",83,80,79,0,false,false,1,10,true,152,0,0,0,0,0],[0,-2.084878045396842,0.20173232087708337,-1.1868238913561437,".character#character , .flesh","hand_left",84,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,7,7.512582183874799,"",1],[1,-63.58366444740396,7.519972889935968,-1.1868238913561437,"","",85,"Normal_Hand0000",84,1.7975185021906417,2.9104087855451417,0,true,"#FFFFFF"],[2,-68.3398159982465,-1.157060723975765,0.31415926535897937,".character#character","hand_left_joint",86,84,80,0,false,false,1,10,true,60,-60,0,0,0,0],[0,-2.8321161240104074,1.4930475240424959,-1.0995574287564283,".character#character , .flesh","thigh_left",87,"#999999","#000",0,false,true,[{"x":-0.20241022695050503,"y":-1.031328299223996},{"x":0.1959845054600109,"y":-1.0441797422049808},{"x":0.17028161949803788,"y":1.0377540207144893},{"x":-0.16385589800755085,"y":1.0377540207144893}],1,7,null,"",1],[0,-1.8903867891164121,2.800385569104382,-0.0349065850398874,".character#character , .flesh","leg_left",88,"#999999","#000",0,false,true,[{"x":-0.16064303726230378,"y":-0.9124524516498909},{"x":0.16064303726230378,"y":-0.9253038946308756},{"x":0.08353437937639896,"y":0.9124524516498909},{"x":-0.08353437937639896,"y":0.9253038946308738}],1,7,null,"",1],[1,-84.8398521640914,45.18570917871869,-1.0995574287564283,"","",89,"Normal_Thigh0000",87,0.4132120599733628,-2.3665034033387577,0,true,"#FFFFFF"],[0,-1.6095954525394922,3.846163127868644,-0.10471975511965992,".character#character , .flesh","feet_left",90,"#999999","#000",0,false,true,[{"x":-0.3532003169100655,"y":-0.2334193398709985},{"x":0.3593429311171974,"y":0},{"x":0.3593429311171974,"y":0.12285228414263472},{"x":-0.3654855453243293,"y":0.11056705572837089}],1,7,null,"",1],[1,-56.910278331099995,84.01850494505379,-0.0349065850398874,"","",91,"Normal_Leg0000",88,0.19879575861250487,-3.1415926535889356,0,true,"#FFFFFF"],[2,-59.263395665193705,54.86512468685822,-0.3665191429188093,".character#character","leg_left_joint",92,88,87,0,false,false,1,10,true,0,-149,0,0,0,0],[1,-47.910405899764825,113.91760413006554,-0.10471975511965992,"","",93,"Normal_Feet0000",90,1.515062169946712,1.2142877670861258,0,true,"#FFFFFF"],[2,-57.06243820056692,107.7868307758951,-0.3665191429188093,".character#character","feet_left_joint",94,90,88,0,false,false,1,10,true,0,0,0,0,0,0],[0,-3.848399294259064,-3.451614487857179,-0.2617993877991494,".character#character , .flesh","head",95,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,7,30.393075689479595,"",1],[0,-3.913370465043865,-0.9127129561410907,0.08726646259971638,".character#character , .flesh","body",96,"#999999","#000",0,false,true,[{"x":-0.5373137876370677,"y":1.2023497051222813},{"x":-0.4316127146592841,"y":-1.3697097373371037},{"x":-0.1497431867185277,"y":-1.82774772024083},{"x":0.1321263412222251,"y":-1.7925140292482356},{"x":0.5549306331333597,"y":-1.1230739003889436},{"x":0.5549306331333597,"y":1.308050778100065},{"x":0.09689265022963056,"y":1.801322451996385},{"x":-0.2202105687037168,"y":1.801322451996385}],1,7,null,"",1],[1,-119.93563549150181,18.271136779319164,-0.0617993877991494,"","",97,"Normal_Belly0000",78,8.746770037203438,1.1579140652818587,-0.2,false,"#FFFFFF"],[1,-116.27084288118976,-31.39406509269309,0.08726646259971638,"","",98,"Normal_Core0000",96,4.16882293351236,1.3835014335302833,0,true,"#FFFFFF"],[1,-113.95713991814694,-106.13757157631773,-0.2617993877991494,"","",99,"Normal_Head_Idle0000",95,2.989677819250855,0.785398163397623,0,true,"#FFFFFF"],[2,-111.53584026045331,-75.71789473110618,-0.2617993877991494,".character#character","head_joint",100,95,96,0,false,false,1,10,true,58,-64,0,0,0,0],[0,-3.0879741129852736,1.5510772338606693,-1.0646508437165412,".character#character , .flesh","thigh_right",101,"#999999","#000",0,false,true,[{"x":-0.20241022695050503,"y":-1.031328299223996},{"x":0.1959845054600109,"y":-1.0441797422049808},{"x":0.17028161949803788,"y":1.0377540207144893},{"x":-0.16385589800755085,"y":1.0377540207144893}],1,7,null,"",1],[0,-2.175473940810691,2.884627407623975,-0.08726646259971645,".character#character , .flesh","leg_right",102,"#999999","#000",0,false,true,[{"x":-0.16064303726230378,"y":-0.9124524516498909},{"x":0.16064303726230378,"y":-0.9253038946308756},{"x":0.08353437937639896,"y":0.9124524516498909},{"x":-0.08353437937639896,"y":0.9253038946308738}],1,7,null,"",1],[0,-3.690248164935997,-3.5929069861219367,-0.2617993877991494,".character#character","eye_left",103,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,7,7.534037070968986,"",1],[1,-92.52942744056394,46.93067496552345,-1.0646508437165412,"","",104,"Normal_Thigh0000",101,0.4132120599733628,-2.3665034033387577,0,true,"#FFFFFF"],[1,-65.46225750505361,86.55614842071638,-0.08726646259971645,"","",105,"Normal_Leg0000",102,0.19879575861250487,-3.1415926535889356,0,true,"#FFFFFF"],[1,-110.68198047308351,-108.34778350156746,-0.2617993877991494,"","",106,"Normal_Eye0000",103,0.5611519909321366,1.2636024235635333,0,null,"#FFFFFF"],[2,-70.04617415732521,58.88598088933901,-0.2617993877991494,".character#character","leg_right_joint",107,102,101,0,false,false,1,10,true,0,-149,0,0,0,0],[0,-1.881492463295238,3.9045844165410757,-0.10471975511965978,".character#character , .flesh","feet_right",108,"#999999","#000",0,false,true,[{"x":-0.3532003169100655,"y":-0.2334193398709985},{"x":0.3593429311171974,"y":0},{"x":0.3593429311171974,"y":0.12285228414263472},{"x":-0.3654855453243293,"y":0.11056705572837089}],1,7,null,"",1],[1,-56.06731622243719,115.67024279023849,-0.10471975511965978,"","",109,"Normal_Feet0000",108,1.515062169946712,1.2142877670861258,0,true,"#FFFFFF"],[2,-64.78248591694367,110.208443021947,-0.2617993877991494,".character#character","feet_right_joint",110,108,102,0,false,false,1,10,true,0,0,0,0,0,0],[0,-3.7801706433559055,-0.991178841878372,-0.08726646259971674,".character#character , .flesh","shoulder_right",111,"#999999","#000",0,false,true,[{"x":-0.18491373990083915,"y":-0.8588215919838902},{"x":0.19313212834087423,"y":-0.8423848151038147},{"x":0.11094824394050207,"y":0.8506032035438524},{"x":-0.11916663238053715,"y":0.8506032035438524}],1,7,null,"",1],[0,-3.052358038490917,-0.08158149565054851,-1.3962634015954631,".character#character , .flesh","arm_right",112,"#999999","#000",0,false,true,[{"x":-0.13560340926061798,"y":-0.6862354347431072},{"x":0.14382179770064596,"y":-0.7026722116231809},{"x":0.12738502082057224,"y":0.6944538231831459},{"x":-0.13560340926061798,"y":0.6944538231831459}],1,7,null,"",1],[0,-3.026521344024788,-3.760499068274978,-0.2617993877991494,".character#character","eye_right",113,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,7,7.534037070968986,"",1],[1,-90.77017584574725,-113.3755459661587,-0.2617993877991494,"","",114,"Normal_Eye0000",113,0.5611519909321366,1.2636024235635333,0,null,"#FFFFFF"],[2,-90.71540314170929,-112.36014350973679,-0.2617993877991494,".character#character","eye_right_joint",115,113,95,0,false,false,1,10,true,0,0,0,0,0,0],[1,-112.83355914047652,-29.693358120071707,-0.08726646259971674,"","",116,"Normal_Shoulder0000",111,0.5731017503262358,-0.16063012257496162,0,true,"#FFFFFF"],[1,-91.30992614597189,-2.5907807415976,-1.3962634015954631,"","",117,"Normal_Arm0000",112,0.29760652045521085,-0.8937510689744023,0,true,"#FFFFFF"],[2,-111.625411779579,-9.35100350738169,-0.2617993877991494,".character#character","arm_right_joint",118,112,111,0,false,false,1,10,true,152,0,0,0,0,0],[0,-2.2152319025646827,0.23095063787648362,-1.4311699866353498,".character#character , .flesh","hand_right",119,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,7,7.512582183874799,"",1],[1,-67.10832510128502,8.603867596340715,-1.4311699866353498,"","",120,"Normal_Hand0000",119,1.7975185021906417,2.9104087855451417,0,true,"#FFFFFF"],[2,-72.57428316426908,1.8740107564754203,0.31415926535897937,".character#character","hand_right_joint",121,119,112,0,false,false,1,10,true,60,-60,0,0,0,0],[2,-115.25727290250322,-52.006199181574985,-0.2617993877991494,".character#character","shoulder_right_joint",122,111,96,0,false,false,1,10,true,180,-19,0,0,0,0],[2,-110.96140920459851,-107.96270680359905,-0.2617993877991494,".character#character","eye_left_joint",123,103,95,0,false,false,1,10,true,0,0,0,0,0,0],[2,-111.13432689121731,-57.888339195270035,-0.2617993877991494,".character#character","shoulder_left_joint",124,79,96,0,false,false,1,10,true,180,-19,0,0,0,0],[2,-144.45826517806944,-77.03181496076849,-0.2617993877991494,".character#character","neck_joint",125,96,95,2,false,false,1,10,false,0,0,0.25,3,0,0],[2,-120.87005675840317,20.858668062222836,-0.2617993877991494,".character#character","core_joint",126,96,78,0,false,false,1,10,true,10,-10,0,0,0,0],[2,-116.45794455313752,32.40913287152706,-0.2617993877991494,".character#character","thigh_right_joint",127,101,78,0,false,false,1,10,true,142,-16,0,0,0,0],[2,-112.63982784986635,26.995489959580905,-0.2617993877991494,".character#character","thigh_left_joint",128,87,78,0,false,false,1,10,true,142,-16,0,0,0,0],[2,18.477468387921533,71.7533708928611,0,".vehicle","baby_joint",129,1,63,2,false,false,1,10,false,0,0,0,2,0,0],[2,-15.730057911483007,41.09907629518818,0,".vehicle","neck_joint",130,2,1,2,false,false,1,10,false,0,0,0.25,3,0,0],[0,1.7089862402141636,3.2167476013215164,0,".vehicle","seatHitBox",131,["#999999","#999999"],["#000","#000"],[0,0],false,true,[[{"x":-0.9229672686343307,"y":-0.2161379046801919},{"x":0.7009877989627853,"y":-0.0759403448876359},{"x":0.7477203188936343,"y":0.05257408492220961},{"x":-0.5257408492220961,"y":0.2395041646456164}],[{"x":-0.537423979204803,"y":0.22782103466290438},{"x":-3.1193957053843917,"y":-2.155537481810563},{"x":-2.803951195851134,"y":-2.4008832114475362},{"x":-0.2920782495678296,"y":-0.18108851473205134}]],1,6,[null,null],"",1],[2,-24.4370950815564,33.58877308273573,0,".vehicle","",132,63,131,0,false,false,1,10,false,0,0,0,0,0,0],[2,38.65180682509406,97.72915668783037,0,".vehicle","",133,63,131,0,false,false,1,10,false,0,0,0,0,0,0],[2,-55.01995646336738,118.7799734847287,0,".vehicle","pedal_right_joint",134,63,108,0,false,false,1,10,false,0,0,0,0,0,0],[2,-46.85668757988126,118.77997348472864,0,".vehicle","pedal_left_joint",135,63,90,0,false,false,1,10,false,0,0,0,0,0,0],[2,-64.49988161838635,9.234171693399578,0,".vehicle","grip_right_joint",136,63,119,0,false,false,1,10,false,0,0,0,0,0,0],[2,-61.33990656671565,6.864190404644937,0,".vehicle","grip_left_joint",137,63,84,0,false,false,1,10,false,0,0,0,0,0,0],[2,-116.43787756672863,78.08563373289138,0,"","",138,96,108,2,false,false,1,10,false,0,0,0.25,5,0,0],[2,-71.67156433469526,-19.61026161466421,0,"","",139,63,96,2,false,false,1,10,false,0,0,0.25,5,0,0],[0,5.023782287344901,3.0902381393544327,0,".vehicle","balanceBody",140,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],0.2,2,26.832815729997368,"",1],[2,4.297136573139544,112.55405928776506,0,".vehicle","balanceBody_joint",141,140,63,0,false,false,1,10,true,0,0,0,0,0,0]]}',
        class: vehicle2,
        library: LIBRARY_ADMIN,
    },
    vehicle_horse: {
        json: `{"objects":[[0,-2.5874472205169616,3.9473883083507575,0.29670597283903605,".horse#horseanimal, .flesh","leg_back_left",0,"#999999","#000",1,false,true,[{"x":-0.04139475487061173,"y":-0.9934741168946477},{"x":0.31046066152957597,"y":-0.8899872297181233},{"x":0.08278950974122257,"y":0.9520793620240386},{"x":-0.3518554164001868,"y":0.9313819845887323}],1,7,null,"",1],[0,1.6376538944478047,5.2042766369688715,0,".horse#horseanimal","heel_front_left",1,"#999999","#000",1,false,true,[{"x":-0.13970729768830825,"y":-0.20697377435305242},{"x":0.1500559864059623,"y":-0.20697377435305242},{"x":0.3156350058884021,"y":0.20697377435305242},{"x":-0.32598369460605614,"y":0.20697377435305242}],1,7,null,"",1],[0,0.012725093559460166,0.13221788711390814,0,".horse#horseanimal, .flesh","frame",2,"#999999","#000",1,false,true,[{"x":2.8200176755603295,"y":-0.8744641966416431},{"x":2.695833410948495,"y":1.050391904841737},{"x":-2.788971609407369,"y":0.82272075305338},{"x":-2.7268794771014555,"y":-0.9986484612534743}],1,7,null,"",1],[0,2.051722316978068,4.092996876948381,0.4363323129985825,".horse#horseanimal, .flesh","leg_front_left",3,"#999999","#000",1,false,true,[{"x":0.2483685292236597,"y":-1.0452175604829126},{"x":0.16557901948244158,"y":1.0245201830476063},{"x":-0.22767115178835517,"y":1.0245201830476063},{"x":-0.1862763969177461,"y":-1.0038228056123}],1,7,null,"",1],[0,4.430682507131806,-3.741453157591982,0,".horse#horseanimal","eye",4,"#999999","#000",1,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,7,9.26908932948404,"",1],[0,3.907847260396935,-3.80286566786822,0,".horse#horseanimal, .flesh","head",5,"#999999","#000",1,false,true,[{"x":0,"y":0},{"x":0,"y":0}],0.1,7,29.311434116732478,"",1],[0,-1.557458978508926,1.36558234482738,0,".horse#horseanimal, .flesh","thigh_back_left",6,"#999999","#000",1,false,true,[{"x":-0.3880758269119706,"y":-1.4177703543184041},{"x":0.6467930448532844,"y":-1.3349808445771834},{"x":0.3570297607590138,"y":1.3142834671418784},{"x":-0.6157469787003276,"y":1.4384677317537091}],1,7,null,"",1],[0,-3.342194370793474,0.04713033556844848,0.38397243543875265,".horse#horseanimal","",7,"#999999","#000",1,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,2,5.493838953457487,"",1],[0,3.1231869823049165,-1.8622633369902875,0,".horse#horseanimal, .flesh","neck",8,"#999999","#000",1,false,true,[{"x":-0.10866123153535412,"y":-1.7799744594362437},{"x":1.008997149971126,"y":-1.5109085527772768},{"x":0.16040467512361545,"y":1.8627639691774642},{"x":-1.060740593559391,"y":1.4281190430360566}],0.1,7,null,"",1],[0,2.644710281555749,1.8755331773687827,0,".horse#horseanimal, .flesh","thigh_front_left",9,"#999999","#000",1,false,true,[{"x":0.33633238332371107,"y":-1.1797505138123936},{"x":0.19145074127657224,"y":1.1176583815064796},{"x":-0.2224968074295326,"y":1.1797505138123932},{"x":-0.3052863171707507,"y":-1.1176583815064791}],1,7,null,"",1],[0,1.2602802678385208,2.8832458362852877,0.2617993877991494,".horse#horseanimal","pedal",10,"#999999","#000",1,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,7,7.825458409176276,"",1],[0,1.332744000518435,0.8447441357424372,0,".horse#horseanimal","",11,"#999999","#000",1,false,true,[{"x":0.056603947879665384,"y":-0.679247374555981},{"x":0.06367944136462356,"y":0.679247374555981},{"x":-0.07075493484958173,"y":0.6721718810710247},{"x":-0.04952845439470721,"y":-0.6721718810710247}],1,7,null,"",1],[0,1.3351948472431268,2.062058878500939,0,".horse#horseanimal","",12,"#999999","#000",1,false,true,[{"x":0.056603947879665384,"y":-0.679247374555981},{"x":0.06367944136462356,"y":0.679247374555981},{"x":-0.07075493484958173,"y":0.6721718810710247},{"x":-0.04952845439470721,"y":-0.6721718810710247}],1,7,null,"",1],[0,0.9195752403848267,-0.22047366067811658,-0.40142572795869635,".character#character , .flesh","thigh_left",13,"#999999","#000",0,false,true,[{"x":-0.20241022695050503,"y":-1.031328299223996},{"x":0.1959845054600109,"y":-1.0441797422049808},{"x":0.17028161949803788,"y":1.0377540207144893},{"x":-0.16385589800755085,"y":1.0377540207144893}],1,7,null,"",1],[0,1.2570120803822247,1.666604565744952,0.10471975511965895,".character#character , .flesh","leg_left",14,"#999999","#000",0,false,true,[{"x":-0.16064303726230378,"y":-0.9124524516498909},{"x":0.16064303726230378,"y":-0.9253038946308756},{"x":0.08353437937639896,"y":0.9124524516498909},{"x":-0.08353437937639896,"y":0.9253038946308738}],1,7,null,"",1],[1,27.428523957032667,-6.232702336249913,-0.40142572795869635,"","",15,"Normal_Thigh0000",13,0.4132120599733628,-2.3665034033387577,0,true,"#FFFFFF"],[0,1.1959409438156283,2.8386285454073548,0.3316125578789225,".character#character , .flesh","feet_right",16,"#999999","#000",0,false,true,[{"x":-0.3532003169100655,"y":-0.2334193398709985},{"x":0.3593429311171974,"y":0},{"x":0.3593429311171974,"y":0.12285228414263472},{"x":-0.3654855453243293,"y":0.11056705572837089}],1,7,null,"",1],[1,37.51265567682024,49.97735715719684,0.10471975511965895,"","",17,"Normal_Leg0000",14,0.19879575861250487,-3.1415926535889356,0,true,"#FFFFFF"],[2,39.54459758278615,21.193685337412454,-0.3665191429188093,".character#character","leg_left_joint",18,14,13,0,false,false,1,10,true,0,-149,0,0,0,0],[1,36.840424570902115,83.98856078292906,0.3316125578789225,"","",19,"Normal_Feet0000",16,1.515062169946712,1.2142877670861258,0,true,"#FFFFFF"],[2,33.07504989148522,76.85505294019367,-0.3665191429188093,".character#character","feet_left_joint",20,16,14,0,false,false,1,10,true,0,0,0,0,0,0],[1,40.25422096897204,86.68589392045408,0.2617993877991494,".horse#horseanimal","",21,"Horse_Pedal0000",10,2.4530675199029677,0.18487329857494245,0,false,"#FFFFFF"],[1,40.163484083457924,62.33319045600455,0,".horse#horseanimal","",22,"Horse_thread0000",12,0.48355637255130607,-1.3463178352399667,0,false,"#FFFFFF"],[1,40.08995868171717,25.813748173249493,0,".horse#horseanimal","",23,"Horse_thread0000",11,0.48355637255130607,-1.3463178352399667,0,false,"#FFFFFF"],[2,40.24067161116575,41.069827747359376,0,".horse#horseanimal","",24,12,11,0,false,false,1,10,false,0,0,0,0,0,0],[2,39.661342851692396,78.72619711312882,0,".horse#horseanimal","",25,10,12,0,false,false,1,10,false,0,0,0,0,0,0],[0,0.6251309873233629,-3.3788747857317674,-0.06981317007977322,".character#character , .flesh","shoulder_left",26,"#999999","#000",0,false,true,[{"x":-0.18491373990083915,"y":-0.8588215919838902},{"x":0.19313212834087423,"y":-0.8423848151038147},{"x":0.11094824394050207,"y":0.8506032035438524},{"x":-0.11916663238053715,"y":0.8506032035438524}],1,7,null,"",1],[0,1.3767151208575221,-2.3696232815845333,-1.3439035240356332,".character#character , .flesh","arm_left",27,"#999999","#000",0,false,true,[{"x":-0.13560340926061798,"y":-0.6862354347431072},{"x":0.14382179770064596,"y":-0.7026722116231809},{"x":0.12738502082057224,"y":0.6944538231831459},{"x":-0.13560340926061798,"y":0.6944538231831459}],1,7,null,"",1],[1,19.32466960290511,-101.3142677333447,-0.06981317007977322,"","",28,"Normal_Shoulder0000",26,0.5731017503262358,-0.16063012257496162,0,true,"#FFFFFF"],[1,41.56941281650558,-71.2181878799003,-1.3439035240356332,"","",29,"Normal_Arm0000",27,0.29760652045521085,-0.8937510689744023,0,true,"#FFFFFF"],[2,21.55365851603832,-77.72220225267495,-0.2617993877991494,".character#character","arm_left_joint",30,27,26,0,false,false,1,10,true,152,0,0,0,0,0],[0,2.1855282181110547,-2.041786531792413,-1.1868238913561437,".character#character , .flesh","hand_left",31,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,7,7.512582183874799,"",1],[1,64.52852345783295,-59.785592690148924,-1.1868238913561437,"","",32,"Normal_Hand0000",31,1.7975185021906417,2.9104087855451417,0,true,"#FFFFFF"],[2,60.15839907001178,-67.89179074429134,0.31415926535897937,".character#character","hand_left_joint",33,31,27,0,false,false,1,10,true,60,-60,0,0,0,0],[1,-46.30077601775348,40.77984654863226,0,".horse#horseanimal","",34,"Horse_ThigBack0000",6,0.4627375632882109,0.41748725190666525,0,false,"#9b9b9b"],[1,-78.23919278825979,118.36785601878505,0.29670597283903605,".horse#horseanimal","",35,"Horse_LegBack0000",0,0.6181213527363268,-2.932023884828656,0,false,"#9b9b9b"],[0,5.495282601857692,-2.1266691151448165,0,".horse#horseanimal","",36,"#999999","#000",1,false,true,[{"x":0.03360859405354688,"y":-0.45106270966608264},{"x":0.04775958102346323,"y":0.4546004564085617},{"x":-0.03714634079603485,"y":0.44752496292360355},{"x":-0.04422183428098947,"y":-0.45106270966608264}],1,2,null,"",1],[0,-3.723296818807562,2.3082594894275283,0,".horse#horseanimal","",37,"#999999","#000",1,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,2,10.722138447848002,"",1],[0,-2.8763455100033926,5.206615936105451,0,".horse#horseanimal","heel_back_left",38,"#999999","#000",1,false,true,[{"x":-0.13970729768830825,"y":-0.20697377435305242},{"x":0.1500559864059623,"y":-0.20697377435305242},{"x":0.3156350058884021,"y":0.20697377435305242},{"x":-0.32598369460605614,"y":0.20697377435305242}],1,7,null,"",1],[1,-86.05835494313392,156.00557024651573,0,".horse#horseanimal","",39,"Horse_Feet0000",38,0.30173206521762175,0.6936329709148767,0,false,"#9b9b9b"],[0,5.770839624608131,-2.1723640371537507,0,".horse#horseanimal","",40,"#999999","#000",1,false,true,[{"x":0.03360859405354688,"y":-0.45106270966608264},{"x":0.04775958102346323,"y":0.4546004564085617},{"x":-0.03714634079603485,"y":0.44752496292360355},{"x":-0.04422183428098947,"y":-0.45106270966608264}],1,2,null,"",1],[0,5.790235841426098,-1.3333569081820422,0,".horse#horseanimal","",41,"#999999","#000",1,false,true,[{"x":0.03360859405354688,"y":-0.45106270966608264},{"x":0.04775958102346323,"y":0.4546004564085617},{"x":-0.03714634079603485,"y":0.44752496292360355},{"x":-0.04422183428098947,"y":-0.45106270966608264}],1,2,null,"",1],[0,5.7330947147833715,-0.4835260332394926,0.15707963267948966,".horse#horseanimal","",42,"#999999","#000",1,false,true,[{"x":0.03360859405354688,"y":-0.45106270966608264},{"x":0.04775958102346323,"y":0.4546004564085617},{"x":-0.03714634079603485,"y":0.44752496292360355},{"x":-0.04422183428098947,"y":-0.45106270966608264}],1,2,null,"",1],[0,4.882188761335948,0.7667371896739565,1.4137166941154085,".horse#horseanimal","",43,"#999999","#000",1,false,true,[{"x":0.03360859405354688,"y":-0.45106270966608264},{"x":0.04775958102346323,"y":0.4546004564085617},{"x":-0.03714634079603485,"y":0.44752496292360355},{"x":-0.04422183428098947,"y":-0.45106270966608264}],1,2,null,"",1],[0,4.035762347737922,0.7967769473959896,1.6929693744345016,".horse#horseanimal","",44,"#999999","#000",1,false,true,[{"x":0.03360859405354688,"y":-0.45106270966608264},{"x":0.04775958102346323,"y":0.4546004564085617},{"x":-0.03714634079603485,"y":0.44752496292360355},{"x":-0.04422183428098947,"y":-0.45106270966608264}],1,2,null,"",1],[0,3.3366943613584987,0.45225020486348666,2.373647782712286,".horse#horseanimal","",45,"#999999","#000",1,false,true,[{"x":0.03360859405354688,"y":-0.45106270966608264},{"x":0.04775958102346323,"y":0.4546004564085617},{"x":-0.03714634079603485,"y":0.44752496292360355},{"x":-0.04422183428098947,"y":-0.45106270966608264}],1,2,null,"",1],[0,2.751859969474221,-0.20521041705051402,2.495820830351888,".horse#horseanimal","",46,"#999999","#000",1,false,true,[{"x":0.03360859405354688,"y":-0.45106270966608264},{"x":0.04775958102346323,"y":0.4546004564085617},{"x":-0.03714634079603485,"y":0.44752496292360355},{"x":-0.04422183428098947,"y":-0.45106270966608264}],1,2,null,"",1],[0,2.357672807862975,-0.9465494344085381,2.8099800957108636,".horse#horseanimal","",47,"#999999","#000",1,false,true,[{"x":0.03360859405354688,"y":-0.45106270966608264},{"x":0.04775958102346323,"y":0.4546004564085617},{"x":-0.03714634079603485,"y":0.44752496292360355},{"x":-0.04422183428098947,"y":-0.45106270966608264}],1,2,null,"",1],[0,2.2228568479383264,-1.7352123001515325,3.159045946109729,".horse#horseanimal","",48,"#999999","#000",1,false,true,[{"x":0.03360859405354688,"y":-0.45106270966608264},{"x":0.04775958102346323,"y":0.4546004564085617},{"x":-0.03714634079603485,"y":0.44752496292360355},{"x":-0.04422183428098947,"y":-0.45106270966608264}],1,2,null,"",1],[1,66.09804313184011,-52.605137529839354,3.159045946109729,".horse#horseanimal","",49,"Horse_thread20000",48,0.8040484317563723,-0.7337337205336466,0,false,"#FFFFFF"],[1,69.99027241346256,-28.71116441976276,2.8099800957108636,".horse#horseanimal","",50,"Horse_thread20000",47,0.8040484317563723,-0.7337337205336466,0,false,"#FFFFFF"],[1,81.75485922747087,-6.226946968191606,2.495820830351888,".horse#horseanimal","",51,"Horse_thread20000",46,0.8040484317563723,-0.7337337205336466,0,false,"#FFFFFF"],[1,99.29725289337898,13.595008202207213,2.373647782712286,".horse#horseanimal","",52,"Horse_thread20000",45,0.8040484317563723,-0.7337337205336466,0,false,"#FFFFFF"],[2,75.13472562949562,-15.425536108112954,0,".horse#horseanimal","",53,47,46,0,false,false,1,10,false,0,0,0,0,0,0],[1,120.46568068044556,24.430389521948705,1.6929693744345016,".horse#horseanimal","",54,"Horse_thread20000",44,0.8040484317563723,-0.7337337205336466,0,false,"#FFFFFF"],[1,146.02727783033467,23.676142740003666,1.4137166941154085,".horse#horseanimal","",55,"Horse_thread20000",43,0.8040484317563723,-0.7337337205336466,0,false,"#FFFFFF"],[0,5.500958460696946,0.3222256064693534,0.4363323129985826,".horse#horseanimal","",56,"#999999","#000",1,false,true,[{"x":0.03360859405354688,"y":-0.45106270966608264},{"x":0.04775958102346323,"y":0.4546004564085617},{"x":-0.03714634079603485,"y":0.44752496292360355},{"x":-0.04422183428098947,"y":-0.45106270966608264}],1,2,null,"",1],[1,165.34240578366186,10.407116981390178,0.4363323129985826,".horse#horseanimal","",57,"Horse_thread20000",56,0.8040484317563723,-0.7337337205336466,0,false,"#FFFFFF"],[2,160.38315055919924,20.328878327795415,0,".horse#horseanimal","",58,43,56,0,false,false,1,10,false,0,0,0,0,0,0],[1,172.4984108432683,-13.880566263969882,0.15707963267948966,".horse#horseanimal","",59,"Horse_thread20000",42,0.8040484317563723,-0.7337337205336466,0,false,"#FFFFFF"],[1,174.30422537662037,-39.462278421689895,0,".horse#horseanimal","",60,"Horse_thread20000",41,0.8040484317563723,-0.7337337205336466,0,false,"#FFFFFF"],[2,170.74236996873668,-3.084487965436832,0,".horse#horseanimal","",61,56,42,0,false,false,1,10,false,0,0,0,0,0,0],[1,173.72233887208137,-64.63249229084116,0,".horse#horseanimal","",62,"Horse_thread20000",40,0.8040484317563723,-0.7337337205336466,0,false,"#FFFFFF"],[2,173.88457059897132,-27.619060929134363,0,".horse#horseanimal","",63,42,41,0,false,false,1,10,false,0,0,0,0,0,0],[2,173.2473089635505,-53.109526345962855,0,".horse#horseanimal","",64,41,40,0,false,false,1,10,false,0,0,0,0,0,0],[2,134.57292742789275,25.462829328016397,0,".horse#horseanimal","",65,44,43,0,false,false,1,10,false,0,0,0,0,0,0],[2,109.15923341530694,22.44173545467848,0,".horse#horseanimal","",66,45,44,0,false,false,1,10,false,0,0,0,0,0,0],[2,91.43622575756004,5.162292448223596,0,".horse#horseanimal","",67,46,45,0,false,false,1,10,false,0,0,0,0,0,0],[2,65.94125249998987,-40.2723626989258,0,".horse#horseanimal","",68,48,47,0,false,false,1,10,false,0,0,0,0,0,0],[1,80.01765631163418,55.695933663575964,0,".horse#horseanimal","",69,"Horse_ThigFront0000",9,0.8845432311513548,0.7003300547231671,0,false,"#9b9b9b"],[1,60.09006495945336,121.48941289600357,0.4363323129985825,".horse#horseanimal","",70,"Horse_LegFront0000",3,1.956417894028662,2.8507900492558127,0,false,"#9b9b9b"],[1,49.361627190402004,155.93539127241834,0,".horse#horseanimal","",71,"Horse_Feet0000",1,0.30173206521762175,0.6936329709148767,0,false,"#9b9b9b"],[0,0.21946727310657355,-0.7073110626665142,0,".horse#horseanimal","saddle",72,"#999999","#000",1,false,true,[{"x":-1.190099202530046,"y":-0.6467930448532866},{"x":1.3556782220124894,"y":-0.12935860897065732},{"x":1.231493957400657,"y":0.7399312433121592},{"x":-1.3970729768830985,"y":0.03622041051178382}],1,7,null,"",1],[1,91.37819448880022,-57.11646112454293,0,".horse#horseanimal","",73,"Horse_Neck0000",8,2.632359549701002,2.6474097302913573,0,false,"#FFFFFF"],[1,-99.18031126553605,1.9233130342067795,0.38397243543875265,".horse#horseanimal","",74,"Horse_Tails0000",7,1.199101641079337,-0.05479116699906733,0,false,"#FFFFFF"],[0,-3.5557849364122966,0.5490273509641534,0.38397243543875265,".horse#horseanimal","",75,"#999999","#000",1,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,2,5.493838953457487,"",1],[1,-105.58802823410073,16.98022349607793,0.38397243543875265,".horse#horseanimal","",76,"Horse_Tails0000",75,1.199101641079337,-0.05479116699906733,0,false,"#FFFFFF"],[2,-103.72347344498917,8.563297077183329,0,".horse#horseanimal","",77,75,7,0,false,false,1,10,true,0,-40,0,0,0,0],[0,-3.70695342686096,1.0843208127471835,0.12217304763960338,".horse#horseanimal","",78,"#999999","#000",1,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,2,5.493838953457487,"",1],[1,-110.0282279502469,32.740716651220396,0.12217304763960338,".horse#horseanimal","",79,"Horse_Tails0000",78,1.199101641079337,-0.05479116699906733,0,false,"#FFFFFF"],[2,-108.75070648174167,24.166212088702252,0,".horse#horseanimal","",80,78,75,0,false,false,1,10,true,40,-40,0,0,0,0],[0,1.0395609906994139,0.9658846222909223,0,".horse#horseanimal","",81,"#999999","#000",1,false,true,[{"x":0.056603947879665384,"y":-0.679247374555981},{"x":0.06367944136462356,"y":0.679247374555981},{"x":-0.07075493484958173,"y":0.6721718810710247},{"x":-0.04952845439470721,"y":-0.6721718810710247}],1,7,null,"",1],[0,-3.7221716521316055,1.6451508025724622,-0.017453292519942983,".horse#horseanimal","",82,"#999999","#000",1,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,2,5.493838953457487,"",1],[1,-110.4668836696817,49.39928558158294,-0.017453292519942983,".horse#horseanimal","",83,"Horse_Tails0000",82,1.199101641079337,-0.05479116699906733,0,false,"#FFFFFF"],[1,-111.97196839874394,94.38887317155735,0,".horse#horseanimal","",84,"Horse_Tail0000",37,25.142571353303317,-1.581657157180191,0,false,"#FFFFFF"],[2,-111.14462697543334,40.68426349517447,0,".horse#horseanimal","",85,82,78,0,false,false,1,10,true,40,-40,0,0,0,0],[2,-111.38401902480248,56.96292285227758,0,".horse#horseanimal","",86,37,82,0,false,false,1,10,true,40,-40,0,0,0,0],[1,0.23852488519359472,7.058904869435505,0,".horse#horseanimal","",87,"Horse_Body0000",2,3.095683392783001,-1.6170798294802895,0,false,"#FFFFFF"],[1,129.80739501167645,-106.42570092874529,0,".horse#horseanimal","",88,"Horse_Head0000",5,14.721899792749973,-0.5472391663180024,0,false,"#FFFFFF"],[1,133.72469872079384,-112.57181373912864,0,".horse#horseanimal","",89,"Horse_Eye0000",4,0.8686214183277141,0.3874859870000885,0,false,"#FFFFFF"],[0,5.514678818675659,-1.287661986173109,0,".horse#horseanimal","",90,"#999999","#000",1,false,true,[{"x":0.03360859405354688,"y":-0.45106270966608264},{"x":0.04775958102346323,"y":0.4546004564085617},{"x":-0.03714634079603485,"y":0.44752496292360355},{"x":-0.04422183428098947,"y":-0.45106270966608264}],1,2,null,"",1],[0,5.45753769203294,-0.43783111123056023,0.15707963267948966,".horse#horseanimal","",91,"#999999","#000",1,false,true,[{"x":0.03360859405354688,"y":-0.45106270966608264},{"x":0.04775958102346323,"y":0.4546004564085617},{"x":-0.03714634079603485,"y":0.44752496292360355},{"x":-0.04422183428098947,"y":-0.45106270966608264}],1,2,null,"",1],[0,4.606631738585513,0.8124321116828925,1.4137166941154085,".horse#horseanimal","",92,"#999999","#000",1,false,true,[{"x":0.03360859405354688,"y":-0.45106270966608264},{"x":0.04775958102346323,"y":0.4546004564085617},{"x":-0.03714634079603485,"y":0.44752496292360355},{"x":-0.04422183428098947,"y":-0.45106270966608264}],1,2,null,"",1],[0,3.760205324987482,0.8424718694049256,1.6929693744345016,".horse#horseanimal","",93,"#999999","#000",1,false,true,[{"x":0.03360859405354688,"y":-0.45106270966608264},{"x":0.04775958102346323,"y":0.4546004564085617},{"x":-0.03714634079603485,"y":0.44752496292360355},{"x":-0.04422183428098947,"y":-0.45106270966608264}],1,2,null,"",1],[0,3.061137338608059,0.4979451268724205,2.373647782712286,".horse#horseanimal","",94,"#999999","#000",1,false,true,[{"x":0.03360859405354688,"y":-0.45106270966608264},{"x":0.04775958102346323,"y":0.4546004564085617},{"x":-0.03714634079603485,"y":0.44752496292360355},{"x":-0.04422183428098947,"y":-0.45106270966608264}],1,2,null,"",1],[0,2.476302946723784,-0.1595154950415798,2.495820830351888,".horse#horseanimal","",95,"#999999","#000",1,false,true,[{"x":0.03360859405354688,"y":-0.45106270966608264},{"x":0.04775958102346323,"y":0.4546004564085617},{"x":-0.03714634079603485,"y":0.44752496292360355},{"x":-0.04422183428098947,"y":-0.45106270966608264}],1,2,null,"",1],[0,2.082115785112537,-0.9008545123996059,2.8099800957108636,".horse#horseanimal","",96,"#999999","#000",1,false,true,[{"x":0.03360859405354688,"y":-0.45106270966608264},{"x":0.04775958102346323,"y":0.4546004564085617},{"x":-0.03714634079603485,"y":0.44752496292360355},{"x":-0.04422183428098947,"y":-0.45106270966608264}],1,2,null,"",1],[0,2.01396649185456,-1.6895173781425992,3.333578871309162,".horse#horseanimal","",97,"#999999","#000",1,false,true,[{"x":0.03360859405354688,"y":-0.45106270966608264},{"x":0.04775958102346323,"y":0.4546004564085617},{"x":-0.03714634079603485,"y":0.44752496292360355},{"x":-0.04422183428098947,"y":-0.45106270966608264}],1,2,null,"",1],[1,59.93555301460815,-51.32799933117018,3.333578871309162,".horse#horseanimal","",98,"Horse_thread20000",97,0.8040484317563723,-0.7337337205336466,0,false,"#FFFFFF"],[1,61.72356173094942,-27.340316759494794,2.8099800957108636,".horse#horseanimal","",99,"Horse_thread20000",96,0.8040484317563723,-0.7337337205336466,0,false,"#FFFFFF"],[1,73.48814854495775,-4.8560993079235795,2.495820830351888,".horse#horseanimal","",100,"Horse_thread20000",95,0.8040484317563723,-0.7337337205336466,0,false,"#FFFFFF"],[1,91.03054221086579,14.965855862475227,2.373647782712286,".horse#horseanimal","",101,"Horse_thread20000",94,0.8040484317563723,-0.7337337205336466,0,false,"#FFFFFF"],[2,66.86801494698304,-14.054688447844727,0,".horse#horseanimal","",102,96,95,0,false,false,1,10,false,0,0,0,0,0,0],[1,112.19896999793235,25.801237182216788,1.6929693744345016,".horse#horseanimal","",103,"Horse_thread20000",93,0.8040484317563723,-0.7337337205336466,0,false,"#FFFFFF"],[1,137.7605671478216,25.04699040027175,1.4137166941154085,".horse#horseanimal","",104,"Horse_thread20000",92,0.8040484317563723,-0.7337337205336466,0,false,"#FFFFFF"],[0,5.225401437946513,0.3679205284782846,0.4363323129985826,".horse#horseanimal","",105,"#999999","#000",1,false,true,[{"x":0.03360859405354688,"y":-0.45106270966608264},{"x":0.04775958102346323,"y":0.4546004564085617},{"x":-0.03714634079603485,"y":0.44752496292360355},{"x":-0.04422183428098947,"y":-0.45106270966608264}],1,2,null,"",1],[1,157.07569510114885,11.777964641658114,0.4363323129985826,".horse#horseanimal","",106,"Horse_thread20000",105,0.8040484317563723,-0.7337337205336466,0,false,"#FFFFFF"],[2,152.1164398766865,21.699725988063364,0,".horse#horseanimal","",107,92,105,0,false,false,1,10,false,0,0,0,0,0,0],[1,164.23170016075534,-12.509718603701911,0.15707963267948966,".horse#horseanimal","",108,"Horse_thread20000",91,0.8040484317563723,-0.7337337205336466,0,false,"#FFFFFF"],[1,166.0375146941072,-38.0914307614219,0,".horse#horseanimal","",109,"Horse_thread20000",90,0.8040484317563723,-0.7337337205336466,0,false,"#FFFFFF"],[2,162.47565928622402,-1.7136403051686315,0,".horse#horseanimal","",110,105,91,0,false,false,1,10,false,0,0,0,0,0,0],[1,165.4556281895682,-63.26164463057312,0,".horse#horseanimal","",111,"Horse_thread20000",36,0.8040484317563723,-0.7337337205336466,0,false,"#FFFFFF"],[2,165.6178599164586,-26.24821326886606,0,".horse#horseanimal","",112,91,90,0,false,false,1,10,false,0,0,0,0,0,0],[2,164.98059828103789,-51.738678685694616,0,".horse#horseanimal","",113,90,36,0,false,false,1,10,false,0,0,0,0,0,0],[0,-3.2144916155528542,3.9823657838703825,0.29670597283903605,".horse#horseanimal, .flesh","leg_back_right",114,"#999999","#000",1,false,true,[{"x":-0.04139475487060906,"y":-0.9934741168946495},{"x":0.31046066152957863,"y":-0.889987229718125},{"x":0.08278950974122523,"y":0.9520793620240369},{"x":-0.35185541640018414,"y":0.9313819845887306}],1,7,null,"",1],[0,-2.2027208259574844,1.3773574131176727,-0.06981317007977318,".horse#horseanimal, .flesh","thigh_back_right",115,"#999999","#000",1,false,true,[{"x":-0.3880758269119724,"y":-1.417770354318404},{"x":0.6467930448532826,"y":-1.3349808445771831},{"x":0.35702976075901205,"y":1.3142834671418786},{"x":-0.6157469787003294,"y":1.4384677317537093}],1,7,null,"",1],[1,-65.67274980613348,41.10404911583636,-0.06981317007977318,".horse#horseanimal","",116,"Horse_ThigBack0000",115,0.4627375632882109,0.41748725190666525,0,false,"#FFFFFF"],[2,-62.70619804998415,88.26053192294148,0,".horse#horseanimal","leg_back_left_joint",117,0,6,0,false,false,1,10,true,120,0,0,0,0,0],[0,0.9670972580194999,3.0043863228337715,0.2617993877991494,".horse#horseanimal","pedal",118,"#999999","#000",1,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,7,7.825458409176276,"",1],[2,-86.62261879903761,150.53387967203457,0,".horse#horseanimal","heel_back_left_joint",119,38,0,0,false,false,1,10,true,40,-40,0,0,0,0],[1,-97.05052463933646,119.41718028437379,0.29670597283903605,".horse#horseanimal","",120,"Horse_LegBack0000",114,0.6181213527362038,-2.9320238848287077,0,false,"#FFFFFF"],[0,-3.5105121780770756,5.215351690750723,0,".horse#horseanimal","heel_back_right",121,"#999999","#000",1,false,true,[{"x":-0.13970729768830736,"y":-0.20697377435305242},{"x":0.15005598640596318,"y":-0.20697377435305242},{"x":0.315635005888403,"y":0.20697377435305242},{"x":-0.32598369460605525,"y":0.20697377435305242}],1,7,null,"",1],[1,-105.0833549853444,156.2676428858739,0,".horse#horseanimal","",122,"Horse_Feet0000",121,0.30173206521762175,0.6936329709148767,0,false,"#FFFFFF"],[2,-82.43081927574335,89.24249411517764,0,".horse#horseanimal","leg_back_right_joint",123,114,115,0,false,false,1,10,true,120,0,0,0,0,0],[2,-106.00456559418183,150.40505098287457,0,".horse#horseanimal","heel_back_right_joint",124,121,114,0,false,false,1,10,true,40,-40,0,0,0,0],[0,1.054040479323273,5.1956312447573625,0,".horse#horseanimal","heel_front_right",125,"#999999","#000",1,false,true,[{"x":-0.13970729768830736,"y":-0.20697377435305242},{"x":0.15005598640596318,"y":-0.20697377435305242},{"x":0.315635005888403,"y":0.20697377435305242},{"x":-0.32598369460605525,"y":0.20697377435305242}],1,7,null,"",1],[0,1.4743996335364642,4.084351484736875,0.4363323129985825,".horse#horseanimal, .flesh","leg_front_right",126,"#999999","#000",1,false,true,[{"x":0.24836852922366148,"y":-1.0452175604829126},{"x":0.16557901948244336,"y":1.0245201830476063},{"x":-0.2276711517883534,"y":1.0245201830476063},{"x":-0.18627639691774434,"y":-1.0038228056123}],1,7,null,"",1],[0,2.0340542647808024,1.8668877851572772,0,".horse#horseanimal, .flesh","thigh_front_right",127,"#999999","#000",1,false,true,[{"x":0.3363323833237146,"y":-1.1797505138123938},{"x":0.1914507412765758,"y":1.1176583815064793},{"x":-0.22249680742952904,"y":1.179750513812393},{"x":-0.30528631717074717,"y":-1.1176583815064793}],1,7,null,"",1],[1,61.6979758083859,55.4365718972308,0,".horse#horseanimal","",128,"Horse_ThigFront0000",127,0.8845432311514417,0.7003300547230843,0,false,"#FFFFFF"],[1,42.77038445620524,121.2300511296584,0.4363323129985825,".horse#horseanimal","",129,"Horse_LegFront0000",126,1.956417894028662,2.8507900492558127,0,false,"#FFFFFF"],[0,1.0420118374241056,2.1831993650494246,0,".horse#horseanimal","",130,"#999999","#000",1,false,true,[{"x":0.056603947879665384,"y":-0.679247374555981},{"x":0.06367944136462356,"y":0.679247374555981},{"x":-0.07075493484958173,"y":0.6721718810710247},{"x":-0.04952845439470721,"y":-0.6721718810710247}],1,7,null,"",1],[1,31.36799378888729,65.96740505245911,0,".horse#horseanimal","",131,"Horse_thread0000",130,0.48355637255130607,-1.3463178352399667,0,false,"#FFFFFF"],[1,31.294468387146537,29.44796276970405,0,".horse#horseanimal","",132,"Horse_thread0000",81,0.48355637255130607,-1.3463178352399667,0,false,"#FFFFFF"],[1,2.405046935645313,-24.269955595464527,0,".horse#horseanimal","",133,"Horse_Chair0000",72,5.173983554750378,2.5110188462396446,0,false,"#FFFFFF"],[2,77.26737243116452,90.71621801434134,0,".horse#horseanimal","leg_front_left_joint",134,3,9,0,false,false,1,10,true,0,-160,0,0,0,0],[2,49.22347132645105,150.63832386648926,0,".horse#horseanimal","heel_front_left_joint",135,1,3,0,false,false,1,10,true,40,-40,0,0,0,0],[1,31.85322473666605,155.67602950607306,0,".horse#horseanimal","",136,"Horse_Feet0000",125,0.30173206521762175,0.6936329709148767,0,false,"#FFFFFF"],[2,58.163960231295945,91.54694518897946,0,".horse#horseanimal","leg_front_right_joint",137,126,127,0,false,false,1,10,true,0,-160,0,0,0,0],[2,80.16434380484952,-17.479325413423965,0,".horse#horseanimal","neck_joint",138,2,8,0,false,false,1,10,true,50,-20,0,0,0,0],[2,106.40138439277692,-98.11023063485936,0,".horse#horseanimal","head_joint",139,8,5,0,false,false,1,10,true,30,-60,0,0,0,0],[2,32.09231659150051,149.31963931363316,0,".horse#horseanimal","heel_front_right_joint",140,125,126,0,false,false,1,10,true,40,-40,0,0,0,0],[2,132.83454769347077,-112.52600199828058,0,".horse#horseanimal","eye_joint",141,4,5,0,false,false,1,10,true,0,0,0,0,0,0],[2,81.05314527657379,23.59629720955965,0,".horse#horseanimal","thigh_front_left_joint",142,9,2,0,false,false,1,10,true,80,-80,0,0,0,0],[2,-62.874225317189655,18.420244233282467,0,".horse#horseanimal","thigh_back_right_joint",143,115,2,0,false,false,1,10,true,80,-80,0,0,0,0],[2,-40.30125562713084,20.071924942311107,0,".horse#horseanimal","thigh_back_left_joint",144,6,2,0,false,false,1,10,true,80,-80,0,0,0,0],[2,61.552388096307226,23.92584659671155,0,".horse#horseanimal","thigh_front_right_joint",145,127,2,0,false,false,1,10,true,80,-80,0,0,0,0],[2,-96.37654294066795,-4.207066051005494,0,".horse#horseanimal","",146,7,2,0,false,false,1,10,true,0,-80,0,0,0,0],[2,9.969973946843197,-17.98774897470433,0,".horse#horseanimal","saddle_joint",147,72,2,0,false,false,1,10,true,5,-5,0,0,0,0],[2,31.445181316595452,8.495994876728155,0,".horse#horseanimal","",148,81,72,0,false,false,1,10,false,0,0,0,0,0,0],[2,31.445181316595452,44.70404234381405,0,".horse#horseanimal","",149,130,81,0,false,false,1,10,false,0,0,0,0,0,0],[2,126.30621674538008,26.833676988284275,0,".horse#horseanimal","",150,93,92,0,false,false,1,10,false,0,0,0,0,0,0],[2,100.89252273279422,23.81258311494628,0,".horse#horseanimal","",151,94,93,0,false,false,1,10,false,0,0,0,0,0,0],[2,83.16951507504746,6.533140108491509,0,".horse#horseanimal","",152,95,94,0,false,false,1,10,false,0,0,0,0,0,0],[2,57.67454181747722,-38.901515038657564,0,".horse#horseanimal","",153,97,96,0,false,false,1,10,false,0,0,0,0,0,0],[2,173.44479692821164,-76.7459536971827,0,".horse#horseanimal","",154,40,5,0,false,false,1,10,false,0,0,0,0,0,0],[2,165.20892118672174,-77.18678944609545,0,".horse#horseanimal","",155,36,5,0,false,false,1,10,false,0,0,0,0,0,0],[2,40.579366534440126,2.026043990927853,0,".horse#horseanimal","",156,11,72,0,false,false,1,10,false,0,0,0,0,0,0],[0,0.24153713581492642,-1.3272153499526933,-0.2617993877991494,".character#characte , .fleshr","belly",157,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,7,14.181497764354457,"",1],[0,0.4348745413494831,-5.676105488534382,-0.2617993877991494,".character#character , .flesh","head",158,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,7,30.393075689479595,"",1],[0,0.3626490660383438,-3.1372039568182863,0.08726646259971638,".character#character , .flesh","body",159,"#999999","#000",0,false,true,[{"x":-0.5373137876370677,"y":1.2023497051222813},{"x":-0.4316127146592841,"y":-1.3697097373371037},{"x":-0.1497431867185277,"y":-1.82774772024083},{"x":0.1321263412222251,"y":-1.7925140292482356},{"x":0.5549306331333597,"y":-1.1230739003889436},{"x":0.5549306331333597,"y":1.308050778100065},{"x":0.09689265022963056,"y":1.801322451996385},{"x":-0.2202105687037168,"y":1.801322451996385}],1,7,null,"",1],[1,8.562579576754601,-48.463593240996396,-0.0617993877991494,"","",160,"Normal_Belly0000",157,8.746770037203438,1.1579140652818587,-0.2,false,"#FFFFFF"],[2,15.858387218391528,-39.73924006073465,-0.2617993877991494,".character#character","thigh_left_joint",161,13,157,0,false,false,1,10,true,142,-16,0,0,0,0],[1,12.009743051276502,-98.12879511300896,0.08726646259971638,"","",162,"Normal_Core0000",159,4.16882293351236,1.3835014335302833,0,true,"#FFFFFF"],[2,17.363888177040526,-124.62306921558582,-0.2617993877991494,".character#character","shoulder_left_joint",163,26,159,0,false,false,1,10,true,180,-19,0,0,0,0],[1,14.541075150109469,-172.87230159663383,-0.2617993877991494,"","",164,"Normal_Head_Idle0000",158,2.989677819250855,0.785398163397623,0,true,"#FFFFFF"],[2,16.962374807804526,-142.45262475142204,-0.2617993877991494,".character#character","head_joint",165,158,159,0,false,false,1,10,true,58,-64,0,0,0,0],[0,0.6373765860318875,-0.1638516774331873,-0.24434609527920606,".character#character , .flesh","thigh_right",166,"#999999","#000",0,false,true,[{"x":-0.20241022695050503,"y":-1.031328299223996},{"x":0.1959845054600109,"y":-1.0441797422049808},{"x":0.17028161949803788,"y":1.0377540207144893},{"x":-0.16385589800755085,"y":1.0377540207144893}],1,7,null,"",1],[0,0.8643950298641626,1.7891114981046732,0.12217304763960307,".character#character , .flesh","leg_right",167,"#999999","#000",0,false,true,[{"x":-0.16064303726230378,"y":-0.9124524516498909},{"x":0.16064303726230378,"y":-0.9253038946308756},{"x":0.08353437937639896,"y":0.9124524516498909},{"x":-0.08353437937639896,"y":0.9253038946308738}],1,7,null,"",1],[0,0.5930256706725493,-5.8173979867991426,-0.2617993877991494,".character#character","eye_left",168,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,7,7.534037070968986,"",1],[1,18.904837677027245,-4.563571180860302,-0.24434609527920606,"","",169,"Normal_Thigh0000",166,0.4132120599733628,-2.3665034033387577,0,true,"#FFFFFF"],[1,25.7345369307514,53.64911783456653,0.12217304763960307,"","",170,"Normal_Leg0000",167,0.19879575861250487,-3.1415926535889356,0,true,"#FFFFFF"],[1,17.816234595172876,-175.08251352188367,-0.2617993877991494,"","",171,"Normal_Eye0000",168,0.5611519909321366,1.2636024235635333,0,null,"#FFFFFF"],[2,26.421274620446713,24.650805912141493,-0.2617993877991494,".character#character","leg_right_joint",172,167,166,0,false,false,1,10,true,0,-149,0,0,0,0],[0,0.882097710726292,2.9639531651470366,0.19198621771937624,".character#character , .flesh","feet_right",173,"#999999","#000",0,false,true,[{"x":-0.3532003169100655,"y":-0.2334193398709985},{"x":0.3593429311171974,"y":0},{"x":0.3593429311171974,"y":0.12285228414263472},{"x":-0.3654855453243293,"y":0.11056705572837089}],1,7,null,"",1],[1,27.25288988558743,87.62577677450922,0.19198621771937624,"","",174,"Normal_Feet0000",173,1.515062169946712,1.2142877670861258,0,true,"#FFFFFF"],[1,31.458730674401416,90.32010851690859,0.2617993877991494,".horse#horseanimal","",175,"Horse_Pedal0000",118,2.4530675199029677,0.18487329857494245,0,false,"#FFFFFF"],[2,22.0995938224523,80.90436936257396,-0.2617993877991494,".character#character","feet_right_joint",176,173,167,0,false,false,1,10,true,0,0,0,0,0,0],[0,0.5031031922526416,-3.206014363231013,-0.08726646259971674,".character#character , .flesh","shoulder_right",177,"#999999","#000",0,false,true,[{"x":-0.18491373990083915,"y":-0.8588215919838902},{"x":0.19313212834087423,"y":-0.8423848151038147},{"x":0.11094824394050207,"y":0.8506032035438524},{"x":-0.11916663238053715,"y":0.8506032035438524}],1,7,null,"",1],[0,1.2309157971176352,-2.3060724963277393,-1.3962634015954631,".character#character , .flesh","arm_right",178,"#999999","#000",0,false,true,[{"x":-0.13560340926061798,"y":-0.6862354347431072},{"x":0.14382179770064596,"y":-0.7026722116231809},{"x":0.12738502082057224,"y":0.6944538231831459},{"x":-0.13560340926061798,"y":0.6944538231831459}],1,7,null,"",1],[0,1.2567524915837642,-5.984990068952187,-0.2617993877991494,".character#character","eye_right",179,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,7,7.534037070968986,"",1],[1,37.728039222509324,-180.110275986475,-0.2617993877991494,"","",180,"Normal_Eye0000",179,0.5611519909321366,1.2636024235635333,0,null,"#FFFFFF"],[2,37.78281192654886,-179.094873530053,-0.2617993877991494,".character#character","eye_right_joint",181,179,158,0,false,false,1,10,true,0,0,0,0,0,0],[1,15.664655927779897,-96.13842376065094,-0.08726646259971674,"","",182,"Normal_Shoulder0000",177,0.5731017503262358,-0.16063012257496162,0,true,"#FFFFFF"],[1,37.18828892228468,-69.32551076191332,-1.3962634015954631,"","",183,"Normal_Arm0000",178,0.29760652045521085,-0.8937510689744023,0,true,"#FFFFFF"],[2,16.872803288678842,-76.08573352769727,-0.2617993877991494,".character#character","arm_right_joint",184,178,177,0,false,false,1,10,true,152,0,0,0,0,0],[0,2.0680419330438684,-1.9935403628007045,-1.4311699866353498,".character#character , .flesh","hand_right",185,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,7,7.512582183874799,"",1],[1,61.38988996697152,-58.130862423974925,-1.4311699866353498,"","",186,"Normal_Hand0000",185,1.7975185021906417,2.9104087855451417,0,true,"#FFFFFF"],[2,55.923931903989214,-64.86071926384014,0.31415926535897937,".character#character","hand_right_joint",187,185,178,0,false,false,1,10,true,60,-60,0,0,0,0],[2,13.240942165754404,-118.7409292018908,-0.2617993877991494,".character#character","shoulder_right_joint",188,177,159,0,false,false,1,10,true,180,-19,0,0,0,0],[2,17.53680586365938,-174.69743682391515,-0.2617993877991494,".character#character","eye_left_joint",189,168,158,0,false,false,1,10,true,0,0,0,0,0,0],[2,7.628158309854597,-45.876061958092706,-0.2617993877991494,".character#character","core_joint",190,159,157,0,false,false,1,10,true,10,-10,0,0,0,0],[2,12.040270515120028,-34.325597148788475,-0.2617993877991494,".character#character","thigh_right_joint",191,166,157,0,false,false,1,10,true,142,-16,0,0,0,0],[2,30.865852557122217,82.36041170958342,0,".horse#horseanimal","",192,118,130,0,false,false,1,10,false,0,0,0,0,0,0],[0,-2.5058419106831553,5.256636051284038,0,".horse#horseanimal","",193,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,2,13.770794186002169,"",1],[2,-65.2512196059632,157.89851087981066,0,".horse#horseanimal","back_right_spring",194,193,2,1,false,true,500,-10,true,0,0,0,0,80,0],[0,-2.511895722305997,5.265587660130369,0,".horse#horseanimal","back_right_feetwheel",195,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,2,39.801308222702666,"",1],[2,-75.24124401123314,157.90492984999906,0,".horse#horseanimal","back_right_engine",196,195,193,0,false,true,5000,10,false,0,0,0,0,0,0],[2,-106.58092573151606,155.68125075021885,0,".horse#horseanimal","back_right_pedal_joint",197,195,121,2,false,false,1,10,false,0,0,1,8,0,0],[0,-1.8716006175275728,5.265862467641182,0,".horse#horseanimal","back_left_feetwheel",198,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,2,39.801308222702666,"",1],[0,-1.871610319424814,5.270053886556902,0,".horse#horseanimal","",199,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,2,13.770794186002169,"",1],[2,-56.08890648947469,158.0280544215019,0,".horse#horseanimal","back_left_spring",200,199,2,1,false,true,500,-10,true,0,0,0,0,80,0],[2,-56.086171872731974,158.0334116192779,0,".horse#horseanimal","back_left_engine",201,198,199,0,false,true,5000,10,false,0,0,0,0,0,0],[0,2.04220462069275,5.249582746592517,0,".horse#horseanimal","front_right_feetwheel",202,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,2,39.801308222702666,"",1],[0,2.048485650478454,5.248447514128096,0,".horse#horseanimal","",203,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,2,13.770794186002169,"",1],[2,61.516707224365035,157.38522044641365,0,".horse#horseanimal","front_right_engine",204,202,203,0,false,true,5000,10,false,0,0,0,0,0,0],[0,2.660550257099842,5.2417232468129145,0,".horse#horseanimal","front_left_feetwheel",205,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,2,39.801308222702666,"",1],[0,2.660540555202601,5.240588014348494,0,".horse#horseanimal","",206,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,2,13.770794186002169,"",1],[2,79.87835436608907,157.14943545302583,0,".horse#horseanimal","front_left_engine",207,205,206,0,false,true,5000,10,false,0,0,0,0,0,0],[2,-86.41374132260123,155.9313694197882,0,".horse#horseanimal","back_left_pedal_joint",208,38,198,2,false,false,1,10,false,0,0,1,8,0,0],[2,61.6264066971589,157.41176546246368,0,".horse#horseanimal","front_right_spring",209,203,2,1,false,true,500,-10,true,0,0,0,0,80,0],[2,79.99955358942861,157.21072492039877,0,".horse#horseanimal","front_left_spring",210,206,2,1,false,true,500,-10,true,0,0,0,0,80,0],[2,30.718465132534753,156.3045635966967,0,".horse#horseanimal","front_right_pedal_joint",211,125,202,2,false,false,1,10,false,0,0,1,8,0,0],[2,48.65706674380711,156.24228625750777,0,".horse#horseanimal","front_left_pedal_joint",212,1,205,2,false,false,1,10,false,0,0,1,8,0,0],[2,66.35344999022183,-62.630922494216,0,".horse#horseanimal","front_left_steer_joint",213,48,31,0,false,false,1,10,false,0,0,0,0,0,0],[2,62.97374806480273,-62.22032543870796,0,".horse#horseanimal","front_right_steer_joint",214,97,185,0,false,false,1,10,false,0,0,0,0,0,0],[2,6.680011256385796,-38.81629327474931,0,".horse#horseanimal","sit_joint",215,72,157,2,false,false,1,10,false,0,0,1,8,0,0],[2,26.551911090435357,90.11031104172332,0,".horse#horseanimal","pedal_right_joint",216,173,118,0,false,false,1,10,false,0,0,0,0,0,0],[2,37.020369153647906,85.72031249908582,0,".horse#horseanimal","pedal_left_joint",217,16,10,0,false,false,1,10,false,0,0,0,0,0,0],[2,-40.77573640609927,-87.63838439207296,0,".horse#horseanimal","backfix_joint",218,2,159,2,false,false,1,10,false,0,0,1,4,0,0],[2,-12.258398874797933,-134.75172214594744,0,".horse#horseanimal","neckfix_joint",219,159,158,2,false,false,1,10,false,0,0,1,2,0,0],[2,56.17553499894403,-105.35404632694573,0,".horse#horseanimal","frontbackfix_joint",220,8,159,0,false,false,1,10,false,0,0,0,0,0,0],[2,-106.1760526551368,29.731304312316368,0,".horse#horseanimal","",221,37,7,3,false,false,1,10,false,0,0,0,0,0,0],[0,-3.256115486664213,4.416666666,0,".horse#horseanimal","wheel_back",222,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,7,36.890652873220716,"",1],[0,2.8185980604519716,4.416666666,0,".horse#horseanimal","wheel_front",223,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,7,36.890652873220716,"",1],[0,-0.1501934188604397,1.9965283810793784,0,".horse#horseanimal","damper",224,"#999999","#000",0,false,true,[{"x":2.867076607538987,"y":-0.35783236550178366},{"x":2.867076607538987,"y":0.43735066894662467},{"x":-2.8759119745884085,"y":0.36666773255121043},{"x":-2.8582412404895567,"y":-0.44618603599605144}],1,2,null,"",1],[2,-79.2409653900846,58.58258878884623,0,".horse#horseanimal","damper1_joint",225,224,2,2,false,false,1,10,false,0,0,0,10,0,0],[2,71.96429924697543,62.41393104146792,0,".horse#horseanimal","damper2_joint",226,224,2,2,false,false,1,10,false,0,0,0,10,0,0],[2,-97.93020095426817,132.85588087557312,0,".horse#horseanimal","engine1",227,224,222,0,false,false,1,10,false,0,0,0,0,0,0],[2,84.06979904573188,132.85588087557312,0,".horse#horseanimal","engine2",228,223,224,0,false,false,1,10,false,0,0,0,0,0,0]]}`,
        class: vehicle_horse,
        library: LIBRARY_ADMIN,
    },
    vehicle_character: {
        json: `{"objects":[[0,0.4934616139871987,-0.15960028547845545,-0.05235987755983046,".character#character , .flesh","thigh_left",0,"#999999","#000",0,false,true,[{"x":-0.20241022695050503,"y":-1.031328299223996},{"x":0.1959845054600109,"y":-1.0441797422049808},{"x":0.17028161949803788,"y":1.0377540207144893},{"x":-0.16385589800755085,"y":1.0377540207144893}],1,7,null,"",1],[0,0.6757217330467975,1.839115804161336,-0.069813170079774,".character#character , .flesh","leg_left",1,"#999999","#000",0,false,true,[{"x":-0.16064303726230378,"y":-0.9124524516498909},{"x":0.16064303726230378,"y":-0.9253038946308756},{"x":0.08353437937639896,"y":0.9124524516498909},{"x":-0.08353437937639896,"y":0.9253038946308738}],1,7,null,"",1],[1,14.524204707288073,-4.4837987672351165,-0.05235987755983046,"","",2,"Normal_Thigh0000",0,0.4132120599733628,-2.3665034033387577,0,true,"#FFFFFF"],[0,0.8190982325210658,3.0039389976219306,0.15707963267948957,".character#character , .flesh","feet_right",3,"#999999","#000",0,false,true,[{"x":-0.3532003169100655,"y":-0.2334193398709985},{"x":0.3593429311171974,"y":0},{"x":0.3593429311171974,"y":0.12285228414263472},{"x":-0.3654855453243293,"y":0.11056705572837089}],1,7,null,"",1],[1,20.07334048926797,55.187341415956354,-0.069813170079774,"","",4,"Normal_Leg0000",1,0.19879575861250487,-3.1415926535889356,0,true,"#FFFFFF"],[2,17.0761804738651,26.488115238577613,-0.5410520681182422,".character#character","leg_left_joint",5,1,0,0,false,false,1,10,true,0,-149,0,0,0,0],[1,25.31730561421113,88.79857014236806,0.15707963267948957,"","",6,"Normal_Feet0000",3,1.515062169946712,1.2142877670861258,0,true,"#FFFFFF"],[2,20.37041479966178,82.4272867639828,-0.5410520681182422,".character#character","feet_left_joint",7,3,1,0,false,false,1,10,true,0,0,0,0,0,0],[0,0.6251309873233629,-3.3788747857317674,-0.06981317007977322,".character#character , .flesh","shoulder_left",8,"#999999","#000",0,false,true,[{"x":-0.18491373990083915,"y":-0.8588215919838902},{"x":0.19313212834087423,"y":-0.8423848151038147},{"x":0.11094824394050207,"y":0.8506032035438524},{"x":-0.11916663238053715,"y":0.8506032035438524}],1,7,null,"",1],[0,0.8906863200932135,-1.8721310176728156,-0.2967059728390353,".character#character , .flesh","arm_left",9,"#999999","#000",0,false,true,[{"x":-0.13560340926061798,"y":-0.6862354347431072},{"x":0.14382179770064596,"y":-0.7026722116231809},{"x":0.12738502082057224,"y":0.6944538231831459},{"x":-0.13560340926061798,"y":0.6944538231831459}],1,7,null,"",1],[1,19.32466960290511,-101.3142677333447,-0.06981317007977322,"","",10,"Normal_Shoulder0000",8,0.5731017503262358,-0.16063012257496162,0,true,"#FFFFFF"],[1,26.966710336135474,-55.99661577997369,-0.2967059728390353,"","",11,"Normal_Arm0000",9,0.29760652045521085,-0.8937510689744023,0,true,"#FFFFFF"],[2,21.55365851603832,-77.72220225267495,-0.2617993877991494,".character#character","arm_left_joint",12,9,8,0,false,false,1,10,true,152,0,0,0,0,0],[0,1.0111779151058815,-1.00775995364162,-0.13962634015954592,".character#character , .flesh","hand_left",13,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,7,7.512582183874799,"",1],[1,28.545347791290713,-30.39714512141079,-0.13962634015954592,"","",14,"Normal_Hand0000",13,1.7975185021906417,2.9104087855451417,0,true,"#FFFFFF"],[2,33.38045904037543,-38.234882886033105,1.3613568165555772,".character#character","hand_left_joint",15,13,9,0,false,false,1,10,true,60,-60,0,0,0,0],[0,0.24153713581492642,-1.3272153499526933,-0.2617993877991494,".character#character , .flesh","belly",16,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,7,14.181497764354457,"",1],[0,0.4348745413494831,-5.676105488534382,-0.2617993877991494,".character#character , .flesh","head",17,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,7,30.393075689479595,"",1],[0,0.3626490660383448,-3.1372039568182863,0.08726646259971638,".character#character , .flesh","body",18,"#999999","#000",0,false,true,[{"x":-0.5373137876370677,"y":1.2023497051222813},{"x":-0.4316127146592841,"y":-1.3697097373371037},{"x":-0.1497431867185277,"y":-1.82774772024083},{"x":0.1321263412222251,"y":-1.7925140292482356},{"x":0.5549306331333597,"y":-1.1230739003889436},{"x":0.5549306331333597,"y":1.308050778100065},{"x":0.09689265022963056,"y":1.801322451996385},{"x":-0.2202105687037168,"y":1.801322451996385}],1,7,null,"",1],[1,8.562579576754601,-48.463593240996396,-0.0617993877991494,"","",19,"Normal_Belly0000",16,8.746770037203438,1.1579140652818587,-0.2,false,"#FFFFFF"],[2,14.945286590396616,-32.662710193774046,-0.2617993877991494,".character#character","thigh_left_joint",20,0,16,0,false,false,1,10,true,142,-16,0,0,0,0],[1,12.009743051276532,-98.12879511300896,0.08726646259971638,"","",21,"Normal_Core0000",18,4.16882293351236,1.3835014335302833,0,true,"#FFFFFF"],[2,17.363888177040526,-124.62306921558582,-0.2617993877991494,".character#character","shoulder_left_joint",22,8,18,0,false,false,1,10,true,180,-19,0,0,0,0],[1,14.541075150109469,-172.87230159663383,-0.2617993877991494,"","",23,"Normal_Head_Idle0000",17,2.989677819250855,0.785398163397623,0,true,"#FFFFFF"],[2,16.962374807804526,-142.45262475142204,-0.2617993877991494,".character#character","head_joint",24,17,18,0,false,false,1,10,true,58,-64,0,0,0,0],[0,0.2949638505337931,-0.10297830223352623,6.245004513516506e-17,".character#character , .flesh","thigh_right",25,"#999999","#000",0,false,true,[{"x":-0.20241022695050503,"y":-1.031328299223996},{"x":0.1959845054600109,"y":-1.0441797422049808},{"x":0.17028161949803788,"y":1.0377540207144893},{"x":-0.16385589800755085,"y":1.0377540207144893}],1,7,null,"",1],[0,0.3628359516074833,1.854161669782273,-0.052359877559829876,".character#character , .flesh","leg_right",26,"#999999","#000",0,false,true,[{"x":-0.16064303726230378,"y":-0.9124524516498909},{"x":0.16064303726230378,"y":-0.9253038946308756},{"x":0.08353437937639896,"y":0.9124524516498909},{"x":-0.08353437937639896,"y":0.9253038946308738}],1,7,null,"",1],[0,0.5930256706725493,-5.8173979867991426,-0.2617993877991494,".character#character","eye_left",27,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,7,7.534037070968986,"",1],[1,8.553733935044082,-2.800191599933515,6.245004513516506e-17,"","",28,"Normal_Thigh0000",25,0.4132120599733628,-2.3665034033387577,0,true,"#FFFFFF"],[1,10.68655523229012,55.63525425959239,-0.052359877559829876,"","",29,"Normal_Leg0000",26,0.19879575861250487,-3.1415926535889356,0,true,"#FFFFFF"],[1,17.816234595172876,-175.08251352188367,-0.2617993877991494,"","",30,"Normal_Eye0000",27,0.5611519909321366,1.2636024235635333,0,null,"#FFFFFF"],[2,9.300637845542035,28.531483581119883,-0.2617993877991494,".character#character","leg_right_joint",31,26,25,0,false,false,1,10,true,0,-149,0,0,0,0],[0,0.5842788034986947,3.0080808137758512,0.017453292519943292,".character#character , .flesh","feet_right",32,"#999999","#000",0,false,true,[{"x":-0.3532003169100655,"y":-0.2334193398709985},{"x":0.3593429311171974,"y":0},{"x":0.3593429311171974,"y":0.12285228414263472},{"x":-0.3654855453243293,"y":0.11056705572837089}],1,7,null,"",1],[1,18.081825902153525,88.83207218143703,0.017453292519943292,"","",33,"Normal_Feet0000",32,1.515062169946712,1.2142877670861258,0,true,"#FFFFFF"],[2,11.839659837171208,83.10763852135102,-0.43633231299858233,".character#character","feet_right_joint",34,32,26,0,false,false,1,10,true,0,0,0,0,0,0],[0,0.5031031922526416,-3.206014363231013,-0.08726646259971674,".character#character , .flesh","shoulder_right",35,"#999999","#000",0,false,true,[{"x":-0.18491373990083915,"y":-0.8588215919838902},{"x":0.19313212834087423,"y":-0.8423848151038147},{"x":0.11094824394050207,"y":0.8506032035438524},{"x":-0.11916663238053715,"y":0.8506032035438524}],1,7,null,"",1],[0,0.7175793255274137,-1.6966320424915955,-0.17453292519943234,".character#character , .flesh","arm_right",36,"#999999","#000",0,false,true,[{"x":-0.13560340926061798,"y":-0.6862354347431072},{"x":0.14382179770064596,"y":-0.7026722116231809},{"x":0.12738502082057224,"y":0.6944538231831459},{"x":-0.13560340926061798,"y":0.6944538231831459}],1,7,null,"",1],[0,1.2567524915837642,-5.984990068952187,-0.2617993877991494,".character#character","eye_right",37,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,7,7.534037070968986,"",1],[1,37.728039222509324,-180.110275986475,-0.2617993877991494,"","",38,"Normal_Eye0000",37,0.5611519909321366,1.2636024235635333,0,null,"#FFFFFF"],[2,37.78281192654886,-179.094873530053,-0.2617993877991494,".character#character","eye_right_joint",39,37,17,0,false,false,1,10,true,0,0,0,0,0,0],[1,15.664655927779897,-96.13842376065094,-0.08726646259971674,"","",40,"Normal_Shoulder0000",35,0.5731017503262358,-0.16063012257496162,0,true,"#FFFFFF"],[1,21.75127541378706,-50.702899091142896,-0.17453292519943234,"","",41,"Normal_Arm0000",36,0.29760652045521085,-0.8937510689744023,0,true,"#FFFFFF"],[2,17.68101702582442,-71.77526026292077,-0.2617993877991494,".character#character","arm_right_joint",42,36,35,0,false,false,1,10,true,152,0,0,0,0,0],[0,0.7102091868847376,-0.803098504791899,-0.20943951023931898,".character#character , .flesh","hand_right",43,"#999999","#000",0,false,true,[{"x":0,"y":0},{"x":0,"y":0}],1,7,7.512582183874799,"",1],[1,19.509182036347596,-24.132037949223978,-0.20943951023931898,"","",44,"Normal_Hand0000",43,1.7975185021906417,2.9104087855451417,0,true,"#FFFFFF"],[2,23.963711087601236,-31.570105007465678,1.5358897417550101,".character#character","hand_right_joint",45,43,36,0,false,false,1,10,true,60,-60,0,0,0,0],[2,13.240942165754404,-118.7409292018908,-0.2617993877991494,".character#character","shoulder_right_joint",46,35,18,0,false,false,1,10,true,180,-19,0,0,0,0],[2,17.53680586365938,-174.69743682391515,-0.2617993877991494,".character#character","eye_left_joint",47,27,17,0,false,false,1,10,true,0,0,0,0,0,0],[2,7.628158309854597,-45.876061958092706,-0.2617993877991494,".character#character","core_joint",48,18,16,0,false,false,1,10,true,10,-10,0,0,0,0],[2,8.387868003140365,-31.358020107804997,-0.2617993877991494,".character#character","thigh_right_joint",49,25,16,0,false,false,1,10,true,142,-16,0,0,0,0]]}`,
        class: vehicle_character,
        library: LIBRARY_ADMIN,
    },
    horseanimal: {
        class: horseanimal,
    },
    character: {
        class: character,
    },
    vain: {
        json: '{"objects":[[0,0.003154367820629632,-0.07136374712007679,0,"","part1",0,"#890808","#630606",1,false,true,[{"x":0.028477641735626946,"y":-0.09142821820385016},{"x":0.02248234873865229,"y":0.08843057170536373},{"x":-0.025479995237137842,"y":0.08843057170536373},{"x":-0.025479995237137842,"y":-0.08543292520687551}],10,7,null,""],[0,-0.048945224052909055,-0.21267429024827236,-0.7679448708775056,"","part2",1,"#890808","#6b0909",1,false,true,[{"x":0.028477641735626946,"y":-0.09142821820385016},{"x":0.02248234873865229,"y":0.08843057170536373},{"x":-0.025479995237137842,"y":0.08843057170536373},{"x":-0.025479995237137842,"y":-0.08543292520687551}],10,7,null,""],[0,-0.05108297945339905,-0.22011994128041493,2.4260076602721177,"","part3",2,"#890808","#600303",1,false,true,[{"x":0.028477641735626946,"y":-0.09142821820385016},{"x":0.02248234873865229,"y":0.08843057170536373},{"x":-0.025479995237137842,"y":0.08843057170536373},{"x":-0.025479995237137842,"y":-0.08543292520687551}],10,7,null,""],[0,0.003347876330606313,-0.06824396020197912,0,"","part4",3,"#890808","#660505",1,false,true,[{"x":0.028477641735626946,"y":-0.09142821820385016},{"x":0.02248234873865229,"y":0.08843057170536373},{"x":-0.025479995237137842,"y":0.08843057170536373},{"x":-0.025479995237137842,"y":-0.08543292520687551}],10,7,null,""],[2,0.2604863299759831,-4.6079468327877935,0,"","part1_joint",4,1,0,0,false,false,1,10,false,0,0,0,0,0,0],[2,-3.3082859975393926,-8.384121948799184,0,"","part2_joint",5,2,1,0,false,false,1,10,false,0,0,0,0,0,0],[2,0.2729742921443762,-4.3639657228591675,0,"","part3_joint",6,2,3,0,false,false,1,10,false,0,0,0,0,0,0]]}',
        class: vain,
    },
    jumppad: {
        json: '{"objects":[[0,-0.027441633202424764,-0.02527810336311545,0,"","pad",0,["#707070","#999999"],["#423f3f","#000"],[1,1],false,true,[[{"x":-3.942850401425633,"y":0.4035988599884508},{"x":-3.942850401425633,"y":-0.4035988599884508},{"x":3.942850401425633,"y":-0.4035988599884508},{"x":3.942850401425633,"y":0.4035988599884508}],[{"x":-5.146081262043283,"y":-0.37157711946319416},{"x":-5.146081262043283,"y":-0.5382437861298603},{"x":5.353918737956719,"y":-0.5382437861298603},{"x":5.353918737956719,"y":-0.37157711946319416}]],1,0,[null,null],""],[0,0.08887776809299597,0.04269412663622327,0,"","platform",1,"#999999","#000",1,false,true,[{"x":-5.2,"y":0.3999999999999999},{"x":-5.2,"y":-0.3999999999999999},{"x":5.2,"y":-0.3999999999999999},{"x":5.2,"y":0.3999999999999999}],10,0,null,""],[1,3.1663330427897654,2.2808237990868117,0,"","",2,"Jumping0000",1,1.1180339887499458,-1.107148717794227,0,false,"#FFFFFF"],[1,2.294313142628518,-14.905656684789344,0,"","",3,"Jumping_Pad0000",0,14.486741363389783,1.353898614790059,0,false,"#FFFFFF"],[2,3.0763512317790314,3.9213369271330984,-0.01745329251994333,"","pad_engine",4,0,1,1,false,false,1,10,true,0,0,0,0,23,0,0]]}',
        class: jumppad,
        library: LIBRARY_MOVEMENT
    }
}
export const getLibraryKeys = function() {
    if(prefabLibrary.libraryKeys.length>0) return prefabLibrary.libraryKeys;
    for (let key in prefabLibrary) {
        if (prefabLibrary.hasOwnProperty(key)) {
            if (prefabLibrary[key].library) {
                if (!prefabLibrary.libraryDictionary[prefabLibrary[key].library]) prefabLibrary.libraryDictionary[prefabLibrary[key].library] = [];
                prefabLibrary.libraryDictionary[prefabLibrary[key].library].push(key);
            }
        }
    }
    prefabLibrary.libraryKeys = Object.keys(prefabLibrary.libraryDictionary);
    return prefabLibrary.libraryKeys;
}


const timerReady = function (timer, target, singleCallback) {
    return singleCallback ? (timer < target && timer + game.editor.deltaTime >= target) : timer > target;
}