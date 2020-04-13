export const clampDot = (target, lines = 1, lineHeight = 14) => {
    const _target = document.querySelectorAll(target)[0];
    if (!_target || !_target.offsetHeight) {
        setTimeout(() => {
            clampDot(target, lines, lineHeight)
        }, 10);
        return;
    }
    while (_target.offsetHeight > (lineHeight * lines)) {
        _target.innerText = _target.innerText.substr(0, _target.innerText.length - 6) + '...';
    }
}
