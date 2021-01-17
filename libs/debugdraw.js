import box2dModule from "./Box2D";
const {Box2D} = box2dModule;

class DebugDraw extends Box2D.b2Draw {

  constructor() {
      super();
      this.m_ctx = null;
  }
  PushTransform(xf) {
      const ctx = this.m_ctx;
      if (ctx) {
          ctx.save();
          ctx.translate(xf.p.x, xf.p.y);
          ctx.rotate(xf.q.GetAngle());
      }
  }
  PopTransform(xf) {
      const ctx = this.m_ctx;
      if (ctx) {
          ctx.restore();
      }
  }
  DrawPolygon(vertices, vertexCount, color) {
      const ctx = this.m_ctx;
      if (ctx) {
          ctx.beginPath();
          ctx.moveTo(vertices[0].x, vertices[0].y);
          for (let i = 1; i < vertexCount; i++) {
              ctx.lineTo(vertices[i].x, vertices[i].y);
          }
          ctx.closePath();
          ctx.strokeStyle = color.MakeStyleString(1);
          ctx.stroke();
      }
  }
  DrawSolidPolygon(vertices, vertexCount, color) {
      const ctx = this.m_ctx;
      if (ctx) {
          ctx.beginPath();
          ctx.moveTo(vertices[0].x, vertices[0].y);
          for (let i = 1; i < vertexCount; i++) {
              ctx.lineTo(vertices[i].x, vertices[i].y);
          }
          ctx.closePath();
          ctx.fillStyle = color.MakeStyleString(0.5);
          ctx.fill();
          ctx.strokeStyle = color.MakeStyleString(1);
          ctx.stroke();
      }
  }
  DrawCircle(center, radius, color) {
      const ctx = this.m_ctx;
      if (ctx) {
          ctx.beginPath();
          ctx.arc(center.x, center.y, radius, 0, b2_pi * 2, true);
          ctx.strokeStyle = color.MakeStyleString(1);
          ctx.stroke();
      }
  }
  DrawSolidCircle(center, radius, axis, color) {
      const ctx = this.m_ctx;
      if (ctx) {
          const cx = center.x;
          const cy = center.y;
          ctx.beginPath();
          ctx.arc(cx, cy, radius, 0, b2_pi * 2, true);
          ctx.moveTo(cx, cy);
          ctx.lineTo((cx + axis.x * radius), (cy + axis.y * radius));
          ctx.fillStyle = color.MakeStyleString(0.5);
          ctx.fill();
          ctx.strokeStyle = color.MakeStyleString(1);
          ctx.stroke();
      }
  }
  // #if B2_ENABLE_PARTICLE
  DrawParticles(centers, radius, colors, count) {
      const ctx = this.m_ctx;
      if (ctx) {
          if (colors !== null) {
              for (let i = 0; i < count; ++i) {
                  const center = centers[i];
                  const color = colors[i];
                  ctx.fillStyle = color.MakeStyleString();
                  // ctx.fillRect(center.x - radius, center.y - radius, 2 * radius, 2 * radius);
                  ctx.beginPath();
                  ctx.arc(center.x, center.y, radius, 0, b2_pi * 2, true);
                  ctx.fill();
              }
          }
          else {
              ctx.fillStyle = "rgba(255,255,255,0.5)";
              // ctx.beginPath();
              for (let i = 0; i < count; ++i) {
                  const center = centers[i];
                  // ctx.rect(center.x - radius, center.y - radius, 2 * radius, 2 * radius);
                  ctx.beginPath();
                  ctx.arc(center.x, center.y, radius, 0, b2_pi * 2, true);
                  ctx.fill();
              }
              // ctx.fill();
          }
      }
  }
  // #endif
  DrawSegment(p1, p2, color) {
      const ctx = this.m_ctx;
      if (ctx) {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = color.MakeStyleString(1);
          ctx.stroke();
      }
  }
  DrawTransform(xf) {
      const ctx = this.m_ctx;
      if (ctx) {
          this.PushTransform(xf);
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(1, 0);
          ctx.strokeStyle = Box2D.b2Color.RED.MakeStyleString(1);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.lineTo(0, 1);
          ctx.strokeStyle = Box2D.b2Color.GREEN.MakeStyleString(1);
          ctx.stroke();
          this.PopTransform(xf);
      }
  }
  DrawPoint(p, size, color) {
      const ctx = this.m_ctx;
      if (ctx) {
          ctx.fillStyle = color.MakeStyleString();
          size *= g_camera.m_zoom;
          size /= g_camera.m_extent;
          const hsize = size / 2;
          ctx.fillRect(p.x - hsize, p.y - hsize, size, size);
      }
  }
  DrawString(x, y, message) {
      const ctx = this.m_ctx;
      if (ctx) {
          ctx.save();
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.font = "15px DroidSans";
          const color = DebugDraw.DrawString_s_color;
          ctx.fillStyle = color.MakeStyleString();
          ctx.fillText(message, x, y);
          ctx.restore();
      }
  }
  DrawStringWorld(x, y, message) {
      const ctx = this.m_ctx;
      if (ctx) {
          const p = DebugDraw.DrawStringWorld_s_p.Set(x, y);
          // world -> viewport
          const vt = g_camera.m_center;
          Box2D.b2Vec2.SubVV(p, vt, p);
          ///const vr = g_camera.m_roll;
          ///box2d.b2Rot.MulTRV(vr, p, p);
          const vs = g_camera.m_zoom;
          Box2D.b2Vec2.MulSV(1 / vs, p, p);
          // viewport -> canvas
          const cs = 0.5 * g_camera.m_height / g_camera.m_extent;
          Box2D.b2Vec2.MulSV(cs, p, p);
          p.y *= -1;
          const cc = DebugDraw.DrawStringWorld_s_cc.Set(0.5 * ctx.canvas.width, 0.5 * ctx.canvas.height);
          Box2D.b2Vec2.AddVV(p, cc, p);
          ctx.save();
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.font = "15px DroidSans";
          const color = DebugDraw.DrawStringWorld_s_color;
          ctx.fillStyle = color.MakeStyleString();
          ctx.fillText(message, p.x, p.y);
          ctx.restore();
      }
  }
  DrawAABB(aabb, color) {
      const ctx = this.m_ctx;
      if (ctx) {
          ctx.strokeStyle = color.MakeStyleString();
          const x = aabb.lowerBound.x;
          const y = aabb.lowerBound.y;
          const w = aabb.upperBound.x - aabb.lowerBound.x;
          const h = aabb.upperBound.y - aabb.lowerBound.y;
          ctx.strokeRect(x, y, w, h);
      }
  }
}
DebugDraw.DrawString_s_color = new Box2D.b2Color(0.9, 0.6, 0.6);
DebugDraw.DrawStringWorld_s_p = new Box2D.b2Vec2();
DebugDraw.DrawStringWorld_s_cc = new Box2D.b2Vec2();
DebugDraw.DrawStringWorld_s_color = new Box2D.b2Color(0.5, 0.9, 0.5);


export function getPIXIDebugDraw(graphics, scale) {
  function getColorFromDebugDrawCallback(color) {
    var red = (color.r * 255 * 255 * 255)|0;
    var green = (color.g * 255 * 255)|0;
    var blue = (color.b * 255)|0;
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
      graphics.beginFill(color, 0.1);
    }
    var tmpI;
    for(tmpI=0;tmpI<vertexCount;tmpI++) {
      var vert = vertices[tmpI];
      if ( tmpI === 0 ){
        graphics.moveTo(vert.x * scale, vert.y * scale);
      }
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
      var vert2 = new Box2D.b2Vec2(center.x, center.y);
      vert2 = new Box2D.b2Vec2(vert2.x+axis.x * radius, vert2.y+axis.y * radius);
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

  var debugDraw = new DebugDraw();
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
    drawCircle(graphics, center, radius, Box2D.Box2D.b2Vec2(0,0), false, getColorFromDebugDrawCallback(color));
  };
  debugDraw.DrawSolidCircle = function(center, radius, axis, color) {
    drawCircle(graphics, center, radius, axis, true, getColorFromDebugDrawCallback(color));

  };
  debugDraw.DrawTransform = function(transform) {
    drawTransform(graphics, transform);

  };
  return debugDraw;
}
