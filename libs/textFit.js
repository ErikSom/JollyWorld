export default function textFit(textSpan) {
	let maxSize = 24;
	if(textSpan.classList.contains('h1')) maxSize = 40;
	if(textSpan.classList.contains('h2')) maxSize = 32;

	const minSize = 8;
	const defaultMargin = 10;
	const textDiv = textSpan.parentNode;
	let iterations = 0;

	textSpan.style.fontSize = maxSize+'px';
	textSpan.style.lineHeight = textDiv.offsetHeight+'px';
	textDiv.style.lineHeight = 'normal';

	while((textSpan.offsetWidth > (textDiv.offsetWidth-defaultMargin) || textSpan.offsetHeight > textDiv.offsetHeight) && iterations< maxSize-minSize )
	{
		textSpan.style.fontSize = maxSize-iterations+'px';
		iterations++;
	}

}
