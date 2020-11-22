import {
    editorSettings
} from './editorSettings';
import paper from '../../../libs/paper-core.js'
const simpler = require('simplify-js');

paper.setup();
export const simplifyPath = function (vertices, smooth, zoom) {
    // if(!smooth) console.log("Straight optimize path..");
    // else console.log("Bezier Curve optimize path..");
    // console.log("Starting num vertices:", vertices.length);
    let optimizedVertices;
    let toleranceIncreaser = 0;
    const maxIterations = 500;
    const precision = 30 * zoom;
    let iterations = 0;
    if (smooth) {
        while ((!optimizedVertices || optimizedVertices.length > editorSettings.pathSimplificationMaxVertices) && iterations < maxIterations) {
            optimizedVertices = [];
            let path = new paper.Path({});
            vertices.map((v) => {
                path.add(new paper.Point(v.x * precision, v.y * precision));
            });
            path.closed = true;
            path.simplify(editorSettings.pathSmoothTolerance + toleranceIncreaser);
            console.log(path);
            path.segments.map((p) => {
                optimizedVertices.push({
                    x: p.point.x / precision,
                    y: p.point.y / precision,
                    point1: {
                        x: p.curve.points[1].x / precision,
                        y: p.curve.points[1].y / precision
                    },
                    point2: {
                        x: p.curve.points[2].x / precision,
                        y: p.curve.points[2].y / precision
                    }
                })
            });
            toleranceIncreaser += editorSettings.pathSimplificationTolerance;
            iterations++;
        }
    } else {
        while ((!optimizedVertices || optimizedVertices.length > editorSettings.pathSimplificationMaxVertices) && iterations < maxIterations) {
            optimizedVertices = vertices.map(v => ({
                x: v.x * precision,
                y: v.y * precision
            }));
            optimizedVertices = simpler(optimizedVertices, (editorSettings.pathSimplificationTolerance + toleranceIncreaser), false).map(v => ({
                x: v.x / precision,
                y: v.y / precision
            }));
            toleranceIncreaser += editorSettings.pathSimplificationTolerance;
            iterations++;
        }
    }
    if (optimizedVertices.length < 3) optimizedVertices = vertices;
    if (optimizedVertices.length > 100) optimizedVertices = null;
    // console.log("Optimized num vertices:", optimizedVertices.length);
    return optimizedVertices;
}



export const combineShapes = sprites => {
    let combinedPath = null;

    const succesfullyMerged = [];

    const referenceSprite = sprites[0];

    sprites.forEach((sprite, i) => {
        let path = new paper.Path();
        let vertices = [...sprite.data.vertices];

        vertices.reverse();
        vertices.forEach((vertice, j) => {

            if (vertices.length > 1) {
                let previousVertice = vertices[j + 1];
                if (j === vertices.length - 1) previousVertice = vertices[0];


                let localVertice = vertice;
                let localPoint1 = vertice.point1 || new paper.Point(0, 0);
                let localPoint2 = previousVertice.point2 || new paper.Point(0, 0);

                if(i > 0){
                    // let globalPos = sprite.toGlobal(localVertice);
                    localVertice = referenceSprite.toLocal(localVertice, sprite);

                    if(localPoint1){
                        // globalPos = sprite.toGlobal(localPoint1);
                        localPoint1 = referenceSprite.toLocal(localPoint1, sprite);
                    }
                    if(localPoint2){
                        // globalPos = sprite.toGlobal(localPoint2);
                        localPoint2 = referenceSprite.toLocal(localPoint2, sprite);
                    }
                }

                const pos = new paper.Point(localVertice.x, localVertice.y);

                let p1 = new paper.Point(0, 0);
                if(localPoint1){
                    p1 = new paper.Point(localPoint1.x - localVertice.x, localPoint1.y - localVertice.y);
                }
                let p2 = new paper.Point(0, 0);
                if(localPoint2){
                    p2 = new paper.Point(localPoint2.x - localVertice.x, localPoint2.y - localVertice.y);
                }

                const segment = new paper.Segment(pos, p1, p2);
                path.segments.push(segment)
                path.closePath();
            } else {
                path = new paper.Path.Circle(new paper.Point(localVertice.x, localVertice.y), sprite.radius);
            }
        });


        if (i === 0) combinedPath = path;
        else {
            const tryCombine = combinedPath.unite(path);
            if(tryCombine.segments){
                succesfullyMerged.push(i);
                combinedPath = tryCombine;
            }
        }
    });

    const combinedVertices = combinedPath.segments.map(p=>
        ({x:p.point.x, y:p.point.y, point1:{x:p.curve.points[1].x, y:p.curve.points[1].y}, point2:{x:p.curve.points[2].x, y:p.curve.points[2].y}})
    );

    return {vertices:combinedVertices, merged:succesfullyMerged}
}
