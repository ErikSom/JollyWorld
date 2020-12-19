let horizontalScrollBar;
let horizontalDrag;
let verticalScrollBar;
let verticalDrag;

import { B2dEditor } from "../B2dEditor";
import {editorSettings} from "./editorSettings";
import * as camera from "./camera";

export let screenWidth = 1;
export let screenHeight= 1;

export const update = function(){
    if(!horizontalScrollBar){
        buildScrollBars();
    }
    screenWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    screenHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

    const cameraHolder = B2dEditor.cameraHolder;
    const zoom = cameraHolder.scale.x;
    const position = {
        x:-cameraHolder.x + editorSettings.worldSize.width/2.0 * zoom, 
        y:-cameraHolder.y + editorSettings.worldSize.height/2.0*zoom
    };

    const horizontalScroll = (position.x+screenWidth/2.0) / (editorSettings.worldSize.width*zoom);
    const horizontalVisible = (screenWidth/zoom) / editorSettings.worldSize.width;
    horizontalDrag.style.width = `${horizontalVisible*100}%`;
    horizontalDrag.style.left = `${horizontalScroll*100}%`;

    const verticalScroll = (position.y+screenHeight/2.0) / (editorSettings.worldSize.height*zoom);
    const verticalVisible = (screenHeight/zoom) / editorSettings.worldSize.height;
    verticalDrag.style.height = `${verticalVisible*100}%`;
    verticalDrag.style.top = `${verticalScroll*100}%`;
}

const buildScrollBars = function (){

    horizontalScrollBar = document.createElement('div');
    horizontalScrollBar.classList.add('horizontal');
    horizontalScrollBar.classList.add('scrollBar');
    horizontalDrag = document.createElement('div');
    horizontalDrag.classList.add('dragBar');
    horizontalScrollBar.appendChild(horizontalDrag);

    verticalScrollBar = document.createElement('div');
    verticalScrollBar.classList.add('vertical');
    verticalScrollBar.classList.add('scrollBar');
    verticalDrag = document.createElement('div');
    verticalDrag.classList.add('dragBar');
    verticalScrollBar.appendChild(verticalDrag);

    document.body.appendChild(horizontalScrollBar);
    document.body.appendChild(verticalScrollBar);

    horizontalScrollBar.addEventListener("mousedown", initHorizontalDragScroll);
    verticalScrollBar.addEventListener("mousedown", initVerticalDragScroll);
}
let scrollHorizontalOffset = 0;
let scrollVerticalOffset = 0;
const initHorizontalDragScroll = function(e){
    document.addEventListener("mousemove", doHorizontalScroll);
    document.addEventListener("mouseup", endHorizontalScroll);
    var rect = horizontalDrag.getBoundingClientRect();
    if(e.pageX>rect.left && e.pageX<rect.right){
        scrollHorizontalOffset = (e.pageX-rect.left)-(rect.right-rect.left)/2
    }else scrollHorizontalOffset = 0;
    doHorizontalScroll(e);
}
const endHorizontalScroll = function(e){
    document.removeEventListener("mousemove", doHorizontalScroll);
    document.removeEventListener("mouseup", endHorizontalScroll);
}
const doHorizontalScroll = function(e){
    const cameraHolder = B2dEditor.cameraHolder;
    const rect = horizontalScrollBar.getBoundingClientRect();
    let targetPerc = (e.pageX-scrollHorizontalOffset-rect.left)/(rect.right-rect.left);
    
    targetPerc = Math.min(1.0, Math.max(0.0, targetPerc));
    cameraHolder.x = -(targetPerc * (editorSettings.worldSize.width * cameraHolder.scale.x)-screenWidth/2.0-editorSettings.worldSize.width/2.0 * cameraHolder.scale.x);
    
    camera.constrainCameraPosition();
    update();
}
const initVerticalDragScroll = function(e){
    document.addEventListener("mousemove", doVerticalScroll);
    document.addEventListener("mouseup", endVerticalScroll);
    var rect = verticalDrag.getBoundingClientRect();
    if(e.pageY>rect.top && e.pageY<rect.bottom){
        scrollVerticalOffset = (e.pageY-rect.top)-(rect.bottom-rect.top)/2
    }else scrollVerticalOffset = 0;
    doVerticalScroll(e);
}
const endVerticalScroll = function(e){
    document.removeEventListener("mousemove", doVerticalScroll);
    document.removeEventListener("mouseup", endVerticalScroll);
}
const doVerticalScroll = function(e){
    const cameraHolder = B2dEditor.cameraHolder;
    const rect = verticalScrollBar.getBoundingClientRect();
    
    let targetPerc = (e.pageY-scrollVerticalOffset-rect.top)/(rect.bottom-rect.top);
    targetPerc = Math.min(1.0, Math.max(0.0, targetPerc));

    cameraHolder.y = -(targetPerc * (editorSettings.worldSize.height*cameraHolder.scale.y)-screenHeight/2.0-editorSettings.worldSize.height/2.0*cameraHolder.scale.y);
    camera.constrainCameraPosition();
    update();
}
export const hide = function(){
    horizontalScrollBar.style.display = "none";
    verticalScrollBar.style.display = "none";
}
export const show = function(){
    horizontalScrollBar.style.display = "block";
    verticalScrollBar.style.display = "block";
}