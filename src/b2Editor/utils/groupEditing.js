import {
    game
} from "../../Game"
import {
	editorSettings
} from './editorSettings';


export const startEditingGroup = () => {
	const editor = game.editor;

	if(editor.groupEditing) return;

	editor.groupMinChildIndex = editor.textures.children.length-1;

	editor.groupEditingObject = null;
	if(editor.selectedPhysicsBodies.length > 0){
		editor.groupEditingObject = editor.selectedPhysicsBodies[0].mySprite;
	}else{
		editor.groupEditingObject = editor.selectedTextures[0];
	}
	editor.groupEditingObject.children.forEach( obj => obj.visible = false);
	editor.groupEditingObject.oldVisible = editor.groupEditingObject.visible;
	editor.groupEditingObject.visible = true;

	if(editor.groupEditingObject.myBody && editor.groupEditingObject.myBody.myTexture){
		editor.groupEditingObject.myBody.myTexture.oldVisible = editor.groupEditingObject.myBody.myTexture.visible;
		editor.groupEditingObject.myBody.myTexture.visible = true;
		editor.groupEditingObject.myBody.myTexture.children.forEach(obj => obj.visible = false);
	}


	// add black overlay
	const highestChild = editor.textures.children[editor.groupMinChildIndex];
	editor.groupEditingBlackOverlay = new PIXI.Graphics();
	editor.groupEditingBlackOverlay.beginFill(0x000000);
	editor.groupEditingBlackOverlay.drawRect(-editorSettings.worldSize.width/2, -editorSettings.worldSize.height/2, editorSettings.worldSize.width, editorSettings.worldSize.height);
	editor.groupEditingBlackOverlay.alpha = 0.3;
	highestChild.addChild(editor.groupEditingBlackOverlay);

	// clone object and ungroup
	editor.copiedJSON = editor.copySelection();
	editor.pasteSelection(true);

	let clonedSprite;
	if(editor.selectedPhysicsBodies.length > 0){
		clonedSprite = editor.selectedPhysicsBodies[0].mySprite;
		editor.updateBodyPosition(clonedSprite.myBody);
	}else{
		clonedSprite = editor.selectedTextures[0];
	}
	editor.ungroupObjects();

	editor.copiedJSON = "";
	// this must come after ungroup else it won't work
	editor.groupEditing = true;

}

export const stopEditingGroup = () => {
	const editor = game.editor;
	if(!editor.groupEditing) return;

	// small cleanup
	editor.groupEditing = false;
	editor.groupEditingObject.children.forEach( obj => obj.visible = true);
	editor.groupEditingObject.visible = editor.groupEditingObject.oldVisible;
	delete editor.groupEditingObject.oldVisible;


	if(editor.groupEditingObject.myBody && editor.groupEditingObject.myBody.myTexture){
		editor.groupEditingObject.myBody.myTexture.visible = editor.groupEditingObject.myBody.myTexture.oldVisible;
		delete editor.groupEditingObject.myBody.myTexture.oldVisible;
		editor.groupEditingObject.myBody.myTexture.children.forEach(obj => obj.visible = true);
	}

	editor.groupEditingBlackOverlay.parent.removeChild(editor.groupEditingBlackOverlay);
	delete editor.groupEditingBlackOverlay;

	editor.selectedPhysicsBodies = [];
	editor.selectedTextures = [];

	// we regroup all the ungrouped shapes
	for(let i = editor.groupMinChildIndex+1; i< editor.textures.children.length; i++){
		const sprite = editor.textures.children[i];
		if(sprite.data.type === editor.object_BODY){
			editor.selectedPhysicsBodies.push(sprite.myBody)
		}else{
			editor.selectedTextures.push(sprite);
		}
	}
	
	// TODO: fix graphics / texts / animations
	// Remove Auto save when editing
	// Reset editor when going in test mode or changing tools

	// we must first restore the rotation
	editor.groupObjects();

	const allObjects = editor.selectedPhysicsBodies.length > 0 ? editor.selectedPhysicsBodies : editor.selectedTextures;
	editor.applyToObjects(editor.TRANSFORM_ROTATE, -editor.groupEditingObject.rotation * editor.RAD2DEG, allObjects, true);

	editor.ungroupObjects();
	editor.groupObjects();

	// we find the grouped object assign its properties to the original and then delete it
	let clonedSprite;
	let isBody = false;
	if(editor.selectedPhysicsBodies.length > 0){
		clonedSprite = editor.selectedPhysicsBodies[0].mySprite;
		editor.updateBodyPosition(clonedSprite.myBody);
		isBody = true;
	}else{
		clonedSprite = editor.selectedTextures[0];
	}


	console.log(clonedSprite.data.x, clonedSprite.data.y, editor.groupEditingObject.data.x, editor.groupEditingObject.data.y)


	delete clonedSprite.data.ID;
	
	const xDif = editor.groupEditingObject.data.x - clonedSprite.data.x;
	const yDif = editor.groupEditingObject.data.y - clonedSprite.data.y;

	Object.assign(editor.groupEditingObject.data, clonedSprite.data);

	// we then update the visuals for the group

	if(isBody){
		editor.updateBodyFixtures(editor.groupEditingObject.myBody);
		editor.updateBodyShapes(editor.groupEditingObject.myBody);
		editor.groupEditingObject.myBody.GetPosition().x -= xDif;
		editor.groupEditingObject.myBody.GetPosition().y -= yDif;

		const clonedTexture = clonedSprite.myBody.myTexture;
		if(clonedTexture){
			const originalTexture = editor.groupEditingObject.myBody.myTexture;
			delete clonedTexture.data.ID;

			if(clonedTexture.data.type === editor.object_GRAPHICGROUP){
				Object.assign(originalTexture.data, clonedTexture.data);
				editor.updateGraphicGroupShapes(originalTexture); // is this a graphic group???
			}else if(clonedTexture.data.type === editor.object_GRAPHIC){
				Object.assign(originalTexture.data, clonedTexture.data);
				editor.updateGraphicShapes(originalTexture);
				originalTexture.visible = originalTexture.data.visible
			}else if(clonedTexture.data.type === editor.object_TEXT){
				Object.assign(originalTexture.data, clonedTexture.data);
				originalTexture.textSprite.text = originalTexture.data.text;

				originalTexture.textSprite.style.fontFamily = originalTexture.data.fontName;
				originalTexture.textSprite.style.fontSize = originalTexture.data.fontSize;
				originalTexture.textSprite.style.fill = originalTexture.data.textColor;
				originalTexture.textSprite.style.align = originalTexture.data.textAlign;

				originalTexture.pivot.set(originalTexture.textSprite.width / 2, originalTexture.textSprite.height / 2);
				originalTexture.visible = originalTexture.data.visible
			}

		}


	} else {
		editor.updateGraphicGroupShapes(editor.groupEditingObject);
		editor.groupEditingObject.x -= xDif;
		editor.groupEditingObject.y -= yDif;
	}
	editor.groupEditingObject.calculateBounds();

	// we restore the editor
	editor.groupEditingObject = null;


	// we can now delete things again so we delete the cloned group
	editor.deleteSelection();

	// restore last bits
	editor.groupMinChildIndex = -1;
	editor.selectedTool = -1;
	editor.selectTool(editor.tool_SELECT)

	// store the new edited group
	editor.storeUndoMovementDebounced();

}
