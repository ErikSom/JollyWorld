export const colorMatrixEffects = ['none', 'blackAndWhite', 'brightness', 'contrast', 'grayscale', 'hue', 'lsd', 'negative', 'night', 'polaroid', 'predator', 'saturate', 'sepia'];

export const guiToEffectProps = data =>{

	const index = colorMatrixEffects.indexOf(data.selectedEffect);
	const intensity = data.intensity;
	const alpha = data.alpha === undefined ? 1.0 : data.alpha;

	return [index, intensity, alpha];

}

export const applyColorMatrixMultiple = (targets, effect) =>{
	targets.forEach(target => applyColorMatrix(target, effect));
}

export const applyColorMatrix = (target, effect) =>{
	if(target.filters){
		for(let i = 0; i<target.filters.length; i++){
			if(target.filters[i] instanceof PIXI.filters.ColorMatrixFilter){
				target.filters.splice(i, 1);
				i--;
			}
		}
	}

	if(!effect || !effect[0]) return;

	const cf = new PIXI.filters.ColorMatrixFilter();
	const type = colorMatrixEffects[effect[0]];
	const intensity = effect[1];
	const alpha = effect[2] === undefined ? 1.0 : effect[2];

	if(!Array.isArray(target.filters)) target.filters = [];

	if(['brightness','contrast','grayscale','night','predator','saturate','hue'].includes(type)){
		cf[type](intensity);
	}else{
		cf[type]();
	}

	cf.alpha = alpha;

	target.filters.push(cf);
}


export const setEffectProperties = (effect, folder, data) => {
	let intensityEl = null;
	let alphaEl = null;
	switch(effect){
		case 'brightness':
			intensityEl = folder.add(data, 'intensity', 0, 2).step(0.01);
			break;
		case 'contrast':
		case 'saturate':
			intensityEl = folder.add(data, 'intensity', -1, 1).step(0.01);
			break;
		case 'grayscale':
		case 'night':
		case 'predator':
			intensityEl = folder.add(data, 'intensity', 0, 1).step(0.01);
		break;

		case 'hue':
			intensityEl = folder.add(data, 'intensity', 0, 360).step(0.01);
		break;
	}
	if(effect !== 'none') alphaEl = folder.add(data, 'alpha', 0, 1).step(0.01);

	return [intensityEl, alphaEl];
}
