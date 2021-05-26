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

	const newBodies = [];

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

		// we need this verticeRef because a single vertice array can generate multiple fixtures
		const targetIndex = oldFixture.verticeRef;
		bodyObject.radius = [body.mySprite.data.radius[targetIndex]];
		bodyObject.colorFill = [body.mySprite.data.colorFill[targetIndex]];
		bodyObject.colorLine = [body.mySprite.data.colorLine[targetIndex]];
		bodyObject.lineWidth = [body.mySprite.data.lineWidth[targetIndex]];
		bodyObject.breakable = false;

		bodyObject.vertices.push(fixtureVertices);

		const newBody = game.editor.buildBodyFromObj(bodyObject);
		newBody.SetLinearVelocity(body.GetLinearVelocity());
		newBody.SetAngularVelocity(body.GetAngularVelocity());

		newBodies.push(newBody);
	})

	// final step
	newBodies.reverse();
	newBodies.forEach(newBody => {
		// place in correct spot
		newBody.mySprite.parent.addChildAt(newBody.mySprite, body.mySprite.parent.getChildIndex(body.mySprite));
	})

	game.editor.deleteObjects([body]);

}

export const update = ()=>{
	bodiesToBreak.forEach( body => breakBody(body));
	bodiesToBreak.length = [];
}

export const reset = () => {
	bodiesToBreak.length = 0;
}
