import {
    b2Vec2
} from "../../../libs/Box2D";
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
export const lineIntersect = function (A, B, C, D) {
    const ccw = function (A, B, C) {
        return (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x)
    };
    return ccw(A, C, D) != ccw(B, C, D) && ccw(A, B, C) != ccw(A, B, D)
};
export const flatten = function (arr) {
    return [].concat.apply([], arr.map(function (element) {
        return Array.isArray(element) ? flatten(element) : element;
    }))
}