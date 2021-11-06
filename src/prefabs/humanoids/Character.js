import * as PrefabManager from '../PrefabManager';
import {
    game
} from "../../Game";
import {
    Settings
} from '../../Settings';
import {globalEvents, GLOBAL_EVENTS} from '../../utils/EventDispatcher'
import {Humanoid} from './Humanoid'
import * as MobileController from '../../utils/MobileController'
import { b2CloneVec2, b2MulVec2 } from '../../../libs/debugdraw';
import { crawlJointsUtility } from '../level/Finish';

const { getPointer, NULL } = Box2D;

const vec1 = new Box2D.b2Vec2();
const vec2 = new Box2D.b2Vec2();

export class Character extends Humanoid {
    constructor(target) {
        super(target);
        this.hat = undefined;
        this.attachedToVehicle = true;
        this.vehicleJoints = [];
        this.vehicleParts = [];
        this.isCharacter = true;
        this.grabJointLeft = null;
        this.grabBodyLeft = null;
        this.grabJointRight = null;
        this.grabBodyRight = null;
        this.vehicle = null;
        this.teleportTicks = 0;

    }

    postConstructor(){
        super.postConstructor();
        this.setSkin(game.selectedCharacter);
    }

    init() {
        super.init();

        [this.lookupObject.body, this.lookupObject.head].forEach(body => {
            for (let fixture = body.GetFixtureList(); Box2D.getPointer(fixture) !== Box2D.getPointer(Box2D.NULL); fixture = fixture.GetNext()) {
                fixture.SetDensity(fixture.GetDensity()*0.5);
            }
        })
        // make eyes not interactable
    }

    flip(noVehicleOverride){
        if(this.attachedToVehicle && !noVehicleOverride){
            game.vehicle.flip();
            this.flipped = !this.flipped;
        }
        else super.flip();
        if(this.hat) this.hat.flip();
    }

    setHat(hatClass){
        if(this.alive === false) return;
        if(this.hat) this.hat.detach();
        this.hat = new hatClass(this, this.lookupObject.head, this.lookupObject.body);
        if(this.flipped) this.hat.flip();

        if(this.hat.isRopeHat || this.hat.isTriggerHat){
            MobileController.showActionButton();
        }else{
            MobileController.hideActionButton();
        }

        this.setExpression(Humanoid.EXPRESSION_SPECIAL);
    }

    setTeleported(){
        this.teleportTicks = 20;
        this.processBodySeparation(true);
    }

