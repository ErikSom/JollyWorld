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

    const zoom = B2dEditor.container.scale.x;
    const position = {x:-B2dEditor.container.x+editorSettings.worldSize.width/2.0*zoom, y:-B2dEditor.container.y+editorSettings.worldSize.height/2.0*zoom};

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
const initHorizontalDragScroll = function(e){
    document.addEventListener("mousemove", doHorizontalScroll);
    document.addEventListener("mouseup", endHorizontalScroll);
    doHorizontalScroll(e);
}
const endHorizontalScroll = function(e){
    document.removeEventListener("mousemove", doHorizontalScroll);
    document.removeEventListener("mouseup", endHorizontalScroll);
}
const doHorizontalScroll = function(e){
    var rect = horizontalScrollBar.getBoundingClientRect();
    let targetPerc = (e.pageX-rect.left)/(rect.right-rect.left);
    targetPerc = Math.min(1.0, Math.max(0.0, targetPerc));
    B2dEditor.container.x = -(targetPerc * (editorSettings.worldSize.width*B2dEditor.container.scale.x)-screenWidth/2.0-editorSettings.worldSize.width/2.0*B2dEditor.container.scale.x);
    camera.constrainCameraPosition();
    update();
}
const initVerticalDragScroll = function(e){
    document.addEventListener("mousemove", doVerticalScroll);
    document.addEventListener("mouseup", endVerticalScroll);
    doVerticalScroll(e);
}
const endVerticalScroll = function(e){
    document.removeEventListener("mousemove", doVerticalScroll);
    document.removeEventListener("mouseup", endVerticalScroll);
}
const doVerticalScroll = function(e){
    var rect = verticalScrollBar.getBoundingClientRect();
    let targetPerc = (e.pageY-rect.top)/(rect.bottom-rect.top);
    targetPerc = Math.min(1.0, Math.max(0.0, targetPerc));
    B2dEditor.container.y = -(targetPerc * (editorSettings.worldSize.height*B2dEditor.container.scale.y)-screenHeight/2.0-editorSettings.worldSize.height/2.0*B2dEditor.container.scale.y);
    camera.constrainCameraPosition();
    update();
}