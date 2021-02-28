import * as PIXI from 'pixi.js';

export class TiledMesh extends PIXI.SimpleMesh {
	/**
	 * 
	 * @param {PIXI.Texture} texture 
	 * @param {number[] | Float32Array} vertices 
	 * @param {number[] | Float32Array} uvs 
	 * @param {number[] | Int16Array} indices 
	 */
	constructor(texture, vertices, uvs, indices) {
		super(texture, vertices, uvs, indices);
		
		/**
		 * @type {PIXI.Sprite}
		 */
		this.tex = texture;
		this.targetSprite = null;
		this.cachedSpriteRotation = 0;
		this.verticesClone = Float32Array.from(vertices);
		this.fixedTextureRotationOffset = Math.PI / 2;
		this.gradientMode = false;
	}

	updateMeshVerticeRotation (force = false) {

		const targetSprite = this.targetSprite;
		const tex = this.tex;

		if(this.cachedSpriteRotation !== targetSprite.rotation || force){

			const vertices = Float32Array.from(this.verticesClone);

			for (let i = 0; i < vertices.length; i += 2){
				let x = vertices[i];
				let y = vertices[i+1];
				let l = Math.sqrt(x*x+y*y);
				let a = Math.atan2(y, x);

				a += targetSprite.rotation;
				a += this.fixedTextureRotationOffset;

				vertices[i] = l * Math.cos(a);
				vertices[i+1] = l * Math.sin(a);
			}

			let minX = Number.POSITIVE_INFINITY;
			let maxX = -Number.POSITIVE_INFINITY;
			let minY = Number.POSITIVE_INFINITY;
			let maxY = -Number.POSITIVE_INFINITY;

			const uvs = new Float32Array(vertices.length);

			for (let i = 0; i < vertices.length; i+=2) {
				uvs[i] = vertices[i] * 2.0 / tex.width + 0.5;
				uvs[i + 1] = vertices[i + 1] * 2.0 / tex.width + 0.5;

				minX = Math.min(uvs[i + 0], minX);
				maxX = Math.max(uvs[i + 0], maxX);
				minY = Math.min(uvs[i + 1], minY);
				maxY = Math.max(uvs[i + 1], maxY);
			}

			if (this.gradientMode) {
				for (let i = 0; i < uvs.length; i += 2) {
					uvs[i * 2 + 1] = (uvs[i * 2 + 1] - minY) / (maxY - minY);
					uvs[i * 2 + 0] = (uvs[i * 2 + 0] - minX) / (maxX - minX);
				}
			}

			this.verticesBuffer.update(vertices);
			this.uvBuffer.update(uvs);

			this.rotation = -targetSprite.rotation-this.fixedTextureRotationOffset;
			this.cachedSpriteRotation = targetSprite.rotation
		}
	}
}
