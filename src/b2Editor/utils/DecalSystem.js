import * as PIXI from 'pixi.js';
import { MaxRectsPacker, Bin } from 'maxrects-packer';

const vert = `
  
attribute vec2 aVertexPosition;

uniform mat3 projectionMatrix;

varying vec2 vTextureCoord;
varying vec2 vNormCoord;

uniform vec4 inputSize;
uniform vec4 outputFrame;

vec4 filterVertexPosition( void )
{
    vec2 position = aVertexPosition * max(outputFrame.zw, vec2(0.)) + outputFrame.xy;

    return vec4((projectionMatrix * vec3(position, 1.0)).xy, 0.0, 1.0);
}

vec2 filterTextureCoord( void )
{
    return aVertexPosition * (outputFrame.zw * inputSize.zw);
}

void main(void)
{
    gl_Position = filterVertexPosition();
    vTextureCoord = filterTextureCoord();
    vNormCoord = aVertexPosition.xy;
}
`;
const fragment = `
    varying vec2 vTextureCoord;
    varying vec2 vNormCoord;

    uniform sampler2D uSampler;
    uniform sampler2D uMask;
    uniform sampler2D uDecal;

    void main(void) {
        float mask = texture2D(uMask, vNormCoord).r;
        vec4 decal = texture2D(uDecal, vNormCoord) * mask;
        vec4 base = texture2D(uSampler, vTextureCoord) * mask;

        gl_FragColor = decal +  (1.0 - decal.a) * base;
    }
`;

class CompositeFilter extends PIXI.Filter {
    constructor(mask, decal) {
        super(vert, fragment, {
            uMask: mask,
            uDecal: decal
        });
    }
}

export class Decal {
    /**
     * 
     * @param {PIXI.RenderTexture} maskRT 
     * @param {PIXI.RenderTexture} decalRT
     * @param {string} key
     */
    constructor(maskRT, decalRT, key) {
        this.maskRT = maskRT;
        this.decalRT = decalRT;
        this.key = key;
        this.id = key;
        this.owner = null;
        /**
         *
         * @type {PIXI.Sprite}
         */
        this.sprite = null;
    }

    destroy() {
        this.maskRT = null;
        this.decalRT = null;
        this.owner = null;
    }
}

export class DecalLayer {
    /**
     *
     * @param {Bin<{x: number, y: number, width: number, height: number, texture: PIXI.Texture, key: string}>} bin
     * @param {PIXI.Application} app
     * @param {PackedDecalSystem} system
     */
    constructor(bin, app, system) {
        this._bin = bin;
        this.app = app;
        this.system = system;
        /**
         *
         * @type {PIXI.Container}
         * @private
         */
        this._sourceContainer = null;
        /**
         *
         * @type {PIXI.Container}
         * @private
         */
        this._particleContainer = null;
        /**
         *
         * @type {PIXI.Container}
         * @private
         */
        this._combain = null;
        /**
         *
         * @type {PIXI.RenderTexture}
         * @private
         */
        this._maskRT = null;
        /**
         *
         * @type {PIXI.RenderTexture}
         * @private
         */
        this._decalRT = null;
        /**
         *
         * @type {PIXI.RenderTexture}
         * @private
         */
        this._resultRT = null;
        /**
         *
         * @type {Decal[]}
         */
        this.decals = [];
    }

    init() {
        this._sourceContainer = new PIXI.Container();
        this._particleContainer = new PIXI.Container();
        this._combain = new PIXI.Container();

        const dim = {
            width: this._bin.width,
            height: this._bin.height
        };

        this._decalRT = PIXI.RenderTexture.create(dim);
        this._maskRT = PIXI.RenderTexture.create(dim);
        this._resultRT = PIXI.RenderTexture.create(dim);

        const decal = new self.PIXI.heaven.Sprite(this._decalRT);
        const mask = new self.PIXI.heaven.Sprite(this._maskRT);
        mask.renderable = false;

        decal.pluginName = 'batchMasked';
        decal.maskSprite =  mask;
        decal.addChild(mask);

        for(let rect of this._bin.rects) {
            const s = new PIXI.Sprite(rect.texture);

            s.x = rect.x;
            s.y = rect.y;
            s.name = rect.key;

            this._sourceContainer.addChild(s);
        }

        this._combain.addChild(
            this._sourceContainer , decal
        );

        this.fill();

        this._sourceContainer.filters = [
            new CompositeFilter(
                this._maskRT,
                this._decalRT
            )
        ];
    }

