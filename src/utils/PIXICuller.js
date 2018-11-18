const PIXI = require('pixi.js');

let cellDictionary = {};
let renderArea = {
    x: 100,
    y: 300,
    width: 400,
    height: 400
};
let cellSize = {
    x: 200,
    y: 200
};
let container;
let updateTicks = 0;
let debugGraphics;
let visibleCells = {};
const settingsIndexCount = 2;
export let debug = true;

export const init = function (_container) {
    container = _container;

    cellDictionary = {};
    for (var i = 0; i < container.children.length; i++) {
        //graphic.renderable = false;
        placeGraphicInCell(container.children[i]);
    }

    const _pixiContainerAddChildSuper = container.addChild;
    container.addChild = function addChild(child) {
        if (arguments.length == 1) child = [child];
        _pixiContainerAddChildSuper.apply(this, child);
        for (let i = 0; i < child.length; i++) {
            placeGraphicInCell(child[i]);
        }
    };
    const _pixiContainerAddChildAtSuper = container.addChildAt;
    container.addChildAt = function addChildAt(child, index) {
        _pixiContainerAddChildAtSuper.apply(this, [child, index]);
        if(child._cullingCell != undefined) return;
        placeGraphicInCell(child[i]);
    };
    const _pixiContainerRemoveChildSuper = container.removeChild;
    container.removeChild = function removeChild(child) {
        if (arguments.length == 1) child = [child];
        _pixiContainerRemoveChildSuper.apply(this, child);
        for (let i = 0; i < child.length; i++) {
            removeGraphicFromCell(child[i]);
        }
    };
    update();
}

const placeGraphicInCell = function (graphic) {
    if(graphic == debugGraphics) return;
    if (graphic._cullingCell) {
        removeGraphicFromCell(graphic);
    }else{
        const _pixiContainerUpdateSuper = graphic.updateTransform;
        graphic.updateTransform = function updateTransform() {
            if (this.transform._localID != this.transform._currentLocalID) {
                placeGraphicInCell(this);
            }
            _pixiContainerUpdateSuper.apply(this);
        };
    }

    const cellX = Math.floor(graphic.x / cellSize.x);
    const cellY = Math.floor(graphic.y / cellSize.y);
    const cell = `${cellX}_${cellY}`;
    if (cellDictionary[cell] == undefined) cellDictionary[cell] = [false, 0];
    cellDictionary[cell].push(graphic);
    setGraphicsInCellVisible([graphic], cellDictionary[cell][0]);
    graphic._cullingCell = cell;

}
const removeGraphicFromCell = function(graphic){
    if (!graphic._cullingCell) return
    cellDictionary[graphic._cullingCell] = cellDictionary[graphic._cullingCell].filter(item => item !== graphic);
    if(cellDictionary[graphic._cullingCell].length == settingsIndexCount) delete cellDictionary[graphic._cullingCell];
}

const updateVisibleCells = function () {
    updateTicks++;
    const global_sp = new PIXI.Point(renderArea.x, renderArea.y);
    const global_ep = new PIXI.Point(renderArea.x + renderArea.width, renderArea.y + renderArea.height);
    const sp = container.toLocal(global_sp);
    const ep = container.toLocal(global_ep);
    const w = ep.x - sp.x;
    const h = ep.y - sp.y;
    if (debug) {
        debugGraphics.lineStyle(10, 0x00FF00, 1);
        debugGraphics.drawRect(sp.x, sp.y, w, h);
    }

    const startTileX = Math.floor(sp.x / cellSize.x);
    const startTileY = Math.floor(sp.y / cellSize.y);

    const visibileXTiles = Math.ceil(w / cellSize.x) + 1;
    const visibileYTiles = Math.ceil(h / cellSize.y) + 1;

    for (var i = 0; i < visibileXTiles; i++) {
        for (var j = 0; j < visibileYTiles; j++) {
            const tileX = startTileX + i;
            const tileY = startTileY + j;
            const cell = `${tileX}_${tileY}`;

            if (cellDictionary[cell] == undefined) {
                cellDictionary[cell] = [true, updateTicks];
            } else {
                cellDictionary[cell][1] = updateTicks;
            }
            visibleCells[cell] = cellDictionary[cell];

            if (debug) {
                debugGraphics.lineStyle(10, 0x008800, 0.5);
                debugGraphics.drawRect(tileX * cellSize.x, tileY * cellSize.y, cellSize.x, cellSize.y);
            }

        }
    }
}
const updateCells = function () {
    Object.keys(visibleCells).map(cell => {
        if (visibleCells[cell][1] != updateTicks) {
            //was visible is now not visible any more
            setGraphicsInCellVisible(visibleCells[cell], false);
            if(visibleCells[cell].length == settingsIndexCount) delete cellDictionary[cell];
            delete visibleCells[cell];
        } else if (visibleCells[cell][1] == updateTicks && visibleCells[0] == false) {
            // was not visible and is now visible
            setGraphicsInCellVisible(visibleCells[cell], true);
        }
    });
}
const setGraphicsInCellVisible = function (arr, bool) {
    for (let i = settingsIndexCount; i < arr.length; i++) {
        arr[i].renderable = true;
    }
}
const drawAllCells = function(){
    debugGraphics.lineStyle(10, 0xFF0000, 0.5);
    Object.keys(cellDictionary).map(cell => {
        const splitCellString = cell.split('_');
        let tileX = parseInt(splitCellString[0]);
        let tileY = parseInt(splitCellString[1]);
        debugGraphics.drawRect(tileX * cellSize.x, tileY * cellSize.y, cellSize.x, cellSize.y);
    });
}
export const update = function () {
    if(debug){
        if(!debugGraphics){
            debugGraphics = container;
        }
        debugGraphics.clear();
        drawAllCells();
    }

    updateVisibleCells();
    updateCells();
}