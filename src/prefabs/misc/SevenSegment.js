import {
    B2dEditor
} from "../../b2Editor/B2dEditor"
import * as PrefabManager from '../PrefabManager';
import {
    game
} from "../../Game";
import { stopCustomBehaviour, drawObjectAdding } from './CustomEditorBehavior';
import * as drawing from '../../b2Editor/utils/drawing';
import { b2AddVec2, b2CloneVec2, b2MulVec2, b2SubVec2 } from "../../../libs/debugdraw";

const TRIGGER_TYPE_ROLLOVER_LEFT = 0;
const TRIGGER_TYPE_ROLLOVER_RIGHT = 1;
const TRIGGER_TYPE_ROLLOVER = 2;
const TRIGGER_TYPE_CHANGE = 3;

const conditions = ["rollover left", "rollover right", "rollover", "change", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

const vec1 = new Box2D.b2Vec2();
const vec2 = new Box2D.b2Vec2();
const vec3 = new Box2D.b2Vec2();

class SevenSegment extends PrefabManager.basePrefab {
    constructor(target) {
        super(target);

        this.linkedSegment = null;
        this.linkedTriggers = [];

        this.base = this.lookupObject.base;
        this.base.isSevenSegment = true;
        this.isSevenSegment = true;

        this.updateNumber();
    }
    increase(){
        let newNumber = this.number + 1;
        if(newNumber === 10){
            this.trigger(TRIGGER_TYPE_ROLLOVER_RIGHT);
            this.rollover(true);
            newNumber = 0;
        }
        this.setNumber(newNumber);
    }
    decrease(){
        let newNumber = this.number - 1;
        if(newNumber === -1){
            this.trigger(TRIGGER_TYPE_ROLLOVER_LEFT);
            this.rollover(false);
            newNumber = 9;
        }
        this.setNumber(newNumber);
    }

    trigger(type){
        this.linkedTriggers.forEach((trigger, index) => {
            if(trigger && !trigger._destroyed){
                const data = this.prefabObject.settings.linkedTriggerData[index]
                const collisionType = conditions[data[1]];

                if(type === TRIGGER_TYPE_ROLLOVER){
                    if(collisionType === 'rollover'){
                        trigger.myBody.class.activateTrigger();
                    }
                }else if(type === TRIGGER_TYPE_ROLLOVER_LEFT){
                    if(collisionType === 'rollover left'){
                        trigger.myBody.class.activateTrigger();
                    }
                }else if(type === TRIGGER_TYPE_ROLLOVER_RIGHT){
                    if(collisionType === 'rollover right'){
                        trigger.myBody.class.activateTrigger();
                    }
                }else {
                    if(collisionType === 'change'){
                        trigger.myBody.class.activateTrigger();
                    }else if(parseInt(collisionType) === this.number){
                        trigger.myBody.class.activateTrigger();
                    }
                }
            }
        })
    }

    setNumber(num){
        if(this.number != num){
            this.number = num;
            this.updateNumber();
            this.trigger(TRIGGER_TYPE_CHANGE);
        }
    }

    rollover(positive){
        if(this.linkedSegment && !this.linkedSegment._destroyed){
            const linkedSegmentClass = game.editor.activePrefabs[this.linkedSegment.data.prefabInstanceName].class;

            if(positive){
                linkedSegmentClass.increase();
            }else{
                linkedSegmentClass.decrease();
            }

        }
        this.trigger(TRIGGER_TYPE_ROLLOVER);
    }
    updateNumber(){

        const segments = this.base.myTexture.children;
        segments.forEach(child => {
            child.visible = true;
        })
        const number = this.number;

        if(number === 0){
            segments[5].visible = false;
        }else if(number === 1){
            [0, 1, 2, 3, 5].forEach(index => {
                segments[index].visible = false;
            })
        }else if(number === 2){
            [2, 6].forEach(index => {
                segments[index].visible = false;
            })
        }else if(number === 3){
            [4, 6].forEach(index => {
                segments[index].visible = false;
            })
        }else if(number === 4){
            [1, 3, 4].forEach(index => {
                segments[index].visible = false;
            })
        }else if(number === 5){
            [0, 4].forEach(index => {
                segments[index].visible = false;
            })
        }else if(number === 6){
            segments[0].visible = false;
        }else if(number === 7){
            [3, 4, 5, 6].forEach(index => {
                segments[index].visible = false;
            })
        }else if(number === 8){
            //
        }else if(number === 9){
            segments[4].visible = false;
        }
    }

    set(property, value) {
		super.set(property, value);
        switch (property) {
            case 'number':
                this.number = value;
                this.updateNumber();
				break;
        }
	}

    linkSevenSegment(targetSprite){
        if(targetSprite){
            this.linkedSegment = targetSprite;
        }else{
            this.linkedSegment = null;
        }
        this.serializeProps();

        game.editor.updateSelection();
    }
    linkTrigger(targetSprite){
        if(targetSprite){
            if(this.linkedTriggers.includes(targetSprite)){
                // resort
            }else{
                this.linkedTriggers.push(targetSprite);
            }

            // update conditions
            this.serializeProps();
        }
    }
    serializeProps(){
        this.checkPropsDestroyed();
        if(this.linkedSegment && !this.linkedSegment._destroyed){
            game.editor.updateObject(this.linkedSegment, this.linkedSegment.data);
            this.prefabObject.settings.linkedSegmentId = [this.linkedSegment.parent.getChildIndex(this.linkedSegment)];
        } else {
            this.prefabObject.settings.linkedSegmentId = null;
        }

        if(this.linkedTriggers.length > 0){
            if(!this.prefabObject.settings.linkedTriggerData) this.prefabObject.settings.linkedTriggerData = []
            // [id, condition]
            const rebuildTriggerIds = [];
            this.linkedTriggers.forEach((trigger, index) => {
                if(!trigger._destroyed){
                    game.editor.updateObject(trigger, trigger.data);

                    const oldData = this.prefabObject.settings.linkedTriggerData[index] || [0,0];
                    rebuildTriggerIds.push([trigger.parent.getChildIndex(trigger), oldData[1]]);
                }
            })
            this.prefabObject.settings.linkedTriggerData = rebuildTriggerIds;

            // sanitize for gui
            this.linkedTriggers = this.linkedTriggers.filter(trigger => trigger && !trigger._destroyed);

        }else{
            this.prefabObject.settings.linkedTriggerData = [];
        }
    }
    initializeProps(){
        if(Array.isArray(this.prefabObject.settings.linkedSegmentId)){
            const linkedSegmentId = this.prefabObject.settings.linkedSegmentId[0];
            if(linkedSegmentId !== undefined && linkedSegmentId < game.editor.textures.children.length){
                this.linkedSegment = game.editor.textures.getChildAt(linkedSegmentId)
            }
        }
        const triggerIds = this.prefabObject.settings.linkedTriggerData;
        if(Array.isArray(triggerIds) && triggerIds.length > 0){
            this.linkedTriggers.length = 0;
            triggerIds.forEach(data => {
                const [id] = data;
                if(id !== undefined && id < game.editor.textures.children.length){
                    this.linkedTriggers.push(game.editor.textures.getChildAt(id));
                }
            })
        }
    }
    checkPropsDestroyed(){
        if(this.linkedSegment && this.linkedSegment._destroyed) this.linkedSegment = null;
        if(this.linkedTriggers.length > 0){
            this.linkedTriggers = this.linkedTriggers.filter(trigger => !trigger._destroyed);
        }
    }
    drawDebugEditor(){
        // draw segment link
        const bodyObject = this.base;
        const sprite = bodyObject.mySprite;

        if(this.linkedSegment && !this.linkedSegment._destroyed){
            editor.debugGraphics.lineStyle(1, "0x000000", 1);
            editor.debugGraphics.moveTo(sprite.x * editor.cameraHolder.scale.x + editor.cameraHolder.x, sprite.y * editor.cameraHolder.scale.y + editor.cameraHolder.y);
            editor.debugGraphics.lineTo(this.linkedSegment.x * editor.cameraHolder.scale.x + editor.cameraHolder.x, this.linkedSegment.y * editor.cameraHolder.scale.y + editor.cameraHolder.y);
            const dx = this.linkedSegment.x - sprite.x;
            const dy = this.linkedSegment.y - sprite.y;
            const tx = sprite.x + dx /2;
            const ty = sprite.y + dy /2;
            const x = tx * editor.cameraHolder.scale.x + editor.cameraHolder.x;
            const y = ty * editor.cameraHolder.scale.y + editor.cameraHolder.y;
            const a = Math.atan2(dy, dx);
            editor.debugGraphics.drawRegularPoly(x, y, 10, 3, a);
        }

        if(this.linkedTriggers.length > 0){
            this.drawDebugTriggerLink()
        }
    }

    drawDebugTriggerLink(){
        if(game.triggerDebugDraw.redrawTimer >= 0){
            game.triggerDebugDraw.redrawTimer --;
        }

        if(game.triggerDebugDraw.redrawTimer !== 0) return;

        const body = this.base;

        this.linkedTriggers.forEach((target, i) => {
            let myPos = body.GetPosition();
            myPos = B2dEditor.getPIXIPointFromWorldPoint(myPos);

            let tarPos = vec1;

            tarPos.Set(target.myBody.GetPosition().x, target.myBody.GetPosition().y);
            tarPos.x *= game.editor.PTM;
            tarPos.y *= game.editor.PTM;

            const lineOffsetSize = -20 * game.levelCamera.scale.x;
            const linePos = vec2;
            linePos.Set(myPos.x, myPos.y);
            b2SubVec2(linePos, tarPos);
            linePos.Normalize();
            b2MulVec2(linePos, lineOffsetSize)
            b2AddVec2(linePos, myPos);

            game.triggerDebugDraw.lineStyle(1.0 / game.editor.cameraHolder.scale.x, "0x000", 1.0);
            game.triggerDebugDraw.moveTo(linePos.x, linePos.y);
            game.triggerDebugDraw.lineTo(tarPos.x, tarPos.y);

            const v = vec3;
            v.Set(tarPos.x-linePos.x, tarPos.y-linePos.y);
            const l = v.Normalize();
            const tl = l*0.5;

            b2MulVec2(v, tl);

            const tp = vec1;
            tp.Set(linePos.x, linePos.y);
            b2AddVec2(tp, v);

            game.triggerDebugDraw.beginFill("0x999", 1.0);
            game.triggerDebugDraw.drawCircle(tp.x, tp.y, 10 / game.editor.cameraHolder.scale.x);
            game.triggerDebugDraw.endFill();
            drawing.addText(i+1, game.triggerDebugDraw, tp, {fontSize: 14}, 1/game.editor.cameraHolder.scale.x);
        });
        game.triggerDebugDraw.dirtyTargets = false;
    }

    init() {
        super.init();
    }
    update() {
        super.update();
    }
}

const linkSegment = prefab => {
    prefab.class.linkSevenSegment(prefab.class.linkObjectTarget);
    delete prefab.class.linkObjectTarget;
    stopCustomBehaviour();
}

const selectLinkTarget = prefab=>{

    if(!prefab.class.linkedSegment){

        game.editor.customPrefabMouseDown = ()=>{
            linkSegment(prefab);
        }
        game.editor.customDebugDraw = ()=>{
            drawObjectAdding(prefab, 'isSevenSegment', true);
        }
        game.editor.customPrefabMouseMove = null;
    } else{
        prefab.class.linkedSegment = null;
        prefab.class.serializeProps();
        game.editor.updateSelection();
    }
}

const linkTrigger = prefab => {

    prefab.class.linkTrigger(prefab.class.linkObjectTarget);

    delete prefab.class.linkObjectTarget;
    stopCustomBehaviour();

    game.editor.updateSelection();
}

const selectTriggerTarget = prefab=>{
    game.editor.customPrefabMouseDown = ()=>{
        linkTrigger(prefab);
    }
    game.editor.customDebugDraw = ()=>{
        drawObjectAdding(prefab, game.editor.object_TRIGGER);
    }
    game.editor.customPrefabMouseMove = null;
}

const addCustomTriggerConditionGUI = (prefabObject, editData, targetFolder) => {

    const prefabClass = prefabObject.class;

    prefabClass.checkPropsDestroyed();


    if(prefabClass.linkedSegment){
        Array.from(targetFolder.domElement.querySelectorAll('.function')).forEach( func => {
            const prop = func.querySelector('.property-name')
            if(prop.innerText === 'linkSevenSegment') prop.innerText = 'unlinkSevenSegment';
        })
    }

    prefabClass.serializeProps();
    prefabClass.linkedTriggers.forEach((trigger, index)=>{
        const triggerFolder = targetFolder.addFolder(`Trigger-${index+1}`)

        const conditionId = `__triggerCondition-${index}`;
        editData[conditionId] = conditions[prefabObject.settings.linkedTriggerData[index][1]];

        triggerFolder.add(editData, conditionId, conditions).name('trigger condition').onChange(function (value) {
            prefabObject.settings.linkedTriggerData[index][1] = conditions.indexOf(value);
        });

        const removeFunction = ()=>{
            prefabClass.linkedTriggers.splice(index, 1);
            prefabClass.serializeProps();
            game.editor.updateSelection();
        }

        const triggerRemoveId = `__triggerRemove-${index}`;
        editData[triggerRemoveId] = removeFunction;
        triggerFolder.add(editData, triggerRemoveId).name('remove');
    })
}

SevenSegment.settings = Object.assign({}, SevenSegment.settings, {
    "number": 0,
    "linkSevenSegment": prefab=>selectLinkTarget(prefab),
    "linkTrigger": prefab=>selectTriggerTarget(prefab),
    "triggerConditions": addCustomTriggerConditionGUI
});
SevenSegment.settingsOptions = Object.assign({}, SevenSegment.settingsOptions, {
    "number":{
		min:0.0,
		max:9.0,
		step:1.0
	},
	"linkSevenSegment": '$function',
	"linkTrigger": '$function',
	"triggerConditions": '$custom',
});

PrefabManager.prefabLibrary.SevenSegment = {
    json: '{"objects":[[0,0.0032,0.0061,0,"sevensegment","base",0,["#1c1c1c"],["#000"],[1,1],true,true,[[{"x":-0.7833,"y":1.221},{"x":-0.7833,"y":-1.221},{"x":0.7833,"y":-1.221},{"x":0.7833,"y":1.221}]],[1],[2],[0],"",[0],true,false,false,[0.5],[0.2],false,true],[7,-0.0946,-0.1829,0,"sevensegment","digits",1,[[6,14.2314,-14.0425,-1.5708,"sevensegment","s2",70,"#ff0000","#000",1,null,[{"x":-13.7333,"y":-0.1333},{"x":-10.3333,"y":-3.5333},{"x":10.4667,"y":-3.5333},{"x":13.8667,"y":-0.1333},{"x":10.1667,"y":3.5667},{"x":-10.0333,"y":3.5667}],null,null,null,null,"",0,0,0,0,"",true],[6,0.1314,-28.6425,-3.1416,"sevensegment","s1",71,"#ff0000","#000",1,null,[{"x":-13.7333,"y":-0.1333},{"x":-10.3333,"y":-3.5333},{"x":10.4667,"y":-3.5333},{"x":13.8667,"y":-0.1333},{"x":10.1667,"y":3.5667},{"x":-10.0333,"y":3.5667}],null,null,null,null,"",0,0,0,0,"",true],[6,14.2274,14.256,-1.5708,"sevensegment","s3",72,"#ff0000","#000",1,null,[{"x":-13.7333,"y":-0.1333},{"x":-10.3333,"y":-3.5333},{"x":10.4667,"y":-3.5333},{"x":13.8667,"y":-0.1333},{"x":10.1667,"y":3.5667},{"x":-10.0333,"y":3.5667}],null,null,null,null,"",0,0,0,0,"",true],[6,0.0274,28.2576,-3.1416,"sevensegment","s4",73,"#ff0000","#000",1,null,[{"x":-13.7333,"y":-0.1333},{"x":-10.3333,"y":-3.5333},{"x":10.4667,"y":-3.5333},{"x":13.8667,"y":-0.1333},{"x":10.1667,"y":3.5667},{"x":-10.0333,"y":3.5667}],null,null,null,null,"",0,0,0,0,"",true],[6,-14.3726,14.256,-4.7124,"sevensegment","s5",74,"#ff0000","#000",1,null,[{"x":-13.7333,"y":-0.1333},{"x":-10.3333,"y":-3.5333},{"x":10.4667,"y":-3.5333},{"x":13.8667,"y":-0.1333},{"x":10.1667,"y":3.5667},{"x":-10.0333,"y":3.5667}],null,null,null,null,"",0,0,0,0,"",true],[6,-0.2726,0.1576,-6.2832,"sevensegment","s7",75,"#ff0000","#000",1,null,[{"x":-13.7333,"y":-0.1333},{"x":-10.3333,"y":-3.5333},{"x":10.4667,"y":-3.5333},{"x":13.8667,"y":-0.1333},{"x":10.1667,"y":3.5667},{"x":-10.0333,"y":3.5667}],null,null,null,null,"",0,0,0,0,"",true],[6,-13.9726,-14.2424,-7.854,"sevensegment","s6",76,"#ff0000","#000",1,null,[{"x":-13.7333,"y":-0.1333},{"x":-10.3333,"y":-3.5333},{"x":10.4667,"y":-3.5333},{"x":13.8667,"y":-0.1333},{"x":10.1667,"y":3.5667},{"x":-10.0333,"y":3.5667}],null,null,null,null,"",0,0,0,0,"",true]],0,0.4118,2.0479,0,1,0,0,0,true,false,[]]]}',
    class: SevenSegment,
    library: PrefabManager.LIBRARY_MISC
}
