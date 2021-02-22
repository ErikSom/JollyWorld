import { BodyObject } from './BodyObject';
import { TextureObject } from './TextureObject';
import { JointObject } from './JointObject';
import { GraphicsObject } from './GraphicsObject';
import { GraphicsGroupObject } from './GraphicsGroupObject';
import { PrefabObject } from './PrefabObject';
import { AnimationGroupObject } from './AnimationGroupObject';
import { MultiObject } from './MultiObject';
import { TextObject } from './TextObject';
import { TriggerObject } from './TriggerObject';
import { EditorSettingsObject } from './EditorSettingsObject';

export {
    BodyObject,
    TextureObject,
    JointObject,
    GraphicsObject,
    GraphicsGroupObject,
    PrefabObject,
    AnimationGroupObject,
    MultiObject,
    TextObject,
    TriggerObject,
    EditorSettingsObject
}

const TYPE_LOCATOR = {
    [ BodyObject.TYPE ] : BodyObject,
    [ TextureObject.TYPE ] : TextureObject,
    [ JointObject.TYPE ] : JointObject,
    [ GraphicsObject.TYPE ] : GraphicsObject,
    [ GraphicsGroupObject.TYPE ] : GraphicsGroupObject,
    [ PrefabObject.TYPE ] : PrefabObject,
    [ AnimationGroupObject.TYPE ] : AnimationGroupObject,
    [ MultiObject.TYPE ] : MultiObject,
    [ TextObject.TYPE ] : TextObject,
    [ TriggerObject.TYPE ] : TriggerObject,
    [ EditorSettingsObject.TYPE ] : EditorSettingsObject
}

/**
 * 
 * @param {Array<any>} arr 
 * @returns { BodyObject | TextureObject 
 * | JointObject | GraphicsObject 
 * | GraphicsGroupObject | PrefabObject 
 * | AnimationGroupObject | MultiObject 
 * | TextObject | TriggerObject | EditorSettingsObject }
 */
export function parseFromArray(arr) {
    const type = arr[0];
    const Ctor = TYPE_LOCATOR[type];

    if (!Ctor) {
        throw 'Unknow type:' + type;
    }

    const obj = new Ctor();
    obj.initFromArray(arr);
    return obj;
}