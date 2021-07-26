import * as PrefabManager from '../PrefabManager';
import * as AudioManager from '../../utils/AudioManager';
import {Humanoid} from '../humanoids/Humanoid';

import { BaseVehicle } from './BaseVehicle';
import { game } from '../../Game';
import { b2DotVV } from '../../../libs/debugdraw';
import { Key } from '../../../libs/Key';
import { drawCircle, drawLine } from '../../b2Editor/utils/drawing';
import { angleDifference } from '../../b2Editor/utils/extramath';
import { Settings } from '../../Settings';
import * as SaveManager from '../../utils/SaveManager'
import * as TutorialManager from '../../utils/TutorialManager';


const vec1 = new Box2D.b2Vec2(0, 0);
const vec2 = new Box2D.b2Vec2(0, 0);

class FoddyCan extends BaseVehicle {
    constructor(target) {
        super(target);
        this.destroyConnectedJoints = {
            head:['neck_joint', 'pot_left_joint', 'pot_right_joint', 'hammer_left_joint', 'hammer_right_joint', 'leg_joint_left', 'leg_joint_right', 'left_arm_hammer_spring', 'right_arm_hammer_spring', 'move_joint'],
            body:['neck_joint', 'pot_left_joint', 'pot_right_joint', 'hammer_left_joint', 'hammer_right_joint', 'leg_joint_left', 'leg_joint_right', 'left_arm_hammer_spring', 'right_arm_hammer_spring', 'move_joint'],
            thigh_left:['leg_joint_left'],
            thigh_right:['leg_joint_right'],
            leg_left:['leg_joint_left'],
            leg_right:['leg_joint_right'],
            feet_left:['leg_joint_left'],
            feet_right:['leg_joint_right'],
            shoulder_left:['hammer_left_joint', 'left_arm_hammer_spring'],
            shoulder_right:['hammer_right_joint', 'right_arm_hammer_spring'],
            arm_left:['hammer_left_joint', 'left_arm_hammer_spring'],
            arm_right:['hammer_right_joint', 'right_arm_hammer_spring'],
            hand_left:['hammer_left_joint', 'left_arm_hammer_spring'],
            hand_right:['hammer_right_joint', 'right_arm_hammer_spring'],
            belly:['pot_left_joint', 'pot_right_joint', 'leg_joint_left', 'leg_joint_right']
        }
        this.vehicleName = 'FoddyCan';
        this.limbsObserver = [
                                [[Humanoid.BODY_PARTS.ARM_LEFT, Humanoid.BODY_PARTS.SHOULDER_LEFT, Humanoid.BODY_PARTS.HAND_LEFT],
                                 [Humanoid.BODY_PARTS.ARM_RIGHT, Humanoid.BODY_PARTS.SHOULDER_RIGHT, Humanoid.BODY_PARTS.HAND_RIGHT]
                                ]
                            ];
        this.postInit = false;
    }

    postConstructor(){
        const userData = SaveManager.getLocalUserdata();
        this.goldMode = userData.cheats.goldenPot;

        if(this.goldMode){
            this.lookupObject.frame.myTexture.originalSprite.texture = PIXI.Texture.from('Pot_20000');
            this.lookupObject.hammer.myTexture.originalSprite.texture = PIXI.Texture.from('Hammer_20000');
        }else{
            this.lookupObject.frame.myTexture.originalSprite.texture = PIXI.Texture.from('Pot0000');
            this.lookupObject.hammer.myTexture.originalSprite.texture = PIXI.Texture.from('Hammer0000');
        }
    }

