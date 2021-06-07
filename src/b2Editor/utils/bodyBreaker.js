import {
	b2CloneVec2,
	b2SubVec2
} from "../../../libs/debugdraw";
import {
	game
} from "../../Game";
import { Settings } from "../../Settings";

const {
	getPointer,
	NULL,
	destroy
} = Box2D; // emscriptem specific

const bodiesToBreak = [];

export const checkBodyBreak = (body, impulse) => {
	if (!body.mySprite || !body.mySprite.data.breakable || body.goingToBreak) return;

	const targetDensity = Array.isArray(body.mySprite.data.density) ? body.mySprite.data.density[0] : body.mySprite.data.density;

	const densityBreakMultiplier = 500;

	if (impulse > targetDensity * densityBreakMultiplier) {
		body.goingToBreak = true;
		bodiesToBreak.push(body);
	}
}

export const calculateBodyArea = vertices => {
	let area = 0
	for (let i = 0; i < vertices.length; i++) {
		const addX = vertices[i].x;
		const addY = vertices[i === vertices.length - 1 ? 0 : i + 1].y;
		const subX = vertices[i === vertices.length - 1 ? 0 : i + 1].x;
		const subY = vertices[i].y;
		area += (addX * addY * 0.5) - (subX * subY * 0.5);
	}
	return area;
}

