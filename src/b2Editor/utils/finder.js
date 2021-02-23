import {
	game
} from "../../Game";

export const findObjectWithCopyHash = copyHash => {
	const foundSprite = game.editor.textures.children.find(element=> (element.copyHash === copyHash
		|| (element.myBody && element.myBody.copyHash === copyHash)));
	return foundSprite
}