    grab(){
        const armLength = 3.43;
        if(this.grabJointLeft || this.grabJointRight || !this.alive){

            if(this.grabJointLeft){
                [this.lookupObject.arm_left, this.lookupObject.hand_left, this.lookupObject.shoulder_left].forEach(obj => {
                    if(obj && obj.snapped) this.release(true, false);
                })
            }

            if(this.grabJointRight){
                [this.lookupObject.arm_right, this.lookupObject.hand_right, this.lookupObject.shoulder_right].forEach(obj => {
                    if(obj && obj.snapped) this.release(false, true);
                })
            }

            return;
        }

        [this.lookupObject.hand_left, this.lookupObject.hand_right].forEach(hand => {
            if(hand && !hand.snapped){

                const radius = 0.4;
                const aabb = new Box2D.b2AABB();

                aabb.get_lowerBound().Set(hand.GetPosition().x-radius, hand.GetPosition().y-radius);
                aabb.get_upperBound().Set(hand.GetPosition().x+radius, hand.GetPosition().y+radius);
                const bodiesFound = [];
                const getBodyCB = new Box2D.JSQueryCallback();
                getBodyCB.ReportFixture = function (fixturePtr) {
                    const fixture = Box2D.wrapPointer( fixturePtr, Box2D.b2Fixture );
                    const body = fixture.GetBody();
                    if(!body.isPhysicsCamera && !fixture.IsSensor() && (!body.mainCharacter || body.snapped)){
                        bodiesFound.push(body);
                    }
                    return true;
                }

                game.world.QueryAABB(getBodyCB, aabb);

                const directions = 12;

                const checkSlize = (360 / directions) * game.editor.DEG2RAD;
                const totalCircleRad = 360 * game.editor.DEG2RAD;
                const rayStart = hand.GetPosition();

                let targetBody = null;

                for (let i = 0; i < totalCircleRad; i += checkSlize) {
                    const rayEnd = vec1;
                    rayEnd.set_x(rayStart.get_x() + Math.cos(i) * 0.6 );
                    rayEnd.set_y(rayStart.get_y() + Math.sin(i) * 0.6 );

                    let callback = Object.assign(new Box2D.JSRayCastCallback(), {
                        ReportFixture: function (fixture_p, point_p, normal_p, fraction) {

                            const fixture = Box2D.wrapPointer(fixture_p, Box2D.b2Fixture);
                            const point = Box2D.wrapPointer(point_p, Box2D.b2Vec2);
                            const normal = Box2D.wrapPointer(normal_p, Box2D.b2Vec2);

                            if(!bodiesFound.includes(fixture.GetBody())){
                                return -1;
                            }
                            if (fixture.IsSensor()) return -1;
                            this.m_hit = true;
                            this.m_point = point;
                            this.m_normal = normal;
                            this.m_fixture = fixture;
                            return fraction;
                        },
                        m_hit: false
                    });
                    game.world.RayCast(callback, rayStart, rayEnd);
                    if(callback.m_hit){
                        targetBody = callback.m_fixture.GetBody();
                        break;
                    }
                }

                if(targetBody){

                    let ropeJointDef = new Box2D.b2RevoluteJointDef();

                    ropeJointDef.Initialize(hand, targetBody, hand.GetPosition());

                    ropeJointDef.set_lowerAngle(0);
                    ropeJointDef.set_upperAngle(0);
                    ropeJointDef.set_enableLimit(true);

                    const handJoint = Box2D.castObject(game.editor.CreateJoint(ropeJointDef), Box2D.b2RevoluteJoint);
                    Box2D.destroy(ropeJointDef);

                    if(targetBody.oldDensities === undefined){

                        const targetBodies = [targetBody, ...crawlJointsUtility(targetBody, body => !body.mainCharacter)];

                        targetBodies.forEach(body=>{
                            const densityReducer = 0.05;
                            if(body.oldDensities === undefined){
                                body.oldDensities = [];
                                for (let fixture = body.GetFixtureList(); Box2D.getPointer(fixture) !== Box2D.getPointer(Box2D.NULL); fixture = fixture.GetNext()) {
                                    const oldDensity = fixture.GetDensity();
                                    body.oldDensities.push(oldDensity);
                                    fixture.SetDensity(oldDensity*densityReducer);
                                }
                                body.ResetMassData();
                            }
                        });
                    }

                    // body joint
                    ropeJointDef = new Box2D.b2DistanceJointDef();

                    ropeJointDef.Initialize(this.lookupObject.body, targetBody, this.lookupObject.body.GetPosition(), hand.GetPosition());

                    let length = ropeJointDef.get_length();
                    ropeJointDef.set_minLength(0);
                    ropeJointDef.set_maxLength(armLength);

                    ropeJointDef.set_stiffness(0);
                    ropeJointDef.set_damping(0);
                    ropeJointDef.set_collideConnected(true);

                    const bodyJoint = Box2D.castObject(game.editor.CreateJoint(ropeJointDef), Box2D.b2DistanceJoint);
                    handJoint.linkedJoints = [bodyJoint];
                    Box2D.destroy(ropeJointDef);

                    // head joint
                    ropeJointDef = new Box2D.b2DistanceJointDef();

                    ropeJointDef.Initialize(this.lookupObject.head, targetBody, this.lookupObject.head.GetPosition(), hand.GetPosition());

                    length = ropeJointDef.get_length();
                    ropeJointDef.set_minLength(0);
                    ropeJointDef.set_maxLength(armLength*2);

                    ropeJointDef.set_stiffness(0);
                    ropeJointDef.set_damping(0);
                    ropeJointDef.set_collideConnected(false);

                    const headJoint = Box2D.castObject(game.editor.CreateJoint(ropeJointDef), Box2D.b2DistanceJoint);
                    handJoint.linkedJoints.push(headJoint);
                    Box2D.destroy(ropeJointDef);

                    let connectedArmParts = null;

                    if(hand === this.lookupObject.hand_left){
                        connectedArmParts = [this.lookupObject.arm_left, this.lookupObject.shoulder_left];
                        this.grabJointLeft = handJoint;
                        this.grabBodyLeft = targetBody;
                    }else{
                        connectedArmParts = [this.lookupObject.arm_right, this.lookupObject.shoulder_right];
                        this.grabJointRight = handJoint;
                        this.grabBodyRight = targetBody;
                    }

                    connectedArmParts.forEach(part => {
                        if(part && !part.destroyed){
                            ropeJointDef = new Box2D.b2DistanceJointDef();
                            ropeJointDef.Initialize(part, targetBody, part.GetPosition(), hand.GetPosition());

                            length = ropeJointDef.get_length();
                            ropeJointDef.set_minLength(0);
                            ropeJointDef.set_maxLength(armLength);

                            ropeJointDef.set_stiffness(0);
                            ropeJointDef.set_damping(0);

                            const newJoint = Box2D.castObject(game.editor.CreateJoint(ropeJointDef), Box2D.b2DistanceJoint);
                            handJoint.linkedJoints.push(newJoint);
                            Box2D.destroy(ropeJointDef);
                        }
                    })
                }
            }
        })
    }

