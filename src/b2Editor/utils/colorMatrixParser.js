export const colorMatrixEffects = ['none', 'blackAndWhite', 'brightness', 'browni', 'contrast', 'grayscale', 'hue', 'lsd', 'negative', 'night', 'polaroid', 'predator', 'saturate', 'sepia'];

export const guiToEffectProps = data =>{

	const index = colorMatrixEffects.indexOf(data.selectedEffect);
	const intensity = data.intensity;

	return [index, intensity];

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

	if(!Array.isArray(target.filters)) target.filters = [];


	if(['brightness','contrast','grayscale','night','predator','saturate','hue'].includes(type)){
		cf[type](intensity);
	}else{
		cf[type]();
	}

	target.filters.push(cf);
}


export const setEffectProperties = (effect, folder, data) => {
	let guiElement = null;
	switch(effect){
		case 'brightness':
			guiElement = folder.add(data, 'intensity', 0, 2);
			break;
		case 'contrast':
		case 'saturate':
			guiElement = folder.add(data, 'intensity', -1, 1);
			break;
		case 'grayscale':
		case 'night':
		case 'predator':
			guiElement = folder.add(data, 'intensity', 0, 1);
		break;

		case 'hue':
			guiElement = folder.add(data, 'intensity', 0, 360);
		break;
	}
	return guiElement;
}
