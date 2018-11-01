
import { B2dEditor } from "../B2dEditor";
import {editorSettings} from "./editorSettings";
import * as scrollBars from "./scrollBars";
import { Settings } from "../../Settings";


let storedCameraPosition = {
    x:0,
    y:0
}
let storedZoom;

export const pan = function(move){
    B2dEditor.container.x += move.x * Settings.PTM;
    B2dEditor.container.y += move.y * Settings.PTM;
    B2dEditor.mousePosWorld.x -= move.x / B2dEditor.container.scale.x;
    B2dEditor.mousePosWorld.y -= move.y / B2dEditor.container.scale.y;
    constrainCameraPosition();
}
export const set = function(pos){
    B2dEditor.container.x = pos.x;
    B2dEditor.container.y = pos.y;
    constrainCameraPosition();
}
export const storeCurrentPosition = function(){
    console.log(B2dEditor.container.x, "THIS IS THE X!!!");
    storedCameraPosition = {x:B2dEditor.container.x, y:B2dEditor.container.y};
    storedZoom = B2dEditor.container.scale.x;
    console.log(storedCameraPosition, storedZoom);
}

export const resetToStoredPosition = function(){
    if(!storedZoom) return;
    console.log(storedZoom);
    console.log(storedCameraPosition);
    B2dEditor.container.scale.x = storedZoom;
    B2dEditor.container.scale.y = storedZoom;
    set(storedCameraPosition);
}

export const zoom = function (pos, isZoomIn) {

    var direction = isZoomIn ? 1 : -1;
    var factor = (1 + direction * 0.1);
    setZoom(pos, B2dEditor.container.scale.x * factor);
}
export const setZoom = function (pos, scale) {
    scale = Math.min(10, Math.max(0.1, scale));
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
    if(scrollBars.screenWidth/scale> editorSettings.worldSize.width){
        scale = scrollBars.screenWidth/editorSettings.worldSize.width;
        setZoom(pos, scale)
        return;
    }else if(scrollBars.screenHeight/scale> editorSettings.worldSize.height){
        scale = scrollBars.screenHeight/editorSettings.worldSize.height;
        setZoom(pos, scale)
        return;
    }
    constrainCameraPosition();
    scrollBars.update();
}
export const constrainCameraPosition = function(){
    let difX = (-B2dEditor.container.x) + (editorSettings.worldSize.width/2*B2dEditor.container.scale.x)
    if(difX>0) {
        difX = (editorSettings.worldSize.width/2*B2dEditor.container.scale.x-scrollBars.screenWidth) + (B2dEditor.container.x);
        if(difX>0){
            difX = 0;
        }
    }else difX *= -1;

    let difY = (-B2dEditor.container.y) + (editorSettings.worldSize.height/2*B2dEditor.container.scale.y)
    if(difY>0) {
        difY = (editorSettings.worldSize.height/2*B2dEditor.container.scale.y-scrollBars.screenHeight) + (B2dEditor.container.y);
        if(difY>0){
            difY = 0;
        }
    }else difY *= -1;

    B2dEditor.container.x -= difX;
    B2dEditor.container.y -= difY;
    B2dEditor.mousePosWorld.x += difX / Settings.PTM / B2dEditor.container.scale.x;
    B2dEditor.mousePosWorld.y += difY / Settings.PTM / B2dEditor.container.scale.y;
}