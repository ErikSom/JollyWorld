export const clampDot = (target, lines = 1, lineHeight = 14) => {
    if (!$(target)[0] || !$(target)[0].offsetHeight) {
        setTimeout(() => {
            clampDot(target, lines, lineHeight)
        }, 10);
        return;
    }
    while ($(target)[0].offsetHeight > (lineHeight * lines)) {
        $(target)[0].innerText = $(target)[0].innerText.substr(0, $(target)[0].innerText.length - 6) + '...';
    }
}