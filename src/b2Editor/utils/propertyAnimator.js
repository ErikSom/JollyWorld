export class PropertyAnimator{
	constructor(keyframes, duration){
		this.keyframes = keyframes;
		this.keyframesLength = this.keyframes.reduce((acc, obj) => acc + obj.l, 0);

		this.duration = duration;
		this.currentFrame = 0;
		this.currentFrameProgress = 0;

		this.currentTime = 0;
		this.currentProgress = 0;
	}

	update(delta){
		this.currentTime += delta;
		while(this.currentTime > this.duration) this.currentTime -= this.duration;
		while(this.currentTime < 0) this.currentTime += this.duration;
		this.currentProgress = this.currentTime/this.duration;
		this.findCurrentKeyFrame(this.currentProgress);
	}

	getFrame(){
		const nextFrameIndex = this.currentFrame + 1 >= this.keyframes.length ? 0 : this.currentFrame+1;
		const nextKeyFrame = this.keyframes[nextFrameIndex];
		const currentKeyFrame = this.keyframes[this.currentFrame];
		return this.getInBetweenKeyFrame(currentKeyFrame, nextKeyFrame, this.currentFrameProgress);
	}

	getInBetweenKeyFrame(oldKey, newKey, progress){
		const keys = Object.keys(oldKey);
		const frame = {};
		keys.forEach( key => {
			if(key !== 'l'){
				const valueDiff = newKey[key]-oldKey[key];
				frame[key] = oldKey[key]+valueDiff*progress;
			}
		});
		return frame;
	}


	findCurrentKeyFrame(progress){
		let targetLength = this.keyframesLength * progress;
		let currentLength = 0;

		for(let i = 0; i<this.keyframes.length; i++){
			const frame = this.keyframes[i];

			if(currentLength+frame.l > targetLength){
				this.currentFrame = i;
				const stepInKeyframe = targetLength -= currentLength;
				this.currentFrameProgress = stepInKeyframe/frame.l;
				break;
			}

			currentLength += frame.l;
		}
	}
}
