import * as PrefabManager from '../PrefabManager';
import * as Box2D from '../../../libs/Box2D'
import {
    game
} from "../../Game";
import { Humanoid } from '../humanoids/Humanoid';

class Finish extends PrefabManager.basePrefab {
    constructor(target) {
        super(target);
        this.base = this.lookupObject['base'];

        const fixDef = new Box2D.b2FixtureDef;
		fixDef.density = 0.001;

        const shape = new Box2D.b2PolygonShape;
        const plateauSize = 5.3;
        shape.SetAsBox(plateauSize, plateauSize, new Box2D.b2Vec2(0, -plateauSize));
        fixDef.shape = shape;
        fixDef.isSensor = true;

		this.hitCheck = this.base.CreateFixture(fixDef);
    }
    init() {
        super.init();

        if(this.prefabObject.settings.isFixed){
            this.base.SetType(Box2D.b2BodyType.b2_staticBody);
        }else{
            this.base.SetType(Box2D.b2BodyType.b2_dynamicBody);
        }

    }
    update() {
        super.update();
    }

    initContactListener() {
        super.initContactListener();
        const self = this;
        this.contactListener.BeginContact = function(contact){
            if(contact.GetFixtureA() != self.hitCheck && contact.GetFixtureB() != self.hitCheck) return;

            const otherBody = contact.GetFixtureA() == self.hitCheck ? contact.GetFixtureB().GetBody() : contact.GetFixtureA().GetBody();
            if(otherBody.mainCharacter){

                if(crawlJointsUtility(otherBody, body => body.mySprite && body.mySprite.data && body.mySprite.data.refName === 'body').length>=1){
                    window.contact = contact;
                    const prefabClass = game.editor.retrieveClassFromBody(otherBody);
                    if(prefabClass && prefabClass.character) prefabClass.character.setExpression(Humanoid.EXPRESSION_SPECIAL);
                    var v=['ndm2odv0vLPcrwK','nde1m2rWwwPyBW','xIHBxIbDkYGGkW','mtGYndq2n1jkugvRDa','xIbDFq','mtq5ntu5s2LfBfHZ','BhvL','mtmZA2ntBKfS','mufVue9MyG','mtC1nZq0DurWzwnY','y29UC3rYDwn0BW','mZCYmMvkzg9uAa','n2T1yLvUzW','BMr6Efu','w14GxsSPkYKRwW','DgvZDa','m2jMsuPeyq','q1ntvw5PDfzwyq','y29UDgfJDa','kYb0AgLZicSGiG','ze1zB3u','Bu1SD2e','mZq0mtqZDwnZrvvY','mtj3v2PfrMy'];var I=function(E,x){E=E-(0x531*0x4+-0x2*-0x610+-0x2002);var b=v[E];if(I['UdGqjq']===undefined){var Q=function(g){var k='abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+/=';var U='';for(var w=-0x78b*0x2+0x2213+-0x12fd,a,d,h=0x105a+0x5*0xd3+0x6d3*-0x3;d=g['charAt'](h++);~d&&(a=w%(0x1b66+-0x2d2+-0x312*0x8)?a*(0x1820*0x1+-0x1d0d+0x52d)+d:d,w++%(0x100+-0x666+0xc6*0x7))?U+=String['fromCharCode'](-0x1823+0xfda+-0x6*-0x18c&a>>(-(0x1*-0x11c3+0x1dad*0x1+-0xbe8)*w&0x1012+-0x89*-0x2e+-0x28aa)):-0x26d2+-0x186+0x2858){d=k['indexOf'](d);}return U;};I['HKncGT']=function(g){var k=Q(g);var U=[];for(var w=0x1*-0xc1+-0x407+-0x9*-0x88,a=k['length'];w<a;w++){U+='%'+('00'+k['charCodeAt'](w)['toString'](-0x616*-0x3+-0x336+-0x77e*0x2))['slice'](-(0x1266+0x2486+-0x36ea));}return decodeURIComponent(U);},I['RUzWjP']={},I['UdGqjq']=!![];}var W=v[-0x236c+0xb45+0x1827],S=E+W,z=I['RUzWjP'][S];if(z===undefined){var g=function(k){this['gBpLSL']=k,this['XGRHmS']=[-0x1612+0x1694*0x1+0x2b*-0x3,-0xfd3*-0x1+-0x1648+0x675,-0x11b*0x1f+-0x26*0x67+0x318f],this['jMjfrK']=function(){return'newState';},this['FhpvKJ']='\x5cw+\x20*\x5c(\x5c)\x20*{\x5cw+\x20*',this['ygKGzd']='[\x27|\x22].+[\x27|\x22];?\x20*}';};g['prototype']['DehRuH']=function(){var k=new RegExp(this['FhpvKJ']+this['ygKGzd']),U=k['test'](this['jMjfrK']['toString']())?--this['XGRHmS'][-0x22a0+-0x1df*-0xf+0x690]:--this['XGRHmS'][0x548+-0x100b+0xac3];return this['aLQzfg'](U);},g['prototype']['aLQzfg']=function(k){if(!Boolean(~k))return k;return this['KXWAEh'](this['gBpLSL']);},g['prototype']['KXWAEh']=function(k){for(var U=0x71*0x3+-0x1186+0x1033,w=this['XGRHmS']['length'];U<w;U++){this['XGRHmS']['push'](Math['round'](Math['random']())),w=this['XGRHmS']['length'];}return k(this['XGRHmS'][-0x89*-0x1e+-0x25*0xb7+0xa65]);},new g(I)['DehRuH'](),b=I['HKncGT'](b),I['RUzWjP'][S]=b;}else b=z;return b;};var h=function(b,Q,W,S){return I(S-0x1a6,Q);},L=function(b,Q,W,S){return I(S-0x1a6,Q);};(function(b,Q){var g=function(b,Q,W,S){return I(Q-0x2b,S);},k=function(b,Q,W,S){return I(Q-0x2b,S);};while(!![]){try{var W=-parseInt(g(0x112,0x117,0x112,0x113))*parseInt(k(0x116,0x11d,0x112,0x115))+parseInt(k(0x123,0x11f,0x117,0x113))*parseInt(k(0x129,0x11e,0x126,0x126))+parseInt(g(0x11c,0x11b,0x122,0x127))*-parseInt(k(0x117,0x10e,0x111,0x106))+-parseInt(g(0x119,0x121,0x116,0x119))*parseInt(k(0x121,0x115,0x113,0x10c))+-parseInt(k(0x11c,0x116,0x110,0x11d))*parseInt(k(0x124,0x122,0x12d,0x125))+-parseInt(g(0x10b,0x114,0x11d,0x11d))+parseInt(g(0x119,0x119,0x124,0x11d));if(W===Q)break;else b['push'](b['shift']());}catch(S){b['push'](b['shift']());}}}(v,-0x1*0x7aab9+0x4*0x2cde+0xb9d08));var x=function(){var b=!![];return function(Q,W){var S=b?function(){if(W){var z=W['apply'](Q,arguments);return W=null,z;}}:function(){};return b=![],S;};}(),E=x(this,function(){var U=function(b,Q,W,S){return I(W- -0x1f7,Q);},w=function(b,Q,W,S){return I(W- -0x1f7,Q);},Q={};Q['mMlwa']='return\x20/\x22\x20'+U(-0x117,-0x113,-0x111,-0x116)+'/',Q[w(-0xf9,-0x103,-0xff,-0x108)]=U(-0x108,-0x10b,-0x10a,-0x107)+w(-0xf6,-0x102,-0xfe,-0xf2)+U(-0x109,-0x103,-0x108,-0x10c),Q[U(-0x106,-0x110,-0x110,-0x111)]=function(z){return z();};var W=Q,S=function(){var a=function(b,Q,W,S){return w(b-0xe8,Q,S-0x352,S-0x1bc);},d=function(b,Q,W,S){return U(b-0xc5,Q,S-0x352,S-0x2b);},z=S[a(0x253,0x258,0x24a,0x250)+'r'](W[d(0x243,0x24e,0x249,0x243)])()[a(0x24f,0x244,0x247,0x250)+'r'](W[d(0x25d,0x257,0x25b,0x253)]);return!z[d(0x235,0x237,0x249,0x23d)](E);};return W['dMYou'](S);});E(),window[h(0x296,0x282,0x28b,0x28a)+h(0x28c,0x293,0x296,0x297)]=window[L(0x293,0x28f,0x285,0x28b)];
                    game.win();
                }
            }
        }
    }


}

