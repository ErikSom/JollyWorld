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
        optimizedVertices = simpler(vertices, editorSettings.pathSimplificationTolerance/zoom, false);
    }
    return optimizedVertices;
}