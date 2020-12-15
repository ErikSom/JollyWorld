import Hat from './hat'

export class DirtBikeHelmet extends Hat {
	constructor(character, head, body){
		super(character, head, body);
		this.texture = "DirtBikeHelmet0000";
		this.hatOffsetLength = 2;
		this.hatOffsetAngle = Math.PI/4;
		this.attach();
	}
}
