import * as PrefabManager from '../PrefabManager';
import {
    game
} from "../../Game";
import { stopCustomBehaviour, drawObjectAdding } from '../misc/CustomEditorBehavior';
import * as PIXI from 'pixi.js';

import { Settings } from "../../Settings";

import { pointOnBezier, calculateBezierLength } from '../../b2Editor/utils/extramath'
import easing from '../../b2Editor/utils/easing';
import { b2CloneVec2, b2LinearStiffness } from '../../../libs/debugdraw';

const DEFAULT_PATH = [{"x":95,"y":45.5,"point1":{"x":131.0757,"y":28.2216},"point2":{"x":131.0757,"y":-28.2216}},{"x":95,"y":-45.5,"point1":{"x":58.9243,"y":-62.7784},"point2":{"x":-58.9243,"y":-62.7784}},{"x":-95,"y":-45.5,"point1":{"x":-131.0757,"y":-28.2216},"point2":{"x":-131.0757,"y":27.2216}},{"x":-95,"y":44.5,"point1":{"x":-58.9243,"y":61.7784},"point2":{"x":58.9243,"y":62.7784}}];

class Animator extends PrefabManager.basePrefab {
    constructor(target) {
        super(target);

        this.isAnimator = true;

        this.linkedTarget = null;
        this.linkedReference = null;
        this.referenceStartAngle = 0;
        this.bodyAnimator = null;

        this.totalLength = null;
        this.cachedLengths = [];
        this.cachedSumLengths = [];

        this.base = this.lookupObject.base;

        this.pathGraphicContainer = new PIXI.Container();
        this.pathGraphicContainer.alpha = 0.4;
        this.pathGraphic = new PIXI.Graphics();
        this.pathGraphic.cacheAsBitmap = true;
        this.pathGraphicContainer.addChild(this.pathGraphic);
        this.base.myTexture.addChildAt(this.pathGraphicContainer, 0);

        this.easeFunction = easing.linear;
        this.animating = true;
        this.animationClockwise = true;
        this.animationDuration = 1000;
        this.animationTime = 0;
	}

	postConstructor(){
		if(this.prefabObject.settings && this.prefabObject.settings.path === undefined){
			this.prefabObject.settings.path = JSON.parse(JSON.stringify(DEFAULT_PATH));
		}
        if(this.prefabObject.settings){
            this.calculatePathLength();
            this.updatePathGraphics();
        }
	}
    updatePathGraphics(){

        this.pathGraphic.cacheAsBitmap = false;
        const colorFill = "0x000000";
		const colorLine = "#00b2ff";
        const opacity = 1.0;
        game.editor.updatePolyGraphic(this.pathGraphic, this.prefabObject.settings.path, colorFill, colorLine, 10, opacity, false, 0.01);

        const arrowEveryPX = 100;

        const arrows = Math.floor(this.totalLength / arrowEveryPX);
        const progresSteps = 1.0 / arrows;

        this.pathGraphic.beginFill(0x00b2ff, opacity);
        this.pathGraphic.lineStyle(0, 0x0, 0);
        for(let i = 0; i<arrows; i++){
            this.drawArrowAtProgress(progresSteps * i, 20);
        }
        this.pathGraphic.beginFill(0xffffff, opacity);

        if(this.prefabObject.settings.clockwise){
            this.drawArrowAtProgress(1-this.prefabObject.settings.startProgress, 10);
        }else{
            this.drawArrowAtProgress(this.prefabObject.settings.startProgress, 10);
        }

        this.pathGraphic.cacheAsBitmap = true;
    }

    drawArrowAtProgress(progress, size){
        const point = this.getPointAtProgress(progress);
        const nextPoint = this.getPointAtProgress(progress+0.01);

        const dx = nextPoint.x - point.x;
        const dy = nextPoint.y - point.y;
        const a = Math.atan2(dy, dx) + (this.prefabObject.settings.clockwise ? Math.PI : 0)


        const l = Math.sqrt(point.x*point.x + point.y*point.y);
        const a2 = Math.atan2(point.y, point.x);

        const x = l * Math.cos(a2 - this.base.GetAngle());
        const y = l * Math.sin(a2 - this.base.GetAngle());


        this.pathGraphic.drawRegularPoly(x, y, size, 3, a + this.base.GetAngle());
    }

