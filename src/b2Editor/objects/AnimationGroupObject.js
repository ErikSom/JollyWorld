import { BaseObject } from './BaseObject';

export class AnimationGroupObject extends BaseObject {
    static TYPE = 11;
    type = 11;

    graphicObjects = [];
    bodyID = null;
    texturePositionOffsetLength = null;
    texturePositionOffsetAngle = null;
    textureAngleOffset = null;
    transparancy = 1;
    tileTexture = '';
    lockselection = false;
    parallax = 0.0;
    repeatTeleportX = 0;
    repeatTeleportY = 0;
    fps = 12;
    playing = true;
    visible = true;
    mirrored = false;

    initFromArray(arr) {
        super.initFromArray(arr);

        this.ID = arr[6];
        this.graphicObjects = arr[7];
        this.bodyID = arr[8];
        this.texturePositionOffsetLength = arr[9];
        this.texturePositionOffsetAngle = arr[10];
        this.textureAngleOffset = arr[11];
        this.transparancy = arr[12] !== undefined ? arr[12] : 1;
        this.parallax = arr[13] !== undefined ? arr[13] : 0;
        this.repeatTeleportX = arr[14] !== undefined ? arr[14] : 0;
        this.repeatTeleportY = arr[15] !== undefined ? arr[15] : 0;
        this.fps = arr[16] !== undefined ? arr[16] : 12;
        this.playing = arr[17] !== undefined ? arr[17] : true;
        this.visible = typeof arr[18] === "boolean" ? arr[18] : true;
        this.mirrored = typeof arr[19] === "boolean" ? arr[19] : false;

        return this;
    }
}