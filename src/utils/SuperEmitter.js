import { Emitter, PropertyNode, Particle } from "pixi-particles";

export class SuperEmitter extends Emitter {
    /**
     * 
     * @param {Particle} p 
     */
    applyAdditionalProperties(p) {
        if (this.randomColors && this.randomColors.length) {
            p.colorList.reset(this.randomColors[this.randomColors.length * Math.random() | 0]);
        }
    }

    /**
     * 
     * @param {string[]} colors 
     */
    setRandomColors(colors) {
        this.randomColors = colors.map(hex => { 
            const hexParts = hex.substr(1, hex.length).match(/.{1,2}/g); 
            return new PropertyNode({ 
                r: parseInt(Number(`0x${hexParts[0]}`), 10), 
                g: parseInt(Number(`0x${hexParts[1]}`), 10), 
                b: parseInt(Number(`0x${hexParts[2]}`), 10) 
            }, 0) 
        });
    }
}