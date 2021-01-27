import * as PrefabManager from '../PrefabManager';
import * as Box2D from '../../../libs/Box2D'
import {
    game
} from "../../Game";
import {
    Settings
} from '../../Settings';
import {globalEvents, GLOBAL_EVENTS} from '../../utils/EventDispatcher'
import {Humanoid} from './Humanoid'

export class Character extends Humanoid {
    constructor(target) {
        super(target);
        this.hat = undefined;
        this.attachedToVehicle = true;
        this.vehicleJoints = [];
    }

    init() {
        super.init();
    }

    flip(){
        if(this.attachedToVehicle){
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
            game.lose();
        }
        super.die();
    }

    lean(dir) {
        const velocity = Settings.characterLeanSpeed * dir;

        if(!this.attachedToVehicle){
            this.lookupObject['body'].SetAngularVelocity(velocity);
        }else{
            const leanedBodies = [];
            this.vehicleJoints.forEach(joint=> {
                const vehicleBody = joint.GetBodyB();
                if(!leanedBodies.includes(vehicleBody)){
                    vehicleBody.SetAngularVelocity(velocity);
                    leanedBodies.push(vehicleBody);
                }
            });
        }
    }

    dealDamage(damage){
        globalEvents.dispatchEvent({type:GLOBAL_EVENTS.CHARACTER_DAMAGE, data:damage});
        super.dealDamage(damage);
    }

    addJoint(joint, bodyB){
        if(bodyB.isVehiclePart){
            this.vehicleJoints.push(joint);
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

    detachFromVehicle(force) {
        if (!force) force = 0;
        if (!this.attachedToVehicle) return;

        const vehicleJoints = this.mainPrefabClass.destroyConnectedJoints['head'];

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

        if(this.hat) this.hat.detachFromVehicle();

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
    }
}

PrefabManager.prefabLibrary.Character = {
    class: Character,
}
