import { B2dEditor } from "../B2dEditor";
import * as scrollBars from "./scrollBars";

export const hide = function(){
    B2dEditor.toolGUI.style.display = "none";
    scrollBars.hide();
}
export const show = function(){
    B2dEditor.toolGUI.style.display = "block";
    scrollBars.show();
}
