import {
	game
} from "../Game";
import {
	Settings
} from "../Settings";
import * as SaveManager from "./SaveManager";

let layoutHolder;
let arrowLeft;
let arrowRight;
let accelerateButtons;
let accelDown;
let accelUp;
let flip;
let pauseButton;
let actionButton;
let ejectButton;

let dpadHolder;
let dpadLeft;
let dpadRight;
let dpadUp;
let dpadDown;

export const init = () => {

	layoutHolder = document.createElement('div');
	layoutHolder.style = `
		position:absolute;
		width:100%;
		height:100%;
		left:0;
		top:0;
		z-index:999;
		pointer-events:none;
		opacity:${Settings.touchControlsAlpha}
	`;
	document.body.appendChild(layoutHolder);


	const buttonSize = Settings.touchButtonSize;

	const screenMargin = '20px 40px';
	const buttonMargin = '0px';
	const verticalAngularOffset = '60px';

	const rotateButtons = document.createElement('div');
	arrowLeft = createButton('arrow', buttonSize, rotateButtons, buttonMargin);
	arrowLeft.style.marginBottom = verticalAngularOffset;
	arrowRight = createButton('arrow', buttonSize, rotateButtons, buttonMargin, true);
	flip = createButton('flip', buttonSize, rotateButtons, buttonMargin, true);
	flip.style.marginLeft = '20px';
	rotateButtons.style = `
	position:absolute;
	left:0;
	bottom:0;
	margin:${screenMargin};
	`;
	layoutHolder.appendChild(rotateButtons);

	accelerateButtons = document.createElement('div');
	accelDown = createButton('accel', buttonSize, accelerateButtons, buttonMargin, true);
	accelUp = createButton('accel', buttonSize, accelerateButtons, buttonMargin);
	accelUp.style.marginBottom = verticalAngularOffset;
	accelerateButtons.style = `
	position:absolute;
	right:0;
	bottom:0;
	margin:${screenMargin};
	`;
	pauseButton = createButton('pause', buttonSize * .5, layoutHolder, buttonMargin);
	pauseButton.style.position = 'absolute';
	pauseButton.style.top = '0';
	pauseButton.style.right = '0';
	pauseButton.style.margin = '20px';

	layoutHolder.appendChild(accelerateButtons);

	ejectButton = createButton('eject', buttonSize * .5, layoutHolder, buttonMargin);
	ejectButton.style.position = 'absolute';
	ejectButton.style.bottom = '120px';
	ejectButton.style.left = '0';
	ejectButton.style.margin = '60px';

	actionButton = createButton('action', buttonSize * .5, layoutHolder, buttonMargin);
	actionButton.style.position = 'absolute';
	actionButton.style.bottom = '120px';
	actionButton.style.right = '0';
	actionButton.style.margin = '60px';

	dpadHolder = document.createElement('div');

	const dpadSpread = 40;
	const dpadScale = .8;
	dpadUp = createButton('dpad', buttonSize * dpadScale, dpadHolder, buttonMargin, false, `translate(0, -${dpadSpread}px)`);
	dpadDown = createButton('dpad', buttonSize * dpadScale, dpadHolder, buttonMargin, false, `rotate(180deg) translate(0, -${dpadSpread}px)`);
	dpadLeft = createButton('dpad', buttonSize * dpadScale, dpadHolder, buttonMargin, false, `rotate(90deg) translate(0, -${dpadSpread}px)`);
	dpadRight = createButton('dpad', buttonSize * dpadScale, dpadHolder, buttonMargin, false, `rotate(270deg) translate(0, -${dpadSpread}px)`);

	dpadHolder.style = `
	position:absolute;
	right:150px;
	bottom:120px;
	`;
	layoutHolder.appendChild(dpadHolder);


	resize();
	hide();


	if (isIos() && !isIOSStandaloneMode()) {
		const userData = SaveManager.getLocalUserdata();
		if (userData.applePWAModals < 3) {
			showApplePWAInstall();
			userData.applePWAModals++;
			SaveManager.updateLocalUserData(userData);
		}
	}

	doServiceWorker();
}

