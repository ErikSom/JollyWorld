import { editorSettings } from './editorSettings';

const paper = require('paper/dist/paper-core');
const simpler = require('simplify-js');

paper.setup();
export const simplifyPath = function (vertices, smooth, zoom) {
    if(!smooth) console.log("Straight optimize path..");
    else console.log("Bezier Curve optimize path..");
    console.log("Starting num vertices:", vertices.length);
    let optimizedVertices;
    let toleranceIncreaser = 0;
    const maxIterations = 500;
    let iterations = 0;
    if (smooth) {
        vertices.pop();
        while((!optimizedVertices || optimizedVertices.length>editorSettings.pathSimplificationMaxVertices) && iterations < maxIterations){
            optimizedVertices = [];
            let path = new paper.Path({});
            vertices.map((v) => {
                path.add(new paper.Point(v.x, v.y));
            });
            path.closed = true;
            path.simplify(editorSettings.pathSmoothTolerance+toleranceIncreaser);
            path.segments.map((p)=>{
                optimizedVertices.push({x:p.point.x, y:p.point.y, point1:{x:p.curve.points[1].x, y:p.curve.points[1].y}, point2:{x:p.curve.points[2].x, y:p.curve.points[2].y}})
            });
            toleranceIncreaser += editorSettings.pathSimplificationTolerance;
            iterations++;
        }
    } else {
        optimizedVertices = vertices;
        while((!optimizedVertices || optimizedVertices.length>editorSettings.pathSimplificationMaxVertices) && iterations < maxIterations){
            optimizedVertices = simpler(optimizedVertices, (editorSettings.pathSimplificationTolerance+toleranceIncreaser)/zoom, false);
            toleranceIncreaser += editorSettings.pathSimplificationTolerance;
            iterations++;
        }
    }
    if(optimizedVertices.length<3) optimizedVertices = vertices;
    if(optimizedVertices.length>100) optimizedVertices = null;
    console.log("Optimized num vertices:", optimizedVertices.length);
    return optimizedVertices;
}