    fill() {

        // render decal base texture
        this.app.renderer.render(this._sourceContainer, {renderTexture: this._resultRT, clear: true});

        // mask is full white with black background
        const filter = new PIXI.filters.ColorMatrixFilter();
        filter.matrix = [
            0, 0, 0, 1, 0,
            0, 0, 0, 1, 0,
            0, 0, 0, 1, 0,
            0, 0, 0, 0, 1
        ];

        this._sourceContainer.filters = [filter];
        this.app.renderer.render(this._sourceContainer, {renderTexture: this._maskRT, clear: false});
        this._sourceContainer.filters = null;

    }

    /**
     *
     * @param {string} key
     */
    getCachedDecalEntry(key) {
        return this.decals.find(e => e.key === key);
    }
    /**
     *
     * @param {string} key
     * @returns {Decal}
     */
    getDecalEntry(key) {
        const cache = this.getCachedDecalEntry(key);
        if (cache) {
            return  cache;
        }

        const frame = this._bin.rects.find(e => e.key === key);

        if(!frame) {
            return  null;
        }

        const decalTexture = new PIXI.RenderTexture(
            this._resultRT,
            new PIXI.Rectangle(frame.x,frame.y, frame.width,frame.height)
        );

        const maskTexture = new PIXI.RenderTexture(
            this._maskRT,
            new PIXI.Rectangle(frame.x,frame.y, frame.width,frame.height)
        );

        const decal = new Decal(maskTexture, decalTexture, key);

        decal.sprite = this._sourceContainer.children.find(e => e.name === key);
        decal.owner = this.system;

        this.decals.push(decal);

        return decal;
    }

    /**
     *
     * @param {Array<PIXI.Sprite & {carving: boolean, carvingSize: number, taskId: number}>} tasks
     */
    flushDecalTasks (tasks) {

        const parts = this._particleContainer;
        const carversTask = tasks.filter((e) => e.carving);

        parts.addChild(...tasks);

        this.app.renderer.render(parts, {
            renderTexture: this._decalRT,
            clear: false
        });

        if (carversTask.length > 0) {
            parts.removeChildren();
            parts.addChild(...carversTask);

            for(let c of carversTask) {
                c.scale.set(c.carvingSize || s.scale.x * 0.6);
                c.tint = 0x0;
            }

            this.app.renderer.render(parts, {
                renderTexture: this._maskRT,
                clear: false
            });

        }

        parts.removeChildren();

        this.flushDecalTexture();
    }

    /**
     * Render to itself to apply mask to top - add holes
     */
    flushDecalTexture() {
        this.app.renderer.render(this._combain,  {
            renderTexture: this._resultRT,
            clear: true
        });
    }

    destroy() {
        this._maskRT && this._maskRT.destroy();
        this._decalRT && this._decalRT.destroy();
        this._resultRT && this._resultRT.destroy();
        this._container && this._container.destroy();

        this._bin = null;
        this._maskRT = null;
        this._decalRT = null;
        this._resultRT = null;
        this._container = null;
    }
}

export class PackedDecalSystem {
    static ATLAS_MAX_SIZE = 1024;
    /**
     *
     * @param {PIXI.Application} app
     * @param {string} key
     */
    constructor(app, key) {
        this.app = app;
        this.key = key;
        /**
         *
         * @type {DecalLayer[]}
         */
        this.layers = [];
        this.tasks = [];

        this.frameId = 0;
        this.lastFrameId = 0;
        this.frameTrottle = 2;
    }

