import * as PrefabManager from '../PrefabManager'
import * as Box2D from '../../../libs/Box2D'
import * as extramath from '../../b2Editor/utils/extramath';
import {
    game
} from "../../Game";


export class BaseVehicle extends PrefabManager.basePrefab {
    static forceUnique = true;
    static playableCharacter = true;

    constructor(target) {
        super(target);
        this.destroyConnectedJoints = {};
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

                    game.editor.selectedPrefabs[instanceName] = true;
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
            const desiredPedalSpeed = 10;
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
BaseVehicle.settings = Object.assign({}, BaseVehicle.settings, {
    "selectedVehicle": "Bike"
});
BaseVehicle.settingsOptions = Object.assign({}, BaseVehicle.settingsOptions, {
    "selectedVehicle": ["Bike", "Stroller", "HorseVehicle", "NoVehicle", "Rick", "Car", "UFO"]
});