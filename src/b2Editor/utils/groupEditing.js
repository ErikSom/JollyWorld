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
		editor.groupEditingObject.myBody.myTexture.children.forEach(obj =>{
			obj.oldVisible = obj.visible;
			obj.visible = false
		});
	}

	// add black overlay
	editor.groupEditingBlackOverlay = new PIXI.Graphics();
	editor.groupEditingBlackOverlay.beginFill(0x000000);
	editor.groupEditingBlackOverlay.drawRect(-editorSettings.worldSize.width/2, -editorSettings.worldSize.height/2, editorSettings.worldSize.width, editorSettings.worldSize.height);
	editor.groupEditingBlackOverlay.alpha = 0.3;
	editor.groupEditingBlackOverlay.data = {};
	editor.textures.addChild(editor.groupEditingBlackOverlay);

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
		editor.groupEditingObject.myBody.myTexture.children.forEach(obj => {
			obj.visible = obj.oldVisible;
			delete obj.oldVisible;
		});
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
	let groupDeleted = false;
	if(editor.selectedPhysicsBodies.length > 0){
		clonedSprite = editor.selectedPhysicsBodies[0].mySprite;
		editor.updateBodyPosition(clonedSprite.myBody);
		isBody = true;
	}else if(editor.selectedPhysicsBodies.length > 0){
		clonedSprite = editor.selectedTextures[0];
	}else{
		// everything got deleted
		console.log("GROUP DELETED!!");
		groupDeleted = true;
	}

	if(!groupDeleted){
		delete clonedSprite.data.ID;

		const xDif = editor.groupEditingObject.data.x - clonedSprite.data.x;
		const yDif = editor.groupEditingObject.data.y - clonedSprite.data.y;

		Object.assign(editor.groupEditingObject.data, clonedSprite.data);

		// we then update the visuals for the group

		if(isBody){
			editor.updateBodyFixtures(editor.groupEditingObject.myBody);
			editor.updateBodyShapes(editor.groupEditingObject.myBody);
			editor.groupEditingObject.myBody.ResetMassData();

			const position = editor.groupEditingObject.myBody.GetPosition();
			position.x -= xDif;
			position.y -= yDif;
			editor.groupEditingObject.myBody.SetPosition(position);
			const originalTexture = editor.groupEditingObject.myBody.myTexture;
			const clonedTexture = clonedSprite.myBody.myTexture;
			if(clonedTexture){

				if(originalTexture){
					delete clonedTexture.myBody.myTexture;
					clonedTexture.data.ID = originalTexture.data.ID;
					editor.groupEditingObject.myBody.myTexture = clonedTexture;
					clonedTexture.data.bodyID = originalTexture.data.bodyID;
					clonedTexture.myBody = editor.groupEditingObject.myBody;

					originalTexture.parent.swapChildren(originalTexture, clonedTexture);
					editor.deleteObjects([originalTexture]);
				}else{
					delete clonedTexture.myBody.myTexture;
					editor.groupEditingObject.parent.addChildAt(clonedTexture, editor.groupMinChildIndex+1);
					editor.setTextureToBody(editor.groupEditingObject.myBody, clonedTexture, clonedTexture.data.texturePositionOffsetLength, clonedTexture.data.texturePositionOffsetAngle, clonedTexture.data.textureAngleOffset);
				}
			} else if(originalTexture){
				editor.groupEditingObject.renderable = true;
				editor.removeTextureFromBody(editor.groupEditingObject.myBody, originalTexture);
				editor.deleteObjects([originalTexture]);
			}
		} else {
			editor.updateGraphicGroupShapes(editor.groupEditingObject);
			editor.groupEditingObject.x -= xDif;
			editor.groupEditingObject.y -= yDif;
		}

		editor.updateObject(editor.groupEditingObject, editor.groupEditingObject.data);

	}else{

		if(editor.groupEditingObject.data.type === editor.object_BODY){
			editor.deleteObjects([editor.groupEditingObject.myBody]);
		}else{
			editor.deleteObjects([editor.groupEditingObject]);
		}
	}


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
