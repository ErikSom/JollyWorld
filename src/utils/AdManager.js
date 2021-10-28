import { isMobile } from "./MobileController";

const adVisibleStates = {
	["jr1"]: false, // ad160x600
	["jr2"]: false, // ad300x250
	["jr3"]: false, // ad728x90
	["jr4"]: false, // ad320x50
}

const adElements = {}
const adKeys = Object.keys(adVisibleStates);

let adContainer;

export const getAdContainer = () => {
	adContainer = document.createElement('div');

	adKeys.forEach(key => {
		adElements[key] = document.createElement('div');
		adElements[key].classList.add(key);
		adContainer.appendChild(adElements[key]);
	})

	adContainer.classList.add('adContainer');
	return adContainer;
}

export const updateDisplayAds = () => {

	if(!adContainer) return;
	if(!adContainer.classList.contains('active')) return;

	adKeys.forEach(key => {
		switch(key){
			case 'jr1':
				setEnableAd(key, window.innerWidth >= 706 && window.innerHeight >= 600);
			break;
			case 'jr2':
				setEnableAd(key, (window.innerWidth >= 1150 && window.innerHeight >= 350) || (window.innerWidth >= 620 && window.innerWidth <= 650 && window.innerHeight >= 350));
			break;
			case 'jr3':
				setEnableAd(key, window.innerWidth >= 1134 && window.innerHeight >= 768);
			break;
			case 'jr4':
				setEnableAd(key, isMobile() && window.innerWidth >= 320 && window.innerHeight >= 436);
			break;
			default:
				setEnableAd(key, false)
			break
		}
	})
}

const setEnableAd = (key, enabled) => {
	const el = adElements[key];
	el.style.display = enabled ? 'block' : 'none';

	if(adVisibleStates[key] !== enabled){
		if(enabled){
			let targetAd = '';
			switch(key){
				case 'jr1':
					targetAd = '160x600';
				break;
				case 'jr2':
					targetAd = '300x250';
				break;
				case 'jr3':
					targetAd = '728x90';
				break;
				case 'jr4':
					targetAd = '320x50';
				break;
			}

			if(targetAd) window.PokiSDK?.displayAd(el, targetAd);
		}else{
			window.PokiSDK?.destroyAd(el);
		}

		adVisibleStates[key] = enabled;
	}
}

export const destroyAllAds = () => {
	adKeys.forEach(key => {
		setEnableAd(key, false);
	})
}
