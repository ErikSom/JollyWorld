import * as PrefabManager from '../PrefabManager';
import * as Box2D from '../../../libs/Box2D';
import {PIDController} from '../misc/PIDController'
import { Settings } from '../../Settings';
import { normalizePI } from '../../b2Editor/utils/extramath';
import {
    game
} from "../../Game";

class DroneBomb extends PrefabManager.basePrefab {
    constructor(target) {
		super(target);


		this.throttleController = new PIDController(2, 0, 1);
		this.angleController = new PIDController(5, 0, 0.1);

		console.log(this.throttleController);
		console.log(this.angleController);
    }
    init(){
        super.init();
		this.body = this.lookupObject['body'];

		let fixture = this.body.GetFixtureList();
		this.sides = [];

		while(fixture){
			if (fixture.GetShape() instanceof Box2D.b2CircleShape) {
				fixture.SetSensor(true);
				this.sides.push(fixture);
			}
			fixture = fixture.GetNext();
		}

		// this.angleController = new PIDController(1, 0, 0.1);
		// this.posXController = new PIDController(1, 0, 1);
		// this.posYController = new PIDController(1, 0, 1);




	}
	update(){

		// const velocity = this.body.GetLinearVelocity();

		// const targetY = game.editor.mousePosWorld.y;

		// this.posYController.setError( targetY - this.body.GetPosition().y );
		// this.posYController.step( 1 / Settings.physicsTimeStep );
		// const targetYAccel = Box2D.b2Clamp(this.posYController.getOutput(), -10.0, 10.0);

		// velocity.y = targetYAccel;

		// const targetX = game.editor.mousePosWorld.x;

		// this.posXController.setError( targetX - this.body.GetPosition().x );
		// this.posXController.step( 1 / Settings.physicsTimeStep );
		// const targetXAccel = Box2D.b2Clamp(this.posXController.getOutput(), -10.0, 10.0);

		// velocity.x = targetXAccel;


		// this.body.SetAngularVelocity(-targetSpeed);


		const targetY = game.editor.mousePosWorld.y;
		const maxForce = 20;

		this.throttleController.setError( targetY - this.body.GetPosition().y - this.body.GetLinearVelocity().y );
		this.throttleController.step( 1 / Settings.physicsTimeStep );
		let targetThrottle = Box2D.b2Clamp(this.throttleController.getOutput(), -maxForce, maxForce);

		const currentAngle = normalizePI(this.body.GetAngle());

		const almostFlipped = .6;
		if(currentAngle> Math.PI * almostFlipped || currentAngle< - Math.PI * almostFlipped){
			console.log("mkay");
			targetThrottle *= -1;
		}


		const distTarget = this.body.GetPosition().Clone().SelfSub(game.editor.mousePosWorld);
		const distA = Math.atan2(distTarget.y, distTarget.x);



		const angle = this.body.GetAngle();
		const offset = new Box2D.b2Vec2();
		const quadLength = 1.0;
		offset.x = quadLength * Math.cos(angle);
		offset.y = quadLength * Math.sin(angle);

		const posLeft = this.body.GetPosition().Clone().SelfSub(offset);
		const posRight = this.body.GetPosition().Clone().SelfAdd(offset);

		const forceDirection = this.body.GetAngle() + Math.PI /2;
		const force = new Box2D.b2Vec2();
		force.x = targetThrottle * Math.cos(forceDirection);
		force.y = targetThrottle * Math.sin(forceDirection);

		const targetX = game.editor.mousePosWorld.x;
		const angleChange = 15 * game.editor.DEG2RAD;
		const angleCorrection = Box2D.b2Clamp(targetX - this.body.GetPosition().x, -angleChange, angleChange);


		this.angleController.setError(currentAngle - angleCorrection);
		this.angleController.step(1 / Settings.physicsTimeStep);
		let targetSpeed = this.angleController.getOutput();

		console.log('speed:', targetSpeed);

		let leftLimiter = 1.0;
		let rightLimiter = 1.0;

		if(targetSpeed < 0 ){
			rightLimiter = Math.max(0, Math.min(1, 1-(Math.abs(targetSpeed) / Math.PI/2)));
		}else if(targetSpeed > 0){
			leftLimiter = Math.max(0, Math.min(1, 1-(Math.abs(targetSpeed) / Math.PI/2)));
		}


		if(currentAngle > Math.PI * almostFlipped || currentAngle < - Math.PI * almostFlipped){
			leftLimiter = 0.4;
			rightLimiter = 0.8;
		}


		this.body.ApplyForce(force.Clone().SelfMul(leftLimiter), posLeft, true);
		this.body.ApplyForce(force.Clone().SelfMul(rightLimiter), posRight, true);

	}
}

PrefabManager.prefabLibrary.DroneBomb = {
    json: '{"objects":[[0,0.003,-0.276,0,"dronebomb","body",0,["#999999","#999999","#999999","#999999"],["#000","#000","#000","#000"],[0,1,1,1,1],false,true,[[{"x":-2.1,"y":0.16},{"x":-2.1,"y":-0.476},{"x":2.096,"y":-0.476},{"x":2.096,"y":0.16}],[{"x":-0.845,"y":1.536},{"x":-0.845,"y":0.098},{"x":0.801,"y":0.098},{"x":0.801,"y":1.536}],[{"x":-2.199,"y":-0.33},{"x":-2.199,"y":-0.33}],[{"x":2.222,"y":-0.33},{"x":2.222,"y":-0.33}]],[0.3,0.3,0.1,0.1],0,[0,0,6.651,6.651],"",[1,1,1,1],true,false,false,[0.5,0.5,0.5,0.5],[0.2,0.2,0.2,0.2]],[1,-0.077,8.295,0,"dronebomb","texture",1,"HommingBomb_Drone_off0000",0,16.591,-1.58,0,false,"#FFFFFF",1,1,1,0,0,0,true]]}',
    class: DroneBomb,
    library: PrefabManager.LIBRARY_WEAPON
}