export const resize = () => {
	if (!layoutHolder) return;

	const landscape = window.innerWidth > window.innerHeight;

	const buttonSize = landscape ? 80 : 50;

	[arrowLeft, arrowRight, accelDown, accelUp, flip].forEach(but => {
		but.style.width = `${buttonSize}px`
		but.style.height = `${buttonSize}px`
	});

	const pauseButonSize = 50;
	pauseButton.style.width = `${pauseButonSize}px`
	pauseButton.style.height = `${pauseButonSize}px`
}
export const showActionButton = () => {
	if (!layoutHolder) return;
	actionButton.style.display = 'block'
}
export const hideActionButton = () => {
	if (!layoutHolder) return;
	actionButton.style.display = 'none'
}
export const showCharacterControls = () => {
	if (!layoutHolder) return;
	accelerateButtons.style.display = 'none';
	dpadHolder.style.display = 'block';
	ejectButton.style.display = 'none';
}
export const showVehicleControls = () => {
	if (!layoutHolder) return;
	accelerateButtons.style.display = 'block';
	dpadHolder.style.display = 'none';
	ejectButton.style.display = 'block';
}

export const hide = () => {
	if (layoutHolder) layoutHolder.style.display = 'none';
}
export const show = () => {
	if (layoutHolder) layoutHolder.style.display = 'block';
}
export const reset = ()=>{
	hideActionButton();
	showVehicleControls();
}

export const isMobile = () => {
	const mobile = /(?:phone|windows\s+phone|ipod|blackberry|(?:android|bb\d+|meego|silk|googlebot) .+? mobile|palm|windows\s+ce|opera\smini|avantgo|mobilesafari|docomo)/i;
	const tablet = /(?:ipad|playbook|(?:android|bb\d+|meego|silk)(?! .+? mobile))/i;
	return mobile.test(navigator.userAgent) || tablet.test(navigator.userAgent) || isIpad();
}

const isIpad = () => {
	return ((navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) && !window.MSStream) || navigator.userAgent.match(/(iPad)/);
}

export const isIos = () => {
	const userAgent = window.navigator.userAgent.toLowerCase();
	return (/iphone|ipad|ipod/.test(userAgent) || isIpad());
}
const isIOSStandaloneMode = () => ('standalone' in window.navigator) && (window.navigator.standalone);


