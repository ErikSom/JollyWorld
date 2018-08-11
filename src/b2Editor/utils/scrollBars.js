let horizontalScrollBar;
let horizontalDrag;
let verticalScrollBar;
let verticalDrag;

import { B2dEditor } from "../B2dEditor";
import {editorSettings} from "./editorSettings";

export let screenWidth = 1;
export let screenHeight= 1;

export const update = function(){
    if(!horizontalScrollBar){
        buildScrollBars();
    }
    screenWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    screenHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;

    const zoom = B2dEditor.container.scale.x;
    const position = {x:-B2dEditor.container.x+editorSettings.worldSize.width/2.0*zoom, y:B2dEditor.container.y-screenHeight/2/zoom+editorSettings.worldSize.height/2.0};
    const horizontalScroll = (position.x+screenWidth/2.0) / (editorSettings.worldSize.width*zoom);
    const horizontalVisible = (screenWidth/zoom) / editorSettings.worldSize.width;

    horizontalDrag.style.width = `${horizontalVisible*100}%`;
    horizontalDrag.style.left = `${horizontalScroll*100}%`

}

const buildScrollBars = function (){

    horizontalScrollBar = document.createElement('div');
    horizontalScrollBar.classList.add('scrollBar');
    horizontalDrag = document.createElement('div');
    horizontalDrag.classList.add('dragBar');
    horizontalScrollBar.appendChild(horizontalDrag);

    document.body.appendChild(horizontalScrollBar);

}