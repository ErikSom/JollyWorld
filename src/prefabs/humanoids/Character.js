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
import { b2MulVec2 } from '../../../libs/debugdraw';

const { getPointer, NULL } = Box2D;

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

        if(this.hat.isRopeHat){
            MobileController.showActionButton();
        }else{
            MobileController.hideActionButton();
        }

        this.setExpression(Humanoid.EXPRESSION_SPECIAL);
    }

    grab(){
        const armLength = 3.43;
        if(this.grabJointLeft || this.grabJointRight) return;

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

                if(bodiesFound.length > 0){
                    const targetBody = bodiesFound.shift();

                    let ropeJointDef = new Box2D.b2DistanceJointDef();

                    ropeJointDef.Initialize(hand, targetBody, hand.GetPosition(), hand.GetPosition());

                    let length = ropeJointDef.get_length();
                    ropeJointDef.set_minLength(0);
                    ropeJointDef.set_maxLength(length);

                    ropeJointDef.set_stiffness(0);
                    ropeJointDef.set_damping(0);

                    const handJoint = Box2D.castObject(game.editor.CreateJoint(ropeJointDef), Box2D.b2DistanceJoint);
                    Box2D.destroy(ropeJointDef);

                    if(targetBody.oldDensities === undefined){
                        targetBody.oldDensities = [];
                        for (let fixture = targetBody.GetFixtureList(); Box2D.getPointer(fixture) !== Box2D.getPointer(Box2D.NULL); fixture = fixture.GetNext()) {
                            const oldDensity = fixture.GetDensity();
                            targetBody.oldDensities.push(oldDensity);
                            fixture.SetDensity(oldDensity*0.05);
                        }
                        targetBody.ResetMassData();
                    }

                    // body joint 
                    ropeJointDef = new Box2D.b2DistanceJointDef();

                    ropeJointDef.Initialize(this.lookupObject.body, targetBody, this.lookupObject.body.GetPosition(), hand.GetPosition());

                    length = ropeJointDef.get_length();
                    ropeJointDef.set_minLength(0);
                    ropeJointDef.set_maxLength(armLength);

                    ropeJointDef.set_stiffness(0);
                    ropeJointDef.set_damping(0);
                    ropeJointDef.set_collideConnected(true);

                    const bodyJoint = Box2D.castObject(game.editor.CreateJoint(ropeJointDef), Box2D.b2DistanceJoint);
                    handJoint.linkedJoints = [bodyJoint];
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

    release(){
        [this.grabJointLeft, this.grabJointRight].forEach(joint => {
            if(joint && !joint.destroyed){
                game.editor.deleteObjects([joint]);
            }
        })
        this.grabJointLeft = null;
        this.grabJointRight = null;

        [this.grabBodyLeft, this.grabBodyRight].forEach(targetBody => {
            if(targetBody && targetBody.oldDensities !== undefined){

                let count = 0;
                for (let fixture = targetBody.GetFixtureList(); Box2D.getPointer(fixture) !== Box2D.getPointer(Box2D.NULL); fixture = fixture.GetNext()) {
                    const oldDensity = targetBody.oldDensities[count];
                    fixture.SetDensity(oldDensity);
                    count++;
                }
                targetBody.ResetMassData();

                delete targetBody.oldDensities;
            }
        })

        this.grabBodyLeft = null;
        this.grabBodyRight = null;
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
                const bodyAngleVector = new Box2D.b2Vec2(Math.cos(body.GetAngle()), Math.sin(body.GetAngle()));
                const dirForce = new Box2D.b2Vec2(bodyAngleVector.y, -bodyAngleVector.x);
                b2MulVec2(dirForce, force)
                body.ApplyForce(dirForce, body.GetPosition(), true);

                Box2D.destroy(bodyAngleVector);
                Box2D.destroy(dirForce);
            }
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
