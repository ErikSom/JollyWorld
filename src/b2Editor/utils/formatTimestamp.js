const moment = require('moment');
export const formatDMY = (timestamp)=> {
    return moment.utc(timestamp).format("MM/DD/YYYY");
}