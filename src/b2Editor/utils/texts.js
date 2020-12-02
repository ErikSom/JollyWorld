// use https://htmlg.com/html-editor/

export const HELP = {
	select: `<p>With the selection tool you can select objects by clicking them or dragging a box around multiple objects.<br />Click next to the selection box or press escape to deselect an object.<br />Hold SHIFT and click objects to add them to the selection and hold CTRL to remove objects from the selection.</p>
	<p><strong>Tips:</strong></p>
	<ul>
	<li>You can switch most object between being a <em><strong>Graphic</strong></em> or <em><strong>Body</strong></em>. Graphics are static objects that don't move by themselves. Body objects take place in the physics world and will collide with other bodies, you can recognise them by the moving green outline. You can group Graphics together with bodies so that the graphic will follow the body.</li>
	<li>Double clicking any Graphic or Object will allow you to edit the vertices of this object.</li>
	<li>Tick <em><strong>lockselection</strong></em> in the object properties to lock an object from being selected. After an object is locked it can only be selected by holding the ALT key.</li>
	</ul>
	<p><strong>Controls:</strong></p>
	<p><em><strong>ARROWS &amp; Mouse Drag</strong></em> - Moves the object(s)<br /><em><strong>WASD</strong></em> - Grow or shrink the object(s)<br /><strong><em>Z &amp; X</em> </strong>- Rotate objects (hold ALT for rotating multiple objects around center)<br /><em><strong>DELETE &amp; BACKSPACE</strong></em> - Destroy object(s)<br /><em><strong>CTRL + G</strong></em> - Group / Ungroup objects<br /><em><strong>CTRL + J</strong></em> - Place Joint (With 2 objects selected it will connect those 2 objects with the joint, one object selected will be pinned to the background)<br /><em><strong>CTRL + UP/DOWN</strong></em> - Move object a layer up or down<br /><em><strong>SHIFT</strong></em> - Holding shift will speed up rotating, scaling and moving with the keyboard</p>`,
	geometry: 'text geometry',
	polydrawing: 'text polydrawing' ,
	joints: 'text joints',
	prefabs: 'text prefabs',
	text: 'text text',
	art: 'text art',
	trigger: 'text trigger',
	settings: 'text settings',
	camera: 'text camera',
	verticeediting: 'text vertic eediting'
}