const createButton = (type, size, target, margin, mirrorX, transform) => {
	const box = 100;
	const svgElement = document.createElementNS("http://www.w3.org/2000/svg", 'svg');
	svgElement.setAttributeNS(null, "viewBox", `0 0 ${box} ${box}`);
	svgElement.setAttributeNS(null, "width", `${size}`);
	svgElement.setAttributeNS(null, "height", `${size}`);

	let generatedHTML =
		`
	<style>.mc5 {display: inline;fill-rule: evenodd;clip-rule: evenodd;fill: #fff}	</style><linearGradient id="edge_1_" gradientUnits="userSpaceOnUse" x1="7599.08" y1="7903.88" x2="9647.08" y2="7903.88"	gradientTransform="matrix(0 -.04883 -.04883 0 435.932 471.049)"><stop offset="0" stop-color="#383838" /><stop offset="1" stop-color="#585858" /></linearGradient><path id="edge" d="M80.3 80.3C88.7 72 92.9 61.9 92.9 50c0-11.8-4.2-21.9-12.6-30.3C72 11.3 61.9 7.1 50 7.1c-11.9 0-22 4.2-30.3 12.6C11.3 28.1 7.1 38.2 7.1 50c0 11.9 4.2 22 12.6 30.3C28 88.7 38.1 92.9 50 92.9c11.9 0 22-4.2 30.3-12.6m5-65.7C95.1 24.4 100 36.2 100 50s-4.9 25.6-14.7 35.3C75.6 95.1 63.8 100 50 100c-13.9 0-25.7-4.9-35.4-14.7C4.9 75.6 0 63.8 0 50s4.9-25.6 14.6-35.4C24.3 4.9 36.1 0 50 0c13.8 0 25.6 4.9 35.3 14.6" fill="url(#edge_1_)" /><path id="bg"	d="M80.3 80.3C72 88.7 61.9 92.9 50 92.9c-11.9 0-22-4.2-30.3-12.6C11.3 72 7.1 61.9 7.1 50c0-11.8 4.2-21.9 12.6-30.3C28 11.3 38.1 7.1 50 7.1c11.9 0 22 4.2 30.3 12.6 8.4 8.4 12.6 18.5 12.6 30.3 0 11.9-4.2 22-12.6 30.3"	fill="#383838" />
	${type === 'arrow'  ? `
	<path d="M545.7 4335.9c103.3 6.8 195.9 73.7 235.2 170.1 29.2 71.5 26.7 153-6.8 222.6-23.1 48.4-61.3 89.8-107.8 117.5-33.1 19.8-73.2 33-112.2 36.9-11.8 1.1-39.7 1.4-51.2.4-115.9-10.1-214-93.7-242.4-206.5-2.2-8.7-4.7-21.3-5.5-27.7-.7-6.4-1.6-12.9-2-14.4l-.5-2.8-81.2-.2L314.1 4496s22.3 19.3 70 66.7c36.6 36.2 66.3 69.5 66.3 69.5s-79.9.2-80.2.8c-.9 1.4 2.5 15.8 6 26.7 7.4 22.4 20.5 43.8 37.4 60.9 30.8 31.1 68.3 47 112 47.3 20.4 0 31-1.5 49.2-7.4 25.8-8.2 46.6-21.3 65.7-41.2 29.3-30.5 44.2-67.3 44.2-109.4-.1-44.5-16.4-82.6-48.5-113.8-25.5-24.7-56.7-39.5-91.9-43.7" fill="#fff" transform="matrix(.1 0 0 -.1 0 511)" id="arrow" />
	` : ''}
	${type === 'accel' ? `
	<g id="accel"><path class="mc5"	d="M58.7 28.4v13.9H40.9v15.4h17.8v13.9L81.1 50 58.7 28.4M24.9 42.3h-6v15.4h6V42.3zM38.1 42.3H27.5v15.4h10.6V42.3z" /></g>
	` : ''}
	${type === 'flip' ? `
	<path d="M48.8 60.9c-3.1-.1-6.7-.6-10.6-1.4-5.3-1.1-9.7-2.5-13.1-4.1-6.3-3.2-6.5-6.5-5.5-8.7 1.3-3 5.4-5.1 13.5-7 5.7-1.1 11.4-1.7 17-1.7 6.2 0 12.4.7 18.6 2.1 3.3.7 5.9 1.7 8 3 2.5 1.5 3.9 3.3 4.2 5.4 1 6.7-8.8 9.1-12.1 9.9-.8.2-1.5.4-2.1.5l-3.2.7v-8.1l2-.5c.4-.1.7-.2 1-.2 4.3-1 5.4-2.1 5.7-2.4-.3-.3-1.3-1.2-4.7-2.1-5.7-1.2-11.6-1.8-17.3-1.8-5.3 0-10.6.5-15.9 1.5-2.9.9-4.5 1.6-5.3 2.1.6.3 1.5.7 3 1.1 2.8.8 6.4 1.6 10.8 2.1 2.4.3 4.4.5 6 .6v-7l11.4 11.4-11.4 11.4v-6.8z" fill="#fff" id="flip" />	
	` : ''}
	${type === 'pause' ? `
	<g id="pause"><path id="r2" class="mc5" d="M32.8 30.5h10.5v39.1H32.8z" /><path id="r" class="mc5" d="M57 30.6h10.5v39.1H57z" /></g>
	` : ''}
	${type === 'exit' ? `
	<g id="exit"><path class="mc5"d="M31.3 74.6c-3.5 0-6.3-2.8-6.3-6.3V56.8h7.3v10.5h34.9V32.4H32.3V43H25V31.4c0-3.5 2.8-6.3 6.3-6.3h36.9c3.5 0 6.3 2.8 6.3 6.3v36.9c0 3.5-2.8 6.3-6.3 6.3H31.3zm12.1-15.2l5.9-5.9H25.1v-7.3h24.2l-5.9-5.9 5.1-5.1 14.6 14.6-14.6 14.7-5.1-5.1z" id="exit-to-app_6_" /></g>
	` : ''}
	${type === 'action' ? `
	<path class="mc5" d="M58.9 63.1l-2-5.4H43.1l-2 5.4h-7.7l12.3-32h8.5l12.3 32h-7.6zM50 37.9l-5 13.8h10l-5-13.8z" id="action"/>
	` : ''}
	${type === 'eject' ? `
	<g id="eject"><circle class="mc5" cx="56.6" cy="20.1" r="5.3"/><path class="mc5" d="M41.6 66.2l15.6 3.7-12.1 16.3-3.5-20zm5.2 13.6l5.8-7.8-7.5-1.8 1.7 9.6zM31 55.8l5.2 1.2 3.2-13.4 13.4 3.2 4.4-18.7-5.3-1.2-3.1 13.4-13.4-3.2z"/><path class="mc5" d="M59.9 39.8l5.2 1.2-5.6 23.9-18.7-4.4L43.3 50l13.4 3.2z"/></g>
	` : ''}
	`;

	if(type === 'dpad'){
		generatedHTML = `<svg version="1.1" id="l" xmlns="http://www.w3.org/2000/svg" x="0" y="0" viewBox="0 0 61 75.5" xml:space="preserve"><style>.mc6{fill:#383838}</style><linearGradient id="SVGID_1_" gradientUnits="userSpaceOnUse" x1="652.814" y1="13141.685" x2="2291.214" y2="13141.685" gradientTransform="matrix(0 -.04608 -.04608 0 636.09 105.583)"><stop offset="0" stop-color="#383838"/><stop offset="1" stop-color="#585858"/></linearGradient><path d="M56 0c3.3 0 5 1.7 5 5v40L30.5 75.5 0 45V5c0-3.3 1.7-5 5-5h51m1 5c0-.7-.3-1-1-1H5c-.7 0-1 .3-1 1v38.3l26.5 26.5L57 43.3V5" fill="url(#SVGID_1_)"/><path class="mc6" d="M57 5v38.3L30.5 69.9 4 43.3V5c0-.7.3-1 1-1h51c.7 0 1 .3 1 1"/><path class="mc6" d="M31 15c-.3 0-.5.1-.7.3l-5 5c-.3.2-.3.5-.3.7v.4c.2.4.5.6.9.6h10c.4 0 .7-.2.9-.6.2-.4.1-.8-.2-1.1l-5-5c-.1-.2-.4-.3-.6-.3"/><path d="M31 15c.2 0 .5.1.7.3l5 5c.3.3.4.7.2 1.1-.2.4-.5.6-.9.6H26c-.4 0-.7-.2-.9-.6V21c0-.2 0-.5.2-.7l5-5c.2-.2.4-.3.7-.3" fill="#666"/></svg>`;
	}

	if (mirrorX) svgElement.style.transform = 'scale(-1, 1)';
	if (margin) svgElement.style.margin = margin;
	if (transform){
		svgElement.style.position = 'absolute';
		svgElement.style.transform = transform;
	}
	svgElement.innerHTML = generatedHTML
	svgElement.style.pointerEvents = 'all';
	svgElement.style.cursor = 'pointer';
	svgElement.style.userSelect = 'none';
	target.appendChild(svgElement);

	svgElement.ontouchstart = handleButton;
	svgElement.ontouchend = handleButton;

	return svgElement;
}

