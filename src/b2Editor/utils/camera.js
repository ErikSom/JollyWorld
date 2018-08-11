
import { B2dEditor } from "../B2dEditor";
import {editorSettings} from "./editorSettings";
import * as scrollBars from "./scrollBars";


export const pan = function(move){
    B2dEditor.container.x += move.x * B2dEditor.PTM;
    B2dEditor.container.y += move.y * B2dEditor.PTM;
    B2dEditor.mousePosWorld.x -= move.x / B2dEditor.container.scale.x;
    B2dEditor.mousePosWorld.y -= move.y / B2dEditor.container.scale.y;
    constrainCameraPosition();
}

export const zoom = function (pos, isZoomIn) {

    var direction = isZoomIn ? 1 : -1;
    var factor = (1 + direction * 0.1);
    setZoom(pos, B2dEditor.container.scale.x * factor);
}
export const setZoom = function (pos, scale) {
    var worldPos = {
        x: (pos.x),
        y: (pos.y)
    };
    var newScale = {
        x: scale,
        y: scale
    };
    var newScreenPos = {
        x: (worldPos.x) * newScale.x + B2dEditor.container.x,
        y: (worldPos.y) * newScale.y + B2dEditor.container.y
    };
    B2dEditor.container.x -= (newScreenPos.x - (pos.x * B2dEditor.container.scale.x + B2dEditor.container.x));
    B2dEditor.container.y -= (newScreenPos.y - (pos.y * B2dEditor.container.scale.y + B2dEditor.container.y));
    B2dEditor.container.scale.x = newScale.x;
    B2dEditor.container.scale.y = newScale.y;

    var i;
    for (i = 0; i < B2dEditor.editorIcons.length; i++) {
        B2dEditor.editorIcons[i].scale.x = 1.0 / newScale.x;
        B2dEditor.editorIcons[i].scale.y = 1.0 / newScale.y;
    }
    if(scrollBars.screenWidth*scale> editorSettings.worldSize.width){
        scale = editorSettings.worldSize.width/scrollBars.screenWidth;
        setZoom(pos, scale)
        return;
    }else if(scrollBars.screenHeight*scale> editorSettings.worldSize.height){
        scale = editorSettings.worldSize.height/scrollBars.screenHeight;
        setZoom(pos, scale)
        return;
    }
    constrainCameraPosition();
    scrollBars.update();
}
export const constrainCameraPosition = function(){
    let difX = -B2dEditor.container.x + (editorSettings.worldSize.width/2);
    console.log("first", difX);
    if(difX>0) {
        difX = (editorSettings.worldSize.width/2-scrollBars.screenWidth) + (B2dEditor.container.x);
        if(difX>0){
            difX = 0;
        }
        console.log("second", difX, scrollBars.screenWidth/2/B2dEditor.container.scale.x);
    }else difX *= -1;

   console.log("final", difX);

    B2dEditor.container.x -= difX;
    //B2dEditor.container.y += difY;
    B2dEditor.mousePosWorld.x += difX / B2dEditor.PTM / B2dEditor.container.scale.x;
    //B2dEditor.mousePosWorld.y += difY / B2dEditor.PTM / B2dEditor.container.scale.y;
}