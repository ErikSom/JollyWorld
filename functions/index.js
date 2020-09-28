const admin = require('firebase-admin');
const functions = require('firebase-functions');
const {Storage} = require('@google-cloud/storage');


admin.initializeApp();
const moment = require('moment');
const _ = require('lodash');

exports.handleVotes = functions.database.ref('PublishedLevelsVoters/{levelid}/').onWrite((change, context) => {
    const snapshot = change.after;
    const levelid = context.params.levelid;
    const voteDataRef = admin.database().ref().child(`PublishedLevels/${levelid}/public/`);
    if (snapshot.hasChildren()) {
        let voteData = {};
        voteData.voteNum = 0;
        voteData.voteAvg = 0;

        let voteSum = 0;
        let voteMax = 0;
        snapshot.forEach(function (item) {
            voteData.voteNum++;
            if(item.val() > 0 ) voteSum += item.val(); // only positive e,g, -100 5 > 5/105
            voteMax += Math.abs(item.val());
        });

        if(voteData.voteNum<10) voteData.voteAvg = 0.5; // require a minimum of 10 votes to get ranked
        else voteData.voteAvg = voteSum/voteMax;

        return voteDataRef.update(voteData);
    }
});

exports.setRangedVotes = functions.https.onCall((data, context) => {
   //Received 'levelid' from client
   const levelRef = admin.database().ref().child(`/PublishedLevels/${data.levelid}`);
   const creationDateRef = levelRef.child(`/private/creationDate`);
   const voteAvgRef = levelRef.child(`/public/voteAvg`);
   const updateRef = levelRef.child(`/public`);

   return creationDateRef.once('value').then(snapshot => {
       const creationDate = moment(snapshot.val());
       var now = moment();

       if (now.year() !== creationDate.year() || now.month() !== creationDate.month()) return;

       return voteAvgRef.once('value').then(snapshot => {
           let updateObject = {};

           const voteAvg = snapshot.val();

           const paddedMonth = _.padStart(creationDate.month(), 2, '0');
           const firstMonthValue = `${creationDate.year()+paddedMonth}_${voteAvg}`; //e.g. 201804_0.8483

           updateObject.firstMonth_voteAvg = firstMonthValue;

           if (now.isoWeek() === creationDate.isoWeek()) {
               const paddedWeek = _.padStart(creationDate.isoWeek(), 2, '0');
               const firstWeekValue = `${creationDate.year()}w${paddedWeek}_${voteAvg}`; //e.g. 2018w03_0.8483

               updateObject.firstWeek_voteAvg = firstWeekValue;


               if (now.isoWeekday() === creationDate.isoWeekday()) {
                    const day = creationDate.isoWeekday();
                    const firstDayValue = `${creationDate.year()}w${paddedWeek}d${day}_${voteAvg}`; //e.g. 2018w03d3_0.8483
                    updateObject.firstDay_voteAvg = firstDayValue;
                }

           }
           return updateRef.update(updateObject);
       });
   });
});

exports.setRangedPopularity = functions.https.onCall((data, context) => {
    //Received 'levelid' from client
    const levelRef = admin.database().ref().child(`/PublishedLevels/${data.levelid}`);
    const creationDateRef = levelRef.child(`/private/creationDate`);
    const playCountRef = levelRef.child(`/public/playCount`);
    const updateRef = levelRef.child(`/public`);

    return creationDateRef.once('value').then(snapshot => {
        const creationDate = moment(snapshot.val());
        var now = moment();

        if (now.year() !== creationDate.year() || now.month() !== creationDate.month()) return;

        return playCountRef.once('value').then(snapshot => {
            let updateObject = {};

            const playCount = snapshot.val();
            const paddedPlays = _.padStart(playCount, 10, '0'); //1.000.000.000

            const paddedMonth = _.padStart(creationDate.month(), 2, '0');
            const firstMonthValue = `${creationDate.year()+paddedMonth}_${paddedPlays}`; //e.g. 201804_0000001337

            updateObject.firstMonth_playCount = firstMonthValue;

            if (now.isoWeek() === creationDate.isoWeek()) {
                const paddedWeek = _.padStart(creationDate.isoWeek(), 2, '0');
                const firstWeekValue = `${creationDate.year()}w${paddedWeek}_${paddedPlays}`; //e.g. 2018w03_0000001337

                updateObject.firstWeek_playCount = firstWeekValue;


                if(now.isoWeekday() === creationDate.isoWeekday()){
                    const day = creationDate.isoWeekday();
                    const firstDayValue = `${creationDate.year()}w${paddedWeek}d${day}_${paddedPlays}`; //e.g. 2018w03d3_0000001337
    
                    updateObject.firstDay_playCount = firstDayValue;

                }


            }
            return updateRef.update(updateObject);
        });
    });
});

exports.publishLevel = functions.https.onCall((data, context) => {
    //Received 'levelid' from client

    //TODO: Check if files already exist and check if it is allowed to update
    if(context.auth.uid !== data.creatorid)  throw new functions.https.HttpsError('permission-denied', 'You are only allowed to publish your own levels');

    const storage = new Storage();
    const targetBucket = 'jolly-ad424.appspot.com';
    const files = ['levelData.json', 'thumb_highRes.jpg', 'thumb_lowRes.jpg'];
    let copyPromises = [];

    files.map((file)=>{
        const srcFilename = `/levels/${data.creatorid}/${data.levelid}/${file}`;
        const destFilename = `/publishedLevels/${data.creatorid}/${data.levelid}/${file}`;
        copyPromises.push(storage.
        bucket(targetBucket)
        .file(srcFilename)
        .copy(storage.bucket(targetBucket).file(destFilename)));
    })
    return new Promise((resolve, reject) => {
        Promise.all(copyPromises).then(()=>{
            let makePublicPromises = [];
            files.map((file)=>{
                const destFilename = `/publishedLevels/${data.creatorid}/${data.levelid}/${file}`;
                makePublicPromises.push(storage.
                bucket(targetBucket)
                .file(destFilename)
                .makePublic());
            });
            return Promise.all(makePublicPromises).then(()=>{
                    return resolve("success");
            }).catch((error)=>{
                throw new functions.https.HttpsError('promise-error', error);
            });

        }).catch(error=>{
            throw new functions.https.HttpsError('promise-error', error);
        })
    });
});
