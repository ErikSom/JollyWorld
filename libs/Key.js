export var Key = {
    _down:{},
    _pressed: {},
    _released: {},
    BACKPACE:8,
    TAB:9,
    ENTER:13,
    SHIFT:16,
    CTRL:17,
    ALT:18,
    ESCAPE:27,
    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,
    DELETE:46,
    0:48,
    1:49,
    2:50,
    3:51,
    4:52,
    5:53,
    6:54,
    7:55,
    8:56,
    9:57,
    A: 65,
    B: 66,
    C: 67,
    D: 68,
    E: 69,
    F: 70,
    G: 71,
    H: 72,
    I: 73,
    J: 74,
    K: 75,
    L: 76,
    M: 77,
    N: 78,
    O: 79,
    P: 80,
    Q: 81,
    R: 82,
    S: 83,
    T: 84,
    U: 85,
    V: 86,
    W: 87,
    X: 88,
    Y: 89,
    Z: 90,
    COMMAND:91,
    isDown: function (keyCode) {
        if(keyCode instanceof Array){
            var i;
            for(i = 0; i<keyCode.length; i++){
                if(!this._down[keyCode[i]]) return false;
            }
            return true;
        }else{
            return this._down[keyCode];
        }
    },

    isReleased: function (keyCode){
        return this._released[keyCode];
    },
    isPressed: function (keyCode){
        console.log("Is Pressed", keyCode);
        return this._pressed[keyCode];
    },

    onKeydown: function (event) {

        if(!this._down[event.keyCode]) this._pressed[event.keyCode] = true;
        this._down[event.keyCode] = true;

        if(event.keyCode == 91){
            //fix command
            if(!this._down[93]){
                this._pressed[93] = true;
                this._pressed[224] = true;
            }
            this._down[93] = true;
            this._down[224] = true;
        }
    },

    onKeyup: function (event) {
        delete this._down[event.keyCode];
        this._released[event.keyCode] = true;

        if(event.keyCode == 91){
            //fix command
            delete this._down[93];
            this._released[93] = true;
            delete this._down[224];
            this._released[224] = true;
        }
    },

    update: function (){
        this._pressed = {};
        this._released = {};
    },
    reset: function(){
        this._down = {};
        this.update();
    }
};