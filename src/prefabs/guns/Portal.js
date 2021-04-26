import * as PrefabManager from '../PrefabManager';
import {
    game
} from "../../Game";
import {
    Settings
} from '../../Settings';
import anime from 'animejs'

class Portal extends PrefabManager.basePrefab {
    constructor(target) {
        super(target);
    }
    init() {
        super.init();
        this.color;
        this.connectedPortal;
        this.preparingForTeleport = [];
        this.teleportingObjects = [];
        this.jointsToDestroy = [];
    }
    initContactListener() {
        super.initContactListener();
        const self = this;
        this.contactListener.BeginContact = function (contact) {
            if (!self.connectedPortal) return;
            const bodies = [contact.GetFixtureA().GetBody(), contact.GetFixtureB().GetBody()];
            const target = (bodies[0] === self.lookupObject['portal']) ? bodies[1] : bodies[0];
            if (target.GetType() == Box2D.b2_staticBody) return;

            contact.SetEnabled(false);

            let currentTime = Date.now();

            //find all neighbours
            const targets = self.findConnectedBodies(target);


            if(!self.isMajorityInsidePortalRange(targets)) return;



            let teleportDatas = [];

            targets.map((target) => {

                if (target.ignoreCollisionsTime && currentTime < target.ignoreCollisionsTime) return;

                let offsetPosition = target.GetPosition().Clone();
                offsetPosition.SelfSub(self.lookupObject['portal'].GetPosition());
                let offsetPositionLength = offsetPosition.Length();
                let offsetPositionAngle = Math.atan2(offsetPosition.y, offsetPosition.x) - self.lookupObject['portal'].GetAngle();
                const offsetAngle = target.GetAngle() - self.lookupObject['portal'].GetAngle();
                target.ignoreCollisionsTime = currentTime + Settings.timeBetweenTeleports;

                const linearVelocityAngle = Math.atan2(target.GetLinearVelocity().y, target.GetLinearVelocity().x) - self.lookupObject['portal'].GetAngle();
                const linearVelocityLength = target.GetLinearVelocity().Length();

                var teleportData = {
                    target,
                    position: target.GetPosition(),
                    angle: target.GetAngle(),
                    offsetPositionLength,
                    offsetPositionAngle,
                    offsetAngle,
                    linearVelocityAngle,
                    linearVelocityLength,
                    angularVelocity: target.GetAngularVelocity()
                };
                teleportDatas.push(teleportData);
            });

            self.preparingForTeleport.push(teleportDatas);
            //Disable Bodies that are going to be teleported
        }
        this.contactListener.PostSolve = function (contact, impulse) {
            // const bodies = [contact.GetFixtureA().GetBody(), contact.GetFixtureB().GetBody()];
            // const target = (bodies[0] === self.lookupObject['bullet']) ? bodies[1] : bodies[0];
            // console.log("hit target:", tagret);
        }
    }
    teleport(teleportDatas) {
        this.teleportingObjects.push(teleportDatas);
        const self = this;
        let teleportedBodies = [];
        teleportDatas.map((teleportData) => {
            var animValues = {
                tint: teleportData.target.mySprite.tint,
                tintPercentage: 0.0,
                opacity: 1.0,
            }
            teleportData.target.mySprite.convertToHeaven();
            anime({
                targets: animValues,
                tint: 0x000000,
                tintPercentage: 1.0,
                opacity: 0.0,
                duration: 150,
                direction: 'alternate',
                easing: 'linear',
                update: function () {
                    //console.log(animValues.tint, animValues.tintPercentage, teleportData.target.mySprite);
                    teleportData.target.mySprite.alpha = animValues.opacity;
                    // teleportData.target.mySprite.tint = animValues.tint;
                    // teleportData.target.mySprite.color.dark[0] = teleportData.target.mySprite.color.light[0] * animValues.tintPercentage;
                    // teleportData.target.mySprite.color.dark[1] = teleportData.target.mySprite.color.light[1] * animValues.tintPercentage;
                    // teleportData.target.mySprite.color.dark[2] = teleportData.target.mySprite.color.light[2] * animValues.tintPercentage;
                    // teleportData.target.mySprite.color.invalidate();
                },
                complete: function () {
                    const newPosition = self.lookupObject['portal'].GetPosition().Clone();
                    const angle = self.lookupObject['portal'].GetAngle() + teleportData.offsetPositionAngle;
                    const offsetPosition = new Box2D.b2Vec2(teleportData.offsetPositionLength * Math.cos(angle), teleportData.offsetPositionLength * Math.sin(angle));
                    newPosition.SelfAdd(offsetPosition);
                    teleportData.target.SetPosition(newPosition);
                    teleportData.target.SetAngle(self.lookupObject['portal'].GetAngle() + teleportData.offsetAngle);

                    //translate linear velocity:
                    const translatedAngle = self.lookupObject['portal'].GetAngle() - teleportData.linearVelocityAngle;
                    const translatedVelocity = new Box2D.b2Vec2(-teleportData.linearVelocityLength * Math.cos(translatedAngle), -teleportData.linearVelocityLength * Math.sin(translatedAngle));
                    teleportData.target.SetLinearVelocity(translatedVelocity);

                    teleportData.target.SetAngularVelocity(teleportData.angularVelocity);
                    teleportData.target.SetActive(true);

                    teleportedBodies.push(teleportData.target);
                    if(teleportedBodies.length == teleportDatas.length){
                        game.editor.applyToObjects(game.editor.TRANSFORM_ROTATE, 180, teleportedBodies);
                        teleportedBodies = undefined;
                    }

                }
            });
        });
    }



