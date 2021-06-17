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

    }

    postConstructor(){
        super.postConstructor();
        this.setSkin(game.selectedCharacter);
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
