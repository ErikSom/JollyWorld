import { formatDMY } from '../b2Editor/utils/formatString';
import '../css/Lobby.scss'
import { game } from '../Game';
import { multiplayerState } from '../multiplayer/multiplayerManager';
import { Settings } from '../Settings';
import { localize } from '../utils/Localization';

let lobby = null

export const generateLobby = () => {
	if(!lobby){
		const htmlStructure = /*html*/`
			<div class="title">
				Lobby
			</div>

			<div class="level-info">
				<div class="thumb select">
					<div class="selectBut">${localize('mainmenu_selectlevel')}</div>
				</div>
				<div class="text-holder select">
					<div class="text-level-name">Level Name Goes Here</div>
					<div class="level-author">
						<div class="text-level-by">${localize('mainmenu_by')}:</div>
						<div class="text-author">Author Name</div>
					</div>
					<div class="tags">
					</div>
					<div class="description-holder">
						<div class="description">Level description goes hereLevel
						description goes hereLevel description
						goes hereLevel description goes here
						Level description goes here</div>
					</div>
					<div class="level-published">
						<div class="text-published">Publ.</div>
						<div class="text-date-published">10 Mar 2020</div>
						<div class="text-updated">Upd.</div>
						<div class="text-date-updated">10 Mar 2020</div>
					</div>
				</div>
			</div>


			<div class="player-list">
				<div class="players-title">${localize('mainmenu_players')}</div>
				<div class="entries">
					<div class="entry entry-template">
						<div class="position">
							<div class="profile"></div>
							<div class="text-position">1st</div>
						</div>
						<div class="text-player-name">Smerik</div>
						<div class="player-status waiting">${localize('mainmenu_admin')}</div>
						<div class="kick-but">${localize('mainmenu_kick')}</div>
					</div>
				</div>
			</div>

			<div class="nav-buttons">
				<div class="leave-but">${localize('mainmenu_leave')}</div>
				<div class="ready-but">${localize('mainmenu_ready')}</div>
				<div class="start-but">${localize('mainmenu_ready')}: 4/8</div>
			</div>
		`;

		lobby = document.createElement('div');
		lobby.classList.add('lobby');
		lobby.innerHTML = htmlStructure;

		const levelSelectButton = lobby.querySelector('.selectBut');
		levelSelectButton.onclick = ()=>{
			game.openSinglePlayer();
			game.gameState = game.GAMESTATE_MULTIPLAYER_LEVELSELECT;
		}
	}

	updateLobbyUI();

	return lobby;
}

export const updateLobbyUI = () => {
	const levelData = multiplayerState.selectedLevel;

	const thumb = lobby.querySelector('.thumb');
	const textHolder = lobby.querySelector('.text-holder');
	const levelSelectButton = lobby.querySelector('.selectBut');

	if(levelData){
		thumb.classList.remove('select');
		textHolder.classList.remove('select');

		const thumbSrc = `${Settings.STATIC}/${levelData.thumb_big_md5}.png`;
		thumb.style.backgroundImage = `url(${thumbSrc})`;

		const title = lobby.querySelector('.text-level-name');
		title.innerText = levelData.title;
		const author = lobby.querySelector('.text-author');
		author.innerText = levelData.author.username;

		const description = lobby.querySelector('.description');
		description.innerText = levelData.description;


		const publishedDateDiv = lobby.querySelector('.level-published');

		const publishedDate = publishedDateDiv.querySelector('.text-date-published');
		publishedDate.innerText = formatDMY(levelData.created_at);

		if(formatDMY(levelData.updated_at) === publishedDate.innerText){
			publishedDateDiv.classList.add('no-update');
		}else{
			publishedDateDiv.classList.remove('no-update');
			const updatedDate = publishedDateDiv.querySelector('.text-date-updated');
			updatedDate.innerText = formatDMY(levelData.updated_at);
		}
		levelSelectButton.innerText = localize('mainmenu_changelevel');
	}else{
		thumb.classList.add('select');
		textHolder.classList.add('select');
		thumb.style.backgroundImage = 'unset';
		levelSelectButton.innerText = localize('mainmenu_selectlevel');
	}
}