    release(left=true, right=true){

        this.releaseImmune = Date.now() + 200;

        const jointArr = [];
        if(left) jointArr.push(this.grabJointLeft);
        if(right) jointArr.push(this.grabJointRight);

        jointArr.forEach(joint => {
            if(joint && !joint.destroyed){
                game.editor.deleteObjects([joint]);
            }
        })

        if(left) this.grabJointLeft = null;
        if(right) this.grabJointRight = null;

        const bodyArr = [];
        if(left) bodyArr.push(this.grabBodyLeft);
        if(right) bodyArr.push(this.grabBodyRight);

        bodyArr.forEach(targetBody => {
            if(targetBody && targetBody.oldDensities !== undefined){

                const targetBodies = [targetBody, ...crawlJointsUtility(targetBody, body => !body.mainCharacter)];

                targetBodies.forEach(body=>{
                    if(body.oldDensities !== undefined){
                        let count = 0;
                        for (let fixture = body.GetFixtureList(); Box2D.getPointer(fixture) !== Box2D.getPointer(Box2D.NULL); fixture = fixture.GetNext()) {
                            const oldDensity = body.oldDensities[count];
                            fixture.SetDensity(oldDensity);
                            count++;
                        }
                        body.ResetMassData();
                        delete body.oldDensities;
                    }
                });

            }
        })

        if(left) this.grabBodyLeft = null;
        if(right) this.grabBodyRight = null;
    }

    update() {
        super.update();
        if(this.hat) this.hat.update();
        if(this.vehicleJoints.length>0){
            this.attachedToVehicle = true;
            for(let i = 0; i<this.vehicleJoints.length; i++){
                if(this.vehicleJoints[i].destroyed){
                    this.vehicleJoints.splice(i, 1);
                    i--;
                }
            }
            if(this.vehicleJoints.length === 0){
                this.attachedToVehicle = false;
            }
        }
    }
    die(){
        if(this.alive){
            this.detachFromVehicle();
            this.release();
            game.gameLose();
        }
        super.die();
    }
    positionBody(direction){
        if(this.hat && this.hat.blockControls) return;
        super.positionBody(direction);
    }

    lean(dir) {
        const velocity = Settings.characterLeanSpeed * dir;
        if(this.hat && this.hat.isRopeHat && this.hat.blockControls){

        }else{
            if(!this.attachedToVehicle){
                this.lookupObject['body'].SetAngularVelocity(velocity);
            }
        }
    }

    dealDamage(damage){
        globalEvents.dispatchEvent({type:GLOBAL_EVENTS.CHARACTER_DAMAGE, data:damage});
        super.dealDamage(damage);
    }

