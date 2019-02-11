import { game } from "../Game";
import * as emitterData from "../data/emitterData";
import { Settings } from "../Settings";

let emitters = [];
let emittersPool = [];

export const init = function(){
    /*TODO
   1) Create proper pooler per available types
   */
   const emitterPoolData = [{type:'blood', poolSize:30}, {type:'gorecloud', poolSize:15}];
   emitterPoolData.map((data)=>{
       for (let i = 0; i < data.poolSize; i++) getEmitter(data.type, null);
   })
  for (let i = 0; i < emitters.length; i++) emittersPool[emitters[i].type].push(emitters[i]);
}
export const playOnceEmitter = function (type, body, point, angle) {

   if (!body.emitterCount || body.emitterCount < Settings.emittersPerBody) {
       let emitter = getEmitter(type, body);
       emitter.spawnPos = new PIXI.Point(point.x * Settings.PTM, point.y * Settings.PTM);
       emitter.body = body;
       if (!body.emitterCount) body.emitterCount = 0;
       body.emitterCount++;

       function returnToPool() {
           emitter.body.emitterCount--;
           emitter.body = null;
           emitter.lastUsed = Date.now();
           emitter._completeCallback = null;
           emittersPool[emitter.type].push(emitter);

       }
       var angleOffset = (emitter.maxStartRotation - emitter.minStartRotation) / 2;
       emitter.minStartRotation = angle - angleOffset;
       emitter.maxStartRotation = angle + angleOffset;
       emitter.playOnce(returnToPool);
   }
}
export const getEmitter = function (type, body) {
   if (!emittersPool[type]) emittersPool[type] = [];
   if (emittersPool[type].length > 0) return emittersPool[type].shift();

   var emitter;
   switch (type) {
       case "blood":
           emitter = new PIXI.particles.Emitter(
               game.myContainer, [PIXI.Texture.fromImage('particle.png'), PIXI.Texture.fromImage('particle-grey.png')],
               emitterData[type]
           );
           break;
       case "gorecloud":
           emitter = new PIXI.particles.Emitter(
               game.myContainer, [PIXI.Texture.fromImage('gore-cloud.png')],
               emitterData[type]
           );
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
       } else emitter.update(Settings.timeStep * 0.001);
   }
}