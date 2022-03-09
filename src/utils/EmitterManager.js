import {
    game
} from "../Game";
import * as emitterData from "../data/emitterData";
import { Settings } from "../Settings";
import { AnimatedParticle } from 'pixi-particles';
import { SuperEmitter as Emitter } from './SuperEmitter';

import * as PIXI from 'pixi.js';


let emitters = [];
let emittersPool = {};
let globalBody = {
    emitterCount: 0
};

export const init = function () {
    const emitterPoolData = [{
        type: 'blood',
        poolSize: 12
    },
    {
        type: 'bloodSpray',
        poolSize: 6
    },
    {
        type: 'gorecloud',
        poolSize: 8
    }, {
        type: 'explosion_layer1',
        poolSize: 8
    }, {
        type: 'explosion_layer2',
        poolSize: 8
    },{
        type: 'explosion2_layer1',
        poolSize: 8
    }, {
        type: 'explosion2_layer2',
        poolSize: 8
    },
    {
        type: 'screenConfetti',
        poolSize: 3
    },
    {
        type: 'confetti',
        poolSize: 3
    },
    {
        type: 'splash',
        poolSize: 6
    }];
    emitterPoolData.forEach((data) => {
        for (let i = 0; i < data.poolSize; i++) getEmitter(data.type, true, true);
    })
    for (let i = 0; i < emitters.length; i++) {
        emittersPool[emitters[i].type].push(emitters[i]);
    }
}
export const playOnceEmitter = function (type, body, point, angle, randomColors) {
    if(['blood', 'gorecloud'].includes(type) && (!Settings.goreEnabled || !Settings.bloodEnabled)) return;
    if (!angle) angle = 0;
    if (!body) body = globalBody;


    const maxEmitters = body === globalBody ? 30 : Settings.emittersPerBody;
    if (body && body.emitterCount && body.emitterCount >= maxEmitters) return;


    let emitter = getEmitter(type);
    if(!emitter) return;
    emitter.spawnPos = new PIXI.Point(point.x * Settings.PTM, point.y * Settings.PTM);

    if(type === 'blood'){
        emitter.acceleration.x = game.world.GetGravity().x * 200;
        emitter.acceleration.y = game.world.GetGravity().y * 200;

    }

    attachEmitter(body, emitter);

    if (body) {
        emitter.body = body;
        if (!body.emitterCount) body.emitterCount = 0;
        body.emitterCount++;
    }

    function returnToPool() {
        if (emitter.body) {
            emitter.body.emitterCount--;
            emitter.body = undefined;
        }
        emitter.lastUsed = Date.now();
        emitter._completeCallback = undefined;
        emittersPool[emitter.type].push(emitter);

    }
    const angleOffset = (emitter.maxStartRotation - emitter.minStartRotation) / 2;
    emitter.minStartRotation = angle - angleOffset;
    emitter.maxStartRotation = angle + angleOffset;

    if(randomColors) {
        //console.warn("v5 + version of pixi particle remove this method");
        emitter.setRandomColors(randomColors);
    }

    emitter.playOnce(returnToPool);

    return emitter;
}

export const getLoopingEmitter = function(type,body,point,angle){
    if (!angle) angle = 0;

    let emitter = getEmitter(type, false);
    if(!emitter) return;
    emitter.spawnPos = new PIXI.Point(point.x * Settings.PTM, point.y * Settings.PTM);

    attachEmitter(body, emitter);

    const angleOffset = (emitter.maxStartRotation - emitter.minStartRotation) / 2;
    emitter.minStartRotation = angle - angleOffset;
    emitter.maxStartRotation = angle + angleOffset;

    return emitter;
}


const attachEmitter = (body, emitter)=>{
    if(body && body.mySprite){
        // create container - postion container at right index
        // make sure to delete container on reset!!
        if(!emitter.container){
            emitter.container = new PIXI.Container();//.particles.ParticleContainer();
            emitter.parent.addChild(emitter.container)
            emitter.parent = emitter.container;
        }

        let targetIndex;
        if(body.myTexture) targetIndex = body.myTexture.parent.getChildIndex(body.myTexture);
        else targetIndex = body.mySprite.parent.getChildIndex(body.mySprite);

        emitter.container.parent.addChildAt(emitter.container, targetIndex+1)
    }else if(emitter.container){
        emitter.parent = emitter.container.parent;
        emitter.container.parent.removeChild(emitter.container);
        delete emitter.container;
    }
}

export const destroyEmitter = emitter =>{
    if(!emitter) return;
    if(emitter.container){
        emitter.container.parent.removeChild(emitter.container);
        delete emitter.container;
    }
    emitter.destroy();
}

const ignorePool = {
    "jetfire": true,
    "cannonShoot": true,
    "sparksMetal": true
}

