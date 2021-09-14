const PIXIFILTERS = require('pixi-filters')

import {
    game
} from "../Game"

let currentEffects = [];
let pixiFilters = [];
let effectTarget = null;

export const init = (target) =>{
	effectTarget = target;
}
export const update = () => {
	currentEffects.forEach(effect => effect.update());
}
export const effectTypes = {
	screenShake:'screenShake',
	shockWave:'shockWave',
}
export const addEffect = (type, props) =>{
	let effect = null;
	const effectMargin = 300;


	if(props.point){
		props.point = game.editor.container.toGlobal(props.point);

		if (game.editor.container.camera) {
			game.editor.container.camera.toScreenPoint(props.point, props.point);
		}

		if(props.point.x > window.innerWidth + effectMargin || props.point.x < -effectMargin
			|| props.point.y > window.innerHeight + effectMargin || props.point.y < -effectMargin){
				return;
		}
	}

	switch(type){
		case effectTypes.shockWave:
			props.follow = game.editor.container;

			const shockFilter = new PIXIFILTERS.ShockwaveFilter([props.point.x, props.point.y], {
				amplitude: 20,
				wavelength: 351,
				brightness: 1,
				radius: props.radius,
			})
			effect = new PixiEffect(shockFilter, type, {...props, startTime:Date.now(), maxLife:600, stageX:effectTarget.x, stageY:effectTarget.y})
		break;
		case effectTypes.screenShake:
			const centerDistanceX = window.innerWidth / 2 - props.point.x;
			const centerDistanceY = window.innerHeight / 2 - props.point.y;
			const centerDistance = Math.sqrt(centerDistanceX * centerDistanceX + centerDistanceY * centerDistanceY);

			const maxLengthX = window.innerWidth / 2 + effectMargin / 2;
			const maxLengthY = window.innerHeight / 2 + effectMargin / 2;
			const maxLength = Math.sqrt(maxLengthX * maxLengthX + maxLengthY * maxLengthY);

			const effectDegration = 1 - (centerDistance / maxLength);

			effect = new ScreenShakeEffect(props.amplitude * effectDegration, 500, 60);
		break
	}
	if(effect) currentEffects.push(effect);
}
export const removeEffect = effect =>{
	for(let i = 0; i<currentEffects.length; i++){
		if(currentEffects[i] === effect){
			currentEffects.splice(i, 1);
			effect.remove(effect.filter);
			break;
		}
	}
}

class BaseEffect{
	constructor(){}
	add(){}
	remove(){}
	update(){}
}

class PixiEffect extends BaseEffect{
	constructor(filter, type, props){
		super();
		this.props = props;
		this.filter = filter;
		this.type = type;
		this.startTime = Date.now();
		this.add(filter);
	}
	add(pixiFilter){
		if(!pixiFilters.includes(pixiFilter)){
			pixiFilters.push(pixiFilter);
			this.applyFilters();
		}
	}
	remove(pixiFilter){
		if(pixiFilters.includes(pixiFilter)){
			pixiFilters = pixiFilters.filter(eff => eff != pixiFilter);
			this.applyFilters();
		}
	}
	update(){
		if(this.type == effectTypes.shockWave){
			this.filter.time = ((Date.now()-this.startTime)/1000*2)%2.5;

			if(this.oldFollowX != this.props.follow.x || this.oldFollowY != this.props.follow.y){
				if(this.oldFollowX == undefined){
					this.oldFollowX = this.props.follow.x;
					this.oldFollowY = this.props.follow.y;
				}
				this.props.point.x -= this.oldFollowX-this.props.follow.x;
				this.props.point.y -= this.oldFollowY-this.props.follow.y;
				this.oldFollowX = this.props.follow.x;
				this.oldFollowY = this.props.follow.y;

				this.filter.center.x = this.props.point.x;
				this.filter.center.y = this.props.point.y;
				const scale = this.props.follow.scale.x;
				this.filter.radius = this.props.radius*scale;
				this.filter.wavelength = 351*scale;
				this.filter.amplitude = 20*scale;
				this.filter.speed = 500*scale;
			}

		}
		if(this.props.maxLife && Date.now() > this.startTime+this.props.maxLife){
			removeEffect(this);
		}
	}
	applyFilters(){
		effectTarget.filters = pixiFilters;
	}
}
class ScreenShakeEffect extends BaseEffect{
	constructor(amplitude, duration, frequency){
		super();
		this.amplitude = amplitude;
		this.duration = duration;
		this.frequency = frequency;
		this.startTime = Date.now();
		this.t = 0;
		this.add();
	}
	add(){
		const sampleCount = (this.duration/1000) * this.frequency;
		this.samplesx = [];
		this.samplesy = [];
		for(let i = 0; i < sampleCount; i++) {
			this.samplesx.push(Math.random() * 2 - 1);
			this.samplesy.push(Math.random() * 2 - 1);
		}
	}
	strength(samples){
		const s = this.t / 1000 * this.frequency;
		const s0 = Math.floor(s);
		const s1 = s0 + 1;
		const k = this.decay();
		return (this.noise(s0, samples) + (s - s0)*(this.noise(s1, samples) - this.noise(s0, samples))) * k;
	};
	update(){
		this.t = Date.now() - this.startTime;
		if(this.t > this.duration){
			removeEffect(this);
			return;
		}
		effectTarget.x = this.strength(this.samplesx)*this.amplitude;
		effectTarget.y = this.strength(this.samplesy)*this.amplitude;
	};
	remove(){
		effectTarget.x = 0;
		effectTarget.y = 0;
	}
	decay(){
		if(this.t >= this.duration) return 0;
		return (this.duration - this.t) / this.duration;
	}
	noise(s, samples)
	{
		if(s >= samples.length) return 0;
		return samples[s];
	};
}