    init() {
        super.init();

        this.character.ignoreJointDamage = true;

        this.lookupObject['move_joint'].EnableMotor(true);
        this.lookupObject['rotate_joint'].EnableMotor(true);
        this.lookupObject['rotate_joint'].SetMaxMotorTorque(10000);

        this.rotateAccel = 0;
        this.rotateAccelInc = 0.08;
        this.rotateAccelMul = 1.06;
        this.maxRotateAccel = 8;

        this.mousePos = {x:0, y:0};
        this.lastMoved = 0;
        this.mouseControlled = false;
        this.mouseEase = 0.1;

        this.targetAngle = 0;
        this.hillOffset = 0;

        this.oldCameraPos = {x: game.editor.cameraHolder.x, y:game.editor.cameraHolder.y};

        document.addEventListener('pointerdown', ()=>this.doPointerLock());

        document.addEventListener('pointermove', e => {
            const movementScaler = 0.04;
            const movementX = e.movementX || e.mozmovementX || e.webkitmovementX || 0;
            const movementY = e.movementY || e.mozmovementY || e.webkitmovementY || 0;
            this.mousePos.x += movementX * movementScaler / game.editor.cameraHolder.scale.x;
            this.mousePos.y += movementY * movementScaler / game.editor.cameraHolder.scale.y;

            const minMovement = 0.1;
            if(Math.abs(movementX) > minMovement || Math.abs(movementY) > minMovement){
                this.lastMoved = Date.now();
            }

        })

		TutorialManager.showTutorial(TutorialManager.TUTORIALS.FODDY);
    }

    doPointerLock(){

        if(game.gameOver || game.levelWon || game.pause) return;

        if(document.pointerLockElement !== game.canvas){
            game.canvas.requestPointerLock = game.canvas.requestPointerLock || game.canvas.mozRequestPointerLock;
            game.canvas.requestPointerLock();

            const hammerEnd = this.lookupObject['hammer_end'];
            this.mousePos.x = hammerEnd.GetPosition().x;
            this.mousePos.y = hammerEnd.GetPosition().y;
        }
    }

    reset(){
        document.removeEventListener('pointerdown', this.doPointerLock);
        game.exitPointerLock();
    }