export const getEmitter = function (type, pool = true, init = false) {
    if(pool){
        if (!emittersPool[type]) emittersPool[type] = [];
        if (emittersPool[type].length > 0) return emittersPool[type].shift();
        // some particles ignore the pool
        if(!init && ignorePool[type]) return;
    }

    let emitter;
    switch (type) {
        case "blood":
            emitter = new Emitter(
                game.editor.textures, [
                    PIXI.Texture.from('particle.png'), 
                    PIXI.Texture.from('particle-grey.png')
                ],
                emitterData[type]
            );
            break;

        case "bloodSpray":
            emitter = new Emitter(
                game.editor.textures, [
                    PIXI.Texture.from('particle.png'), 
                    PIXI.Texture.from('particle-grey.png')
                ],
                emitterData[type]
            );
            break;
        case "gorecloud":
            emitter = new Emitter(
                game.editor.textures, [PIXI.Texture.from('gore-cloud.png')],
                emitterData[type]
            );
            break;
        case "explosion_layer1":
            emitter = new Emitter(
                game.editor.textures, [PIXI.Texture.from('Smoke_1.png'), PIXI.Texture.from('Smoke_2.png'), PIXI.Texture.from('Smoke_3.png'), PIXI.Texture.from('Smoke_4.png')],
                emitterData[type]
            );
            break;
        case "explosion_layer2":
            emitter = new Emitter(
                game.editor.textures, [PIXI.Texture.from('Fire_1.png'), PIXI.Texture.from('Fire_2.png'), PIXI.Texture.from('Fire_3.png')],
                emitterData[type]
            );
            break;
        case "explosion2_layer1":
            emitter = new Emitter(
                game.editor.textures, [PIXI.Texture.from('Smoke_Fire_10000'), PIXI.Texture.from('Smoke_Fire_20000'), PIXI.Texture.from('Smoke_Fire_30000'), PIXI.Texture.from('Smoke_Fire_40000')],
                emitterData['explosion_layer1']
            );
            emitter.minimumSpeedMultiplier = 6;
            emitter.frequency = 0.0005;
        break;
        case "explosion2_layer2":
            emitter = new Emitter(
                game.editor.textures, [PIXI.Texture.from('Fire_Fire_10000'), PIXI.Texture.from('Fire_Fire_20000'), PIXI.Texture.from('Fire_Fire_30000')],
                emitterData['explosion_layer2']
            );
            emitter.minimumSpeedMultiplier = 9;
            emitter.frequency = 0.0005;
         break;
         case "jetfire":
            emitter = new Emitter(
                game.editor.textures, [PIXI.Texture.from('particle.png'), PIXI.Texture.from('particle-fire.png')],
                emitterData[type]
            );
            break;
        case "cannonShoot":
            emitter = new Emitter(
                game.editor.textures, [PIXI.Texture.from('particle.png')],
                emitterData[type]
            );
            break;
        case "sparksMetal":
            emitter = new Emitter(
                game.editor.textures, [PIXI.Texture.from('particle-spark.png')],
                emitterData[type]
            );
            break;
        case "confetti":
            emitter = new Emitter(
                game.editor.textures,
                emitterData.confettiFrames,
                emitterData['confetti']
            );
            emitter.particleConstructor = AnimatedParticle;
            break;
        case "screenConfetti":
            emitter = new Emitter(
                game.stage,
                emitterData.confettiFrames,
                emitterData['confetti']
            );
            emitter.particleConstructor = AnimatedParticle;
            break;
        case "splash":
            emitter = new Emitter(
                game.editor.textures, [PIXI.Texture.from('Splash')],
                emitterData[type]
            );
            break;
    }
    if(pool){
        emitter.type = type;
        emitters.push(emitter);
    }
    return emitter;
}
export const update = function () {

    for (var i = 0; i < emitters.length; i++) {
        var emitter = emitters[i];
        if (!emitter.body && emittersPool[emitter.type]) {
            // if (Date.now() - emitter.lastUsed > Settings.emitterMaxPoolTime) {
            //     for (var j = 0; j < emittersPool[emitter.type].length; j++){
            //         if (emittersPool[emitter.type][j] == emitter){
            //             emittersPool[emitter.type].splice(j, 1);
            //         }
            //     }
            //     emitter.destroy();
            //     emitters.splice(i, 1);
            //     i--;
            // }
        } else emitter.update(game.editor.deltaTime * 0.001);
    }
}
export const reset = function () {
    emittersPool = {}
    for (let i = 0; i < emitters.length; i++) {
        let emitter = emitters[i];
        emitter.body = undefined;
        emitter.cleanup();
        emitter.emit = false;
        if(emitter.container){
            emitter.parent = game.editor.textures;
            delete emitter.container;
        }
        if (!emittersPool[emitter.type]) emittersPool[emitter.type] = [];
        emittersPool[emitter.type].push(emitter);
    }
}
