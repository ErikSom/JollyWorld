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
export const buildDotShell = hidden=>{
    var dotShell = document.createElement('div');
    dotShell.setAttribute('class', 'dot-shell')
    var dots = document.createElement('div');
    dots.setAttribute('class', 'dot-pulse')
    dotShell.appendChild(dots);
    if(hidden) dotShell.classList.add('hidden');
    return dotShell;
}
