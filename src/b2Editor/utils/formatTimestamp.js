export const formatDMY = (timestamp)=> {
    const date = new Date(timestamp);
    return `${date.getUTCMonth() + 1}-${date.getUTCDate()}-${date.getUTCFullYear()}`;
}
