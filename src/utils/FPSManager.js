import {
    game
} from "../Game";
import { Settings } from "../Settings";

const measuredFPS = [];
const measureSteps = 5*60;
let ticks = 0;
const idleTime = 1000;

export const update = deltaTime =>{
	if(game.gameState === game.GAMESTATE_NORMALPLAY && game.run && (Date.now()-game.levelStartTime) > idleTime){
		measuredFPS.push(deltaTime);
		if(measuredFPS.length>measureSteps) measuredFPS.shift();
		ticks++;
		if(ticks% measureSteps === 0){
			let averageFPS = measuredFPS.reduce((a, b) => a + b, 0);
			averageFPS /= measuredFPS.length;
			if(1000/averageFPS < Settings.FPSLimitTarget){
				console.log("DROPPING THE FPS!!!!");
				Settings.FPSLimiter = true;
			}
		}
	}else{
		measuredFPS.length = 0;
		ticks = 0;
		Settings.FPSLimiter = false;
	}
}