    addJoint(joint, bodyB){
        if(bodyB.isVehiclePart){
            this.vehicleJoints.push(joint);
            if(!bodyB.mySprite.data.prefabInstanceName && bodyB.GetType() != Box2D.b2_staticBody){
                // find all vehicle parts
                joint.jointCrawled = true;
                bodyB.jointCrawled = true;
                this.vehicleParts.push(bodyB);

                const crawlJoints = body => {
                    for (let jointEdge = body.GetJointList(); getPointer(jointEdge) !== getPointer(NULL); jointEdge = jointEdge.get_next()) {
                        const joint = game.editor.CastJoint(jointEdge.joint);
                        if(!joint.jointCrawled){
                            joint.jointCrawled = true;
                            this.vehicleJoints.push(joint);
                            const bodyA = joint.GetBodyA();
                            if(!this.lookupObject._bodies.includes(bodyA) && !bodyA.jointCrawled){
                                bodyA.jointCrawled = true;
                                bodyA.isVehiclePart = true;
                                this.vehicleParts.push(bodyA);
                                crawlJoints(bodyA);
                            }
                            const bodyB = joint.GetBodyB();
                            if(!this.lookupObject._bodies.includes(bodyB) && !bodyB.jointCrawled){
                                bodyB.jointCrawled = true;
                                bodyB.isVehiclePart = true;
                                this.vehicleParts.push(bodyB);
                                crawlJoints(bodyB);
                            }
                        }
                    }
                }

                crawlJoints(bodyB);

                this.vehicleParts.forEach(part => delete part.jointCrawled);
                this.vehicleJoints.forEach(part => delete part.jointCrawled);
                this.vehicleParts = [...new Set(this.vehicleParts)];
                this.vehicleJoints = [...new Set(this.vehicleJoints)];
            }
        }
    }
    doCollisionUpdate(update) {
        super.doCollisionUpdate(update);
        // Destroy connected joints
        if(!this.mainPrefabClass.destroyConnectedJoints[update.target]) return;
        this.mainPrefabClass.destroyConnectedJoints[update.target].forEach((targetJointName) => {
            if (targetJointName instanceof String || typeof(targetJointName) === 'string') {
                if (this.lookupObject[targetJointName]) {
                    game.editor.DestroyJoint(this.lookupObject[targetJointName]);
                    delete this.lookupObject[targetJointName];
                }
            } else if (!this.lookupObject[targetJointName.ifno]) {
                targetJointName.destroy.forEach((connectedJointName) => {
                    if (this.lookupObject[connectedJointName]) {
                        game.editor.DestroyJoint(this.lookupObject[connectedJointName]);
                        delete this.lookupObject[connectedJointName];
                    }
                });
            }
        });
    }
    checkLimbs(){
        if(this.attachedToVehicle){
            this.mainPrefabClass.limbsObserver.forEach(observe=>{
                if(!this.attachedToVehicle) return;
                if(Array.isArray(observe)){

                    let leftBroken = false;
                    let rightBroken = false;

                    observe.forEach((side, index)=> {
                        side.forEach(limb=>{
                            const targetObject = this.lookupObject[limb]
                            if(!targetObject || targetObject.snapped){
                                if(index === 0) leftBroken = true;
                                else rightBroken = true;
                            }
                        });
                    });
                    if(leftBroken && rightBroken){
                        this.detachFromVehicle();
                        return;
                    }
                }else{
                    const limb = observe;
                    const targetObject = this.lookupObject[limb]
                    if(!targetObject || targetObject.snapped){
                        this.detachFromVehicle();
                        return;
                    }
                }
            })
        }
    }

    detachFromVehicle(force) {
        if (!force) force = 0;
        if (!this.attachedToVehicle) return;
        this.ignoreJointDamage = true;

        const vehicleJoints = this.mainPrefabClass.destroyConnectedJoints['head'];

        MobileController.showCharacterControls();

        if(vehicleJoints){
            vehicleJoints.forEach((jointName) => {
                if (this.lookupObject[jointName]) {
                    game.editor.DestroyJoint(this.lookupObject[jointName]);
                    delete this.lookupObject[jointName];
                }
            });
        }

        if(this.vehicleJoints){
            this.vehicleJoints.forEach(joint =>{
                game.editor.DestroyJoint(joint);
                this.vehicleJoints = [];
            })
        }

        for (let i = 0; i < this.lookupObject._bodies.length; i++) {
            const body = this.lookupObject["body"];
            if(body){
                const bodyAngleVector = vec1;
                bodyAngleVector.Set(Math.cos(body.GetAngle()), Math.sin(body.GetAngle()));
                const dirForce = vec2;
                dirForce.Set(bodyAngleVector.y, -bodyAngleVector.x);
                b2MulVec2(dirForce, force)
                body.ApplyForce(dirForce, body.GetPosition(), true);
            }
        }


        if(game.vehicle){
            game.vehicle.eject();
        }

        this.attachedToVehicle = false;
        if(this.hat) this.hat.detachFromVehicle();

    }

    destroy(){
        this.destroyed = true;
        if(this.hat){
            this.hat.destroy();
        }
        super.destroy();
    }
}

PrefabManager.prefabLibrary.Character = {
    class: Character,
}
