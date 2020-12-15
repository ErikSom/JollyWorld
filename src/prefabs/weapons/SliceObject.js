import * as PrefabManager from '../PrefabManager';

import {
    game
} from "../../Game";

import {Character} from '../humanoids/Character'
 

export class SliceObject extends PrefabManager.basePrefab {
    constructor(target) {
        super(target);
    }
    init() {
        this.sliceForce = 50;
        this.sliceChance = .3;
        super.init();
        this.sliceBody = this.lookupObject['sliceBody'];
        this.objectsToSlice = [];
    }
    update(){
        super.update();
        if(this.objectsToSlice){
            this.objectsToSlice.forEach(body => {
            let jointEdge = body.GetJointList();
                while (jointEdge) {
                    const next = jointEdge.next;
                    if(Math.random()<this.sliceChance){
                        game.editor.deleteObjects([jointEdge.joint]);
                    }
                    jointEdge = next;
                }
            });
        }
    }
    initContactListener() {
        super.initContactListener();
        const self = this;
        this.contactListener.PostSolve = function (contact, impulse) {
            const bodies = [contact.GetFixtureA().GetBody(), contact.GetFixtureB().GetBody()];

            const sliceBody = (bodies[0] == self.sliceBody) ? bodies[0] : bodies[1];
            const otherBody = (bodies[0] == self.sliceBody) ? bodies[1] : bodies[0];

            if(sliceBody != self.sliceBody || !otherBody.isFlesh) return;

            const count = contact.GetManifold().pointCount;
            let force = 0;
            for (let j = 0; j < count; j++) force = Math.max(force, impulse.normalImpulses[j]);
            if(force > self.sliceForce){
                if(!self.objectsToSlice.includes(otherBody)){
                    self.objectsToSlice.push(otherBody);
                }

                if(otherBody.isFlesh){
                    const refName = otherBody?.mySprite?.data?.refName;
                    let damage = 30;
                    if(refName === Character.BODY_PARTS.HEAD || refName === Character.BODY_PARTS.BODY){
                        damage = 1000;
                    }
                    const characterClass = game.editor.retrieveSubClassFromBody(otherBody);
                    characterClass.dealDamage(damage);
                }


            }

		}
    }
}
