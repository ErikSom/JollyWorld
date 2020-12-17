import * as PIXI from 'pixi.js';

const tmpMatrix = new PIXI.Matrix();

export function PathRenderTarget() {
    const proto = (PIXI.RenderTarget).prototype;

    proto.save = function() {
        const {
            root, 
            destinationFrame, 
            sourceFrame,
            transform,
            resolution 
        } = this;

        return this.state = {
            root, 
            destinationFrame, 
            sourceFrame,
            transform,
            resolution 
        };
    }

    proto.restore = function () {
        if (!this.state) return;

        Object.assign(this, this.state);

        this.state = null;
	}
	
	console.debug('[RenderTarget pather] pathing RenderTarget');
}


export class Camera extends PIXI.DisplayObject {
	/**
	 *
	 * @param {PIXI.Container} stage
	 * @param {PIXI.Container} [listen]
	 */
	constructor(stage, listen) {
		super();

		this.stage = stage;
		this.listen = listen || this;
		this._enabled = true;
	}

	disable() {
		console.log("DISABLE CAMERA");
		this._enabled = false;
	}

	enable() {
		console.log("ENABLE CAMERA");
		this._enabled = true;
	}

	updateTransform() {
		this.transform.updateTransform(this.parent.transform);

		// if enabled = use latest paren, or this to save render ored
		this.stage.parent = this._enabled ?  this.parent : this;
		this.stage.updateTransform();
		this.stage.parent = undefined;

	}
	/**
	 *
	 * @param {PIXI.Renderer} renderer
	 */
	renderWebGL (renderer) {

		// if not enabled - we should render in normal order
		if (!this._enabled) {
			this.stage.renderWebGL (renderer);
			return;
		}

        const {
            _activeRenderTarget, currentRenderer
        } = renderer;

		// flush last render
		currentRenderer.flush();

        _activeRenderTarget.save()

		// apply matrix
		_activeRenderTarget.transform = this.listen.worldTransform;

		// need reset for update uniforms
		renderer._activeRenderTarget = null;
		renderer.bindRenderTarget (_activeRenderTarget);

		this.stage.renderWebGL (renderer);

		// flush current
		currentRenderer.flush();

		// restore back
		_activeRenderTarget.restore();
		renderer._activeRenderTarget = null;
		renderer.bindRenderTarget (_activeRenderTarget);
	}

	get matrix() {
		return this.listen.worldTransform;
	}

	/**
	 *
	 * @type {PIXI.Matrix}
	 */
	get invertedMatrix() {
		this.listen.transform.worldTransform.copy(tmpMatrix);
		tmpMatrix.invert();
		return tmpMatrix;
	}

	/**
	 * Transform from camera viewport to screen
	 * @param {PIXI.IPoint} point
	 * @param {PIXI.IPoint} [output]
	 */
	toScreenPoint(point, output = new PIXI.Point()) {
		const m = this.listen.transform.worldTransform;

		m.apply(point, output);
		return output;
	}
}
