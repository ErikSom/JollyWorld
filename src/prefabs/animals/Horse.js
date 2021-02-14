import * as PrefabManager from '../PrefabManager';
import {
    game
} from "../../Game";

class Horse extends PrefabManager.basePrefab {
    static TIME_EYES_CLOSE = 3000;
    static TIME_EYES_OPEN = 3100;
    constructor(target) {
        super(target);
    }
    init() {
        super.init();
        this.eyesTimer = 0.0;
        this.collisionUpdates = [];
        var i;
        for (i = 0; i < this.lookupObject._bodies.length; i++) {
            var body = this.lookupObject._bodies[i];
            // if (body.mySprite.data.groups.indexOf('.flesh') >= 0) {

            //     body.isFlesh = true;
            //     game.editor.prepareBodyForDecals(body);

            //     var texture = body.myTexture;
            //     //fix gore for Skin2, Skin3 etc

            //     var fleshName = texture.data.textureName.split('0000')[0];
            //     if (fleshName.indexOf('Head') > 0) fleshName = fleshName.substr(0, fleshName.indexOf('_')) + "_Head";

            //     var sprite = new PIXI.Sprite(PIXI.Texture.from(fleshName + "_Flesh0000"));
            //     texture.addChildAt(sprite, 0);
            // }
        }
    }
    update() {
        super.update();
        if (PrefabManager.timerReady(this.eyesTimer, Horse.TIME_EYES_CLOSE, true)) {
            //this.lookupObject.eye.myTexture.originalSprite.texture = PIXI.Texture.from(this.lookupObject.eye.myTexture.data.textureName.replace("0000", "_Closed0000"));
        } else if (PrefabManager.timerReady(this.eyesTimer, Horse.TIME_EYES_OPEN, false)) {
            //this.lookupObject.eye.myTexture.originalSprite.texture = PIXI.Texture.from(this.lookupObject.eye.myTexture.data.textureName);
            this.eyesTimer = -game.editor.deltaTime;
        }

        for (var i = 0; i < this.collisionUpdates.length; i++) {
            this.doCollisionUpdate(this.collisionUpdates[i]);
        }
        this.collisionUpdates = [];
        this.eyesTimer += game.editor.deltaTime;
    }
    static GORE_BASH = 0;
    static GORE_SNAP = 1;

    initContactListener() {
        super.initContactListener();
        var self = this;
        this.contactListener.PostSolve = function (contact, impulse) {
            // var bodies = [contact.GetFixtureA().GetBody(), contact.GetFixtureB().GetBody()];
            // var body;
            // for (var i = 0; i < bodies.length; i++) {
            //     body = bodies[i];
            // }
        }
    }

    doCollisionUpdate(update) {
        // switch (update.type) {
        //     case Horse.GORE_BASH:
        //         break;
        //     case Horse.GORE_SNAP:
        //         break;
        // }
    }
}

PrefabManager.prefabLibrary.Horse = {
    class: Horse,
}