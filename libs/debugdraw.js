import { Box2D } from "./Box2D";

export function getPIXIDebugDraw(graphics, scale) {
  function getColorFromDebugDrawCallback(color) {
    var red = (color._r * 255 * 255 * 255)|0;
    var green = (color._g * 255 * 255)|0;
    var blue = (color._b * 255)|0;
    return red + green + blue;
  }
  function drawSegment(graphics, vert1, vert2, color) {
    graphics.lineStyle(1, color, 1);
    graphics.moveTo(vert1.x * scale, vert1.y * scale);
    graphics.lineTo(vert2.x * scale, vert2.y * scale);
  }
  function drawPolygon(graphics, vertices, vertexCount, fill, color) {
    graphics.lineStyle(1, color, 1);
    if (fill) {
      graphics.beginFill(color, 0.5);
    }
    var tmpI;
    for(tmpI=0;tmpI<vertexCount;tmpI++) {
      var vert = vertices[tmpI];
      if ( tmpI === 0 )
        graphics.moveTo(vert.x * scale, vert.y * scale);
      else
        graphics.lineTo(vert.x * scale, vert.y * scale);
    }
      graphics.lineTo(vertices[0].x * scale, vertices[0].y * scale);

    if (fill) {
      graphics.endFill();
    }
  }
  function drawCircle(graphics, center, radius, axis, fill, color) {

    graphics.lineStyle(1, color, 1);
    if (fill) {
      graphics.beginFill(color, 0.5);
    }
    graphics.moveTo(center.x * scale+ radius*scale, center.y * scale);
    graphics.arc(center.x * scale, center.y * scale, radius * scale, 0, 2 * Math.PI, false);
    if (fill) {
      graphics.endFill();
    }

    if (fill) {
      //render axis marker
      var vert2 = new Box2D.Common.Math.b2Vec2(center.x, center.y);
      vert2 = new Box2D.Common.Math.b2Vec2(vert2.x+axis.x * radius, vert2.y+axis.y * radius);
      graphics.moveTo(center.x * scale, center.y * scale);
      graphics.lineTo(vert2.x * scale, vert2.y * scale);
    }
  }
  function drawAxes(graphics, x, y, angle) {
    var sin = Math.sin(angle);
    var cos = Math.cos(angle);
    var newX = x * scale;
    var newY = y * scale;
    function transform(x, y) { return { x: x * cos + y * sin, y: -x * sin + y * cos }; }
    var origin = transform(newX, newY);
    var xAxis = transform(newX + 100, newY);
    var yAxis = transform(newX, newY + 100);
    graphics.lineStyle(2, 'rgb(192,0,0)', 1);
    graphics.moveTo(origin.x, origin.y);
    graphics.lineTo(xAxis.x, xAxis.y);
    graphics.lineStyle(2, 'rgb(0,192,0)', 1);
    graphics.moveTo(origin.x, origin.y);
    graphics.lineTo(yAxis.x, yAxis.y);
  }
  function drawTransform(transform) {
    var pos = trans.position();
    drawAxes(graphics, pos.x, pos.y, transform.GetAngle());
  }

  var debugDraw = new Box2D.Dynamics.b2DebugDraw();
  debugDraw.m_sprite.graphics.clear = function (){};
  debugDraw.DrawSegment = function(vert1, vert2, color) {
    drawSegment(graphics, vert1, vert2, getColorFromDebugDrawCallback(color));
  };
  debugDraw.DrawPolygon = function(vertices, vertexCount, color) {
    drawPolygon(graphics, vertices, vertexCount, false, getColorFromDebugDrawCallback(color));
  };
  debugDraw.DrawSolidPolygon = function(vertices, vertexCount, color) {
    drawPolygon(graphics, vertices, vertexCount, true, getColorFromDebugDrawCallback(color));
  };
  debugDraw.DrawCircle = function(center, radius, color) {
    drawCircle(graphics, center, radius, Box2D.b2Vec2(0,0), false, getColorFromDebugDrawCallback(color));
  };
  debugDraw.DrawSolidCircle = function(center, radius, axis, color) {
    drawCircle(graphics, center, radius, axis, true, getColorFromDebugDrawCallback(color));
  };
  debugDraw.DrawTransform = function(transform) {
    drawTransform(graphics, transform);
  };
  return debugDraw;
}