const breakBody = body => {
	const fixturesToSplit = [];
	for (let fixture = body.GetFixtureList(); getPointer(fixture) !== getPointer(NULL); fixture = fixture.GetNext()) {
		fixturesToSplit.push(fixture);
	}

	const newBodies = [];

	fixturesToSplit.forEach((oldFixture, index) => {


		const fixtureVertices = [];

		const baseShape = oldFixture.GetShape();
		let shape;
		if (baseShape.GetType() === Box2D.b2Shape.e_circle) {
			shape = Box2D.castObject(baseShape, Box2D.b2CircleShape);
			const pos = shape.get_m_p();
			fixtureVertices.push({
				x: pos.x,
				y: pos.y
			});
			fixtureVertices.push({
				x: pos.x,
				y: pos.y
			});

		} else {
			shape = Box2D.castObject(baseShape, Box2D.b2PolygonShape);
			for (let vertexIx = 0; vertexIx < shape.get_m_count(); vertexIx++) {
				const vertex = shape.get_m_vertices(vertexIx);
				fixtureVertices.push({
					x: vertex.x,
					y: vertex.y
				});
			}
		}

		let bodiesToCreate = [fixtureVertices];

		let destroyCircle = false;

		if (fixturesToSplit.length === 1) {
			if(fixtureVertices.length > 3){
				let pointsArr = [];
				for (let j = 0; j < fixtureVertices.length; j++) {
					pointsArr.push(fixtureVertices[j].x);
					pointsArr.push(fixtureVertices[j].y);
				}

				const earcutIndexes = PIXI.utils.earcut(pointsArr, [], 2);

				const earcutPoints = [];
				for (let j = 0; j < earcutIndexes.length; j++) {
					earcutPoints.push(fixtureVertices[earcutIndexes[j]]);
				}

				let earcutTriangles = [];
				while (earcutPoints.length) {
					earcutTriangles.push(earcutPoints.splice(0, 3));
				}

				bodiesToCreate = earcutTriangles;
			}else if (fixtureVertices.length === 3) {
				bodiesToCreate = subDivideTriangle(fixtureVertices);
			}else if (baseShape.GetType() === Box2D.b2Shape.e_circle) {
				destroyCircle = true;
				// we are dealing with a mofo circle
				bodiesToCreate = [];

				const pixelsBetweenVertices = 10 / Settings.PTM;
				const circumference = shape.get_m_radius() * 2 * Math.PI;
				const verticesToPlace = Math.min(12, Math.max(4, circumference / pixelsBetweenVertices));

				const startPos = shape.get_m_p();
				const circleVertices = [];
				const angleSlice = Settings.pidouble / verticesToPlace;
				for(let i = 0; i<verticesToPlace; i++){
					const a = i * angleSlice;
					const x = startPos.x + shape.get_m_radius() * Math.cos(a);
					const y = startPos.y + shape.get_m_radius() * Math.sin(a);
					circleVertices.push({x, y})
				}
				const qR = shape.get_m_radius()/4;
				const hR = shape.get_m_radius()/2;
				const centerPoint = {x:startPos.x + Math.random()*hR - qR, y:startPos.y + Math.random()*hR - qR};
				let count = 0;
				let lastVertice = null;
				while(count < circleVertices.length){

					const itemsLeft = circleVertices.length-count;

					let ran = Math.max(2, Math.floor(Math.random()*(itemsLeft / 2)));
					if(itemsLeft<=3) ran = Math.min(3, itemsLeft);

					const arr = [];

					if(lastVertice){
						arr.push({x:lastVertice.x, y:lastVertice.y});
					}

					for(let i = 0; i<ran; i++){
						arr.push({x:circleVertices[count+i].x, y:circleVertices[count+i].y})
						lastVertice = circleVertices[count+i];
					}

					if(count + ran === circleVertices.length){
						arr.push({x:circleVertices[0].x, y:circleVertices[0].y})
					}

					arr.push({x:centerPoint.x, y:centerPoint.y});
					bodiesToCreate.push([arr]);

					count += ran;
				}
				bodiesToCreate = bodiesToCreate;
			}
		}

		bodiesToCreate.forEach(newBodyVertices => {
			let area = 0;

			if(Array.isArray(newBodyVertices[0])){
				area = calculateBodyArea(newBodyVertices[0]);
			}else{
				area = calculateBodyArea(newBodyVertices);
			}

			if(Math.abs(area) >  1){
				const bodyObject = new game.editor.bodyObject;
				Object.assign(bodyObject, body.mySprite.data);

				bodyObject.fixed = false;
				bodyObject.breakable = true;

				bodyObject.vertices = [];

				bodyObject.x = body.GetPosition().x;
				bodyObject.y = body.GetPosition().y;
				bodyObject.rotation = body.GetAngle();

				// we need this verticeRef because a single vertice array can generate multiple fixtures
				const targetIndex = oldFixture.verticeRef;

				if(!destroyCircle){
					bodyObject.radius = [body.mySprite.data.radius[targetIndex]];
				}else{
					bodyObject.radius = [0];
				}
				bodyObject.colorFill = [body.mySprite.data.colorFill[targetIndex]];
				bodyObject.colorLine = [body.mySprite.data.colorLine[targetIndex]];
				bodyObject.lineWidth = [body.mySprite.data.lineWidth[targetIndex]];

				bodyObject.vertices.push(newBodyVertices);

				const newBody = game.editor.buildBodyFromObj(bodyObject);
				newBody.SetLinearVelocity(body.GetLinearVelocity());
				newBody.SetAngularVelocity(body.GetAngularVelocity());

				newBodies.push(newBody);
			}
		});
	})


	// reattach joints
	for (let jointEdge = body.GetJointList(); getPointer(jointEdge) !== getPointer(NULL); jointEdge = jointEdge.get_next()) {
		const joint = game.editor.CastJoint(jointEdge.joint);

		const otherBody = joint.GetBodyA() === body ? joint.GetBodyB() : joint.GetBodyA();

		if (joint.GetType() == Box2D.e_revoluteJoint) {
			const revoluteJointDef = new Box2D.b2RevoluteJointDef();

			const anchor = joint.GetAnchorA();

			const targetBody = findBestJointFixture(newBodies, anchor);

			revoluteJointDef.Initialize(targetBody, otherBody, anchor);

			revoluteJointDef.set_collideConnected(joint.GetCollideConnected());
			revoluteJointDef.set_referenceAngle(joint.GetReferenceAngle());
			revoluteJointDef.set_lowerAngle(joint.GetUpperLimit());
			revoluteJointDef.set_upperAngle(joint.GetLowerLimit());
			revoluteJointDef.set_maxMotorTorque(joint.GetMaxMotorTorque());
			revoluteJointDef.set_motorSpeed(joint.GetMotorSpeed());
			revoluteJointDef.set_enableLimit(joint.IsLimitEnabled());
			revoluteJointDef.set_enableMotor(joint.IsMotorEnabled());

			game.editor.CreateJoint(revoluteJointDef);
			destroy(revoluteJointDef);
		} else if (joint.GetType() == Box2D.e_prismaticJoint) {

			let prismaticJointDef = new Box2D.b2PrismaticJointDef();

			const axis = joint.GetLocalAxisA();
			const anchor = new joint.GetAnchorA();

			const targetBody = findBestJointFixture(newBodies, anchor);

			prismaticJointDef.Initialize(targetBody, otherBody, anchor, axis);
			prismaticJointDef.set_collideConnected(joint.GetCollideConnected());
			prismaticJointDef.set_referenceAngle(joint.GetReferenceAngle());
			prismaticJointDef.set_lowerTranslation(joint.GetLowerLimit());
			prismaticJointDef.set_upperTranslation(joint.GetUpperLimit());
			prismaticJointDef.set_maxMotorForce(joint.GetMaxMotorForce());
			prismaticJointDef.set_motorSpeed(joint.GetMotorSpeed());
			prismaticJointDef.set_enableLimit(joint.IsLimitEnabled());
			prismaticJointDef.set_enableMotor(joint.IsMotorEnabled());

			game.editor.CreateJoint(prismaticJointDef);
			destroy(prismaticJointDef);
		} else if (joint.GetType() == Box2D.e_distanceJoint) {
			let distanceJointDef = new Box2D.b2DistanceJointDef();

			const anchor = joint.GetAnchorA();
			const targetBody = findBestJointFixture(newBodies, anchor);

			distanceJointDef.Initialize(targetBody, otherBody, anchor, anchor);

			distanceJointDef.set_collideConnected(joint.GetCollideConnected());

			distanceJointDef.set_length(joint.GetLength());
			distanceJointDef.set_minLength(joint.GetMinLength());
			distanceJointDef.set_maxLength(joint.GetMaxLength());

			distanceJointDef.set_stiffness(joint.GetStiffness());
			distanceJointDef.set_damping(joint.GetDamping());

			game.editor.CreateJoint(distanceJointDef);
		} else if (joint.GetType() == Box2D.e_wheelJoint) {

			let wheelJointDef = new Box2D.b2WheelJointDef();
			const axis = joint.GetLocalAxisA();
			const anchor = joint.GetAnchorA();
			const targetBody = findBestJointFixture(newBodies, anchor);

			wheelJointDef.Initialize(targetBody, otherBody, anchor, axis);
			wheelJointDef.set_stiffness(joint.GetStiffness());
			wheelJointDef.set_damping(joint.GetDamping());
			wheelJointDef.set_maxMotorTorque(joint.GetMaxMotorTorque());
			wheelJointDef.set_motorSpeed(joint.GetMotorSpeed());
			wheelJointDef.set_enableMotor(joint.IsMotorEnabled());

			game.editor.CreateJoint(wheelJointDef);

			destroy(wheelJointDef);
		}
	}

	// final step
	newBodies.reverse();
	newBodies.forEach(newBody => {
		// place in correct spot
		newBody.mySprite.parent.addChildAt(newBody.mySprite, body.mySprite.parent.getChildIndex(body.mySprite));
	})

	game.editor.deleteObjects([body]);

}

