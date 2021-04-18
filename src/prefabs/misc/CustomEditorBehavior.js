import {
    game
} from "../../Game";

export const stopCustomBehaviour = () => {
    game.editor.customPrefabMouseDown = null;
    game.editor.customPrefabMouseMove = null;
    game.editor.customDebugDraw = null;
}

export const drawObjectAdding = (prefab, types, allowPrefabs = false) => {

    if(!Array.isArray(types)) types = [types];

    const bodyObject = prefab.class.base;
    const sprite = bodyObject.mySprite ? bodyObject.mySprite : bodyObject;

    const editor = game.editor;

    let tarSprite = editor.getPIXIPointFromWorldPoint(editor.mousePosWorld);
    editor.debugGraphics.lineStyle(1, editor.jointLineColor, 1);

	let highestObject = editor.retrieveHighestSelectedObject(editor.mousePosWorld, editor.mousePosWorld);

    prefab.class.linkObjectTarget = null;

    if(highestObject){
        let objectData = highestObject.mySprite ? highestObject.mySprite.data : highestObject.data;
        let shouldAdd = false;

        types.forEach(type => {
            if(objectData.type === type || (typeof type === 'string' && highestObject.myBody && highestObject.myBody[type])){
                shouldAdd = true;
            }
        })

        if(!allowPrefabs && objectData.prefabInstanceName) shouldAdd = false;

        if(shouldAdd){
            tarSprite = highestObject;
            prefab.class.linkObjectTarget = tarSprite;
            editor.debugGraphics.lineStyle(1, "0xFFFF00", 1);
        }
    }

    editor.debugGraphics.moveTo(sprite.x * editor.cameraHolder.scale.x + editor.cameraHolder.x, sprite.y * editor.cameraHolder.scale.y + editor.cameraHolder.y);
    editor.debugGraphics.lineTo(tarSprite.x * editor.cameraHolder.scale.x + editor.cameraHolder.x, tarSprite.y * editor.cameraHolder.scale.y + editor.cameraHolder.y);
}
