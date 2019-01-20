import { editorSettings } from './editorSettings';

const paper = require('paper/dist/paper-core');
const simpler = require('simplify-js');

paper.setup();
export const simplifyPath = function (vertices, smooth, zoom) {
    let optimizedVertices;
    if (smooth) {
        optimizedVertices = [];
        let path = new paper.Path({});
        path.closed = true;
        vertices.map((v) => {
            path.add(new paper.Point(v.x, v.y));
        });
        path.simplify(editorSettings.pathSimplificationTolerance);
        path.segments.map((p)=>{
            optimizedVertices.push({x:p.point.x, y:p.point.y, point1:{x:p.curve.points[1].x, y:p.curve.points[1].y}, point2:{x:p.curve.points[2].x, y:p.curve.points[2].y}})
        });
    } else {
        let toleranceIncreaser = 0;
        optimizedVertices = vertices;
        while(!optimizedVertices || optimizedVertices.length>editorSettings.pathSimplificationMaxVertices){
            optimizedVertices = simpler(optimizedVertices, (editorSettings.pathSimplificationTolerance+toleranceIncreaser)/zoom, false);
            toleranceIncreaser += editorSettings.pathSimplificationTolerance;
        }
    }
    return optimizedVertices;
}