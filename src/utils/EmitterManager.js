import {
    game
} from "../Game";
import * as emitterData from "../data/emitterData";
import {
    Settings
} from "../Settings";

let emitters = [];
let emittersPool = {};
let globalBody = {
    emitterCount: 0
};

export const init = function () {
    /*TODO
   1) Create proper pooler per available types
   */
    const emitterPoolData = [{
        type: 'blood',
        poolSize: 30
    }, {
        type: 'gorecloud',
        poolSize: 15
    }, {
        type: 'explosion_layer1',
        poolSize: 10
    }, {
        type: 'explosion_layer2',
        poolSize: 10
    },{
        type: 'explosion2_layer1',
        poolSize: 10
    }, {
        type: 'explosion2_layer2',
        poolSize: 10
    }];
    emitterPoolData.map((data) => {
        for (let i = 0; i < data.poolSize; i++) getEmitter(data.type);
    })
    for (let i = 0; i < emitters.length; i++) {
        emittersPool[emitters[i].type].push(emitters[i]);
    }
}
export const playOnceEmitter = function (type, body, point, angle) {
    if (!angle) angle = 0;
    if (!body) body = globalBody;

    const maxEmitters = body === globalBody ? 30 : Settings.emittersPerBody;
    if (body && body.emitterCount && body.emitterCount >= maxEmitters) return;

    let emitter = getEmitter(type);
    emitter.spawnPos = new PIXI.Point(point.x * Settings.PTM, point.y * Settings.PTM);


    if(body && body.mySprite){
        // create container - postion container at right index
        // make sure to delete container on reset!!
        if(!emitter.container){
            emitter.container = new PIXI.Container();
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
    emitter.playOnce(returnToPool);


}
export const getEmitter = function (type) {
    if (!emittersPool[type]) emittersPool[type] = [];
    if (emittersPool[type].length > 0) return emittersPool[type].shift();

    let emitter;
    switch (type) {
        case "blood":
            emitter = new PIXI.particles.Emitter(
                game.editor.textures, [PIXI.Texture.fromImage('particle.png'), PIXI.Texture.fromImage('particle-grey.png')],
                emitterData[type]
            );
            break;
        case "gorecloud":
            emitter = new PIXI.particles.Emitter(
                game.editor.textures, [PIXI.Texture.fromImage('gore-cloud.png')],
                emitterData[type]
            );
            break;
        case "explosion_layer1":
            emitter = new PIXI.particles.Emitter(
                game.editor.textures, [PIXI.Texture.fromImage('Smoke_1.png'), PIXI.Texture.fromImage('Smoke_2.png'), PIXI.Texture.fromImage('Smoke_3.png'), PIXI.Texture.fromImage('Smoke_4.png')],
                emitterData[type]
            );
            break;
        case "explosion_layer2":
            emitter = new PIXI.particles.Emitter(
                game.editor.textures, [PIXI.Texture.fromImage('Fire_1.png'), PIXI.Texture.fromImage('Fire_2.png'), PIXI.Texture.fromImage('Fire_3.png')],
                emitterData[type]
            );
            break;
        case "explosion2_layer1":
            emitter = new PIXI.particles.Emitter(
                game.editor.textures, [PIXI.Texture.fromImage('Smoke_Fire_10000'), PIXI.Texture.fromImage('Smoke_Fire_20000'), PIXI.Texture.fromImage('Smoke_Fire_30000'), PIXI.Texture.fromImage('Smoke_Fire_40000')],
                emitterData['explosion_layer1']
            );
            emitter.minimumSpeedMultiplier = 6;
            emitter.frequency = 0.0005;
        break;
        case "explosion2_layer2":
            emitter = new PIXI.particles.Emitter(
                game.editor.textures, [PIXI.Texture.fromImage('Fire_Fire_10000'), PIXI.Texture.fromImage('Fire_Fire_20000'), PIXI.Texture.fromImage('Fire_Fire_30000')],
                emitterData['explosion_layer2']
            );
            emitter.minimumSpeedMultiplier = 9;
            emitter.frequency = 0.0005;
         break;
    }
    emitter.type = type;
    emitters.push(emitter);
    return emitter;
}
export const update = function () {
    for (var i = 0; i < emitters.length; i++) {
        var emitter = emitters[i];
        if (!emitter.body && emittersPool[emitter.type] > Settings.emitterPool) {
            if (Date.now() - emitter.lastUsed > Settings.emitterMaxPoolTime) {
                for (var j = 0; j < emittersPool[emitter.type].length; j++)
                    if (emittersPool[emitter.type][j] == emitter) emittersPool[emitter.type].splice(j, 1);
                emitter.destroy();
                emitters.splice(i, 1);
                i--;
            }
        } else emitter.update(game.editor.deltaTime * 0.001);
    }
}
export const reset = function () {
    emittersPool = {};
    for (let i = 0; i < emitters.length; i++) {
        let emitter = emitters[i];
        emitter.body = undefined;
        emitter.cleanup();
        if(emitter.container){
            emitter.parent = game.editor.textures;
            delete emitter.container;
        }
        if (!emittersPool[emitter.type]) emittersPool[emitter.type] = [];
        emittersPool[emitter.type].push(emitter);
    }
}
