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

    sprites.forEach((sprite, i) => {
        let path = new paper.Path();
        let vertices = [...sprite.data.vertices];
        let offsetX = i === 0 ? 0 : sprite.x-sprites[0].x;
        let offsetY = i === 0 ? 0 : sprite.y-sprites[0].y;

        vertices.reverse();
        vertices.forEach((vertice, j) => {

            if (vertices.length > 1) {
                let previousVertice = vertices[j + 1];
                if (j === vertices.length - 1) previousVertice = vertices[0];
                const pos = new paper.Point(vertice.x+offsetX, vertice.y+offsetY);

                let p1 = new paper.Point(0, 0);
                if(vertice.point1){
                    p1 = new paper.Point(vertice.point1.x - vertice.x, vertice.point1.y - vertice.y);
                }
                let p2 = new paper.Point(0, 0);
                if(previousVertice.point2){
                    p2 = new paper.Point(previousVertice.point2.x - vertice.x, previousVertice.point2.y - vertice.y);
                }

                const segment = new paper.Segment(pos, p1, p2);
                path.segments.push(segment)
                path.closePath();
            } else {
                path = new paper.Path.Circle(new paper.Point(vertice.x+offsetX, vertice.y+offsetY), sprite.radius);
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
