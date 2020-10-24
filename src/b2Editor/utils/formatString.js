export const formatDMY = timestamp => {
    const date = new Date(timestamp);
    return `${date.getUTCMonth() + 1}-${date.getUTCDate()}-${date.getUTCFullYear()}`;
}
export const dateDiff = (d1, d2, padded=true) => {
    let delta = Math.abs(d2 - d1) / 1000;
    let dd = Math.floor(delta / 86400);
    delta -= dd * 86400;
    let hh = Math.floor(delta / 3600) % 24;
    delta -= hh * 3600;
    let mm = Math.floor(delta / 60) % 60;
    delta -= mm * 60;
    let ss = Math.floor(delta % 60);
    delta -= ss;
    let ms = Math.round(delta*1000);
    if(padded){
        dd = (''+dd).padStart(2, '0');
        hh = (''+hh).padStart(2, '0');
        mm = (''+mm).padStart(2, '0');
        ss = (''+ss).padStart(2, '0');
        ms = (''+ms).padStart(3, '0');
    }
    return {dd, hh, mm, ss, ms};
}

const SI_SYMBOL = ["", "k", "M", "G", "T", "P", "E"];
export const formatNumber = (number) => {
    const tier = Math.log10(number) / 3 | 0;
    if(tier == 0) return number;
    const suffix = SI_SYMBOL[tier];
    const scale = Math.pow(10, tier * 3);
    const scaled = number / scale;
    return scaled.toFixed(1) + suffix;
}
