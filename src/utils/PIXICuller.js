const PIXI = require('pixi.js');

let cellDictionary = {};
let renderArea = {x:100, y:300, width:400, height:400};
let cellSize = {x:200, y:200};
let container;
let updateTicks = 0;
let debugGraphics;
export let debug = true;

export const init = function(_container){
    container = _container;

    if(debug){
        debugGraphics = container.addChild(new PIXI.Graphics());
    }

    cellDictionary = {};
    for(var i = 0; i<container.children.length; i++){
        //graphic.renderable = false;
        placeGraphicInCell(container.children[i]);
    }

    updateVisibleCells();
}

const placeGraphicInCell = function(graphic){
    if(graphic._cullingCell){
        cellDictionary[graphic._cullingCell] = cellDictionary[graphic._cullingCell].filter(item => item !== graphic);
    }

    const cellX = Math.floor(graphic.x / cellSize.x);
    const cellY = Math.floor(graphic.y / cellSize.y);
    const cell = `${cellX}_${cellY}`;
    if(cellDictionary[cell] == undefined) cellDictionary[cell] = [false, 0];
    cellDictionary[cell].push(graphic);


    //graphic.renderable = cellDictionary[cell][0];

    graphic._cullingCell = cell;

}

const updateVisibleCells = function(){
    updateTicks++;
    const global_sp = new PIXI.Point (renderArea.x, renderArea.y);
    const global_ep = new PIXI.Point (renderArea.x+renderArea.width, renderArea.y+renderArea.height);
    const sp = container.toLocal(global_sp);
    const ep = container.toLocal(global_ep);
    const w = ep.x-sp.x;
    const h = ep.y-sp.y;
    if(debug){
        debugGraphics.clear();
        debugGraphics.lineStyle(10, 0x00FF00, 1);
        debugGraphics.drawRect(sp.x, sp.y, w, h);
    }

    const startTileX = Math.floor(sp.x/cellSize.x);
    const startTileY = Math.floor(sp.y/cellSize.y);

    const visibileXTiles = Math.ceil(w/cellSize.x)+1;
    const visibileYTiles = Math.ceil(h/cellSize.y)+1;


    for(var i = 0; i<visibileXTiles; i++){
        for(var j = 0; j<visibileYTiles; j++){
            const tileX = startTileX+i;
            const tileY = startTileY+j;
            const cell = `${tileX}_${tileY}`;

            if(debug){
                debugGraphics.lineStyle(10, 0x008800, 0.5);
                debugGraphics.drawRect(tileX*cellSize.x, tileY*cellSize.y, cellSize.x, cellSize.y);
            }

        }
    }

}
export const update = function(){
    updateVisibleCells();
}