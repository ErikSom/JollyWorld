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

		this.angleController = new PIDController(1, 0, 0.1);
		this.posXController = new PIDController(1, 0, 1);
		this.posYController = new PIDController(1, 0, 1);


	}
	update(){

		const velocity = this.body.GetLinearVelocity();

		const targetY = game.editor.mousePosWorld.y;

		this.posYController.setError( targetY - this.body.GetPosition().y );
		this.posYController.step( 1 / Settings.physicsTimeStep );
		const targetYAccel = Box2D.b2Clamp(this.posYController.getOutput(), -10.0, 10.0);

		velocity.y = targetYAccel;

		const targetX = game.editor.mousePosWorld.x;

		this.posXController.setError( targetX - this.body.GetPosition().x );
		this.posXController.step( 1 / Settings.physicsTimeStep );
		const targetXAccel = Box2D.b2Clamp(this.posXController.getOutput(), -10.0, 10.0);

		velocity.x = targetXAccel;

		const targetAngle = game.world.GetGravity().y  === 0 ? targetXAccel : targetXAccel / game.world.GetGravity().y;

		console.log(targetAngle);



		const currentAngle = normalizePI(this.body.GetAngle());
		this.angleController.setError(currentAngle - targetAngle);
		this.angleController.step(1 / Settings.physicsTimeStep);
		let targetSpeed = this.angleController.getOutput();
		if(Math.abs(targetSpeed) > 1000){
			targetSpeed = 0;
		}

		this.body.SetAngularVelocity(-targetSpeed);

	}
}

PrefabManager.prefabLibrary.DroneBomb = {
    json: '{"objects":[[0,0.003,-0.276,0,"dronebomb","body",0,["#999999","#999999","#999999","#999999"],["#000","#000","#000","#000"],[0,1,1,1,1],false,true,[[{"x":-2.1,"y":0.16},{"x":-2.1,"y":-0.476},{"x":2.096,"y":-0.476},{"x":2.096,"y":0.16}],[{"x":-0.845,"y":1.536},{"x":-0.845,"y":0.098},{"x":0.801,"y":0.098},{"x":0.801,"y":1.536}],[{"x":-2.199,"y":-0.33},{"x":-2.199,"y":-0.33}],[{"x":2.222,"y":-0.33},{"x":2.222,"y":-0.33}]],[0.3,0.3,0.1,0.1],0,[0,0,6.651,6.651],"",[1,1,1,1],true,false,false,[0.5,0.5,0.5,0.5],[0.2,0.2,0.2,0.2]],[1,-0.077,8.295,0,"dronebomb","texture",1,"HommingBomb_Drone_off0000",0,16.591,-1.58,0,false,"#FFFFFF",1,1,1,0,0,0,true]]}',
    class: DroneBomb,
    library: PrefabManager.LIBRARY_WEAPON
}
