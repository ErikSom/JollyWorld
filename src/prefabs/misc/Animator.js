import * as Box2D from '../../../libs/Box2D'
import * as PrefabManager from '../PrefabManager';
import {
    game
} from "../../Game";
import { stopCustomBehaviour, drawObjectAdding } from './CustomEditorBehavior';
import * as PIXI from 'pixi.js';

import {
    Key
} from "../../../libs/Key"



import { Settings } from "../../Settings";

import { pointOnBezier, calculateBezierLength } from '../../b2Editor/utils/extramath'

const DEFAULT_PATH = [{"x":95,"y":45.5,"point1":{"x":131.0757,"y":28.2216},"point2":{"x":131.0757,"y":-28.2216}},{"x":95,"y":-45.5,"point1":{"x":58.9243,"y":-62.7784},"point2":{"x":-58.9243,"y":-62.7784}},{"x":-95,"y":-45.5,"point1":{"x":-131.0757,"y":-28.2216},"point2":{"x":-131.0757,"y":27.2216}},{"x":-95,"y":44.5,"point1":{"x":-58.9243,"y":61.7784},"point2":{"x":58.9243,"y":62.7784}}];

class Animator extends PrefabManager.basePrefab {
    constructor(target) {
        super(target);

        this.linkedTarget = null;
        this.totalLength = null;
        this.cachedLengths = [];
        this.cachedSumLengths = [];

        this.base = this.lookupObject.base;
        this.base.isAnimator = true;

        this.pathGraphic = new PIXI.Graphics();
        this.base.myTexture.addChild(this.pathGraphic);

        this.relativeBody = null;
        this.animating = true;
        this.animationClockwise = true;
        this.animationDuration = 1000;
        this.animationTime = 0;
	}

	postConstructor(){
		if(this.prefabObject.settings && this.prefabObject.settings.path === undefined){
			this.prefabObject.settings.path = DEFAULT_PATH;
		}
        this.updatePathGraphics();
	}
    updatePathGraphics(){
        const colorFill = "#0096ff";
		const colorLine = "#00518a";
        game.editor.updatePolyGraphic(this.pathGraphic, this.prefabObject.settings.path, colorFill, colorLine, 1, 0.6);
    }

    editPathCallback(newPathGraphic){
        // the vertices is a shared array between the newPathGraphic and this object, so updating those vertices updates them here.
        game.editor.deleteObjects([newPathGraphic]);
        this.updatePathGraphics();
    }
    linkTarget(targetSprite){
        if(targetSprite){
            this.linkedTarget = targetSprite;
        }else{
            this.linkedTarget = null;
        }
        game.editor.updateSelection();
    }

    calculatePathLength(){
        this.cachedLengths.length = 0;
        this.cachedSumLengths.length = 0;
        this.totalLength = 0;

        const verts = this.prefabObject.settings.path;
        const count = verts.length;
        let currentPoint;
		let nextPoint;
        for(let i = 1; i<= count; i++){
            if(i !== count){
				currentPoint = verts[i - 1];
				nextPoint = verts[i];
			}else{
				currentPoint = verts[i - 1];
				nextPoint = verts[0];
			}

            let length = 0;
            if(!currentPoint.point1 || !currentPoint.point2){
                const dx = nextPoint.x - currentPoint.x;
                const dy = nextPoint.y - currentPoint.y;
                length = Math.sqrt(dx*dx + dy*dy);
            }else{
                length = calculateBezierLength(currentPoint, currentPoint.point1, currentPoint.point2, nextPoint);
            }

            this.cachedLengths[i-1] = length;
            this.cachedSumLengths[i-1] = this.totalLength;
            this.totalLength += length;
        }
    }
    getPointAtProgress(progress){

        const progressLength = progress * this.totalLength;
        const closestPointIndex = this.findPointAtLength(progressLength);

        const verts = this.prefabObject.settings.path;

        let currentPoint;
		let nextPoint;

        if(closestPointIndex !== verts.length-1){
            currentPoint = verts[closestPointIndex];
            nextPoint = verts[closestPointIndex+1];
        }else{
            currentPoint = verts[closestPointIndex];
            nextPoint = verts[0];
        }

        const progressOnLine = progressLength-this.cachedSumLengths[closestPointIndex];
        const t = progressOnLine / this.cachedLengths[closestPointIndex];

        let x,y;

        if(currentPoint.point1 && currentPoint.point2){
            x = pointOnBezier(t, currentPoint.x, currentPoint.point1.x, currentPoint.point2.x, nextPoint.x);
            y = pointOnBezier(t, currentPoint.y, currentPoint.point1.y, currentPoint.point2.y, nextPoint.y);
        }else{

            const dx = nextPoint.x - currentPoint.x;
            const dy = nextPoint.y - currentPoint.y;

            x = currentPoint.x + dx * t;
            y = currentPoint.y + dy * t;

        }

        return {x, y};
    }

    findPointAtLength(length){
        let left = 0;
        let right = this.cachedSumLengths.length;
        while (left+1<right) {
            const mid = (left+right)>>1;
            if (this.cachedSumLengths[mid] <= length) {
                left = mid;
            } else {
                right = mid;
            }
        }
        return left;
    }

    serializeProps(){
        if(this.linkedTarget && !this.linkedTarget.destroyed){
            game.editor.updateObject(this.linkedTarget, this.linkedTarget.data);
            this.prefabObject.settings.linkedTargetId = [this.linkedTarget.parent.getChildIndex(this.linkedTarget)];
        } else {
            this.prefabObject.settings.linkedTargetId = null;
        }

    }
    initializeProps(){
        if(Array.isArray(this.prefabObject.settings.linkedTargetId)){
            const linkedTargetId = this.prefabObject.settings.linkedTargetId[0];
            if(linkedTargetId !== undefined && linkedTargetId < game.editor.textures.children.length){
                this.linkedTarget = game.editor.textures.getChildAt(linkedTargetId)
            }
        }
    }

