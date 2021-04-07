import {
    game
} from "../../Game";

export const stopCustomBehaviour = () => {
    game.editor.customPrefabMouseDown = null;
    game.editor.customPrefabMouseMove = null;
    game.editor.customDebugDraw = null;
}