    editPathCallback(newPathGraphic){
        // the vertices is a shared array between the newPathGraphic and this object, so updating those vertices updates them here.
        game.editor.deleteObjects([newPathGraphic]);
        this.calculatePathLength();
        this.updatePathGraphics();
    }
    linkTarget(targetSprite){
        if(targetSprite){

            if(targetSprite.myBody) {
                // if texture then pick the body
                this.linkedTarget = targetSprite.myBody.mySprite;
            }else{
                this.linkedTarget = targetSprite;
            }

            const dx = game.editor.mousePosWorld.get_x()*Settings.PTM - this.linkedTarget.x;
            const dy = game.editor.mousePosWorld.get_y()*Settings.PTM - this.linkedTarget.y;
            const a = Math.atan2(dy, dx);

            this.prefabObject.settings.targetAnchorLength = Math.sqrt(dx*dx + dy*dy);
            this.prefabObject.settings.targetAnchorAngle = a-this.linkedTarget.rotation;
        }else{
            this.linkedTarget = null;
        }
        game.editor.updateSelection();
    }

    linkReference(targetSprite){
        if(targetSprite){
            // if texture then pick the body
            this.linkedReference = targetSprite.myBody.mySprite;
        }else{
            this.linkedReference = null;
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

        // rotate current & next point
        currentPoint = JSON.parse(JSON.stringify(currentPoint));
        nextPoint = JSON.parse(JSON.stringify(nextPoint));

        [currentPoint, nextPoint, currentPoint.point1, currentPoint.point2].forEach(point => {
            if(point){
                const l = Math.sqrt(point.x * point.x + point.y * point.y);
                const a = Math.atan2(point.y, point.x);

                const newRotation = this.base.GetAngle() + a;

                point.x = l * Math.cos(newRotation);
                point.y = l * Math.sin(newRotation);
            }
        });

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
    doubleClickCallback(){
        editPath(this.prefabObject);
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
        this.checkPropsDestroyed();

        if(this.linkedTarget && !this.linkedTarget._destroyed){
            game.editor.updateObject(this.linkedTarget, this.linkedTarget.data);
            this.prefabObject.settings.linkedTargetId = [this.linkedTarget.parent.getChildIndex(this.linkedTarget)];
        } else {
            this.prefabObject.settings.linkedTargetId = null;
        }

        if(this.linkedReference && !this.linkedReference._destroyed){
            game.editor.updateObject(this.linkedReference, this.linkedReference.data);
            this.prefabObject.settings.linkedReferenceId = [this.linkedReference.parent.getChildIndex(this.linkedReference)];
        } else {
            this.prefabObject.settings.linkedReferenceId = null;
        }

    }
    initializeProps(){
        if(Array.isArray(this.prefabObject.settings.linkedTargetId)){
            const linkedTargetId = this.prefabObject.settings.linkedTargetId[0];
            if(linkedTargetId !== undefined && linkedTargetId < game.editor.textures.children.length){
                this.linkedTarget = game.editor.textures.getChildAt(linkedTargetId)
            }
        }

        if(Array.isArray(this.prefabObject.settings.linkedReferenceId)){
            const linkedReferenceId = this.prefabObject.settings.linkedReferenceId[0];
            if(linkedReferenceId !== undefined && linkedReferenceId < game.editor.textures.children.length){
                this.linkedReference = game.editor.textures.getChildAt(linkedReferenceId)
            }
        }
    }

    checkPropsDestroyed(){
        if(this.linkedTarget && this.linkedTarget._destroyed) this.linkedTarget = null;
        if(this.linkedReference && this.linkedReference._destroyed) this.linkedReference = null;
    }

    drawDebugEditor(){
        const bodyObject = this.base;
        const sprite = bodyObject.mySprite;

        if(this.linkedTarget && !this.linkedTarget._destroyed){
            const l = this.prefabObject.settings.targetAnchorLength;
            const a = this.prefabObject.settings.targetAnchorAngle;

            const targetX = this.linkedTarget.x + l * Math.cos(this.linkedTarget.rotation+a);
            const targetY = this.linkedTarget.y + l * Math.sin(this.linkedTarget.rotation+a);

            editor.debugGraphics.lineStyle(1, "0x000000", 1);
            editor.debugGraphics.moveTo(sprite.x * editor.cameraHolder.scale.x + editor.cameraHolder.x, sprite.y * editor.cameraHolder.scale.y + editor.cameraHolder.y);
            editor.debugGraphics.lineTo(targetX * editor.cameraHolder.scale.x + editor.cameraHolder.x, targetY * editor.cameraHolder.scale.y + editor.cameraHolder.y);

            if(this.linkedReference && !this.linkedReference._destroyed){
                editor.debugGraphics.lineStyle(1, "0xFF0000", 1);
                editor.debugGraphics.moveTo(sprite.x * editor.cameraHolder.scale.x + editor.cameraHolder.x, sprite.y * editor.cameraHolder.scale.y + editor.cameraHolder.y);
                editor.debugGraphics.lineTo(this.linkedReference.x * editor.cameraHolder.scale.x + editor.cameraHolder.x, this.linkedReference.y * editor.cameraHolder.scale.y + editor.cameraHolder.y);
            }
        }
    }


    buildBodyAnimator(){

        const bodyDef = new Box2D.b2BodyDef();
        this.m_groundBody = game.editor.CreateBody(bodyDef);

        const md = new Box2D.b2MouseJointDef();
        md.set_bodyA(this.m_groundBody);
        md.set_bodyB(this.linkedTarget.myBody);
        md.set_collideConnected(false);
        md.set_maxForce(this.prefabObject.settings.maxForce);

        b2LinearStiffness(md, this.prefabObject.settings.frequencyHZ, this.prefabObject.settings.damping, this.m_groundBody, this.linkedTarget.myBody);

        const l = this.prefabObject.settings.targetAnchorLength / Settings.PTM;
        const a = this.prefabObject.settings.targetAnchorAngle;

        const targetPosition = b2CloneVec2(this.linkedTarget.myBody.GetPosition());

        const offsetX = l * Math.cos(this.linkedTarget.rotation+a);
        const offsetY = l * Math.sin(this.linkedTarget.rotation+a);

        targetPosition.set_x(targetPosition.get_x() + offsetX);
        targetPosition.set_y(targetPosition.get_y() + offsetY);

        md.set_target(targetPosition);

        this.bodyAnimator = Box2D.castObject(game.editor.CreateJoint(md), Box2D.b2MouseJoint);

        Box2D.destroy(md);
        Box2D.destroy(bodyDef);
        Box2D.destroy(targetPosition);
    }

    set(property, value){
        super.set(property, value);
        switch (property) {
            case 'startProgress':
            case 'clockwise':
                this.updatePathGraphics();
                break;
        }
    }

    init() {
        if(this.linkedTarget && !this.linkedTarget._destroyed){
            this.calculatePathLength();
            this.animationDuration = this.prefabObject.settings.duration * 1000;
            this.animationClockwise = this.prefabObject.settings.clockwise;

            if(this.linkedReference){
                const dx = this.linkedReference.x - this.linkedTarget.x;
                const dy = this.linkedReference.y - this.linkedTarget.y;
                const a = Math.atan2(dy, dx);

                this.referenceLength = Math.sqrt(dx*dx + dy*dy);
                this.referenceAngle = a - this.linkedReference.myBody.GetAngle();
            }

            if(this.linkedTarget && this.linkedTarget.data.type === game.editor.object_BODY){
                this.buildBodyAnimator();
            }

            this.easeFunction = this.prefabObject.settings.easing === 'linear' ? easing[this.prefabObject.settings.easing] : easing[this.prefabObject.settings.easing+'Cubic'];

            if(!game.editor.editorSettingsObject.physicsDebug){
                this.base.myTexture.visible = false;
            }

            this.animating = this.prefabObject.settings.animating;
            this.animationTime = this.prefabObject.settings.startProgress * this.animationDuration;
        }

        super.init();
    }

    setProgress(progress){
        this.animationTime = progress * this.animationDuration;
    }

    setDuration(duration){
        const currentProgress = this.animationTime / this.animationDuration;
        this.animationDuration = duration;
        this.animationTime = duration * currentProgress;
    }
    setClockwise(clockwise){
        const currentProgress = this.animationTime / this.animationDuration;
        this.animationClockwise = clockwise;
        this.animationTime = this.animationDuration * (1 - currentProgress);
    }

    update() {

        if(this.linkedTarget && !this.linkedTarget._destroyed && (this.prefabObject.settings.global || (this.linkedReference && !this.linkedReference._destroyed))){
            if(this.animating){
                this.animationTime += game.editor.deltaTime;
            }

            while(this.animationTime > this.animationDuration){
                this.animationTime -= this.animationDuration;
            }

            let animationProgress = this.animationTime / this.animationDuration;
            if(this.animationClockwise) animationProgress = 1 - animationProgress;
            animationProgress = this.easeFunction(animationProgress);

            let {x, y} = this.getPointAtProgress(animationProgress);

            if(this.prefabObject.settings.global){
                x += this.base.GetPosition().x * Settings.PTM;
                y += this.base.GetPosition().y * Settings.PTM;
            }else{
                const l = Math.sqrt(x*x + y*y);
                const a = Math.atan2(y, x);

                x = this.linkedReference.myBody.GetPosition().x * Settings.PTM;
                y = this.linkedReference.myBody.GetPosition().y * Settings.PTM;


                const targetAngle = a;

                x += l * Math.cos(targetAngle);
                y += l * Math.sin(targetAngle);

            }

            if(this.linkedTarget.myBody && this.bodyAnimator){

                const targetPosition = b2CloneVec2(this.base.GetPosition());
                targetPosition.set_x(x / Settings.PTM);
                targetPosition.set_y(y / Settings.PTM);

                this.bodyAnimator.SetTarget(targetPosition);

                Box2D.destroy(targetPosition);

            }else if(this.linkedTarget.parent){

                const l = this.prefabObject.settings.targetAnchorLength;
                const a = this.prefabObject.settings.targetAnchorAngle;

                const offsetX = l * Math.cos(this.linkedTarget.rotation+a);
                const offsetY = l * Math.sin(this.linkedTarget.rotation+a);

                this.linkedTarget.x = x - offsetX;
                this.linkedTarget.y = y - offsetY;
            }
        }

        if(game.editor.editorSettingsObject.physicsDebug && (this.linkedReference && !this.linkedReference._destroyed)){
            this.base.SetTransform(this.linkedReference.myBody.GetPosition(), this.linkedReference.myBody.GetAngle())
        }

        super.update();
    }
}

const linkTarget = prefab => {
    prefab.class.linkTarget(prefab.class.linkObjectTarget);
    delete prefab.class.linkObjectTarget;
    stopCustomBehaviour();
}

const linkReference = prefab => {
    prefab.class.linkReference(prefab.class.linkObjectTarget);
    delete prefab.class.linkObjectTarget;
    stopCustomBehaviour();
}


const selectLinkTarget = prefab=>{

    if(!prefab.class.linkedTarget){

        game.editor.customPrefabMouseDown = ()=>{
            linkTarget(prefab);
        }
        game.editor.customDebugDraw = ()=>{
            drawObjectAdding(prefab, [game.editor.object_BODY, game.editor.object_TEXTURE, game.editor.object_GRAPHIC, game.editor.object_GRAPHICGROUP, game.editor.object_ANIMATIONGROUP], false, false);
        }
        game.editor.customPrefabMouseMove = null;
    } else{
        prefab.class.linkedTarget = null;
        game.editor.updateSelection();
    }
}

const selectLinkReference = prefab=>{

    if(!prefab.class.linkedReference){

        game.editor.customPrefabMouseDown = ()=>{
            linkReference(prefab);
        }
        game.editor.customDebugDraw = ()=>{
            drawObjectAdding(prefab, [game.editor.object_BODY]);
        }
        game.editor.customPrefabMouseMove = null;
    } else{
        prefab.class.linkedReference = null;
        game.editor.updateSelection();
    }
}

const editPath = prefab => {
    const graphicObject = new game.editor.graphicObject;
    graphicObject.vertices = prefab.settings.path
    graphicObject.x = prefab.class.base.GetPosition().x * Settings.PTM;
    graphicObject.y = prefab.class.base.GetPosition().y * Settings.PTM;

    const graphic = game.editor.buildGraphicFromObj(graphicObject);
    graphic.rotation = prefab.class.base.GetAngle();

    game.editor.verticeEditingSprite = graphic;
    game.editor.selectTool(game.editor.tool_VERTICEEDITING);
    game.editor.verticeEditingCallback = prefab.class.editPathCallback.bind(prefab.class);
}

const addCustomBodyGUI = (prefabObject, editData, targetFolder) => {
    const prefabClass = prefabObject.class;

    prefabClass.checkPropsDestroyed();

    if(prefabClass.linkedTarget){
        Array.from(targetFolder.domElement.querySelectorAll('.function')).forEach( func => {
            const prop = func.querySelector('.property-name')
            if(prop.innerText === 'selectTarget') prop.innerText = 'unselectTarget';
        })

        if(prefabObject.settings.global === undefined) prefabObject.settings.global = true;

        editData.global = prefabObject.settings.global;
        targetFolder.add(editData, 'global').onChange(function (value) {
            prefabObject.settings.global = value;
            prefabClass.linkedReference = null;
            game.editor.updateSelection();
        });

        if(!prefabObject.settings.global){
            const addReferenceId = 'selectReferenceBody';
            editData[addReferenceId] = () => selectLinkReference(prefabObject);
            targetFolder.add(editData, addReferenceId);

            if(prefabClass.linkedReference){
                Array.from(targetFolder.domElement.querySelectorAll('.function')).forEach( func => {
                    const prop = func.querySelector('.property-name')
                    if(prop.innerText === 'selectReferenceBody') prop.innerText = 'unselectReferenceBody';
                })
            }

        }

        if(prefabClass.linkedTarget.data.type === game.editor.object_BODY){
            const maxForceId = `maxForce`;
            if(prefabObject.settings.maxForce === undefined) prefabObject.settings.maxForce = 5000;
            editData[maxForceId] = prefabObject.settings.maxForce;

            targetFolder.add(editData, maxForceId, 0, 50000).step(1).onChange(function (value) {
                prefabObject.settings.maxForce = value;
            });

            const frequenzeHZId = `frequencyHZ`;
            if(prefabObject.settings.frequencyHZ === undefined) prefabObject.settings.frequencyHZ = 5;
            editData[frequenzeHZId] = prefabObject.settings.frequencyHZ;

            targetFolder.add(editData, frequenzeHZId, 0, 20).step(0.1).onChange(function (value) {
                prefabObject.settings.frequencyHZ = value;
            });

            const dampingId = `damping`;
            if(prefabObject.settings.damping === undefined) prefabObject.settings.damping = 0.7;
            editData[dampingId] = prefabObject.settings.damping;

            targetFolder.add(editData, dampingId, 0, 1).step(0.1).onChange(function (value) {
                prefabObject.settings.damping = value;
            });
        }
    }
}

Animator.settings = Object.assign({}, Animator.settings, {
    "duration": 1.0,
    "easing": "linear",
    "startProgress":0,
    "clockwise": true,
    "selectTarget": prefab=>selectLinkTarget(prefab),
    "bodyValues": addCustomBodyGUI,
    "editPath": prefab=>editPath(prefab),
    "animating": true,
});
Animator.settingsOptions = Object.assign({}, Animator.settingsOptions, {
   "duration":{
		min:0.1,
		max:120.0,
		step:0.1
	},
    "easing": ['linear', 'easeIn', 'easeOut', 'easeInOut'],
    "startProgress":{
		min:0.0,
		max:1.0,
		step:0.01
	},
    "clockwise": true,
	"selectTarget": '$function',
    "bodyValues": '$custom',
	"editPath": '$function',
    "animating": true,
});

PrefabManager.prefabLibrary.Animator = {
    json: '{"objects":[[0,0.0051,0.0406,0,"","base",0,["#999999"],["#000"],[0],true,true,[[{"x":0.7976,"y":-0.7824},{"x":0.7976,"y":0.7824},{"x":-0.7976,"y":0.7824},{"x":-0.7976,"y":-0.7824}]],[1],[2],[0],"",[0],true,false,false,[0.5],[0.2],false,true],[7,-0.1516,-1.2184,0,"","",1,[[6,3.1381,4.6794,0,"","",0,"#00b2ff","#000",0.4,33.0257,[{"x":0,"y":0},{"x":0,"y":0}],null,null,null,null,"",0,0,0,0,"",true],[6,3.3239,13.002,0,"","",73,"#565656","#656565",1,null,[{"x":20.9882,"y":12.8053},{"x":20.9882,"y":-12.8053},{"x":-20.9882,"y":-12.8053},{"x":-20.9882,"y":12.8053}],null,null,null,null,"",0,0,0,0,"",true],[6,1.463,-9.8331,0,"","",74,"#565656","#656565",1,null,[{"x":-21.5279,"y":0.9465},{"x":17.81,"y":-11.0793},{"x":21.4079,"y":-0.6124},{"x":-17.69,"y":10.7453}],null,null,null,null,"",0,0,0,0,"",true],[6,2.9897,5.4653,0,"","",75,"#ffffff","#656565",1,null,[{"x":18.3522,"y":2.3065},{"x":18.3522,"y":-2.3065},{"x":-18.3522,"y":-2.3065},{"x":-18.3522,"y":2.3065}],null,null,null,null,"",0,0,0,0,"",true],[6,1.7969,-9.9511,-0.3075,"","",76,"#ffffff","#656565",1,null,[{"x":18.3522,"y":2.3065},{"x":18.3522,"y":-2.3065},{"x":-18.3522,"y":-2.3065},{"x":-18.3522,"y":2.3065}],null,null,null,null,"",0,0,0,0,"",true],[6,-19.0028,1.9762,0,"","",77,"#565656","#656565",1,5.6458,[{"x":0,"y":0},{"x":0,"y":0}],null,null,null,null,"",0,0,0,0,"",true],[6,-7.2049,-6.4188,0,"","",78,"#565656","#656565",1,null,[{"x":-4.6234,"y":5.0592},{"x":-1.9815,"y":-3.3508},{"x":5.0009,"y":-5.3658},{"x":1.6041,"y":3.6574}],null,null,null,null,"",0,0,0,0,"",true],[6,8.4057,-10.9766,0,"","",79,"#565656","#656565",1,null,[{"x":-4.6234,"y":5.0592},{"x":-1.9815,"y":-3.3508},{"x":5.0009,"y":-5.3658},{"x":1.6041,"y":3.6574}],null,null,null,null,"",0,0,0,0,"",true],[6,-6.2595,6.2059,0.0698,"","",80,"#565656","#656565",1,null,[{"x":-4.6234,"y":5.0592},{"x":-1.9815,"y":-3.3508},{"x":5.0009,"y":-5.3658},{"x":1.6041,"y":3.6574}],null,null,null,null,"",0,0,0,0,"",true],[6,11.3498,5.851,0.0698,"","",81,"#565656","#656565",1,null,[{"x":-4.6234,"y":5.0592},{"x":-1.9815,"y":-3.3508},{"x":5.0009,"y":-5.3658},{"x":1.6041,"y":3.6574}],null,null,null,null,"",0,0,0,0,"",true]],0,2.4556,1.6946,0,1,0,0,0,true,false,[]]]}',
    class: Animator,
    library: PrefabManager.LIBRARY_MOVEMENT
}

