import {
    game
} from "../../Game";

export const rotateVector = function (vector, degrees) {
    const radians = degrees * game.editor.DEG2RAD;
    const sin = Math.sin(radians);
    const cos = Math.cos(radians);
    const tx = vector.x;
    const ty = vector.y;
    return new Box2D.b2Vec2(cos * tx - sin * ty, sin * tx + cos * ty);
}

export const rotateVectorAroundPoint = function(vector, point, degrees, log){
    const vec = vector.Clone().SelfSub(point);
    // if(log) console.log(vec.x, vec.y, 'diff', vec.Length());
    const newvec = new Box2D.b2Vec2(vec.Length(), 0);
    const rotatedVector = rotateVector(newvec, degrees);
    return rotatedVector.SelfAdd(point);
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

export const isConvex = function (arr) {
    if (arr.length < 4)
        return true;
    let sign = false;
    let n = arr.length;
    for (let i = 0; i < n; i++) {
        const dx1 = arr[(i + 2) % n].x - arr[(i + 1) % n].x;
        const dy1 = arr[(i + 2) % n].y - arr[(i + 1) % n].y;
        const dx2 = arr[i].x - arr[(i + 1) % n].x;
        const dy2 = arr[i].y - arr[(i + 1) % n].y;
        const zcrossproduct = dx1 * dy2 - dy1 * dx2;
        if (i == 0)
            sign = zcrossproduct > 0;
        else if (sign != (zcrossproduct > 0))
            return false;
    }
    return true;
}

export function linePointDistance(x, y, x1, y1, x2, y2) {

    let A = x - x1;
    let B = y - y1;
    let C = x2 - x1;
    let D = y2 - y1;

    let dot = A * C + B * D;
    let len_sq = C * C + D * D;
    let param = -1;
    if (len_sq != 0) //in case of 0 length line
        param = dot / len_sq;

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    }
    else if (param > 1) {
      xx = x2;
      yy = y2;
    }
    else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    let dx = x - xx;
    let dy = y - yy;
    return {x:xx, y:yy, distance:Math.sqrt(dx * dx + dy * dy)};
}


/**
 * jsBezier
 *
 * Copyright (c) 2010 - 2017 jsPlumb (hello@jsplumbtoolkit.com)
 *
 * licensed under the MIT license.
 */

if(typeof Math.sgn == "undefined") {
    Math.sgn = function(x) { return x == 0 ? 0 : x > 0 ? 1 :-1; };
}

const pidouble = Math.PI*2;
export const normalizePI = angle => {
    while (angle <= -Math.PI) angle += pidouble;
    while (angle > Math.PI) angle -= pidouble;
    return angle;
}

export const clampAngleToRange = (angle, min, max) => Math.min(max, Math.max(min, normalizePI(angle)));

export const angleDifference = ( angle1, angle2 ) =>
{
    const diff = ( angle2 - angle1 + Math.PI ) % pidouble - Math.PI;
    return diff < -Math.PI ? diff + pidouble : diff;
}


let Vectors = {
        subtract 	: 	function(v1, v2) { return {x:v1.x - v2.x, y:v1.y - v2.y }; },
        dotProduct	: 	function(v1, v2) { return (v1.x * v2.x)  + (v1.y * v2.y); },
        square		:	function(v) { return Math.sqrt((v.x * v.x) + (v.y * v.y)); },
        scale		:	function(v, s) { return {x:v.x * s, y:v.y * s }; }
    },
    maxRecursion = 64,
    flatnessTolerance = Math.pow(2.0,-maxRecursion-1);

export const distanceFromCurve = function(point, curve) {
    let candidates = [],
        w = _convertToBezier(point, curve),
        degree = curve.length - 1, higherDegree = (2 * degree) - 1,
        numSolutions = findRoots(w, higherDegree, candidates, 0),
        v = Vectors.subtract(point, curve[0]), dist = Vectors.square(v), t = 0.0;

    for (let i = 0; i < numSolutions; i++) {
        v = Vectors.subtract(point, bezier(curve, degree, candidates[i], null, null));
        let newDist = Vectors.square(v);
        if (newDist < dist) {
            dist = newDist;
            t = candidates[i];
        }
    }
    v = Vectors.subtract(point, curve[degree]);
    let  newDist = Vectors.square(v);
    if (newDist < dist) {
        dist = newDist;
        t = 1.0;
    }
    return {location:t, distance:dist};
};

export const nearestPointOnCurve = function(point, curve) {
    let td = distanceFromCurve(point, curve);
    return {point:bezier(curve, curve.length - 1, td.location, null, null), location:td.location};
};

