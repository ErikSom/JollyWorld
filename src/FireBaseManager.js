function FireBaseManager(){
    this.checkingUsername = false;
    this.createUser = function(email, password){

        var self = this;
        firebase.auth().createUserWithEmailAndPassword(email, password).then(function(user){self.onCreateUserSuccess(user)}, function(error){self.onCreateUserError(error)});
    }
    this.onCreateUserSuccess = function(user){
        console.log("YAY YOU SIGNED IN!!!!")
        console.log(user);
    }
    this.onCreateUserError = function(error){
        // Handle Errors here.
        var errorCode = error.code;
        var errorMessage = error.message;
        // ...
        console.log("ERROR!!!!");
        console.log("code"+errorCode+"  message:"+errorMessage);
    }
    this.doesUserNameExist = function(name){
        console.log("checking for name: "+name);
        this.checkingUsername = true;

        var usernameRef = firebase.database().ref('/Users').orderByChild('username').equalTo('test2');
        usernameRef.once('value').then(snapshot => {
            var post = snapshot.val();
            console.log(post);
          })

    }

}

//fetchProvidersForEmail