import { game } from "../Game";
import { Settings } from "../Settings";
import * as PIXI from 'pixi.js';
import * as PhysicsParticleEmitter from './PhysicsParticleEmitter';

const vec1 = new Box2D.b2Vec2(0, 0);

export const  generateGoreParticles = (targetBodyPart, sprite, position, angle, velocity, noExtraGore, skin) => {
    if(!Settings.goreEnabled) return;
    let meatParticles = ["Gore_Meat", "Gore_Meat", "Gore_Meat"];
    let extraParticles = [];
    switch(targetBodyPart){
        case 'head':
            extraParticles.push('Gore_Brain');
            if(skin >= 0) extraParticles.push('Normal_Head_Gore1', 'Normal_Head_Gore2');
            meatParticles.push("Gore_Meat", "Gore_Meat");
        break
        case 'body':
            extraParticles.push('Gore_LungRight', 'Gore_LungLeft', 'Gore_Stomach','Gore_Liver');
            if(skin >= 0) extraParticles.push('Normal_Core_Gore2', 'Normal_Core_Gore1');
            meatParticles.push("Gore_Meat", "Gore_Meat","Gore_Meat", "Gore_Meat");
        break;
        case 'belly':
            extraParticles.push('Gore_Intestine');
            if(skin >= 0) extraParticles.push('Normal_Belly_Gore1');
        break;
        case 'thigh_left':
        case 'thigh_right':
            if(skin >= 0) extraParticles.push('Normal_Thigh_Gore1');
            meatParticles.push("Gore_Meat");
        break;
        case 'leg_left':
        case 'leg_right':
            if(skin >= 0) extraParticles.push('Normal_Leg_Gore1');
            meatParticles.push("Gore_Meat");
        break;
        case 'hand_left':
        case 'hand_right':
            meatParticles = ['Gore_Meat'];
        break;
        case 'feet_left':
        case 'feet_right':
            meatParticles = ['Gore_Meat', 'Gore_Meat'];
        break;
        case 'shoulder_left':
        case 'shoulder_right':
            if(skin >= 0) extraParticles.push('Normal_Shoulder_Gore1');
        break;
        case 'arm_left':
        case 'arm_right':
            if(skin >= 0) extraParticles.push('Normal_Arm_Gore1');
        break;
    }

    if(noExtraGore){
        extraParticles.length = 0;
        // NO EXTRA GORE FOR KIDS & BABY
    }

    const particlesToGenerate = meatParticles.concat(extraParticles);
    const goreParticleMaxSpeed = 50;

    const targetChildIndex = sprite.parent.getChildIndex(sprite);

    for(let i = 0; i< particlesToGenerate.length; i++){
        const particle = particlesToGenerate[i];
        if(particle === 'Gore_Meat'){
            const ranId = Math.floor(Math.random()*6)+1;
            particlesToGenerate[i] = particle+ranId+'0000';
        }else if(particle.indexOf('Normal_') === 0){
            const targetFrame = String(skin).padStart(4, '0');
            particlesToGenerate[i] = particle+targetFrame;
        }else {
            particlesToGenerate[i] = particlesToGenerate[i] + '0000';
        }
    }

    PhysicsParticleEmitter.emit(particlesToGenerate, position, particlesToGenerate.length, 5, goreParticleMaxSpeed, false, undefined, angle, undefined, velocity,  targetChildIndex, false);
}