const _convertToBezier = function(point, curve) {
    let degree = curve.length - 1, higherDegree = (2 * degree) - 1,
        c = [], d = [], cdTable = [], w = [],
        z = [ [1.0, 0.6, 0.3, 0.1], [0.4, 0.6, 0.6, 0.4], [0.1, 0.3, 0.6, 1.0] ];

    for (let i = 0; i <= degree; i++) c[i] = Vectors.subtract(curve[i], point);
    for (let i = 0; i <= degree - 1; i++) {
        d[i] = Vectors.subtract(curve[i+1], curve[i]);
        d[i] = Vectors.scale(d[i], 3.0);
    }
    for (let row = 0; row <= degree - 1; row++) {
        for (let column = 0; column <= degree; column++) {
            if (!cdTable[row]) cdTable[row] = [];
            cdTable[row][column] = Vectors.dotProduct(d[row], c[column]);
        }
    }
    for (let i = 0; i <= higherDegree; i++) {
        if (!w[i]) w[i] = [];
        w[i].y = 0.0;
        w[i].x = parseFloat(i) / higherDegree;
    }
    let n = degree, m = degree-1;
    for (let k = 0; k <= n + m; k++) {
        let lb = Math.max(0, k - m),
            ub = Math.min(k, n);
        for (let i = lb; i <= ub; i++) {
            let j = k - i;
            w[i+j].y += cdTable[j][i] * z[j][i];
        }
    }
    return w;
};

const findRoots = function(w, degree, t, depth) {
    let left = [], right = [],
        left_count, right_count,
        left_t = [], right_t = [];

    switch (getCrossingCount(w, degree)) {
        case 0 : {
            return 0;
        }
        case 1 : {
            if (depth >= maxRecursion) {
                t[0] = (w[0].x + w[degree].x) / 2.0;
                return 1;
            }
            if (isFlatEnough(w, degree)) {
                t[0] = computeXIntercept(w, degree);
                return 1;
            }
            break;
        }
    }
    bezier(w, degree, 0.5, left, right);
    left_count  = findRoots(left,  degree, left_t, depth+1);
    right_count = findRoots(right, degree, right_t, depth+1);
    for (let i = 0; i < left_count; i++) t[i] = left_t[i];
    for (let i = 0; i < right_count; i++) t[i+left_count] = right_t[i];
    return (left_count+right_count);
};

const getCrossingCount = function(curve, degree) {
    let n_crossings = 0, sign, old_sign;
    sign = old_sign = Math.sgn(curve[0].y);
    for (let i = 1; i <= degree; i++) {
        sign = Math.sgn(curve[i].y);
        if (sign != old_sign) n_crossings++;
        old_sign = sign;
    }
    return n_crossings;
};

const isFlatEnough = function(curve, degree) {
    let  error,
        intercept_1, intercept_2, left_intercept, right_intercept,
        a, b, c, det, dInv, a1, b1, c1, a2, b2, c2;
    a = curve[0].y - curve[degree].y;
    b = curve[degree].x - curve[0].x;
    c = curve[0].x * curve[degree].y - curve[degree].x * curve[0].y;

    let max_distance_above, max_distance_below;
    max_distance_above = max_distance_below = 0.0;

    for (let i = 1; i < degree; i++) {
        let value = a * curve[i].x + b * curve[i].y + c;
        if (value > max_distance_above)
            max_distance_above = value;
        else if (value < max_distance_below)
            max_distance_below = value;
    }
    a1 = 0.0; b1 = 1.0; c1 = 0.0; a2 = a; b2 = b;
    c2 = c - max_distance_above;
    det = a1 * b2 - a2 * b1;
    dInv = 1.0/det;
    intercept_1 = (b1 * c2 - b2 * c1) * dInv;
    a2 = a; b2 = b; c2 = c - max_distance_below;
    det = a1 * b2 - a2 * b1;
    dInv = 1.0/det;
    intercept_2 = (b1 * c2 - b2 * c1) * dInv;
    left_intercept = Math.min(intercept_1, intercept_2);
    right_intercept = Math.max(intercept_1, intercept_2);
    error = right_intercept - left_intercept;
    return (error < flatnessTolerance)? 1 : 0;
};

const computeXIntercept = function(curve, degree) {
    let XLK = 1.0, YLK = 0.0,
        XNM = curve[degree].x - curve[0].x, YNM = curve[degree].y - curve[0].y,
        XMK = curve[0].x - 0.0, YMK = curve[0].y - 0.0,
        det = XNM*YLK - YNM*XLK, detInv = 1.0/det,
        S = (XNM*YMK - YNM*XMK) * detInv;
    return 0.0 + XLK * S;
};

const bezier = function(curve, degree, t, left, right) {
    let temp = [[]];
    for (let j =0; j <= degree; j++) temp[0][j] = curve[j];
    for (let i = 1; i <= degree; i++) {
        for (let j =0 ; j <= degree - i; j++) {
            if (!temp[i]) temp[i] = [];
            if (!temp[i][j]) temp[i][j] = {};
            temp[i][j].x = (1.0 - t) * temp[i-1][j].x + t * temp[i-1][j+1].x;
            temp[i][j].y = (1.0 - t) * temp[i-1][j].y + t * temp[i-1][j+1].y;
        }
    }
    if (left != null)
        for (let j = 0; j <= degree; j++) left[j]  = temp[j][0];
    if (right != null)
        for (let j = 0; j <= degree; j++) right[j] = temp[degree-j][j];

    return (temp[degree][0]);
};
