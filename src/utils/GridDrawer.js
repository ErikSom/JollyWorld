export const drawGrid = (graphics, camera, size) => {

	if(graphics.gridText){
		graphics.gridText.destroy()
		delete graphics.gridText;
	}

	if(size === 0){
		return;
	}



	const targetWidth = window.innerWidth;
	const targetHeight = window.innerHeight;

	let realPixelSize = parseFloat(size);
	let actualSize = realPixelSize * camera.scale.x;

	const zoomStep = 2;

	while(actualSize < size / zoomStep){
		actualSize *= zoomStep;
		realPixelSize *= zoomStep;
	}

	while(actualSize > size * zoomStep){
		actualSize /= zoomStep;
		realPixelSize /= zoomStep;
	}


	const gridText = new PIXI.Text(`${realPixelSize.toFixed(2)}px`, new PIXI.TextStyle({fontSize: 18, fill: 0xFFFFFF, stroke: 0x000000, strokeThickness: 4}))
	gridText.pivot.set(gridText.width / 2, gridText.height / 2);
	gridText.x = window.innerWidth / 2;
	gridText.y = 80;
	graphics.gridText = gridText;
	graphics.addChild(gridText);


	const xOffset = camera.position.x % actualSize;
	const xCameraOffset = -Math.round(((- xOffset) + camera.position.x) / actualSize);
	let i = 0;

	for(let x = 0; x < targetWidth; x += actualSize) {
		const realX = xCameraOffset + i;

		const thick = realX % 10 === 0 ? 4 : 1;

		graphics.lineStyle(thick, realX % 2 === 0 ? 0x414141 : 0x9f9e9e, 0.6);

		graphics.moveTo(x + xOffset, 0);
		graphics.lineTo(x + xOffset, targetHeight);
		i++;
	}

	const yOffset = camera.position.y % actualSize;
	const yCameraOffset = -Math.round(((- yOffset) + camera.position.y) / actualSize);
	i = 0;

	for(let y = 0; y < targetHeight; y += actualSize) {
		const realY = yCameraOffset + i;

		const thick = realY % 10 === 0 ? 4 : 1;

		graphics.lineStyle(thick, realY % 2 === 0 ? 0x414141 : 0x9f9e9e, 0.6);

		graphics.moveTo(0, y + yOffset);
		graphics.lineTo(targetWidth, y + yOffset);
		i++;
	}
}
