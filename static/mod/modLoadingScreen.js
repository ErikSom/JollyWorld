function showLoadingScreen() {
	lockScrolling();
	$('loadingbackground').style.pointerEvents = 'all';
	$('loadingbackground').style.opacity = 1;
	$('loadingbarprogress').style.width = "0%"
}

function hideLoadingScreen() {
	unlockScrolling();
	$('loadingbackground').style.pointerEvents = 'none';
	$('loadingbackground').style.opacity = 0;
}

function lockScrolling() {
	window.scrollTo(0, 0)
	document.body.style.overflowY = "hidden";
}

function unlockScrolling() {
	document.body.style.overflowY = "scroll";
}