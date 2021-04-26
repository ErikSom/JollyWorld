export const generateVertices = vertices =>{
    const buffer = Box2D._malloc(vertices.length * 8);
    let offset = 0;
    for (var i=0;i<vertices.length;i++) {
        Box2D.HEAPF32[buffer + offset >> 2] = vertices[i].get_x();
        Box2D.HEAPF32[buffer + (offset + 4) >> 2] = vertices[i].get_y();
        offset += 8;
    }
    return Box2D.wrapPointer(buffer, Box2D.b2Vec2);
}
