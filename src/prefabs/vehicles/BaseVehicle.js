import * as PrefabManager from '../PrefabManager'
import * as extramath from '../../b2Editor/utils/extramath';
import {
    game
} from "../../Game";
import { Settings } from '../../Settings';
import { applyColorMatrixMultiple } from '../../b2Editor/utils/colorMatrixParser';
import { b2CloneVec2, b2MulVec2 } from '../../../libs/debugdraw';

const { getPointer, NULL } = Box2D;

export class BaseVehicle extends PrefabManager.basePrefab {
    static forceUnique = true;
    static playableCharacter = true;

    constructor(target) {
        super(target);
        this.destroyConnectedJoints = {};
        this.flipped = false;
        this.isVehicle = true;
        this.character = game.editor.activePrefabs[this.lookupObject.character.body.mySprite.data.subPrefabInstanceName].class;

        this.vehicleName = '';
        this.accel = 0;
        this.limbsObserver = [];
        this.applyColorMatrix(this.prefabObject.settings.colorMatrix);
        this.leanTicks = 0;
    }

    applyColorMatrix(cm){
        if(!cm) return;
        const textures = [];
        this.lookupObject._bodies.map(body => body.myTexture && textures.push(body.myTexture));
        this.lookupObject._bodies.map(body => body.mySprite && body.mySprite.isMesh && textures.push(body.mySprite));

        applyColorMatrixMultiple(textures, cm)
    }