const handleButton = event => {
	const {
		currentTarget,
		type
	} = event;

	const buttonDown = type === 'touchstart';
	const charFlipped = game.character.flipped;

	switch (event.currentTarget) {
		case arrowLeft:
			fireKeyboardEvent(buttonDown, 65);
			break
		case arrowRight:
			fireKeyboardEvent(buttonDown, 68);
			break
		case accelUp:
			fireKeyboardEvent(buttonDown, charFlipped ? 83 : 87);
			break
		case accelDown:
			fireKeyboardEvent(buttonDown, charFlipped ? 87 : 83);
			break
		case flip:
			fireKeyboardEvent(buttonDown, 32);
			break
		case pauseButton:
			fireKeyboardEvent(buttonDown, 80);
			break
		case dpadUp:
			fireKeyboardEvent(buttonDown, charFlipped ? 83 : 87);
			break
		case dpadDown:
			fireKeyboardEvent(buttonDown, charFlipped ? 87 : 83);
			break
		case dpadLeft:
			fireKeyboardEvent(buttonDown, charFlipped ? 65 : 68);
			break
		case dpadRight:
			fireKeyboardEvent(buttonDown, charFlipped ? 68 : 65);
			break
		case ejectButton:
			fireKeyboardEvent(buttonDown, 90);
			break
		case actionButton:
			fireKeyboardEvent(buttonDown, 69);
			break
	}

	if (buttonDown) currentTarget.style.filter = 'brightness(0.5)';
	else currentTarget.style.filter = 'unset';
	event.preventDefault();
}


const fireKeyboardEvent = (down, key) => {
	const keyEvent = down ? 'keydown' : 'keyup'
	document.body.dispatchEvent(new KeyboardEvent(keyEvent, {
		keyCode: key,
		charCode: key,
	}));
}


export const openFullscreen = () => {
	if (isMobile() && window.location.hostname !== 'localhost') {
		const fullscreenElement = document.body;
		if (fullscreenElement.requestFullscreen) {
			fullscreenElement.requestFullscreen();
		} else if (fullscreenElement.mozRequestFullScreen) {
			/* Firefox */
			fullscreenElement.mozRequestFullScreen();
		} else if (fullscreenElement.webkitRequestFullscreen) {
			/* Chrome, Safari and Opera */
			fullscreenElement.webkitRequestFullscreen();
		} else if (fullscreenElement.msRequestFullscreen) {
			/* IE/Edge */
			fullscreenElement.msRequestFullscreen();
		}
	}
}