    /**
     * Get EXIST decal for key
     * @param {string} key
     * @return {Decal|null}
     */
    getDecalFor(key) {
        for(const layer of this.layers) {
            const decal = layer.getDecalEntry(key);
            if (decal)
                return decal;
        }

        return  null;
    }
    /**
     *
     * @param {PIXI.Texture[]} tex
     * @returns {DecalLayer[]}
     */
    generateLayerForGroup(tex) {
        const pack = new MaxRectsPacker(
            PackedDecalSystem.ATLAS_MAX_SIZE,
            PackedDecalSystem.ATLAS_MAX_SIZE,
            2, {
                pot: false
            }
        );

        const layers = this.layers;

        pack.addArray(tex.map(e => ({
                width: e.width,
                height: e.height,
                key: e.key || e.textureCacheIds[0],
                texture: e
        })));

        pack.next();
        pack.bins.forEach(bin => {
            const layer = new DecalLayer(bin, this.app, this);
            layer.init();
            layers.push(layer);
        });

        return layers;
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


        for(let layer of this.layers) {
            layer.flushDecalTasks(this.tasks);
        }

        this.tasks.length = 0;
    }

    flushDecalTexture() {
        if (this.tasks.length > 0) {
            this.flushDecalTasks();
            return;
        }

        for(let layer of this.layers) {
            layer.flushDecalTexture();
        }
    }

    destroy() {
        this.layers && this.layers.forEach(e => e.destroy());
        this.layers = null;
    }
}

export class DecalSystem {
    /**
     * 
     * @param {PIXI.BaseTexture} baseTexture
     * @param {number} id
     * @param {PIXI.Application} app 
     * @param {DecalSystem} owner 
     * 
     */
    constructor(baseTexture, id, app, owner) {
        this.source = baseTexture;
        this.id = id;
        this.app = app;
        this.frameId = 0;
        this.decals = [];
        this.tasks = [];

        /**
         * @type {DecalSystem}
         */
        this.next = null;

        if(owner) {
            owner.next = this;
        }

        //update decals every 2 frame
        this.frameTrottle = 2;
        this.lastFrameId = 0;

        // we use original sheet, but an collect all nodes of sprite and repack to smaller spritesheet
        // this can make sence if VRAW fill full
        // till we create 3 source for enity: mask, decal, result
        // but, instead of decal RT we can collect DECAL pool, and render it with mask when invalidating a texture
        // and how result will only a mask texture + result texture
 
        const dimensions = {
            width: baseTexture.width,
            height: baseTexture.height
        };

        this.maskRT = PIXI.RenderTexture.create(dimensions);
        this.decalRT = PIXI.RenderTexture.create(dimensions);
        this.resultRT = PIXI.RenderTexture.create(dimensions);

        this.container = new PIXI.Container();

        this._combain = new PIXI.Container();

        const decal = new self.PIXI.heaven.Sprite(this.decalRT);
        const mask = new self.PIXI.heaven.Sprite(this.maskRT);
        mask.renderable = false;

        const sourseSprite = new self.PIXI.heaven.Sprite(new PIXI.Texture(baseTexture));

        this.container.pluginName = 'batchMasked';
        decal.pluginName = sourseSprite.pluginName = 'batchMasked';
        decal.maskSprite = sourseSprite.maskSprite =  mask;
        decal.addChild(mask);

        this._combain.addChild(sourseSprite, decal);

        this.refill();
    }

    refill () {                
        //console.warn("NOT SUPPORTED YET IN V6");
        //return;

        const g = new self.PIXI.heaven.Sprite(PIXI.Texture.WHITE);
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
     * Get strored decal for id
     * @param {string} id 
     */
    getDecalFor(id) {
        return this.decals.find((e) => e.id === id);
    }
    /**
     * 
     * @param {PIXI.Texture} source 
     * @param {string} id
     */
    createDecalEntry(source, id) {

        if (id && this.decals.find((e) => e.id === id)) {
            console.warn("[Decal] Doubling occurred for:", id);
        }

        const decal = new PIXI.RenderTexture(this.resultRT.baseTexture, source.frame.clone());
        const mask = new PIXI.RenderTexture(this.maskRT.baseTexture, source.frame.clone());

        const d = new Decal(mask, decal, this);
        d.id = id;

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
        
        //console.warn("NOT SUPPORTED YET IN V6");
        //return;

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
        //this.app.renderer.currentRenderer.flush();

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
			//this.app.renderer.currentRenderer.flush();
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

        if (this.next) {
            this.next.destroy();
        }

        this.next = null;
        this.decals.forEach((e) => e.destroy());

        this.maskRT.destroy(true);
        this.decalRT.destroy(true);
        this.resultRT.destroy(true);

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
 * @param {string} key
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
