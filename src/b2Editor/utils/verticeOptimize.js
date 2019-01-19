import { editorSettings } from './editorSettings';

const paper = require('paper/dist/paper-core');
const simpler = require('simplify-js');

paper.setup();
export const simplifyPath = function (vertices, smooth, zoom) {
    let optimizedVertices;
    if (smooth) {
        let path = new paper.Path({});
        vertices.map((v) => {
            path.add(new paper.Point(v.x, v.y));
        });
        path.simplify(10);
    } else {
        let toleranceIncreaser = 0;
        optimizedVertices = vertices;
        while(!optimizedVertices || optimizedVertices.length>editorSettings.pathSimplificationMaxVertices){
            optimizedVertices = simpler(optimizedVertices, (editorSettings.pathSimplificationTolerance+toleranceIncreaser)/zoom, false);
            toleranceIncreaser += editorSettings.pathSimplificationTolerance;
        }
        console.log(optimizedVertices.length, "LENGTG");
    }
    return optimizedVertices;
}