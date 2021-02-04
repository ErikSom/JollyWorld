import { game } from "../../Game";

export class Decal {
    /**
     * 
     * @param {PIXI.RenderTexture} maskRT 
     * @param {PIXI.RenderTexture} decalRT 
     * @param {DecalSystem} owner 
     */
    constructor(maskRT, decalRT, owner) {
        this.maskRT = maskRT;
        this.decalRT = decalRT;
        this.owner = owner;
    }

    destroy() {
        this.maskRT = null;
        this.decalRT = null;
        this.owner = null;
    }
}

export class DecalSystem {
    /**
     * 
     * @param {PIXI.BaseTexture} baseTexture
     * @param {number} id
     * @param {PIXI.Application} app 
     */
    constructor(baseTexture, id, app) {
        this.source = baseTexture;
        this.id = id;
        this.app = app;
        this.frameId = 0;
        this.decals = [];
        this.tasks = [];

        //update decals every 2 frame
        this.frameTrottle = 2;
        this.lastFrameId = 0;

        // we use original sheet, but an collect all nodes of sprite and repack to smaller spritesheet
        // this can make sence if VRAW fill full
        // till we create 3 source for enity: mask, decal, result
        // but, instead of decal RT we can collect DECAL pool, and render it with mask when invalidating a texture
        // and how result will only a mask texture + result texture
 
        this.maskRT = PIXI.RenderTexture.create(baseTexture.width, baseTexture.height);
        this.decalRT = PIXI.RenderTexture.create(baseTexture.width, baseTexture.height);
        this.resultRT = PIXI.RenderTexture.create(baseTexture.width, baseTexture.height);

        this.container = new PIXI.Container();

        this._combain = new PIXI.Container();

        const decal = new PIXI.heaven.Sprite(this.decalRT);
        const mask = new PIXI.heaven.Sprite(this.maskRT);
        mask.renderable = false;

        const sourseSprite = new PIXI.heaven.Sprite(new PIXI.Texture(baseTexture));

        this.container.pluginName = 'spriteMasked';
        decal.pluginName = sourseSprite.pluginName = 'spriteMasked';
        decal.maskSprite = sourseSprite.maskSprite =  mask;
        decal.addChild(mask);

        this._combain.addChild(sourseSprite, decal);

        this.refill();
    }

    refill () {
        const g = new PIXI.heaven.Sprite(PIXI.Texture.WHITE);
        g.tint = 0;
        g.width = this.maskRT.width;
        g.height = this.maskRT.height;

        // clear
        this.app.renderer.render(g, this.maskRT, true);

        g.texture = new PIXI.Texture(this.source);
        g.scale.set(1);

        g.color.setLight(1, 1, 1);
		g.color.setDark(0, 0, 0);		

        // render decal base texture
        this.app.renderer.render(g, this.resultRT, true);

        // render white mask
		g.color.setLight(1, 1, 1);
		g.color.setDark(1, 1, 1);		

        this.app.renderer.render(g, this.maskRT, false);
    }

    /**
     * 
     * @param {PIXI.Texture} source 
     */
    createDecalEntry(source) {
        const decal = new PIXI.RenderTexture(this.resultRT.baseTexture, source.frame.clone());
        const mask = new PIXI.RenderTexture(this.maskRT.baseTexture, source.frame.clone());

        const d = new Decal(mask, decal, this);
        this.decals.push(d);

        return d;
    }

    /**
     * 
     * @param {PIXI.Sprite & {carving: boolean, carvingSize: number, taskId: number}} task 
     */
    pushDecalUpdateTask (task) {
        task.taskId = this.frameId;
        this.tasks.push(task);
    }

    flushDecalTasks () {        
        this.frameId ++;

        if (this.tasks.length  === 0 || (this.frameId - this.lastFrameId) < this.frameTrottle) {
            return;
        }

        this.lastFrameId = this.frameId;

        //console.log(`[Decal System] ${this.id} passed: ${this.tasks.length}`, this.frameId);

        this.container.addChild(...this.tasks);
        const carversTask = this.tasks.filter((e) => e.carving);

        this.app.renderer.render(this.container, this.decalRT, false);    
        // flush current REAL CURRENT
        // becuase a main renderer can swap renderer
        this.app.renderer.currentRenderer.flush();

        if (carversTask.length > 0) {
            this.container.removeChildren();
            this.container.addChild(...carversTask);

            for(let c of carversTask) {
                c.scale.set(c.carvingSize || s.scale.x * 0.6);
                c.color.setDark(0,0,0);
                c.color.setLight(0,0,0);
            }

            this.app.renderer.render(this.container, this.maskRT, false);
            
			// flush current REAL CURRENT
			// becuase a main renderer can swap renderer
			this.app.renderer.currentRenderer.flush();
        }

        this.tasks.length = 0;
        this.container.removeChildren();


        this.flushDecalTexture();
    }

    /**
     * Render to itself to apply mask to top - add holes
     */
    flushDecalTexture() {
        if (this.tasks.length > 0) {
            this.flushDecalTasks();
            return;
        }

        this.app.renderer.render(this._combain,  this.resultRT, true );
    }

    destroy() {
        this.decals.forEach((e) => e.destroy());
        this.maskRT.destroy();
        this.decalRT.destroy();
        this.resultRT.destroy();
        
        this.decals = [];
        this.maskRT = null;
        this.decalRT = null;
        this.resultRT = null;
        this.bigMaskSprite = null;
        this.container = null;
        this.source = null;
    }
}

/**
 * @type {Map<string, DecalSystem>}
 */
const _decalsSystems = new Map();

/**
 * 
 * @param {strin} key 
 * @returns {DecalSystem | null}
 */
export function getDecalSystem(key) {
    return _decalsSystems.get(key);
}

export function setDecalSystem(key, sys) {
    _decalsSystems.set(key, sys);
}

export function getAllSystems() {
    return _decalsSystems;
}

export function dropSystems() {
    for(let s of _decalsSystems.values()) {
        s.destroy();
    }

    _decalsSystems.clear();
}