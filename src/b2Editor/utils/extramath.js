import { b2Vec2 } from "../../../libs/Box2D";
import {
    game
} from "../../Game";

export const rotateVector = function (vector, degrees) {
    const radians = degrees * game.editor.DEG2RAD;
    const sin = Math.sin(radians);
    const cos = Math.cos(radians);
    const tx = vector.x;
    const ty = vector.y;
    return new b2Vec2(cos * tx - sin * ty, sin * tx + cos * ty);
}