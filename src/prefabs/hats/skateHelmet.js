import Hat from './hat'

export class SkateHelmet extends Hat {
	constructor(character, head, body){
		super(character, head, body);
		this.texture = "SkateHelmet0000";
		this.hatOffsetLength = 2;
		this.hatOffsetAngle = Math.PI/4;
		this.attach();
	}
}