    init() {

        super.init();
        this.character.setSkin(game.selectedCharacter);
        let i;
        for (i = 0; i < this.lookupObject._bodies.length; i++) {
            let body = this.lookupObject._bodies[i];
            body.mySprite.data.prefabID = this.prefabObject.instanceID;
        }
        this.character.life = this.prefabObject.settings.life || 300;
        this.initContactListener();

        this.leanSpeed = 0.2;
        this.engines = [];
        this.wheels = [];
        this.desiredVehicleTorques = [];
        this.desiredVehicleSpeeds = [];

        let maxEngines = 4;
        for (i = 1; i <= maxEngines; i++) {
            let engine = this.lookupObject["engine" + i.toString()];
            if (engine != null) {
                this.engines.push(engine);
                let tarBody = engine.GetBodyA();

                for (let fixture = tarBody.GetFixtureList(); getPointer(fixture) !== getPointer(NULL); fixture = fixture.GetNext()) {
                    if (fixture.GetType() === Box2D.b2Shape.e_circle) {
                        this.wheels.push(fixture)
                    }
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

                    let vehicleDepth = game.editor.getLowestChildIndex([].concat(this.lookupObject._bodies, this.lookupObject._textures, this.lookupObject._joints));

                    // reset settings
                    this.prefabObject.settings.forceVehicle = false;
                    delete this.prefabObject.settings.limbs;

                    game.currentLevelData.forced_vehicle = 0;

                    let vehiclePrefab = `{"objects":[[4,${this.prefabObject.x},${this.prefabObject.y},${this.prefabObject.rotation},${JSON.stringify(this.prefabObject.settings)},"${value}",${this.prefabObject.instanceID}]]}`;
                    let newObjects = game.editor.buildJSON(JSON.parse(vehiclePrefab));
                    game.editor.applyToObjects(game.editor.TRANSFORM_FORCEDEPTH, vehicleDepth, [].concat(newObjects._bodies, newObjects._textures, newObjects._joints));

                    game.editor.deleteSelection(true);

                    let instanceName;
                    if (newObjects._bodies.length > 0) instanceName = newObjects._bodies[0].mySprite.data.prefabInstanceName;
                    else if (newObjects._textures.length > 0) instanceName = newObjects._textures[0].data.prefabInstanceName;

                    game.editor.selectedPrefabs[instanceName] = true;
                    game.editor.updateSelection();
                }
                break;
            case 'forceVehicle':
                if(value) game.currentLevelData.forced_vehicle = Settings.availableVehicles.indexOf(this.vehicleName)+1;
                else {
                    game.currentLevelData.forced_vehicle = 0;
                    const jointsToDelete = [];
                    for (let i = 0; i < game.editor.textures.children.length; i++) {
                        let sprite = game.editor.textures.getChildAt(i);
                        if(sprite.data && sprite.data.type === game.editor.object_JOINT){
                            if(!sprite.data.prefabInstanceName){
                                const spriteA = game.editor.textures.getChildAt(sprite.data.bodyA_ID);
                                const spriteB = game.editor.textures.getChildAt(sprite.data.bodyB_ID);
                                if(spriteA.myBody && game.editor.retrieveClassFromBody(spriteA.myBody) && game.editor.retrieveClassFromBody(spriteA.myBody).isVehicle){
                                    jointsToDelete.push(sprite);
                                }else if(spriteB && spriteB.myBody && game.editor.retrieveClassFromBody(spriteB.myBody) && game.editor.retrieveClassFromBody(spriteB.myBody).isVehicle){
                                    jointsToDelete.push(sprite);
                                }

                            }
                        }
                    }
                    game.editor.deleteObjects(jointsToDelete);
                }
                this.prefabObject.settings[property] = value;
                break;
            default:
                this.prefabObject.settings[property] = value;
            break;
        }
    }

    accelerate(dir) {
        if(this.character && this.character.hat && this.character.hat.blockControls) return;
        if(this.flipped) dir*= -1;
        this.accel = dir;
        if((dir < 0 && !this.flipped) || (dir>0 && this.flipped)) dir *= .6; // only 60% backwards speed

        this.accelerateWheels(dir);
        let i;
        let j;
        let wheel;
        const offset = 0.5;

        this.grounded = false;

        for (i = 0; i < this.wheels.length; i++) {
            wheel = this.wheels[i];

            let rayStart = wheel.GetBody().GetPosition();
            let rayEnd;
            // add 360 scope
            let wheelRadius = wheel.GetShape().get_m_radius() || wheel.GetBody().myTexture.width / Settings.PTM;
            let rayLength = wheelRadius + offset;
            let checkSlize = (360 / 20) * game.editor.DEG2RAD;
            let totalCircleRad = 360 * game.editor.DEG2RAD;
            for (j = 0; j < totalCircleRad; j += checkSlize) {
                rayEnd = b2CloneVec2(rayStart);
                rayEnd.set_x(rayEnd.get_x() + Math.cos(j) * rayLength );
                rayEnd.set_y(rayEnd.get_y() + Math.sin(j) * rayLength );

                let callback = Object.assign(new Box2D.JSRayCastCallback(), {
                    ReportFixture: function (fixture_p, point_p, normal_p, fraction) {
        
                        const fixture = Box2D.wrapPointer(fixture_p, Box2D.b2Fixture);
                        const point = Box2D.wrapPointer(point_p, Box2D.b2Vec2);
                        const normal = Box2D.wrapPointer(normal_p, Box2D.b2Vec2);
        
                        if(fixture.GetBody().mainCharacter) return -1;
                        if (fixture.IsSensor()) return -1;
                        this.m_hit = true;
                        this.m_point = point;
                        this.m_normal = normal;
                        this.m_fixture = fixture;
                        return fraction;
                    },
                    m_hit: false
                });
                wheel.GetBody().GetWorld().RayCast(callback, rayStart, rayEnd);
                Box2D.destroy(rayEnd);

                if (callback.m_hit) {
                    let forceDir = extramath.rotateVector(callback.m_normal, 90);

                    const impulse = (this.desiredVehicleSpeeds[i] * dir / Settings.timeStep) * game.editor.deltaTime;

                    this.applyImpulse(impulse, forceDir);
                    this.grounded = true;
                    break;
                }
            }
        }
    }
    applyImpulse(force, angle) {
        let i;
        let body;
        let dirFore = b2CloneVec2(angle);
        b2MulVec2(dirFore, force * 0.01)
        for (i = 0; i < this.lookupObject._bodies.length; i++) {
            body = this.lookupObject._bodies[i];
            if(body.snapped) continue;
            let oldVelocity = body.GetLinearVelocity();
            let newVelocity = new Box2D.b2Vec2(oldVelocity.x + dirFore.x, oldVelocity.y + dirFore.y);
            body.SetLinearVelocity(newVelocity);
            Box2D.destroy(newVelocity);
        }
        Box2D.destroy(dirFore);
    }
    accelerateWheels(dir) {
        let i;
        let engine;
        for (i = 0; i < this.engines.length; i++) {
            engine = this.engines[i];
            engine.SetMaxMotorTorque(this.desiredVehicleTorques[i]);
            engine.SetMotorSpeed(-dir * this.desiredVehicleSpeeds[i]);
        }
        if (this.lookupObject.pedal_engine) {
            this.lookupObject.pedal_engine.SetMaxMotorTorque(10000);
            const desiredPedalSpeed = 10;
            this.lookupObject.pedal_engine.SetMotorSpeed(Math.min(desiredPedalSpeed, Math.max(-desiredPedalSpeed, -this.wheels[0].GetBody().GetAngularVelocity() * 3.0)));
        }
    }
    stopAccelerateWheels() {
        let i;
        let engine;
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
        this.accel = 0;
        this.stopAccelerateWheels();
    }
    flip(){
        this.flipped = !this.flipped;
        game.editor.mirrorPrefab(game.vehicle, 'frame');
    }
    lean(dir) {
        if (this.lookupObject.frame) {
            if(this.leanTicks <= 0){
                // push towards the other side when attached to a rope with more force
                if(this.character && this.character.hat && this.character.hat.isRopeHat && this.character.hat.blockControls){
                    // don't do anything for now
                }else{
                    let velocity = this.leanSpeed * dir;
                    this.lookupObject.frame.SetAngularVelocity(velocity * 10);
                }
                this.leanTicks = 1000/60;
            }
            this.leanTicks -= game.editor.deltaTime;
        }
    }

    getCurrentActiveBodies(){
        if(this.character && this.character.attachedToVehicle){
            return [...this.lookupObject._bodies, ...this.character.vains];
        }else{
            return [...this.character.lookupObject._bodies, ...this.character.vains];
        }
    }

    destroy(){
        this.character.destroy();
        super.destroy();
    }
}

const setColorMatrix = prefab =>{
    const callback = cm=>{
        prefab.settings.colorMatrix = cm;
    }

    const textures = [];
    prefab.class.lookupObject._bodies.map(body => body.myTexture && textures.push(body.myTexture));
    prefab.class.lookupObject._bodies.map(body => body.mySprite && body.mySprite.isMesh && textures.push(body.mySprite));
    
    game.editor.ui.showColorMatrixEditor(prefab.settings.colorMatrix, textures, callback, prefab.settings)
}

BaseVehicle.settings = Object.assign({}, BaseVehicle.settings, {
    "setColorMatrix": prefab=>setColorMatrix(prefab),
    "life": 300,
    "selectedVehicle": "Bike",
    "forceVehicle": false
});
BaseVehicle.settingsOptions = Object.assign({}, BaseVehicle.settingsOptions, {
    "setColorMatrix": '$function',
    "life": {
        min: 1.0,
        max: 10000.0,
        step: 1.0
	},
    "selectedVehicle": Settings.availableVehicles,
    "forceVehicle": false,
});
