const functions = require('firebase-functions');
const moment = require('moment');
const _ = require('lodash');


exports.setRangedPopularity = functions.https.onCall((data, context) => {
    //Received 'levelid' from client
    const levelRef = firebase.database().ref().child(`/PublishedLevels/${data.levelid}`);
    const creationDateRef = levelRef.child(`/private/creationDate`);
    const playCountRef = levelRef.child(`/public/playCount`);
    const updateRef = levelRef.child(`/public`);

    return creationDateRef.once('value').then(snapshot => {
        const creationDate = moment(snapshot.val());

        var now = moment();

        if(now.year() !== creationDate.year() || now.month() !== creationDate.month()) return;

        return playCountRef.once('value').then(snapshot => {
            let updateObject = {};

            const playCount = snapshot.val();
            const paddedPlays = _.padStart(playCount, 10, '0'); //1.000.000.000

            const paddedMonth = _.padStart(creationDate.month(), 2, '0');
            const firstMonthValue = `${creationDate.year()+paddedMonth}_${paddedPlays}`; //e.g. 201804_0000001337

            updateObject.firstMonth_playCount = firstMonthValue;

            if(now.isoWeek() === creationDate.isoWeek()){
                const paddedWeek = _.padStart(creationDate.isoWeek(), 2, '0');
                const firstWeekValue = `${creationDate.year()}w${paddedWeek}_${paddedPlays}`; //e.g. 2018w03_0000001337

                updateObject.firstWeek_playCount = firstWeekValue;
            }
            return updateRef.update(updateObject);
        });
    });
});