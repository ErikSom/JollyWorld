import { BaseObject } from './BaseObject';

export class TextObject extends BaseObject {
    static TYPE = 9;
    type = 9;

    text = 'Write your text here';
    textColor = "#FFF";
    transparancy = 1.0;
    fontSize = 12;
    fontName = "Arial";
    textAlign = 'left';
    lockselection = false;
    parallax = 0.0;
    repeatTeleportX = 0;
    repeatTeleportY = 0;
    visible = true;

    initFromArray(arr) {
        super.initFromArray(arr);

        this.ID = arr[6];
        this.text = arr[7];
        this.textColor = arr[8];
        this.transparancy = arr[9];
        this.fontSize = arr[10];
        this.fontName = arr[11];
        this.textAlign = arr[12];
        this.bodyID = arr[13];
        this.texturePositionOffsetLength = arr[14];
        this.texturePositionOffsetAngle = arr[15];
        this.textureAngleOffset = arr[16];
        this.parallax = arr[17] !== undefined ? arr[17] : 0;
        this.repeatTeleportX = arr[18] !== undefined ? arr[18] : 0;
        this.repeatTeleportY = arr[19] !== undefined ? arr[19] : 0;
        this.visible = typeof arr[20] === "boolean" ? arr[20] : true;

        return this;
    }
}