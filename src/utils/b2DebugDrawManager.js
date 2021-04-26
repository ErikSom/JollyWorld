import { makeDebugDraw } from '../../libs/debugdraw';
import { game } from '../Game';
import { Settings } from '../Settings';

let canvas = document.createElement('canvas');
let ctx = canvas.getContext('2d', {alpha:true});

export const init = () => {
	document.body.appendChild(canvas);
	canvas.style = `
		position:absolute;
		top:0;
		left:0;
	`;
	const debugDraw = makeDebugDraw(ctx, Settings.PTM, Box2D);
	game.world.SetDebugDraw(debugDraw);
}

export const resize = () => {
	canvas.style.width = `${window.innerWidth}px`;
	canvas.style.height = `${window.innerHeight}px`;
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
}

export const drawCanvas = cameraPosition => {
	ctx.fillStyle = 'rgba(0,0,0,0)';
	ctx.fillRect(0, 0, canvas.width, canvas.height);
  
	ctx.save();
	ctx.scale(Settings.PTM, Settings.PTM);
	ctx.translate(cameraPosition.x, cameraPosition.y);
	ctx.lineWidth /= Settings.PTM;

	ctx.fillStyle = 'rgb(255,255,0)';
	game.world.DebugDraw();

	ctx.restore();
  };
