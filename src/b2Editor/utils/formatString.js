export const formatDMY = timestamp => {
    const date = new Date(timestamp);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const day = date.getDate();
    const month = monthNames[date.getMonth()];
    const year = date.getFullYear();

    return `${day} ${month} ${year}`;
}
export const timeFormat = (delta, padded=true) => {
    delta = delta / 1000;
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
export const hexToNumberHex = hex => {
    if(hex.length>7) hex = hex.substr(0, 7);
    if(typeof hex === 'string') hex = hex.replace('#', '0x');
    return parseInt(Number(hex), 10)
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

export const JSONStringify = json=>{
    return JSON.stringify(json, function(key, val) {
        return (val && val.toFixed) ? Number(val.toFixed(4)) : val;
    })
}

export const makeOrdinal = number => {
    const tenth = number % 10;
    const hundreth = number % 100;
    let ordinal = 'th';
    if (tenth >= 1 && tenth <= 3) {
        if (hundreth < 10 || hundreth > 20) {
            ordinal = ['st', 'nd', 'rd'][tenth - 1];
        }
    }
    return number + ordinal;
}
