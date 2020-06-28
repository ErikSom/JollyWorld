import * as PrefabManager from '../PrefabManager'
import * as Box2D from '../../../libs/Box2D';


class Arrow extends PrefabManager.basePrefab {
    constructor(target) {
		super(target);
		this.dragConstant = 0.2;
    }
    init() {
        this.arrowBody = this.lookupObject['arrowBody'];
		super.init();
		this.pointingVec = new Box2D.b2Vec2( 1, 0 );
		this.tailVec = new Box2D.b2Vec2( -1.4, 0 );
		this.vec = new Box2D.b2Vec2();
	}
	update(){
		this.arrowBody.GetWorldVector(this.pointingVec, this.vec);
		const pointingDirection = this.vec;
		const flightDirection = this.arrowBody.GetLinearVelocity().Clone();
		const flightSpeed = flightDirection.Normalize();


		const dot = Box2D.b2Vec2.DotVV( flightDirection, pointingDirection );

		const dragForceMagnitude = (1 - Math.abs(dot)) * flightSpeed * flightSpeed * this.dragConstant * this.arrowBody.GetMass();

		this.arrowBody.GetWorldPoint( this.tailVec, this.vec );
		const arrowTailPosition = this.vec;

		this.arrowBody.ApplyForce( flightDirection.SelfMul(-dragForceMagnitude), arrowTailPosition );
	}
}

PrefabManager.prefabLibrary.Arrow = {
    json: '{"objects":[[0,1.059544631412833,-0.007327434648982022,0,"arrow","arrowBody",0,["#999999"],["#000"],[0],false,true,[[[{"x":-3.6805252363811514,"y":1.734723475976807e-18},{"x":1.141176985178861,"y":-0.12237822897360437},{"x":1.39817126602343,"y":0.012237822897360438},{"x":1.141176985178861,"y":0.11014040607624395}]]],[1],0,[0],"",[1]],[1,2.961862192593653,0.7029452529312912,0,"arrow","arrowTexture",1,"Arrow0000",0,28.839243423167698,-3.109590225253805,0,false,"#FFFFFF",1,1,1]]}',
    class: Arrow,
    library: PrefabManager.LIBRARY_WEAPON  ,
}
