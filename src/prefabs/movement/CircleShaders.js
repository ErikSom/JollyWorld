import { Program, MeshMaterial } from 'pixi.js';

const VERT = `
attribute vec2 aVertexPosition;
attribute vec2 aTextureCoord;

uniform mat3 projectionMatrix;
uniform mat3 translationMatrix;
uniform mat3 uTextureMatrix;

varying vec2 vTextureCoord;

void main(void)
{
    gl_Position = vec4((projectionMatrix * translationMatrix * vec3(aVertexPosition, 1.0)).xy, 0.0, 1.0);

    vTextureCoord = (uTextureMatrix * vec3(aTextureCoord, 1.0)).xy;
}`;

export const FRAGMENT = `#define M_PI 3.1415926535897932384626433832795

varying vec2 vTextureCoord;
uniform vec4 uColor;
uniform sampler2D uSampler;

void main(void)
{
    vec2 pos = vTextureCoord;
    vec2 center = vec2(0.5, 0.5);
    vec2 delta = pos - center;

    float d = length(delta) * 3.;
    float a = 3. * atan(-delta.y, delta.x) / M_PI;

	vec2 rad = vec2(1.0-d, a);

	vec4 texColor = texture2D(uSampler, rad);
	gl_FragColor = texture2D(uSampler, rad) * uColor;
}
`;

export class CircleMaterial extends MeshMaterial {
    constructor(texture) {
        super(texture,{
            program: Program.from(VERT, FRAGMENT),
        });

        this.batchable = false;
    }
}