    update() {
        const hammerEnd = this.lookupObject['hammer_end'];

        if(!this.postInit){
            this.character.lookupObject.shoulder_left_joint.EnableLimit(false);
            this.character.lookupObject.arm_left_joint.EnableLimit(false);
            this.character.lookupObject.hand_left_joint.EnableLimit(false);

            this.character.lookupObject.shoulder_right_joint.EnableLimit(false);
            this.character.lookupObject.arm_right_joint.EnableLimit(false);
            this.character.lookupObject.hand_right_joint.EnableLimit(false);

            this.postInit = true;

            this.mousePos.x = hammerEnd.GetPosition().x;
            this.mousePos.y = hammerEnd.GetPosition().y;
        }

        game.editor.debugGraphics.clear();

        this.mouseControlled = (document.pointerLockElement === game.canvas);

        const rotateJoint = this.lookupObject['rotate_joint'];
        const moveJoint = this.lookupObject['move_joint'];

        if(this.character && this.character.attachedToVehicle){
            if(this.mouseControlled){


                // do camera movement
                const cameraMovementX = game.editor.cameraHolder.x - this.oldCameraPos.x;
                const cameraMovementY = game.editor.cameraHolder.y - this.oldCameraPos.y;

                this.mousePos.x -= (cameraMovementX / Settings.PTM) / game.editor.cameraHolder.x;
                this.mousePos.y -= (cameraMovementY / Settings.PTM) / game.editor.cameraHolder.y;
                this.oldCameraPos = {x: game.editor.cameraHolder.x, y:game.editor.cameraHolder.y};
                //


                this.mousePos.x += (hammerEnd.GetPosition().x - this.mousePos.x) * this.mouseEase;
                this.mousePos.y += (hammerEnd.GetPosition().y - this.mousePos.y) * this.mouseEase;

                const pixiPoint = game.editor.getPIXIPointFromWorldPoint(this.mousePos);
                game.levelCamera.matrix.apply(pixiPoint,pixiPoint);
                drawCircle({x:pixiPoint.x-1, y:pixiPoint.y-1}, 10, {color:0x333333, size:1.6}, {alpha:0});
                drawCircle(pixiPoint, 10, {size:1.6}, {alpha:0});

                const rotator = this.lookupObject['rotator'];

                const dx = this.mousePos.x - this.lookupObject['body'].GetPosition().x;
                const dy = this.mousePos.y - this.lookupObject['body'].GetPosition().y;

                const l = Math.sqrt(dx * dx + dy * dy);

                const maxIdleTime = 100;
                const mouseMoved = Date.now() - this.lastMoved < maxIdleTime;

                if(l > 1.0 && mouseMoved){

                    rotateJoint.EnableMotor(false);
                    rotateJoint.SetMaxMotorTorque(1);

                    let desiredAngle;

                    if(this.flipped){
                        desiredAngle = Math.atan2(dy, dx) - Math.PI * 1.2616;// arm offset
                    }else{
                        desiredAngle = Math.atan2(dy, dx) + Math.PI * 0.2616;// arm offset
                    }

                    const nextAngle = rotator.GetAngle() + rotator.GetAngularVelocity() / 60.0;
                    let totalRotation = desiredAngle - nextAngle;
                    while ( totalRotation < -180 * game.editor.DEG2RAD ) totalRotation += 360 * game.editor.DEG2RAD;
                    while ( totalRotation >  180 * game.editor.DEG2RAD ) totalRotation -= 360 * game.editor.DEG2RAD;
                    let desiredAngularVelocity = totalRotation * 60;
                    const change = 200 * game.editor.DEG2RAD;
                    desiredAngularVelocity = Math.min( change, Math.max(-change, desiredAngularVelocity));
                    const impulse = rotator.GetInertia() * desiredAngularVelocity * 6;

                    rotator.ApplyAngularImpulse( impulse );
                }else{
                    rotateJoint.EnableMotor(true);
                    rotateJoint.SetMotorSpeed(0);
                    rotateJoint.SetMaxMotorTorque(10000);
                }

                const globalAxis = moveJoint.GetBodyA().GetWorldVector(moveJoint.GetLocalAxisA());
                const rd = vec1;
                vec1.Set(hammerEnd.GetPosition().x - this.mousePos.x, hammerEnd.GetPosition().y - this.mousePos.y);
                const rl = rd.Normalize();
                if(rl > 0.2 && mouseMoved){
                    const dot = b2DotVV(rd, globalAxis);
                    const targetMotorSpeed = dot * rl * 8;

                    moveJoint.SetMaxMotorForce(10000);
                    moveJoint.SetMotorSpeed(-targetMotorSpeed);
                }else{
                    moveJoint.SetMaxMotorForce(10000);
                    moveJoint.SetMotorSpeed(0);
                }

            }else{
                rotateJoint.EnableMotor(true);

                if(Key.isDown(Key.LEFT) || Key.isDown(Key.A)){
                    if(this.rotateAccel <0) this.rotateAccel = 0;
                    this.rotateAccel += this.rotateAccelInc;
                    this.rotateAccel *= this.rotateAccelMul;
                    this.rotateAccel = Math.min(this.maxRotateAccel, this.rotateAccel);
                    rotateJoint.SetMotorSpeed(this.rotateAccel);
                } else if(Key.isDown(Key.RIGHT) || Key.isDown(Key.D)){
                    if(this.rotateAccel >0) this.rotateAccel = 0;
                    this.rotateAccel -= this.rotateAccelInc;
                    this.rotateAccel *= this.rotateAccelMul;
                    this.rotateAccel = Math.max(-this.maxRotateAccel, this.rotateAccel);
                    rotateJoint.SetMotorSpeed(this.rotateAccel);

                }else{
                    rotateJoint.SetMotorSpeed(0);
                    this.rotateAccel = 0;
                }

                if(Key.isDown(Key.UP) || Key.isDown(Key.W)){
                    moveJoint.SetMaxMotorForce(10000);
                    moveJoint.SetMotorSpeed(-50);
                }else if(Key.isDown(Key.DOWN) || Key.isDown(Key.S)){
                    moveJoint.SetMaxMotorForce(10000);
                    moveJoint.SetMotorSpeed(6);
                }else{
                    moveJoint.SetMaxMotorForce(3000);
                    moveJoint.SetMotorSpeed(0);
                }
            }
        }

        this.updateTargetAngle();

        super.update();
    }

