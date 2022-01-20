import '../css/Lobby.scss'
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
					<div class="selectBut">Select Level</div>
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
		`

		lobby = document.createElement('div');
		lobby.classList.add('lobby');
		lobby.innerHTML = htmlStructure;
	}
	return lobby;
}
