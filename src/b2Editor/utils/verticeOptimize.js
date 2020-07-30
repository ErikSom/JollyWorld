import { editorSettings } from './editorSettings';
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
    const precision = 30*zoom;
    let iterations = 0;
    if (smooth) {
        while((!optimizedVertices || optimizedVertices.length>editorSettings.pathSimplificationMaxVertices) && iterations < maxIterations){
            optimizedVertices = [];
            let path = new paper.Path({});
            vertices.map((v) => {
                path.add(new paper.Point(v.x*precision, v.y*precision));
            });
            path.closed = true;
            path.simplify(editorSettings.pathSmoothTolerance+toleranceIncreaser);
            path.segments.map((p)=>{
                optimizedVertices.push({x:p.point.x/precision, y:p.point.y/precision, point1:{x:p.curve.points[1].x/precision, y:p.curve.points[1].y/precision}, point2:{x:p.curve.points[2].x/precision, y:p.curve.points[2].y/precision}})
            });
            toleranceIncreaser += editorSettings.pathSimplificationTolerance;
            iterations++;
        }
    } else {
        while((!optimizedVertices || optimizedVertices.length>editorSettings.pathSimplificationMaxVertices) && iterations < maxIterations){
            optimizedVertices = vertices.map(v=>({x:v.x*precision, y:v.y*precision}));
            optimizedVertices = simpler(optimizedVertices, (editorSettings.pathSimplificationTolerance+toleranceIncreaser), false).map(v=>({x:v.x/precision, y:v.y/precision}));
            toleranceIncreaser += editorSettings.pathSimplificationTolerance;
            iterations++;
        }
    }
    if(optimizedVertices.length<3) optimizedVertices = vertices;
    if(optimizedVertices.length>100) optimizedVertices = null;
    // console.log("Optimized num vertices:", optimizedVertices.length);
    return optimizedVertices;
}