    findConnectedBodies(target) {

        let targetsFound = [target];
        const self = this;

        const crawlJoints = function (_target) {
            var jointEdge = _target.GetJointList();
            while (jointEdge) {
                let targetBody = (jointEdge.joint.GetBodyA() == _target) ? jointEdge.joint.GetBodyB() : jointEdge.joint.GetBodyA();
                if (targetBody.GetType() == Box2D.b2_staticBody) {
                    targetBody = undefined;
                    self.jointsToDestroy.push(jointEdge.joint);
                }
                if (targetBody && !targetsFound.includes(targetBody)) {
                    targetsFound.push(targetBody);
                    crawlJoints(targetBody);
                }
                jointEdge = jointEdge.next;
            }
        }
        crawlJoints(target);

        return targetsFound;
    }
    isMajorityInsidePortalRange(targets) {
        let targetsInsideRange = [];

        const tolerance = 0.7;

        const portalAngleVector = new Box2D.b2Vec2(Math.cos(this.lookupObject['portal'].GetAngle()), Math.sin(this.lookupObject['portal'].GetAngle()));
        const rayEndOffset = portalAngleVector.SelfMul(10.0);
        const self = this;

        this.rayCastCallback  = function () {
            this.m_hit = false;
        };
        this.rayCastCallback.prototype.ReportFixture = function (fixture, point, normal, fraction) {
            if(fixture.GetBody() !== self.lookupObject['portal']) return -1;
            this.m_hit = true;
            this.m_point = point.Clone();
            this.m_normal = normal;
            this.m_fixture = fixture;
            return fraction;
        }

        targets.map((target)=>{
            const rayStart = target.GetPosition();
            let rayEnd = target.GetPosition().Clone();
            rayEnd.SelfSub(rayEndOffset);
            let callback = new this.rayCastCallback();
            target.GetWorld().RayCast(callback, rayStart, rayEnd);
            if (callback.m_hit) {
                targetsInsideRange.push(target);
            }
        });

        let minimumAmmountOfObjects = (targets.length == 1) ? 1 : Math.floor(targets.length*tolerance);

        return (targetsInsideRange.length >= minimumAmmountOfObjects);

    }

    setColor(color) {
        this.color = color;
        this.lookupObject.portal.mySprite.data.colorFill[0] = color;
        game.editor.updateBodyShapes(this.lookupObject.portal);
    }
    linkPortal(portal) {
        this.connectedPortal = portal;
        portal.connectedPortal = this;
    }
    update() {
        if (this.preparingForTeleport.length > 0) {
            this.preparingForTeleport.map((teleportDatas) => {
                teleportDatas.map((teleportData) => {
                    teleportData.target.SetPosition(teleportData.position);
                    teleportData.target.SetAngle(teleportData.angle);
                    teleportData.target.SetActive(false);
                });
                this.connectedPortal.teleport(teleportDatas);
            });
            this.preparingForTeleport = [];
        }
        if (this.jointsToDestroy.length > 0) {
            this.jointsToDestroy.map((joint) => {
                game.world.DestroyJoint(joint);
            });
            this.jointsToDestroy = [];
        }
    }
    destroy() {
        game.editor.deleteObjects([this.prefabObject]);
    }
}
PrefabManager.prefabLibrary.Portal = {
    json: '{"objects":[[0,0,0,0,"","portal",0,["#0093ff"],["#000"],[1],true,true,[[{"x":-0.7676813864695209,"y":5.66424374341025},{"x":-0.7676813864695209,"y":-5.66424374341025},{"x":0.7676813864695207,"y":-5.66424374341025},{"x":0.7676813864695207,"y":5.66424374341025}]],[1],2,[0],"",[1]]]}',
    class: Portal,
}
// PrefabManager.prefabLibrary.Portal = {
//     json: '{"objects":[[0,-0.06249997827993725,0.4166665218662454,0,"","portal",0,["#ffffff"],["#000"],[1],true,true,[[{"x":-0.7708330654525546,"y":5.624998045194317},{"x":-0.7708330654525546,"y":-5.624998045194317},{"x":0.7708330654525546,"y":-5.624998045194317},{"x":0.7708330654525546,"y":5.624998045194317}]],[1],0,[0],"",[1]],[6,24.999991311974743,3.7499986967962116,0,"","",1,"#ff0000","#000",1,14.740585273506932,[{"x":0,"y":0},{"x":0,"y":0}],0,28.26353781431091,0.31475766139130845,0,"",1]]}',
//     class: Portal,
// }