    eject(){
        game.editor.setBodyCollision(this.lookupObject['hammer'], [1, 1]);

        const targetZSwap = [this.character.lookupObject.hand_right, this.character.lookupObject.arm_right, this.character.lookupObject.shoulder_right];

        for(let i = 0; i<targetZSwap.length; i++){
            const target = targetZSwap[i];
            if(target && target.myTexture && !target.destroyed){
                const targetIndex = target.myTexture.parent.getChildIndex(target.myTexture);
                this.lookupObject.frame.myTexture.parent.addChildAt(this.lookupObject.frame.myTexture, targetIndex);
                break;
            }
        }

        game.editor.deleteObjects([this.lookupObject['move_joint']]);
    }

    updateTargetAngle(){
        const frame = this.lookupObject.frame;

        const gravity = game.editor.world.GetGravity();

        const realBaseAngle = Math.atan2(gravity.y, gravity.x);
        const baseAngle = realBaseAngle - Settings.pihalve;


        const potWidth = 1.2;
        const depthCheck = 3.2;

        const rayPositions = [];

        [1, -1].forEach(dir => {

            const offsetAngle = realBaseAngle - Settings.pihalve * dir;

            const offsetX = potWidth * Math.cos(offsetAngle);
            const offsetY = potWidth * Math.sin(offsetAngle);

            const sp = vec1;
            sp.Set(frame.GetPosition().x + offsetX, frame.GetPosition().y + offsetY);

            const zOffsetX = depthCheck * Math.cos(realBaseAngle);
            const zOffsetY = depthCheck * Math.sin(realBaseAngle);

            const ep = vec2;
            ep.Set(sp.x + zOffsetX, sp.y + zOffsetY);


            const raycastCallback = new Box2D.JSRayCastCallback();
            const callback = Object.assign(raycastCallback, {
                ReportFixture: function (fixture_p, point_p, normal_p, fraction) {

                    const fixture = Box2D.wrapPointer(fixture_p, Box2D.b2Fixture);
                    const point = Box2D.wrapPointer(point_p, Box2D.b2Vec2);

                    if(fixture.GetBody().mainCharacter) return -1;
                    if (fixture.IsSensor()) return -1;
                    this.m_hit = true;
                    this.m_point = point;
                    return fraction;
                },
                m_hit: false
            });

            game.world.RayCast(callback, sp, ep);

            if(callback.m_hit){
                rayPositions.push({ x:callback.m_point.x, y:callback.m_point.y });
            }else{
                rayPositions.push({ x:ep.x, y:ep.y });
            }

            Box2D.destroy(raycastCallback);


            // const pixiSP = game.editor.getPIXIPointFromWorldPoint(sp);
            // game.levelCamera.matrix.apply(pixiSP,pixiSP);

            // const pixiEP = game.editor.getPIXIPointFromWorldPoint(ep);
            // game.levelCamera.matrix.apply(pixiEP,pixiEP);

            // drawLine(pixiSP, pixiEP);

        })

        const rdx = rayPositions[0].x - rayPositions[1].x;
        const rdy = rayPositions[0].y - rayPositions[1].y;
        const ra = Math.atan2(rdy, rdx);

        const maxHillOffset = 0.2;
        this.hillOffset = Math.max(-maxHillOffset, Math.min(maxHillOffset, angleDifference(baseAngle, ra)));

        const diff = angleDifference(this.targetAngle, baseAngle + this.hillOffset) ;

        this.targetAngle += diff * 0.1;

        while ( this.targetAngle < -180 * game.editor.DEG2RAD ) this.targetAngle += 360 * game.editor.DEG2RAD;
        while ( this.targetAngle >  180 * game.editor.DEG2RAD ) this.targetAngle -= 360 * game.editor.DEG2RAD;

        frame.SetTransform(frame.GetPosition(), this.targetAngle);

    }


