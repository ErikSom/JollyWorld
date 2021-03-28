const timer = document.createElement('div');
document.body.appendChild(timer);
const timerSeconds = document.createElement('span');
timerSeconds.classList.add('seconds');
const timerMilliseconds = document.createElement('span');
timerMilliseconds.classList.add('milliseconds');

timer.append(timerSeconds);
timer.append(timerMilliseconds);

timer.classList.add('game-timer');

import { dateDiff } from "../b2Editor/utils/formatString";
import {
    game
} from "../Game";

export const update = ()=>{
    if(game.levelWon || game.gameOver) return;
    const d = dateDiff(performance.now(), game.levelStartTime);
    const s = d.hh !== '00' ? `${d.hh}:${d.mm}:${d.ss}.` : `${d.mm}:${d.ss}.`;
    timerSeconds.innerText = s;
    timerMilliseconds.innerText = d.ms;
}

export const show = visible=> {
    timer.style.display = visible ? 'block' : 'none';
}
