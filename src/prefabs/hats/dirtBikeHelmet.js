import Hat from './hat'

export class DirtBikeHelmet extends Hat {
	constructor(character, head, body){
		super(character, head, body);
		this.texture = "DirtBikeHelmet0000";
		this.hatOffsetLength = 4;
		this.hatOffsetAngle = 0.5;
		this.attach();
	}
}