const findBestJointFixture = (newBodies, anchor) => {
	let minDistance = Number.POSITIVE_INFINITY;
	let targetBody = null;

	for (let i = 0; i < newBodies.length; i++) {
		const newBody = newBodies[i];
		const fixture = newBody.GetFixtureList();

		if (fixture.TestPoint(anchor)) {
			return newBody;
		}

		const dis = b2CloneVec2(newBody.GetPosition());
		b2SubVec2(dis, anchor);

		const disLength = dis.Length();
		if (disLength < minDistance) {
			minDistance = disLength;
			targetBody = newBody;
		}
	};

	return targetBody;
}

const vectorDistance = (a, b) => {
	const xd = a.x - b.x;
	const yd = a.y - b.y;
	return Math.sqrt(xd * xd + yd * yd);
}

const centerVec = (a, b) => {
	const ranCenter = Math.random() * 0.5 + 0.25;
	const x = a.x + (b.x - a.x) * ranCenter;
	const y = a.y + (b.y - a.y) * ranCenter;
	return {
		x,
		y
	};
}

const sortByLargest = vertices => {
	const l1 = vectorDistance(vertices[0], vertices[1]);
	const l2 = vectorDistance(vertices[1], vertices[2]);
	const l3 = vectorDistance(vertices[2], vertices[0]);

	if (l1 > l2 && l1 > l3) {
		return vertices;
	} else if (l2 > l3) {
		return [vertices[1], vertices[2], vertices[0]];
	}
	return [vertices[2], vertices[0], vertices[1]];
}

const subDivideTriangle = vertices => {
	const ran = Math.floor(Math.random() * 3);

	switch (ran) {
		case 0:
		case 1:
		case 2:
			vertices = sortByLargest(vertices);
			const cv = centerVec(vertices[0], vertices[1]);

			const triangle1 = [vertices[0], cv, vertices[2]];
			const triangle2 = [vertices[1], cv, vertices[2]];

			return [triangle1, triangle2];
	}
}

export const update = () => {
	bodiesToBreak.forEach(body => breakBody(body));
	bodiesToBreak.length = [];
}

export const reset = () => {
	bodiesToBreak.length = 0;
}
