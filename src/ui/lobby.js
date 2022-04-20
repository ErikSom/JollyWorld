import { formatDMY } from '../b2Editor/utils/formatString';
import '../css/Lobby.scss'
import { game } from '../Game';
import { adminStartLoadLevel, kickPlayer, leaveMultiplayer, LOBBY_STATE, multiplayerState, setLobbyStateReady } from '../multiplayer/multiplayerManager';
import { multiplayerAtlas } from '../multiplayer/rippleCharacter';
import { SIMPLE_MESSAGE_TYPES } from '../multiplayer/schemas';
import { Settings } from '../Settings';
import { backendManager } from '../utils/BackendManager';
import { localize } from '../utils/Localization';

let lobby = null;

export const generateLobby = () => {
	if(!lobby){
		const htmlStructure = /*html*/`
			<div class="title">
				Lobby
			</div>

			<div class="level-info">
				<div class="thumb select admin">
					<div class="selectBut">${localize('mainmenu_selectlevel')}</div>
					<div class="hostPicking">${localize('mainmenu_nolevel')}</div>
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

			<div class="copy-url">
				<div class="level-link-text">${localize('multiplayer_invitelink')}:</div>
				<input class="text-url" readonly>
				<div class="copy-button"></div>
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
						<div class="kick-but">${localize('mainmenu_kick')}</div>
						<div class="player-status connecting">${localize('mainmenu_admin')}</div>
					</div>
				</div>
			</div>

			<div class="nav-buttons">
				<div class="leave-but">${localize('mainmenu_leave')}</div>
				<div class="ready-but">${localize('mainmenu_ready')}</div>
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

		const input = lobby.querySelector('input');
		const copyButton = lobby.querySelector('.copy-button');
        copyButton.addEventListener('click', () => {
            const copyText = `(${localize('multiplayer_copied')}) `;
            if (input.value.startsWith(copyText)) {
                input.value = input.value.substr(copyText.length);
            }
            input.select();
            input.setSelectionRange(0, 99999);
            document.execCommand("copy");
            input.value = copyText + input.value;
        });

		const navButtons = lobby.querySelector('.nav-buttons');
		const leaveButton = navButtons.querySelector('.leave-but');
		leaveButton.onclick = () => {
			// disconnect everything
			leaveMultiplayer();
			game.openMainMenu();
		}
	}

	updateLobbyUI();

	return lobby;
}

export const updateLobbyUI = () => {
	// LEVEL DATA
	const levelData = multiplayerState.selectedLevelData;

	const thumb = lobby.querySelector('.thumb');
	const textHolder = lobby.querySelector('.text-holder');
	const levelSelectButton = lobby.querySelector('.selectBut');
	const entries = lobby.querySelector('.entries');
	const link = lobby.querySelector('input');

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

	if(multiplayerState.admin){
		thumb.classList.add('admin');
	}else{
		thumb.classList.remove('admin');
	}

	if(multiplayerState.lobby){
		link.value = `${window.location.origin}${window.location.pathname}?lobbyID=${multiplayerState.lobby}`;
		// link.value = `https://friendly-snake-42.loca.lt?lobbyID=${multiplayerState.lobby}`;
	}

	// PLAYERS

	const template = entries.querySelector('.entry-template');
	template.style.display = 'none';

	const myPlayer = {
		admin: multiplayerState.admin,
		playerState: {
			name: backendManager.userData?.username || multiplayerState.fakeUsername,
			lobbyState: multiplayerState.lobbyState,
		},
		skinBlob: multiplayerState.skinBlob
	}

	while(entries.children.length>1){
		entries.removeChild(entries.children[1]);
	}

	const otherPlayers = Object.values(multiplayerState.players);
	const players = [myPlayer, ...otherPlayers];

	let playersReady = 1;

	players.forEach(({ id, admin, playerState, skinBlob }, index) => {
		const entry = template.cloneNode(true);
		entry.style.display = 'flex';
		entry.classList.remove('entry-template');

		const profile = entry.querySelector('.profile');

		if(skinBlob){
			const resolution = 2;
			profile.style.backgroundImage = `url(${URL.createObjectURL(skinBlob)})`;
			profile.style.backgroundSize = `${256 / resolution}px`;
			const frame = multiplayerAtlas.frames.profile.frame;
			profile.style.backgroundPosition = `${frame.x / resolution}px ${frame.y / resolution}px`;
		}else{
			profile.style.backgroundImage = '';
		}

		const username = entry.querySelector('.text-player-name')
		username.innerText = playerState.name;

		if(index === 0){
			entry.classList.add('me');
		}

		const status = entry.querySelector('.player-status');

		status.classList.remove('connecting');

		if(admin){
			status.innerText = localize('mainmenu_admin');
			status.classList.add('waiting');
		}else if(playerState.lobbyState === LOBBY_STATE.CONNECTING){
			status.innerText = localize('mainmenu_connecting');
			status.classList.add('connecting');
		} else if(playerState.lobbyState === LOBBY_STATE.WAITING){
			status.innerText = localize('mainmenu_waiting');
			status.classList.add('waiting');
		} else if(playerState.lobbyState === LOBBY_STATE.READY){
			status.innerText = localize('mainmenu_ready');
			status.classList.add('ready');
		}

		const kickButton = entry.querySelector('.kick-but');
		if(!multiplayerState.admin || index === 0){
			kickButton.style.opacity = '0';
		} else {
			kickButton.onclick = () => {
				kickPlayer(id, SIMPLE_MESSAGE_TYPES.KICKED_BY_ADMIN);
			}
		}

		if(playerState.lobbyState === LOBBY_STATE.READY){
			playersReady++;
		}

		entries.appendChild(entry);
	});

	// BUTTONS
	const navButtons = lobby.querySelector('.nav-buttons');

	const readyButton = navButtons.querySelector('.ready-but');

	readyButton.classList.remove('ready');

	readyButton.onclick = ()=>{};

	if(multiplayerState.admin){
		if(players.length === 1){
			readyButton.innerText = localize('mainmenu_waiting');
		}else if(players.length === playersReady){
			readyButton.innerText = localize('mainmenu_start');
			readyButton.classList.add('ready');

			readyButton.onclick = () => {
				adminStartLoadLevel();
			}

		}else {
			readyButton.innerText = `${localize('mainmenu_ready')} ${playersReady}/${players.length}`;
		}
	}else{
		if(myPlayer.playerState.lobbyState === LOBBY_STATE.READY){
			readyButton.innerText = `${localize('mainmenu_waiting')} ${playersReady}/${players.length}`;
		}else{
			readyButton.classList.add('ready');
			readyButton.innerText = localize('mainmenu_ready');
		}

		readyButton.onclick = () => {
			setLobbyStateReady(!(myPlayer.playerState.lobbyState === LOBBY_STATE.READY))
		}
	}
}
