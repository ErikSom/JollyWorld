function FireBaseManager() {
    this.app;
    this.user;
    this.username;
    this.usernameUnique = false;
    this.createdUserdata = false;
    this.loginEmail;
    this.loginPassword;
    this.actionCode;

    this.init = function (config) {
        this.app = firebase.initializeApp(config);
        var self = this;
        firebase.auth().onAuthStateChanged(function (user) {
            if (user) {
                self.user = user;
                self.onLogin();
            }
        });
    }

    this.createUser = function (email, password, form) {
        console.log(email + "  " + password);
        var self = this;
        firebase.auth().createUserWithEmailAndPassword(email, password).then(function (user) {
            self.onCreateUserSuccess(user)
        }, function (error) {
            self.onCreateUserError(error)
        });
    }
    this.onCreateUserSuccess = function (user) {
        console.log("YAY YOU SIGNED IN!!!!")
        console.log(user);
        $('form').removeClass('loading');
        $(".ui.negative.message").addClass('hidden');
    }
    this.onCreateUserError = function (error) {
        $('form').removeClass('loading');
        $(".ui.negative.message").removeClass('hidden');
        $(".ui.negative.message > p").text(error.message)
    }
    this.checkUserData = function (data) {
        var self = this;
        var usernameRef = firebase.database().ref('/Usernames').orderByKey().equalTo(data.username);
        usernameRef.once('value').then(snapshot => {
            var username = snapshot.val();
            $(".ui.negative.message").addClass('hidden');
            if (!username) {
                self.usernameUnique = true;
                self.username = name;
                self.storeUserData(data);
            } else {
                $('form').removeClass('loading');
                $(".ui.negative.message").removeClass('hidden');
                $(".ui.negative.message > p").text("Someone else already picked that");
            }
        })
    }
    this.storeUserData = function (data) {
        console.log(this.app.auth());
        var self = this;
        var userRef = firebase.database().ref('/Users/' + this.app.auth().currentUser.uid);
        userRef.set(data);
        userRef.once('value').then(function (snapshot) {
            var usernameRef = firebase.database().ref('/Usernames/' + data.username);
            usernameRef.set(self.app.auth().currentUser.uid);
            usernameRef.once('value').then(function (snapshot) {
                console.log("username successfully stored!!");
                self.onLoginComplete();
            }, function(error) {
                console.log("ERROR!!");
                console.log(error.message);
            });
        }, function (error){
            console.log("ERROR!!");
            console.log(error.message);
        });
    }
    this.onLogin = function () {
        var self = this;
        console.log(this.app.auth().currentUser.uid+"  MY UID");
        var userRef = firebase.database().ref('/Users/' + this.app.auth().currentUser.uid);
        userRef.once('value').then(function (snapshot) {
            if(snapshot.val()){
                self.onLoginComplete();
            }else{
                showUserData();
            }
        }, function (error) {
            console.log(error.message);
            $(".ui.negative.message").removeClass('hidden');
            $(".ui.negative.message > p").text(error.message);
            self.signout();
        });
    }
    this.login = function (email, password) {
        var self = this;

        firebase.auth().signInWithEmailAndPassword(email, password).then(function (user) {
            self.onLoginSucccess(user);
        }, function (error) {
            self.onLoginError(error);
        });
    }
    this.onLoginComplete = function () {
        console.log("USER LOGGED IN!");
        showSignout();
        console.log(this.app.auth().currentUser);
        $(".ui.positive.message").removeClass('hidden');
        $(".ui.positive.message > p").text("Logged in as " + this.app.auth().currentUser);

        var lotsaText = '{"objects":[{"x":22.553839909988955,"y":4.7969752794865474,"rotation":0,"ID":0,"type":0,"colorFill":"#999999","colorLine":"#000","fixed":false,"awake":true,"vertices":[{"x":-0.45534230357671035,"y":-0.9410407607252083},{"x":-0.04553423035767068,"y":-1.214246142871236},{"x":0.31873961250370186,"y":-0.8499723000098651},{"x":0.4098080732190432,"y":0.06071230714356268},{"x":0.1366026910730156,"y":1.4039721026948673},{"x":-0.364273842861369,"y":1.540574793767881}],"density":1,"group":"","refName":"","collision":7},{"x":674.2683630670339,"y":149.1456948757286,"rotation":0,"ID":1,"type":1,"textureName":"1upleg.png","bodyID":0,"texturePositionOffsetLength":5.738283544852673,"texturePositionOffsetAngle":-1.992130640224259,"textureAngleOffset":0,"group":"","refName":""},{"x":22.388338160715605,"y":7.141988142906628,"rotation":0,"ID":2,"type":0,"colorFill":"#999999","colorLine":"#000","fixed":false,"awake":true,"vertices":[{"x":-0.32253413170017,"y":-0.46293134196965813},{"x":-0.16316432544832082,"y":-1.1231776821558928},{"x":0.1783424022342146,"y":-1.1004105669770565},{"x":0.33771220848606376,"y":-0.531232687506165},{"x":0.2921779781283895,"y":1.6544103696620605},{"x":-0.32253413170017,"y":1.5633419089467173}],"density":1,"group":"","refName":"","collision":7},{"x":677.0004168884949,"y":223.96018842125162,"rotation":0,"ID":3,"type":1,"textureName":"1lowleg.png","bodyID":2,"texturePositionOffsetLength":11.078175286928426,"texturePositionOffsetAngle":-1.0667688592172224,"textureAngleOffset":0,"group":"","refName":""},{"jointType":0,"x":672.2193227009398,"y":186.71143492080748,"rotation":1.5999999999999943,"collideConnected":false,"enableMotor":false,"maxMotorTorque":1,"motorSpeed":10,"enableLimit":true,"upperAngle":0,"lowerAngle":-149.0176322418136,"dampingRatio":0,"frequencyHz":0,"type":2,"group":"","refName":"","bodyA_ID":2,"bodyB_ID":0,"ID":4},{"x":22.745559912771213,"y":1.8235355551707402,"rotation":0,"ID":5,"type":0,"colorFill":"#999999","colorLine":"#000","fixed":false,"awake":true,"vertices":[{"x":-0.3555555555555614,"y":-0.4111111111111114},{"x":-0.15555555555555856,"y":-0.8777777777777782},{"x":0.1777777777777736,"y":-0.8111111111111113},{"x":0.3777777777777729,"y":0.05555555555555536},{"x":0.11111111111110716,"y":1.0555555555555554},{"x":-0.15555555555555856,"y":0.9888888888888889}],"density":1,"group":"","refName":"","collision":7},{"x":683.7001307164696,"y":58.37273332178892,"rotation":0,"ID":6,"type":1,"textureName":"1uparm.png","bodyID":5,"texturePositionOffsetLength":3.9015666369065602,"texturePositionOffsetAngle":-1.222025323211012,"textureAngleOffset":0,"group":"","refName":""},{"x":22.79702202027203,"y":3.824266467375038,"rotation":0,"ID":7,"type":0,"colorFill":"#999999","colorLine":"#000","fixed":false,"awake":true,"vertices":[{"x":-0.1710527060768996,"y":-0.25657905911535295},{"x":-0.13684216486151968,"y":-1.0092109658537227},{"x":0.13684216486152323,"y":-0.9750004246383419},{"x":0.20526324729228307,"y":0.1197368942538315},{"x":0.10263162364614331,"y":1.0776320482844826},{"x":-0.13684216486151968,"y":1.0434215070691026}],"density":1,"group":"","refName":"","collision":7},{"x":683.9106606081612,"y":115.24115213948184,"rotation":0,"ID":8,"type":1,"textureName":"1lowarm.png","bodyID":7,"texturePositionOffsetLength":0.5131581182307059,"texturePositionOffsetAngle":-1.5707963267944536,"textureAngleOffset":0,"group":"","refName":""},{"jointType":0,"x":683.9106606081614,"y":84.45166504563925,"rotation":1.5807274866610683,"collideConnected":false,"enableMotor":false,"maxMotorTorque":1,"motorSpeed":10,"enableLimit":true,"upperAngle":152,"lowerAngle":0,"dampingRatio":0,"frequencyHz":0,"type":2,"group":"","refName":"","bodyA_ID":7,"bodyB_ID":5,"ID":9},{"x":22.792805088677298,"y":1.8130501313998035,"rotation":0,"ID":10,"type":0,"colorFill":"#999999","colorLine":"#000","fixed":false,"awake":true,"vertices":[{"x":-0.6285714285714263,"y":-0.5714285714285721},{"x":-0.16190476190476133,"y":-1.304761904761905},{"x":0.10476190476190439,"y":-1.5714285714285716},{"x":0.4380952380952401,"y":-1.4380952380952383},{"x":0.571428571428573,"y":0.2952380952380951},{"x":0.37142857142857366,"y":2.3619047619047615},{"x":-0.6952380952380928,"y":2.2285714285714286}],"density":1,"group":"","refName":"","collision":7},{"x":680.9270098031758,"y":65.24864679913694,"rotation":0,"ID":11,"type":1,"textureName":"1body.png","bodyID":10,"texturePositionOffsetLength":11.226790116793472,"texturePositionOffsetAngle":-1.8281200417660084,"textureAngleOffset":0,"group":"","refName":""},{"jointType":0,"x":680.4243861668929,"y":38.57692965716447,"rotation":1.5807274866610896,"collideConnected":false,"enableMotor":false,"maxMotorTorque":1,"motorSpeed":10,"enableLimit":true,"upperAngle":10,"lowerAngle":-180,"dampingRatio":0,"frequencyHz":0,"type":2,"group":"","refName":"","bodyA_ID":10,"bodyB_ID":5,"ID":12},{"x":22.938305547543706,"y":-0.0015657213309401286,"rotation":0,"ID":13,"type":0,"colorFill":"#999999","colorLine":"#000","fixed":false,"awake":true,"vertices":[{"x":0,"y":0},{"x":0,"y":0}],"density":1,"group":"","refName":"","collision":7,"radius":14.000000000000057},{"x":688.1491664263111,"y":-0.04697163992823228,"rotation":0,"ID":14,"type":1,"textureName":"1head.png","bodyID":13,"texturePositionOffsetLength":1.1718571004216928e-13,"texturePositionOffsetAngle":2.896613990462929,"textureAngleOffset":0,"group":"","refName":""},{"jointType":0,"x":688.1491664263115,"y":9.60900368434497,"rotation":-1.5861250927131039,"collideConnected":false,"enableMotor":false,"maxMotorTorque":1,"motorSpeed":10,"enableLimit":true,"upperAngle":57.58186397984887,"lowerAngle":-64.38287153652392,"dampingRatio":0,"frequencyHz":0,"type":2,"group":"","refName":"","bodyA_ID":10,"bodyB_ID":13,"ID":15},{"x":22.77358699046018,"y":4.918378803582737,"rotation":0,"ID":16,"type":0,"colorFill":"#999999","colorLine":"#000","fixed":false,"awake":true,"vertices":[{"x":-0.45534230357671035,"y":-0.9410407607252083},{"x":-0.04553423035767068,"y":-1.214246142871236},{"x":0.31873961250370186,"y":-0.8499723000098651},{"x":0.4098080732190432,"y":0.06071230714356268},{"x":0.1366026910730156,"y":1.4039721026948673},{"x":-0.364273842861369,"y":1.540574793767881}],"density":1,"group":"","refName":"","collision":7},{"x":680.8607754811707,"y":152.78780059861427,"rotation":0,"ID":17,"type":1,"textureName":"1upleg.png","bodyID":16,"texturePositionOffsetLength":5.738283544852673,"texturePositionOffsetAngle":-1.992130640224259,"textureAngleOffset":0,"group":"","refName":""},{"x":22.60808524118683,"y":7.263391667002825,"rotation":0,"ID":18,"type":0,"colorFill":"#999999","colorLine":"#000","fixed":false,"awake":true,"vertices":[{"x":-0.32253413170017,"y":-0.46293134196965813},{"x":-0.16316432544832082,"y":-1.1231776821558928},{"x":0.1783424022342146,"y":-1.1004105669770565},{"x":0.33771220848606376,"y":-0.531232687506165},{"x":0.2921779781283895,"y":1.6544103696620605},{"x":-0.32253413170017,"y":1.5633419089467173}],"density":1,"group":"","refName":"","collision":7},{"x":683.5928293026317,"y":227.60229414413752,"rotation":0,"ID":19,"type":1,"textureName":"1lowleg.png","bodyID":18,"texturePositionOffsetLength":11.078175286928426,"texturePositionOffsetAngle":-1.0667688592172224,"textureAngleOffset":0,"group":"","refName":""},{"jointType":0,"x":678.8117351150763,"y":190.353540643693,"rotation":1.5999999999999943,"collideConnected":false,"enableMotor":false,"maxMotorTorque":1,"motorSpeed":10,"enableLimit":true,"upperAngle":0,"lowerAngle":-149.0176322418136,"dampingRatio":0,"frequencyHz":0,"type":2,"group":"","refName":"","bodyA_ID":18,"bodyB_ID":16,"ID":20},{"jointType":0,"x":680.2481124117094,"y":116.2185088835673,"rotation":1.600000000000005,"collideConnected":false,"enableMotor":false,"maxMotorTorque":1,"motorSpeed":10,"enableLimit":true,"upperAngle":149.47103274559194,"lowerAngle":-8.765743073047872,"dampingRatio":0,"frequencyHz":0,"type":2,"group":"","refName":"","bodyA_ID":16,"bodyB_ID":10,"ID":21},{"jointType":0,"x":677.1673867717411,"y":116.44081546899827,"rotation":1.5523033076478931,"collideConnected":false,"enableMotor":false,"maxMotorTorque":1,"motorSpeed":10,"enableLimit":true,"upperAngle":16.4735516372796,"lowerAngle":-141.76322418136021,"dampingRatio":0,"frequencyHz":0,"type":2,"group":"","refName":"","bodyA_ID":10,"bodyB_ID":0,"ID":22},{"x":22.652800989546677,"y":1.8078999738268875,"rotation":0,"ID":23,"type":0,"colorFill":"#999999","colorLine":"#000","fixed":false,"awake":true,"vertices":[{"x":-0.3555555555555614,"y":-0.4111111111111114},{"x":-0.15555555555555856,"y":-0.8777777777777782},{"x":0.1777777777777736,"y":-0.8111111111111113},{"x":0.3777777777777729,"y":0.05555555555555536},{"x":0.11111111111110716,"y":1.0555555555555554},{"x":-0.15555555555555856,"y":0.9888888888888889}],"density":1,"group":"","refName":"","collision":7},{"x":680.9173630197336,"y":57.90366588147334,"rotation":0,"ID":24,"type":1,"textureName":"1uparm.png","bodyID":23,"texturePositionOffsetLength":3.9015666369065602,"texturePositionOffsetAngle":-1.222025323211012,"textureAngleOffset":0,"group":"","refName":""},{"x":22.71362035857896,"y":3.7885285356752103,"rotation":0,"ID":25,"type":0,"colorFill":"#999999","colorLine":"#000","fixed":false,"awake":true,"vertices":[{"x":-0.1710527060768996,"y":-0.25657905911535295},{"x":-0.13684216486151968,"y":-1.0092109658537227},{"x":0.13684216486152323,"y":-0.9750004246383419},{"x":0.20526324729228307,"y":0.1197368942538315},{"x":0.10263162364614331,"y":1.0776320482844826},{"x":-0.13684216486151968,"y":1.0434215070691026}],"density":1,"group":"","refName":"","collision":7},{"x":681.408610757369,"y":114.16901418848701,"rotation":0,"ID":26,"type":1,"textureName":"1lowarm.png","bodyID":25,"texturePositionOffsetLength":0.5131581182307059,"texturePositionOffsetAngle":-1.5707963267944536,"textureAngleOffset":0,"group":"","refName":""},{"jointType":0,"x":680.1162993569685,"y":81.96678486677041,"rotation":1.5861250927131039,"collideConnected":false,"enableMotor":false,"maxMotorTorque":1,"motorSpeed":10,"enableLimit":true,"upperAngle":151.88916876574308,"lowerAngle":0,"dampingRatio":0,"frequencyHz":0,"type":2,"group":"","refName":"","bodyA_ID":25,"bodyB_ID":23,"ID":27},{"jointType":0,"x":681.0374766150494,"y":37.06978761437075,"rotation":1.5071237677699827,"collideConnected":false,"enableMotor":false,"maxMotorTorque":1,"motorSpeed":10,"enableLimit":true,"upperAngle":18.89168765743073,"lowerAngle":-180,"dampingRatio":0,"frequencyHz":0,"type":2,"group":"","refName":"","bodyA_ID":10,"bodyB_ID":23,"ID":28}]}';

        this.uploadFile(lotsaText, "levels", "levelData.json");
    }
    this.signout = function () {
        firebase.auth().signOut().then(function () {
            console.log("signed out");
            showLogin();
        }, function (error) {
            // An error happened.
            console.log("signout error" + error.message);
            $(".ui.negative.message").removeClass('hidden');
            $(".ui.negative.message > p").text(error.message);
        });
    }
    this.onLoginSucccess = function (user) {
        console.log("LOGIN SUCCES")
        console.log(user);
        // go to application
        $('form').removeClass('loading');
        $(".ui.negative.message:visible").addClass('hidden');
    }
    this.onLoginError = function (error) {
        $('form').removeClass('loading');
        console.log($(".ui.negative.message:visible"));
        $(".ui.negative.message").removeClass('hidden');
        $(".ui.negative.message > p").text(error.message);
        console.log("ERROR" + error.message);
    }
    this.requestResetPassword = function (email) {
        console.log("reset password for:" + email);
        this.app.auth().sendPasswordResetEmail(email).then(function () {
            // Email sent.
            $('form').removeClass('loading');
            $(".ui.negative.message").addClass('hidden');
            $(".ui.positive.message").removeClass('hidden');
            console.log("great succes :D");
        }).catch(function (error) {
            // An error happened.
            $('form').removeClass('loading');
            $(".ui.positive.message").addClass('hidden');
            $(".ui.negative.message").removeClass('hidden');
            $(".ui.negative.message:visible > p").text(error.message);
        });
    }
    this.checkURLParameters = function () {
        var urlParams = this.getUrlParams();
        var mode = urlParams.mode;
        this.actionCode = urlParams.oobCode;
        var accountEmail;
        // Verify the password reset code is valid.
        if (!mode) showLogin();
        else if (mode == "resetPassword") {
            showReset();
            this.app.auth().verifyPasswordResetCode(this.actionCode).then(function (email) {
                var accountEmail = email;
                console.log(accountEmail);
                console.log("check:" + $(".ui.message:visible > p"));
                $(".ui.message:visible>p").text("Resetting password for " + accountEmail);
            }).catch(function (error) {
                console.log($(".ui.negative.message:visible"))
                $(".ui.negative.message").removeClass('hidden');
                $(".ui.negative.message > p").text(error.message);
            });
        }
    }
    this.resetPassword = function (newpassword) {
        $('form').addClass('loading');
        console.log(this.actionCode)
        this.app.auth().confirmPasswordReset(this.actionCode, newpassword).then(function (resp) {
            // navigate back to login url.split('?')[0]
            $('form').removeClass('loading');
            console.log("BIG SUCCES, password reset succesful");
            $(".ui.positive.message").removeClass('hidden');
        }).catch(function (error) {
            $('form').removeClass('loading');
            $(".ui.negative.message").removeClass('hidden');
            $(".ui.negative.message > p").text(error.message);
        });
    }

    this.uploadFiles = function (files){
        Promise.all(
            files.map(file => uploadFile(file))
          )
          .then((url) => {
            console.log(`All success`)
          })
          .catch((error) => {
            console.log(`Some failed: `, error.message)
          });
    }

    this.uploadFile = function(file, dir, name, optionalUploadManager) {
        var storageRef = firebase.storage().ref(dir+"/"+this.generateUUID()+"/"+name);

        var task;
        if(typeof file === 'string'){
            task = storageRef.putString(file);
        }else{
            task = storageRef.put(file);
        }
        task.on('state_changed',
            function progress(snapshot){
                var percentage = snapshot.bytesTransferred / snapshot.totalBytes * 100;
                console.log(percentage);
            },
            function error(error){
                console.log(error.message);
            },
            function complete(){
                var downloadURL = task.snapshot.downloadURL;
                console.log(downloadURL);
            }
        );
      }

    this.generateUUID = function() {
        var d = new Date().getTime();
        if (typeof performance !== 'undefined' && typeof performance.now === 'function'){
            d += performance.now();
        }
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }

    this.getUrlParams = function (prop) {
        var params = {};
        var search = decodeURIComponent(window.location.href.slice(window.location.href.indexOf('?') + 1));
        var definitions = search.split('&');
        definitions.forEach(function (val, key) {
            var parts = val.split('=', 2);
            params[parts[0]] = parts[1];
        });
        return (prop && prop in params) ? params[prop] : params;
    }

}

//fetchProvidersForEmail