const showApplePWAInstall = () => {
	const prompt = document.createElement('div');
	prompt.classList.add('ios-pwa-container');

	const pwa = document.createElement('div');
	pwa.classList.add('ios-pwa');
	prompt.appendChild(pwa);

	document.body.appendChild(prompt);

	const iconContainer = document.createElement('div');
	iconContainer.classList.add('ios-pwa-icon-container')
	pwa.appendChild(iconContainer);

	const thumb = document.createElement('div');
	iconContainer.appendChild(thumb);
	thumb.classList.add('ios-pwa-icon-thumb');
	thumb.style.backgroundImage = 'url(./android-chrome-60x60.png)'

	const cross = document.createElement('div');
	cross.classList.add('ios-pwa-cross');
	cross.innerText = '✕';
	pwa.appendChild(cross);

	cross.onclick = () => {
		if (prompt && prompt.parentNode) {
			prompt.parentNode.removeChild(prompt);
		}
	}

	const content = document.createElement('div');
	content.classList.add('ios-pwa-content');
	pwa.appendChild(content);

	const text = document.createElement('div');
	text.classList.add('ios-pwa-text');
	text.innerHTML = "<span>Install <strong>JollyWorld</strong> on your home screen for <strong>fullscreen</strong> gameplay and quick and easy access when you&rsquo;re on the go.</span>"
	content.appendChild(text);

	const guide = document.createElement('p');
	guide.classList.add('ios-pwa-guide');
	content.appendChild(guide);

	guide.innerHTML = `
	Just tap <svg class="ios-pwa-guide-icon" viewBox="0 0 128 128" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><title>Share</title><path fill="#007AFF" d="M48.883,22.992L61.146,10.677L61.146,78.282C61.146,80.005 62.285,81.149 64,81.149C65.715,81.149 66.854,80.005 66.854,78.282L66.854,10.677L79.117,22.992C79.693,23.57 80.256,23.853 81.114,23.853C81.971,23.853 82.534,23.57 83.11,22.992C84.25,21.848 84.25,20.125 83.11,18.981L65.997,1.794C65.715,1.511 65.421,1.215 65.139,1.215C64.563,0.932 63.718,0.932 62.861,1.215C62.579,1.498 62.285,1.498 62.003,1.794L44.89,18.981C43.75,20.125 43.75,21.848 44.89,22.992C46.029,24.149 47.744,24.149 48.883,22.992ZM103.936,35.32L81.114,35.32L81.114,41.053L103.936,41.053L103.936,121.27L24.064,121.27L24.064,41.053L46.886,41.053L46.886,35.32L24.064,35.32C20.928,35.32 18.355,37.904 18.355,41.053L18.355,121.27C18.355,124.419 20.928,127.003 24.064,127.003L103.936,127.003C107.072,127.003 109.645,124.419 109.645,121.27L109.645,41.053C109.645,37.891 107.072,35.32 103.936,35.32Z"></path></svg> then “Add to Home Screen”
	`
	prompt.style.visibility = 'hidden';
	pwa.style.opacity = 0;

	if(isIpad()){
		pwa.classList.add('ipad');
		prompt.classList.add('ipad');
	}

	setTimeout(() => {
		pwa.style.opacity = 1.0;
		prompt.style.visibility = 'visible';
	}, 300);
}


let newWorker = null;
let serviceWorkerRefreshing = false;

const doServiceWorker = () => {
	if ('serviceWorker' in navigator) {
		navigator.serviceWorker.register('./sw.js', {
			scope: '/'
		}).then(reg => {
			reg.addEventListener('updatefound', () => {
					// An updated service worker has appeared in reg.installing!
					newWorker = reg.installing;
					newWorker.addEventListener('statechange', () => {

						// Has service worker state changed?
						switch (newWorker.state) {
							case 'installed':

								// There is a new service worker available, show the notification
								if (navigator.serviceWorker.controller) {
									showServiceWorkerUpdate();
								}

								break;
						}
					});
				}),
				function (err) {
					console.log('ServiceWorker registration failed: ', err);
				};
		});

		navigator.serviceWorker.addEventListener('controllerchange', function () {
			if (serviceWorkerRefreshing) return;
			window.location.reload();
			serviceWorkerRefreshing = true;
		  });
	}
}

const showServiceWorkerUpdate = ()=>{
	game.editor.ui.showPrompt('An update is ready, would you like to refresh to install it?',
	'Update',
	'Nope!'	,
	document.body)
	.then(()=>{
		newWorker.postMessage({
			action: 'skipWaiting'
		})
		},
		()=>{}
	)
}
