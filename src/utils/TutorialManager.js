import * as SaveManager from "./SaveManager";
import { isMobile } from "./MobileController";

export const TUTORIALS = {
	SKIPPY:{
		type: 0,
		text: 'Hold the down arrow key to charge a jump. You can also jump mid-air.',
		mobileText: 'Hold the down arrow key to charge a jump. You can also jump mid-air.',
		closeTime: 5000,
	},
	FODDY:{
		type: 1,
		text: 'This vehicle is a homeage to Getting Over It with permission from Bennett Foddy',
		mobileText: 'This vehicle is a homeage to Getting Over It with permission from Bennett Foddy',
		closeTime: 4000,
		extraTutorials:['FODDY2'],
	},
	ROPEHELMET:{
		type: 2,
		text: 'You found a rope helmet, press <b>E</b> to shoot the rope, swing and move up and down using the <b>ARROW</b> keys',
		mobileText: 'You found a rope helmet, touch the A button to shoot the rope, swing and move up and down using the <b>ARROWS</b>',
		closeTime: 6000,
	},
	FODDY2:{
		type: 3,
		text: "Click the screen to play with the mouse, if you don't click the screen you can play with the arrow keys.",
		mobileText: "Click the screen to play with the mouse, if you don't click the screen you can play with the arrow keys.",
		closeTime: 4000,
	},
}
let tutorialQueue = [];
const typeSpeed = 26;

let tutorialBubble;
let typeWriterTimeout = null;
let closeTimeout = null;
let playing = false;

const userTutorials = SaveManager.getLocalUserdata().tutorials;

export const init = () => {
	tutorialBubble = document.createElement('div');
	tutorialBubble.classList.add('speech-bubble');
	document.body.appendChild(tutorialBubble);
	hide();
}

export const hide = () => {
	tutorialBubble.style.opacity = 0;
	if(typeWriterTimeout) clearTimeout(typeWriterTimeout)
	typeWriterTimeout = null;
	if(closeTimeout) clearTimeout(closeTimeout)
	closeTimeout = null;
	playing = false;
}

export const show = () => {
	tutorialBubble.style.opacity = 1;
}

export const showTutorial = tutorial => {
	if(userTutorials[tutorial.type]) return;

	let preLaunchTutorials = [];
	if(tutorial.type === 0){
		if(tutorialQueue.length > 0){
			preLaunchTutorials = [...tutorialQueue];
			tutorialQueue.length = 0;
			hide();
		}
	}

	tutorialQueue.push(tutorial);

	if(tutorial.extraTutorials) tutorial.extraTutorials.forEach(index => showTutorial(TUTORIALS[index]));
	if(!playing) showNextTutorial();

	if(preLaunchTutorials.length>0) tutorialQueue = tutorialQueue.concat(preLaunchTutorials);
}
const showNextTutorial = () => {
	const tutorial = tutorialQueue[0];
	if(tutorial){
		tutorialBubble.innerHTML = '';
		const text = isMobile() ? (tutorial.mobileText || tutorial.text) : tutorial.text;
		typeWriter(text, tutorialBubble);
		show();

		playing = true;

		if(tutorial.closeTime){
			closeTimeout = setTimeout(()=>{
				userTutorials[tutorial.type] = true;

				const userData = SaveManager.getLocalUserdata();
				userData.tutorials = userTutorials;
				SaveManager.updateLocalUserData(userData);

				tutorialQueue.shift();
				showNextTutorial()
				closeTimeout = null;
			}, tutorial.closeTime)
		}
	}else{
		return hide();
	}
}

const typeWriter = (text, target, i = 0) => {

	if (i < text.length) {


		if(text.charAt(i + 1) === '<') i+=3;
		if(text.charAt(i + 1) === '>') i+=1;

		const newText = text.substring(0, i + 1);
		target.innerHTML = newText;
		typeWriterTimeout = setTimeout(() => typeWriter(text, target, i + 1), typeSpeed);
	}
}

