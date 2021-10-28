const adVisibleStates = {
	["ad160x600"]: false,
	["ad300x250"]: false,
	["ad728x90"]: false,
	["ad320x50"]: false,
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
}