    drawDebugEditor(){
        const bodyObject = this.base;
        const sprite = bodyObject.mySprite;

        if(this.linkedTarget && !this.linkedTarget.destroyed){
            editor.debugGraphics.lineStyle(1, "0x000000", 1);
            editor.debugGraphics.moveTo(sprite.x * editor.cameraHolder.scale.x + editor.cameraHolder.x, sprite.y * editor.cameraHolder.scale.y + editor.cameraHolder.y);
            editor.debugGraphics.lineTo(this.linkedTarget.x * editor.cameraHolder.scale.x + editor.cameraHolder.x, this.linkedTarget.y * editor.cameraHolder.scale.y + editor.cameraHolder.y);
        }
    }

    init() {
        this.calculatePathLength();
        this.animationDuration = this.prefabObject.settings.duration * 1000;
        this.animationClockwise = this.prefabObject.settings.clockwise;
        super.init();
    }
    update() {

        if(this.animating && this.linkedTarget){
            this.animationTime += game.editor.deltaTime;

            while(this.animationTime > this.animationDuration){
                this.animationTime -= this.animationDuration;
            }

            let animationProgress = this.animationTime / this.animationDuration;
            if(this.animationClockwise) animationProgress = 1 - animationProgress;

            let {x, y} = this.getPointAtProgress(animationProgress);

            if(this.linkedTarget.myBody){

            }else{

                if(!this.relativeBody){
                    x += this.base.GetPosition().x * Settings.PTM;
                    y += this.base.GetPosition().y * Settings.PTM;
                }

                this.linkedTarget.x = x;
                this.linkedTarget.y = y;
            }

        }


        super.update();
    }
}

const linkTarget = prefab => {
    prefab.class.linkTarget(prefab.class.linkObjectTarget);
    delete prefab.class.linkObjectTarget;
    stopCustomBehaviour();
}


const selectLinkTarget = prefab=>{

    if(!prefab.class.linkedTarget){

        game.editor.customPrefabMouseDown = ()=>{
            linkTarget(prefab);
        }
        game.editor.customDebugDraw = ()=>{
            drawObjectAdding(prefab, [game.editor.object_BODY, game.editor.object_TEXTURE, game.editor.object_GRAPHIC, game.editor.object_GRAPHICGROUP, game.editor.object_ANIMATIONGROUP]);
        }
        game.editor.customPrefabMouseMove = null;
    } else{
        prefab.class.linkedTarget = null;
        game.editor.updateSelection();
    }
}

const editPath = prefab => {
    const graphicObject = new game.editor.graphicObject;
    graphicObject.vertices = prefab.settings.path
    graphicObject.x = prefab.class.base.GetPosition().x * Settings.PTM;
    graphicObject.y = prefab.class.base.GetPosition().y * Settings.PTM;

    const graphic = game.editor.buildGraphicFromObj(graphicObject);

    game.editor.verticeEditingSprite = graphic;
    game.editor.selectTool(game.editor.tool_VERTICEEDITING);
    game.editor.verticeEditingCallback = prefab.class.editPathCallback.bind(prefab.class);
}

Animator.settings = Object.assign({}, Animator.settings, {
    "duration": 1.0,
    "clockwise": true,
    "selectTarget": prefab=>selectLinkTarget(prefab),
    "editPath": prefab=>editPath(prefab),
});
Animator.settingsOptions = Object.assign({}, Animator.settingsOptions, {
   "duration":{
		min:0.1,
		max:120.0,
		step:0.1
	},
    "clockwise": true,
	"selectTarget": '$function',
	"editPath": '$function',
});

PrefabManager.prefabLibrary.Animator = {
    json: '{"objects":[[0,0.0114,0.0124,0,"animator","base",0,["#999999"],["#000"],[0],true,true,[[{"x":-2.3022,"y":1.0019},{"x":-2.3022,"y":-1.0019},{"x":2.3022,"y":-1.0019},{"x":2.3022,"y":1.0019}]],[1],[2],[0],"",[0],true,false,false,[0.5],[0.2],false,true],[7,-0.3433,-0.3725,0,"","",1,[[6,-40,-0.092,0,"","",71,"#10c5ff","#000",1,30,[{"x":0,"y":0},{"x":0,"y":0}],null,null,null,null,"",0,0,0,0,"",true],[6,-20,-0.092,0,"","",72,"#0894f9","#000",1,30,[{"x":0,"y":0},{"x":0,"y":0}],null,null,null,null,"",0,0,0,0,"",true],[6,0,-0.092,0,"","",73,"#0065ff","#000",1,30,[{"x":0,"y":0},{"x":0,"y":0}],null,null,null,null,"",0,0,0,0,"",true],[6,20,0.368,0,"","",74,"#034ee2","#000",1,30,[{"x":0,"y":0},{"x":0,"y":0}],null,null,null,null,"",0,0,0,0,"",true],[6,40,-0.092,0,"","",75,"#003fa0","#000",1,30,[{"x":0,"y":0},{"x":0,"y":0}],null,null,null,null,"",0,0,0,0,"",true]],0,1.0131,2.3154,0,1,0,0,0,true,false,[]]]}',
    class: Animator,
    library: PrefabManager.LIBRARY_MISC
}