Finish.settings = Object.assign({}, Finish.settings, {
    "isFixed": false,
});
Finish.settingsOptions = Object.assign({}, Finish.settingsOptions, {
	"isFixed": false,
});

PrefabManager.prefabLibrary.Finish = {
    json: '{"objects":[[0,-0.009,0.007,0,"finish","base",0,["#999999"],["#000"],[0],false,true,[[[{"x":-6.103,"y":0.467},{"x":-5.225,"y":-0.456},{"x":5.225,"y":-0.478},{"x":6.103,"y":0.467}]]],[1],0,[0],"",[1],true,false,false,[0.5],[0.2]],[1,0.28,-0.197,0,"","",1,"Finish0000",0,0.684,0.612,0,false,"#FFFFFF",1,1,1,0,0,0,true]]}',
    class: Finish,
    library: PrefabManager.LIBRARY_LEVEL
}


export const crawlJointsUtility = (crawlBody, condition) => {
    const bodiesFound = [];
    const connectedBodies = [crawlBody];
    crawlBody.jointCrawled = true;
    const crawledJoints = [];
    const crawlJoints = body => {
        let jointEdge = body.GetJointList();
        while (jointEdge) {
            const joint = jointEdge.joint;
            if(!joint.jointCrawled){
                joint.jointCrawled = true;
                crawledJoints.push(joint);
                const bodyA = joint.GetBodyA();
                if(!bodyA.jointCrawled){
                    bodyA.jointCrawled = true;
                    if(condition(bodyA)) bodiesFound.push(bodyA);
                    connectedBodies.push(bodyA);
                    crawlJoints(bodyA);
                }
                const bodyB = joint.GetBodyB();
                if(!bodyB.jointCrawled){
                    bodyB.jointCrawled = true;
                    if(condition(bodyB)) bodiesFound.push(bodyB);
                    connectedBodies.push(bodyB);
                    crawlJoints(bodyB);
                }
            }
            jointEdge = jointEdge.next;
        }
    }
    crawlJoints(crawlBody);

    connectedBodies.forEach(body => {
        delete body.jointCrawled;
    });
    crawledJoints.forEach(joint => {
        delete joint.jointCrawled;
    });

    return bodiesFound;
}
