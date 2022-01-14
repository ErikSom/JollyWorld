
import { B2dEditor } from "../B2dEditor";
import {editorSettings} from "./editorSettings";
import * as scrollBars from "./scrollBars";
import { Settings } from "../../Settings";


let storedCameraPosition = {
    x:0,
    y:0
}
let storedZoom = undefined;

export const pan = function(move){    
    const camera = B2dEditor.container.camera || B2dEditor.container;

    camera.x += move.x * Settings.PTM;
    camera.y += move.y * Settings.PTM;
    B2dEditor.mousePosWorld.x -= move.x / camera.scale.x;
    B2dEditor.mousePosWorld.y -= move.y / camera.scale.y;
    constrainCameraPosition();
}
export const set = function(pos){
    const camera = B2dEditor.container.camera || B2dEditor.container;

    camera.x = pos.x;
    camera.y = pos.y;
    constrainCameraPosition();
}
export const storeCurrentPosition = function(){
    const camera = B2dEditor.container.camera || B2dEditor.container;

    storedCameraPosition = {x:camera.x, y:camera.y};
    storedZoom = camera.scale.x;
}

export const resetToStoredPosition = function(){
    const camera = B2dEditor.container.camera || B2dEditor.container;

    if(storedZoom){
        camera.scale.x = storedZoom;
        camera.scale.y = storedZoom;
    }else{
        storedCameraPosition.x = window.innerWidth/2;
        storedCameraPosition.y = window.innerHeight/2;
    }
    set(storedCameraPosition);
}

export const zoom = function (pos, isZoomIn) {

    var direction = isZoomIn ? 1 : -1;
    var factor = (1 + direction * 0.1);

    const camera = B2dEditor.container.camera || B2dEditor.container;

    setZoom(pos, camera.scale.x * factor);
}
export const setZoom = function (pos, scale) {
    const camera = B2dEditor.container.camera || B2dEditor.container;

    scale = Math.min(10, Math.max(0.01, scale));
    var worldPos = {
        x: (pos.x),
        y: (pos.y)
    };
    var newScale = {
        x: scale,
        y: scale
    };
    var newScreenPos = {
        x: (worldPos.x) * newScale.x + camera.x,
        y: (worldPos.y) * newScale.y + camera.y
    };


    camera.x -= (newScreenPos.x - (pos.x * camera.scale.x + camera.x));
    camera.y -= (newScreenPos.y - (pos.y * camera.scale.y + camera.y));
    camera.scale.x = newScale.x;
    camera.scale.y = newScale.y;

    let guiUpscaleX = 1;
    if(newScale.x < 1){
        guiUpscaleX = Math.max(1, 6 * (1 - newScale.x));
    }
    for (let i = 0; i < B2dEditor.editorIcons.length; i++) {
        B2dEditor.editorIcons[i].scale.x = B2dEditor.editorIcons[i].scale.y = (1.0 / newScale.x) / guiUpscaleX;
    }
    if(scrollBars.screenWidth/scale> editorSettings.worldSize.width){
        // small epsilon to prevent infinite loop zoom
        scale = scrollBars.screenWidth/editorSettings.worldSize.width+0.00001;
        setZoom(pos, scale)
        return;
    }else if(scrollBars.screenHeight/scale> editorSettings.worldSize.height){
        scale = scrollBars.screenHeight/editorSettings.worldSize.height+0.00001;
        setZoom(pos, scale)
        return;
    }
    constrainCameraPosition();
    scrollBars.update();
}

export const constrainCameraPosition = function(){
    const camera = B2dEditor.container.camera || B2dEditor.container;

    let difX = (-camera.x) + (editorSettings.worldSize.width/2*camera.scale.x)
    if(difX>0) {
        difX = (editorSettings.worldSize.width/2*camera.scale.x-scrollBars.screenWidth) + (camera.x);
        if(difX>0){
            difX = 0;
        }
    }else difX *= -1;

    let difY = (-camera.y) + (editorSettings.worldSize.height/2*camera.scale.y)
    if(difY>0) {
        difY = (editorSettings.worldSize.height/2*camera.scale.y-scrollBars.screenHeight) + (camera.y);
        if(difY>0){
            difY = 0;
        }
    }else difY *= -1;

    camera.x -= difX;
    camera.y -= difY;
    B2dEditor.mousePosWorld.x += difX / Settings.PTM / camera.scale.x;
    B2dEditor.mousePosWorld.y += difY / Settings.PTM / camera.scale.y;
}
