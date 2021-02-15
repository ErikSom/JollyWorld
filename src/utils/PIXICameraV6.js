import * as PIXI from "pixi.js";

const tmpMatrix = new PIXI.Matrix();

class NewProjector extends PIXI.ProjectionSystem {
  constructor(renderer) {
    super(renderer);

    this.state = {
      transform: undefined,
      root: undefined,
      resolution: undefined,
      sourceFrame: undefined,
      destinationFrame: undefined,
    };
  }

  update(destinationFrame, sourceFrame, resolution, root) {
    this.state.destinationFrame = destinationFrame
      ? destinationFrame.clone()
      : undefined;
    this.state.sourceFrame = sourceFrame ? sourceFrame.clone() : undefined;
    this.state.resolution = resolution;
    this.state.root = root;
    this.state.transform = this.transform ? this.transform.clone() : undefined;

    super.update(destinationFrame, sourceFrame, resolution, root);
  }
}

//PIXI.ProjectionSystem = NewProjector;

export class Camera extends PIXI.DisplayObject {
  /**
   *
   * @param {PIXI.Container | Stage} stage
   * @param {PIXI.Container} [listen]
   */
  constructor(stage, listen) {
    super();

    this.stage = stage;
    this.listen = listen || this;
    this.pixelSnapping = true;
  }

  forceUpdate() {
    this.stage.needUpdateTransform = true;
    this.updateTransform();
  }

  updateTransform() {
    this.stage.parent = this.parent;
    this.stage.updateTransform();
    this.stage.parent = undefined;

    this.transform.updateTransform(this.parent.transform);
  }
  /**
   *
   * @param {PIXI.Renderer} renderer
   */
  render(renderer) {
    const { projection, batch } = renderer;

    if (!projection.state) {
      projection.state = {};
      projection.__proto__ = NewProjector.prototype;
      return; // skip first render because projection system cann't pathed
    }
    const state = Object.assign({}, projection.state);

    batch.flush();

    const orig = state.transform;

    projection.transform = this.listen.worldTransform;

    if (this.pixelSnapping) {
      const sx = 1;//this.scale.x;
      const sy = 1;//this.scale.y;

      projection.transform.tx = Math.round(projection.transform.tx * sx) / sx;
      projection.transform.ty = Math.round(projection.transform.ty * sy) / sy;
    }

    projection.update(
      state.destinationFrame,
      state.sourceFrame,
      state.resolution,
      state.root
    );

    this.stage.render(renderer);

    batch.flush();

    projection.transform = orig;
    projection.update(
      state.destinationFrame,
      state.sourceFrame,
      state.resolution,
      state.root
    );
  }

  get matrix() {
    return this.listen.worldTransform;
  }

  /**
   *
   * @type {PIXI.Matrix}
   */
  get invertedMatrix() {
    tmpMatrix.copyFrom(this.listen.transform.worldTransform);
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
