let horizontalScrollBar;
let horizontalDrag;
let verticalScrollBar;
let verticalDrag;

import { B2dEditor } from "../B2dEditor";
import {editorSettings} from "./editorSettings";

export const update = function(){
    if(!horizontalScrollBar){
        buildScrollBars();
    }
    
    const screenWidth = window.innerWidth || document.documentElement.clientWidth || document.body.clientWidth;
    const screenHeight = window.innerHeight || document.documentElement.clientHeight || document.body.clientHeight;
    const position = {x:B2dEditor.container.x-screenWidth/2, y:B2dEditor.container.y-screenHeight/2};
    const zoom = B2dEditor.container.scale.x;


    const horizontalScroll = (editorSettings.worldSize.width-(screenWidth/zoom))/ position.x;
    const horizontalVisible = editorSettings.worldSize.width/(screenWidth/zoom);

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