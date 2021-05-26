import {
	game
} from "../../Game";

const { getPointer, NULL, destroy} = Box2D; // emscriptem specific

const bodiesToBreak = [];

export const checkBodyBreak = (body, impulse) => {
	if(!body.mySprite || !body.mySprite.data.breakable || body.goingToBreak) return;

	if(impulse > 0){
		body.goingToBreak = true;
		bodiesToBreak.push(body);
	}
}

const breakBody = body => {
	const fixturesToSplit = [];
	for (let fixture = body.GetFixtureList(); getPointer(fixture) !== getPointer(NULL); fixture = fixture.GetNext()) {
		fixturesToSplit.push(fixture);
	}

	fixturesToSplit.forEach((oldFixture, index) => {
		const bodyObject = new game.editor.bodyObject;
		Object.assign(bodyObject, body.mySprite.data);

		bodyObject.vertices = [];

		const fixtureVertices = [];

		const baseShape = oldFixture.GetShape();
		if(baseShape.GetType() === Box2D.b2Shape.e_circle){
			const shape = Box2D.castObject(baseShape, Box2D.b2CircleShape);
			const pos = shape.get_m_p();
			fixtureVertices.push({x:pos.x, y:pos.y});
			fixtureVertices.push({x:pos.x, y:pos.y});

		}else {
			const shape = Box2D.castObject(baseShape, Box2D.b2PolygonShape);
			for (let vertexIx = 0; vertexIx < shape.get_m_count(); vertexIx++) {
				const vertex = shape.get_m_vertices(vertexIx);
				fixtureVertices.push({x:vertex.x, y:vertex.y});
			}
		}
		bodyObject.x = body.GetPosition().x;
		bodyObject.y = body.GetPosition().y;
		bodyObject.rotation = body.GetAngle();

		bodyObject.radius = [body.mySprite.data.radius[0]];
		bodyObject.colorFill = [body.mySprite.data.colorFill[0]];
		bodyObject.colorLine = [body.mySprite.data.colorLine[0]];
		bodyObject.lineWidth = [body.mySprite.data.lineWidth[0]];
		bodyObject.breakable = false;

		bodyObject.vertices.push(fixtureVertices);

		const newBody = game.editor.buildBodyFromObj(bodyObject);
		newBody.SetLinearVelocity(body.GetLinearVelocity());
		newBody.SetAngularVelocity(body.GetAngularVelocity());

	})

	game.editor.deleteObjects([body]);

}

const findIndex = (vertices, index)=> {
	// crawl vertice arrays to match index
}

export const update = ()=>{
	bodiesToBreak.forEach( body => breakBody(body));
	bodiesToBreak.length = [];
}

export const reset = () => {
	bodiesToBreak.length = 0;
}
