export default (target, color, progress) => {
	const cm = new PIXI.filters.ColorMatrixFilter();

	if(!target.filters) target.filters = [cm];
	else {
		target.filters = target.filters.filter(cm => target.activeCM != cm);
		target.filters.push(cm);
	}

	const r = (color >> 16) & 0xFF;
	const g = (color >>  8) & 0xFF;
	const b = color & 0xFF;

	cm.matrix = [
		0, 0, 0, 0, r / 256,
		0, 0, 0, 0, g / 256,
		0, 0, 0, 0, b / 256,
		0, 0, 0, 1, 0,
	];

	cm.alpha = progress;

	target.activeCM = cm;

	return cm;
}