    lean() {
        // ignore
    }


    destroy(){
        super.destroy();
    }

    initContactListener() {
        super.initContactListener();
        const self = this;
        this.contactListener.PostSolve = function (contact, impulse) {

            const bodyA = contact.GetFixtureA().GetBody();
            const bodyB = contact.GetFixtureB().GetBody();

            let force = 0;
            for (let j = 0; j < impulse.get_count(); j++){
                if (impulse.get_normalImpulses(j) > force){
                    force = impulse.get_normalImpulses(j);
                }
            }

            let hammer;
            if(bodyA === self.lookupObject.hammer) hammer = bodyA;
            if(bodyB === self.lookupObject.hammer) hammer = bodyB;

            if(hammer){

                const velocityA = Math.max(bodyA.GetLinearVelocity().Length(), Math.abs(bodyA.GetAngularVelocity()));
                const velocityB = Math.max(bodyB.GetLinearVelocity().Length(), Math.abs(bodyB.GetAngularVelocity()));

                const velocitySum = velocityA + velocityB;

                if (velocitySum > 2.0 && force > 150) {
                    const targetSounds = self.goldMode ? ['mjolner-1','mjolner-2', 'mjolner-3'] : ['squeak-1', 'squeak-2', 'squeak-3', 'squeak-4'];
                    AudioManager.playSFX(targetSounds, 0.1, 1.4 + 0.4 * Math.random()-0.2, hammer.GetPosition());
                }
            }



            let frame;
            if(bodyA === self.lookupObject.frame) frame = bodyA;
            if(bodyB === self.lookupObject.frame) frame = bodyB;

            if(frame){

                const velocity = Math.max(frame.GetLinearVelocity().Length(), Math.abs(frame.GetAngularVelocity()));

                if (velocity > 2.0 && force > 100) {
                    const targetSounds = ['pot-impact'];
                    AudioManager.playSFX(targetSounds, 0.1, 1.4 + 0.4 * Math.random()-0.2, frame.GetPosition());
                }
            }



        }
    }
}

