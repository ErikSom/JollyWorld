// use https://htmlg.com/html-editor/

export const HELP = {
	select: `<p>With the selection tool you can select objects by clicking them or dragging a box around multiple objects.<br />Click next to the selection box or press escape to deselect an object.<br />Hold SHIFT and click objects to add them to the selection and hold CTRL to remove objects from the selection.<br /><strong></strong></p>
	<p><strong>Tips:</strong></p>
	<ul>
	<li>You can switch most object between being a <em><strong>Graphic</strong></em> or <em><strong>Physics Object</strong></em>. Graphics are static objects that don't move by themselves. Physics objects take place in the physics world and will collide with other physics objects, you can recognise them by the moving green outline. You can group Graphics together with a Physics Object so that the Graphic will follow the Physics Object.</li>
	<li>Double clicking any Graphic or Physics Object will allow you to edit the vertices of this object.</li>
	<li>Tick <em><strong>lockselection</strong></em> in the object properties to lock an object from being selected. After an object is locked it can only be selected by holding the ALT key.</li>
	</ul>
	<p><strong>Physics Objects:</strong></p>
	<ul>
	<li><strong><em>groups</em>:</strong><br />You can give multiple objects the same group name. This will internally link these objects for future features of Jolly World.</li>
	<li><strong><em>refName</em>:</strong><br />This is a unique name to identify an object</li>
	<li><strong><em>density</em>:<br /></strong>Density is used to change how heavy an object is for its size. A balloon is bigger than a brick, but has a way lower density so its much lighter. The higher the density the heavier the object. When you encounter issues with joints, you can try tweaking the density to make the simulation more stable.</li>
	<li><strong><em>fixed</em>:<br /></strong>Fixed objects will not move, they are used to layout your level. If you want an object to fall make sure to not have this toggled on!</li>
	<li><strong><em>awake</em>:<br /></strong>Fixed objects are always asleep. Objects that move can be set to sleep by toggling away to off. If a Physics Object sleeps it will only start moving once its touched by another Physics Object, this way it can float in the air.</li>
	<li><strong><em>collision<br /></em></strong><strong>Everything</strong>
	<div><span></span><span>The object will collide with everything</span></div>
	<strong>Everything but characters</strong><em><strong><br /></strong></em>Will collide with everything but characters<br /><strong>Nothing<br /></strong>The object will collide with nothing. Useful for adding counter balance to vehicles.<br /><strong>Everything but similar</strong><em><strong><br /></strong></em>The object will collide with all objects, except for objects that also have this value<br /><strong>Only similar</strong><em><strong><br /></strong></em>The object will only collide with objects that also have this value<br /><strong>Only fixed objects</strong><em><strong><br /></strong></em>The object will only collide with objects that are don't move and are set to fixed<br /><strong>Only characters</strong><em><strong><br /></strong></em>The object will only collide with characters</li>
	</ul>
	<p><strong>Controls:</strong></p>
	<p><em><strong>ARROWS &amp; Mouse Drag</strong></em> - Moves the object(s)<br /><em><strong>WASD</strong></em> - Grow or shrink the object(s)<br /><strong><em>Z &amp; X</em> </strong>- Rotate objects (hold ALT for rotating multiple objects around center)<br /><em><strong>DELETE &amp; BACKSPACE</strong></em> - Destroy object(s)<br /><em><strong>T</strong></em> - Start / Stop testing level<br /><em><strong>CTRL + Z</strong></em> - Undo last action<strong></strong><em><strong><br />CTRL + G</strong></em> - Group / Ungroup objects<br /><em><strong>CTRL + J</strong></em> - Place Joint (With 2 objects selected it will connect those 2 objects with the joint, one object selected will be pinned to the background)<br /><em><strong>CTRL + UP/DOWN</strong></em> - Move object a layer up or down<br /><em><strong>SHIFT</strong></em> - Holding shift will speed up rotating, scaling and moving with the keyboard</p>
	​​`,
	geometry: `<p>The geometry tool is used to draw primitive objects. You can draw Squares, Triangles or Circles. Hold the mouse and drag to draw.<br /><em><strong>isPhysicsObject</strong></em> is used switch between drawing <em><strong>Graphics</strong></em> or <em><strong>Bodies</strong></em>. Graphics are not affected by gravity and will not collide in the physics world, but bodies will.</p>
	<p><strong>Tips:</strong></p>
	<ul>
	<li>You can combine multiple Primitives by selecting them and clicking Group Objects.</li>
	<li>If you wish to group objects but want one single outline (like drawing a house using a square and a triangle), you can overlap these shapes a little bit and use the <em><strong>Merge Graphics&nbsp;</strong></em>option. It will only merge objects if the new shape does not introduce holes.</li>
	<li>Double clicking any Graphic or Physics Object using the select tool to edit the vertices.</li>
	</ul>`,
	polydrawing: `<p>The polydrawing tool is used to draw more complex shapes. Click to place a vertice on the screen, then click again somewhere else to connect the vertices. Draw a full shape and then close the shape by clicking the first vertice you placed.</p>
	<p><strong>Tips:</strong></p>
	<ul>
	<li>Double clicking any Graphic or Physics Object using the select tool to edit the vertices.</li>
	</ul>
	<p><strong>Controls:</strong></p>
	<p><b><i>BACKSPACE &amp; DELETE -</i> </b>Delete the last created vertice<i><br /></i><em><strong>CTRL + Z</strong></em> - Undo last action</p>` ,
	joints: `<p>The joint tool is used to join 2 physics bodies together or pin a single object to the world background. <span>Joints can also be used to bring bodies to life if you enable the motor. There are different types of joints and each one serves a different purpose.<br /></span></p>
	<p><strong>Joint Types:</strong></p>
	<ul>
	<li><em><strong>Pin:<br /></strong></em>The Pin will hold bodies in place like the object is hanging from it.<br /><strong>maxMotorTorque:</strong> If you enable the motor the maxMotorTorque is used to control how powerful the motor is. The more power the heavier the objects the motor can push / rotate.<em><br /></em><strong>motorSpeed:</strong><em> You can set the speed and direction of the motor using motorSpeed slider, positive numbers will turn the object clockwise, negative numbers will set the rotation counterclockwise.</em> <br /><strong>enableLimits:</strong><em> If you want to enable a limit for the rotation you can set an upper or lower limit and the object will stop it&rsquo;s motion once it reaches those values. This is very useful when you want to create swinging axes or pendulums.</em></li>
	<li><strong><em>Slide:</em><br /></strong> This works similar to the Pin, the difference is that instead of setting a rotating motion it enables horizontal or vertical movements. The settings are also the same as with the Pin the main difference is in the <strong>enableLimits</strong> option which sets horizontal or vertical limits, the direction will depend on the rotation of the object. You can adjust the rotation of the object by clicking it with the pointer/cursor/selection tool.</li>
	<li><strong><em>Distance:</em><br /></strong> A point on each body will be kept at a fixed distance apart with a springy mechanism. This is useful for building things like levers, but can also be used to build trees that can actually bend. If you want to keep an object at a certain angle (like a tree) you can use 2 distance joints next to each other to limit the rotation.<br /><strong>frequencyHz:</strong> is used to set how stiff / springy the object should be. A higher value means a stiffer joint.<br /><strong>damping:</strong> this is used to naturally slow down the movement of the joint</li>
	<li><strong><em>Rope:</em><br /></strong>This pin simulates the effect of a rope, useful for creating hanging bridges or lamps.</li>
	<li><strong><em>Wheel:</em><br /></strong> A joint useful for modelling vehicle suspension. It combines features from both the <em><strong>Pin</strong></em> joint and the <em><strong>Distance</strong></em> joint.<time datetime="2020-10-07T10:49:15.596Z" class="edited-3sfAzf" role="note" aria-label="Wednesday, 7 October 2020 12:49"><br /></time></li>
	</ul>
	<p><strong>Tips:</strong></p>
	<ul>
	<li>If you want to rotate an object, make sure the body is not set to <strong>Fixed </strong>in the body properties</li>
	<li>To better visualize the angle limits when you turn on <strong>enableLimits</strong>, you can rotate the joint by using <strong>Z &amp; X, </strong>and align the center of limits (gray line) with the direction your object is facing</li>
	</ul>
	<div class="container-1ov-mD"></div>
	<p><span>&nbsp;</span></p>
	​`,
	prefabs: `<p>These are premade standardized assets &amp; player upgrades that you can use to build your level.</p>
	<p><strong>Prefabs:</strong></p>
	<ul>
	<li><strong><em>Weapons:</em><br /></strong><span> Lot of tools here to inflict damage!</span></li>
	<li><strong><em>Movements:</em><br /></strong><span>Jumping pads, water blocks and player upgrades!</span></li>
	<li><strong><em>Level:</em><br /></strong><span>Here you will find the Finish Line, if a player reaches this pad they win! You can also place checkpoints in your level, if a player dies he starts at the latest checkpoint he touched.</span><span></span></li>
	<li><span><strong><em>Decorations:</em><br /></strong>Decorative items and assets to make your levels look pretty! </span><span></span></li>
	</ul>
	<p><span><strong>Blueprints:</strong><br /></span><span>Blueprints are like prefabs, but they are not joined as a single group. Blueprints are intended to teach you how to build certain kind of mechanics in the game. If you wish to share fun blueprints with us, drop them in the discord!</span></p>
	​`,
	text: `<p><span>Place text anywhere in the level! You can change the font type, the color, the size, the transparency and the text alignment. Keep in mind that text boxes are not physical objects they behave more like graphics, however you can combine them with bodies.</span></p>
	<p><strong>Tips:</strong></p>
	<ul>
	<li>To edit a text object, use the select tool and click the text. You can change the text by pressing the <em><strong>edit text</strong></em> button</li>
	</ul>`,
	art: `<p>The art tool is similar to the free drawing tool, the main difference is that you can only draw graphics with this (not physics object) but once the object has been drawn, you can select it with the cursor and adjust all it&rsquo;s settings including converting it to a physics object!<br />Toggle <em><strong>smoothen</strong></em> to switch between smooth or rough edges.</p>
	<p><strong>Controls:</strong></p>
	<p><em><strong>Mouse Drag:&nbsp;</strong></em>Click and hold the mouse to start drawing your shape. Once you release the mouse the shape will be closed.</p>
	<p><strong>Tips:</strong></p>
	<ul>
	<li>Double clicking any Graphic or Physics Object using the select tool to edit the vertices.</li>
	</ul>`,
	trigger: 'placeholder trigger',
	settings: 'placeholder settings',
	camera: 'placeholder camera',
	"vertice editing": 'placeholder vertic editing'
}
