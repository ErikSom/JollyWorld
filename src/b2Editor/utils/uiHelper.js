export const clampDot = (target, lines = 1, lineHeight = 14) => {
    if(!target) return;
    if (!target.offsetHeight) {
        setTimeout(() => {
            clampDot(target, lines, lineHeight)
        }, 1000);
        return;
    }
    while (target.offsetHeight > (lineHeight * lines)) {
        target.innerText = target.innerText.substr(0, target.innerText.length - 6) + '...';
    }
}