PrefabManager.prefabLibrary.FoddyCan = {
    json: '{"objects":[[0,-0.521,2.5031,-0.7501,".character#Character , .flesh","thigh_left",0,["#999999"],["#000"],[0],false,true,[[{"x":-0.202,"y":-1.031},{"x":0.196,"y":-1.044},{"x":0.17,"y":1.038},{"x":-0.164,"y":1.038}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[1,-15.6487,75.5059,-0.7501,"","",1,"Normal_Thigh0000",0,0.413,-2.367,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.6226,3.6311,1.0121,".character#Character , .flesh","leg_left",2,["#999999"],["#000"],[0],false,true,[[{"x":-0.161,"y":-0.912},{"x":0.161,"y":-0.925},{"x":0.084,"y":0.912},{"x":-0.084,"y":0.925}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[0,-1.576,4.393,1.2391,".character#Character , .flesh","feet_left",3,["#999999"],["#000"],[0],false,true,[[{"x":-0.353,"y":-0.233},{"x":0.359,"y":0},{"x":0.359,"y":0.123},{"x":-0.365,"y":0.111}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[1,-18.7831,108.7646,1.0121,"","",4,"Normal_Leg0000",2,0.199,-3.142,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,-45.7651,131.8284,1.2391,"","",5,"Normal_Feet0000",3,1.515,1.214,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.2515,-1.04,-1.1696,".character#Character , .flesh","shoulder_left",6,["#999999"],["#000"],[0],false,true,[[{"x":-0.185,"y":-0.859},{"x":0.193,"y":-0.842},{"x":0.111,"y":0.851},{"x":-0.119,"y":0.851}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[0,1.107,-0.9614,-1.99,".character#Character , .flesh","arm_left",7,["#999999"],["#000"],[0],false,true,[[{"x":-0.136,"y":-0.686},{"x":0.144,"y":-0.703},{"x":0.127,"y":0.694},{"x":-0.136,"y":0.694}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[1,-7.2392,-31.6844,-1.1696,"","",8,"Normal_Shoulder0000",6,0.573,-0.161,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,33.3466,-29.1067,-1.99,"","",9,"Normal_Arm0000",7,0.298,-0.894,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,1.9805,-1.2852,-2.0424,".character#Character , .flesh","hand_left",10,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.513],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[1,59.8428,-36.8092,-2.0424,"","",11,"Normal_Hand0000",10,1.798,2.91,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-1.2205,1.5118,-0.262,".character#Character , .flesh","belly",12,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[14.181],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[0,-1.0522,-2.8309,-0.262,".character#Character , .flesh","head",13,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[30.393],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[0,-1.1128,-0.2769,0.087,".character#Character , .flesh","body",14,["#999999"],["#000"],[0],false,true,[[{"x":-0.537,"y":1.202},{"x":-0.432,"y":-1.37},{"x":-0.15,"y":-1.828},{"x":0.132,"y":-1.793},{"x":0.555,"y":-1.123},{"x":0.555,"y":1.308},{"x":0.097,"y":1.801},{"x":-0.22,"y":1.801}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[1,-35.3006,36.7066,-0.062,"","",15,"Normal_Belly0000",12,8.747,1.158,-0.2,false,"#FFFFFF",1,1,1,0,0,0,true],[1,-32.2564,-12.3203,0.087,"","",16,"Normal_Core0000",14,4.169,1.384,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,-30.0701,-87.5157,-0.262,"","",17,"Normal_Head_Idle0000",13,2.99,0.785,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.3547,2.3213,-0.8727,".character#Character , .flesh","thigh_right",18,["#999999"],["#000"],[0],false,true,[[{"x":-0.202,"y":-1.031},{"x":0.196,"y":-1.044},{"x":0.17,"y":1.038},{"x":-0.164,"y":1.038}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[0,-0.3421,3.4823,0.8556,".character#Character , .flesh","leg_right",19,["#999999"],["#000"],[0],false,true,[[{"x":-0.161,"y":-0.912},{"x":0.161,"y":-0.925},{"x":0.084,"y":0.912},{"x":-0.084,"y":0.925}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[0,-0.8512,-2.9949,-0.262,".character#Character","eye_left",20,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.534],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[1,-10.6091,70.0512,-0.8727,"","",21,"Normal_Thigh0000",18,0.413,-2.367,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,-10.3931,104.3191,0.8556,"","",22,"Normal_Leg0000",19,0.199,-3.142,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,-25.5105,-90.4071,-0.262,"","",23,"Normal_Eye0000",20,0.561,1.264,0,null,"#FFFFFF",1,1,1,0,0,0,true],[0,-1.0858,4.3515,0.9246,".character#Character , .flesh","feet_right",24,["#999999"],["#000"],[0],false,true,[[{"x":-0.353,"y":-0.233},{"x":0.359,"y":0},{"x":0.359,"y":0.123},{"x":-0.365,"y":0.111}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[1,-31.1217,130.113,0.9246,"","",25,"Normal_Feet0000",24,1.515,1.214,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-0.7038,-0.756,-0.5407,".character#Character , .flesh","shoulder_right",26,["#999999"],["#000"],[0],false,true,[[{"x":-0.185,"y":-0.859},{"x":0.193,"y":-0.842},{"x":0.111,"y":0.851},{"x":-0.119,"y":0.851}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[0,0.4314,-0.2623,-1.8156,".character#Character , .flesh","arm_right",27,["#999999"],["#000"],[0],false,true,[[{"x":-0.136,"y":-0.686},{"x":0.144,"y":-0.703},{"x":0.127,"y":0.694},{"x":-0.136,"y":0.694}]],[1],[7],[null],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[0,-0.1642,-3.2059,-0.262,".character#Character","eye_right",28,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.534],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[1,-4.9005,-96.7371,-0.262,"","",29,"Normal_Eye0000",28,0.561,1.264,0,null,"#FFFFFF",1,1,1,0,0,0,true],[0,4.2818,-5.3734,-1.0472,".vehicle","hammer",30,["#999999","#999999"],["#000","#000"],[0,0],false,true,[[{"x":-6.5264,"y":0.1806},{"x":-6.5264,"y":-0.1708},{"x":2.3772,"y":-0.1708},{"x":2.3772,"y":0.1806}],[{"x":1.7179,"y":0.8686},{"x":1.7179,"y":-0.8784},{"x":2.4313,"y":-0.8784},{"x":2.4313,"y":0.8686}]],[1,3],[2,7],[0,0],"",[0,0],true,false,false,[1,1],[0,0],false,true,false,false,1],[0,-1.1215,2.9177,0,".vehicle","frame",31,["#999999","#999999"],["#000","#000"],[0,0],false,true,[[{"x":0.0083,"y":0.0847},{"x":0.0083,"y":0.0847}],[{"x":1.3151,"y":-2.6574},{"x":1.3151,"y":2.4879},{"x":-1.3316,"y":2.4879},{"x":-1.3316,"y":-2.6574}]],[1,1],[7,7],[70.9441,0],"",[0,0],true,false,false,[0.5,0.8],[0.2,0.2],true,true,false,false,1],[1,-33.1178,84.5531,0,"","",32,"Pot0000",31,3.0245,1.3957,0,false,"#FFFFFF",1,1,1,0,0,0,true],[1,98.375,-107.1104,-1.0472,"","",33,"Hammer0000",30,61.8921,-3.1255,0,false,"#FFFFFF",1,1,1,0,0,0,true],[1,-20.5815,-22.892,-0.5407,"","",34,"Normal_Shoulder0000",26,0.573,-0.161,0,true,"#FFFFFF",1,1,1,0,0,0,true],[1,13.1225,-8.106,-1.8156,"","",35,"Normal_Arm0000",27,0.298,-0.894,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,1.3043,-0.4981,-2.3383,".character#Character , .flesh","hand_right",36,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[7],[7.513],"",[1],true,false,false,[0.5],[0.2],false,true,false,false,1],[1,40.0474,-13.3967,-2.3383,"","",37,"Normal_Hand0000",36,1.798,2.91,0,true,"#FFFFFF",1,1,1,0,0,0,true],[0,-1.0509,-0.3078,0,".vehicle","rotator",38,["#999999ff"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[2],[60],"",[0],true,false,false,[0.5],[0.2],false,true,false,false,1],[0,5.2777,-7.1681,0,".vehicle","hammer_end",39,["#999999"],["#000"],[0],false,true,[[{"x":0,"y":0},{"x":0,"y":0}]],[1],[2],[30],"",[0],true,false,false,[0.5],[0.2],false,true,false,false,1],[2,5.1113,94.0206,0.5411,".character#Character","leg_left_joint",40,2,0,0,false,false,1,10,true,0,-149,0,0,0,0,false],[2,-43.3948,122.0769,0.5411,".character#Character","feet_left_joint",41,3,2,0,false,false,1,10,true,0,0,0,0,0,0,false],[2,13.8565,-21.3605,-0.7856,".character#Character","arm_left_joint",42,7,6,0,false,false,1,10,true,152,0,0,0,0,0,false],[2,51.0997,-37.8583,0.8374,".character#Character","hand_left_joint",43,10,7,0,false,false,1,10,true,60,-60,0,0,0,0,false],[2,-29.6661,52.6883,-0.262,".character#Character","thigh_left_joint",44,0,12,0,false,false,1,10,true,142,-16,0,0,0,0,false],[2,-24.479,-39.8671,-0.262,".character#Character","shoulder_left_joint",45,6,14,0,false,false,1,10,true,180,-19,0,0,0,0,false],[2,-27.6491,-57.1017,-0.262,".character#Character","head_joint",46,13,14,0,false,false,1,10,true,58,-64,0,0,0,0,false],[2,11.8467,86.2999,0.6456,".character#Character","leg_right_joint",47,19,18,0,false,false,1,10,true,0,-149,0,0,0,0,false],[2,-31.61,121.7936,0.4716,".character#Character","feet_right_joint",48,24,19,0,false,false,1,10,true,0,0,0,0,0,0,false],[2,-6.8281,-93.7437,-0.262,".character#Character","eye_right_joint",49,28,13,0,false,false,1,10,true,0,0,0,0,0,0,false],[2,-6.25,-2.9309,-1.3441,".character#Character","arm_right_joint",50,27,26,0,false,false,1,10,true,152,0,0,0,0,0,false],[2,31.4672,-12.1591,0.4539,".character#Character","hand_right_joint",51,36,27,0,false,false,1,10,true,60,-60,0,0,0,0,false],[2,-29.5609,-39.746,-1.1172,".character#Character","shoulder_right_joint",52,26,14,0,false,false,1,10,true,180,-19,0,0,0,0,false],[2,-27.0741,-89.3457,-0.262,".character#Character","eye_left_joint",53,20,13,0,false,false,1,10,true,0,0,0,0,0,0,false],[2,-36.9831,39.4753,-0.262,".character#Character","belly_joint",54,14,12,0,false,false,1,10,true,10,-10,0,0,0,0,false],[2,-36.2231,53.9933,-0.262,".character#Character","thigh_right_joint",55,18,12,0,false,false,1,10,true,142,-16,0,0,0,0,false],[2,-56.9039,24.8987,0,".character#Character","pot_left_joint",56,31,14,2,false,false,1,10,false,0,0,0.5,8,0,0,true],[2,-10.8847,26.2498,0,".character#Character","pot_right_joint",57,31,14,2,false,false,1,10,false,0,0,0.5,8,0,0,true],[2,-58.8317,-50.482,0,".character#Character","neck_joint",58,14,13,2,false,false,1,10,false,0,0,0.5,3,0,0,true],[2,57.4866,-39.329,0,".character#Character","hammer_left_joint",59,10,30,0,false,true,100,0,false,0,0,1,10,0,0,true],[2,38.913,-14.5905,0,".character#Character","hammer_right_joint",60,36,30,0,false,true,100,0,false,0,0,1,10,0,0,true],[2,-12.0064,106.6511,0,".character#Character","leg_joint_right",61,19,31,0,false,false,1,10,false,0,0,0,0,0,0,true],[2,-21.0605,108.7113,0,".character#Character","leg_joint_left",62,2,31,0,false,false,1,10,false,0,0,0,0,0,0,true],[2,-31.027,-9.5275,0,".vehicle","rotate_joint",63,38,31,0,false,true,500,10,false,65,-135,0,0,0,0,true],[2,159.2155,-216.2026,0,".vehicle","hammer_move_joint",64,39,30,0,false,false,1,10,false,0,0,0,0,0,0,true],[2,155.5765,-211.79,0.576,".vehicle","move_joint",65,38,39,1,false,false,1,10,true,0,0,0,0,126,0,true],[2,-21.3011,-21.6796,0,".character#Character","right_arm_hammer_spring",66,26,30,2,false,false,1,10,false,0,0,0.6,4,0,0,true],[2,-6.8418,-29.4359,0,".character#Character","left_arm_hammer_spring",67,6,30,2,false,false,1,10,false,0,0,0.6,4,0,0,true]]}',
    class: FoddyCan,
    library: PrefabManager.LIBRARY_ADMIN,
}
