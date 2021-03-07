import {
    game
} from "../../Game";

const elements = [];
let hidden = false;

export const reset = ()=>{
	elements.length = 0;
}

export const add = el =>{
	if(!game.editor.editing) return;
	elements.push(el);
}

export const bringToFront = ()=>{
	if(!game.editor.editing) return;
	for(let i = 0; i<elements.length; i++){

		const el = elements[i];

		if(el.destroyed){
			elements.splice(i, 1);
			i--;
		}else{
			el.parent.addChild(el);
		}

	}
}

export const toggleHide = ()=>{
	if(hidden) show();
	else hide();
}

export const hide = ()=> {
	for(let i = 0; i<elements.length; i++){
		const el = elements[i];
		if(!el.destroyed){
			el.alpha = .5;
			if(game.editor.shiftDown) el.alpha = 0;
			el.data.lockselection = true;
		}
	}
	hidden = true;
}

export const show = ()=> {
	for(let i = 0; i<elements.length; i++){
		const el = elements[i];
		if(!el.destroyed){
			el.alpha = 1;
			el.data.lockselection = false;
		}
	}
	hidden = false
}
