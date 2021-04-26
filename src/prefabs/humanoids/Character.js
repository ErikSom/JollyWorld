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

export class Character extends Humanoid {
    constructor(target) {
        super(target);
        this.hat = undefined;
        this.attachedToVehicle = true;
        this.vehicleJoints = [];
        this.vehicleParts = [];
        this.isCharacter = true;

    }

    init() {
        super.init();
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
                    let jointEdge = body.GetJointList();
                    while (jointEdge) {
                        const joint = jointEdge.joint;
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
                        jointEdge = jointEdge.next;
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
        //Destroy connected joints
        if(!this.mainPrefabClass.destroyConnectedJoints[update.target]) return;
        this.mainPrefabClass.destroyConnectedJoints[update.target].forEach((targetJointName) => {
            if (targetJointName instanceof String || typeof(targetJointName) === 'string') {
                if (this.lookupObject[targetJointName]) {
                    game.world.DestroyJoint(this.lookupObject[targetJointName]);
                    delete this.lookupObject[targetJointName];
                }
            } else if (!this.lookupObject[targetJointName.ifno]) {
                targetJointName.destroy.forEach((connectedJointName) => {
                    if (this.lookupObject[connectedJointName]) {
                        game.world.DestroyJoint(this.lookupObject[connectedJointName]);
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
                    game.world.DestroyJoint(this.lookupObject[jointName]);
                    delete this.lookupObject[jointName];
                }
            });
        }

        if(this.vehicleJoints){
            this.vehicleJoints.forEach(joint =>{
                game.world.DestroyJoint(joint);
                this.vehicleJoints = [];
            })
        }

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
        }

        this.attachedToVehicle = false;
        if(this.hat) this.hat.detachFromVehicle();

    }

    destroy(){
        this.destroyed = true;
        if(this.hat){
            console.log("DESTROY HAT!!");
            this.hat.destroy();
        }
        super.destroy();
    }
}

PrefabManager.prefabLibrary.Character = {
    class: Character,
}
