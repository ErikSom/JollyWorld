import { BufferSchema } from '@geckos.io/typed-array-buffer-schema';
import {
	Network
} from '../../libs/netlib';
import { Settings } from '../Settings';
import { globalEvents } from '../utils/EventDispatcher';
import { characterModel } from './schemas';

export const SERVER_EVENTS = {
	PLAYER_JOINED: 'playerJoined',
	PLAYER_LEFT: 'playerLeft',
	JOINED_LOBBY: 'lobbyJoined',
	LEFT_LOBBY: 'lobbyLeft',
}

const MESSAGE_TYPE = {
	RELIABLE: 'reliable',
	UNRELIABLE: 'unreliable',
}

const searchParams = new URLSearchParams(window.location.search);
const urlLobbyIDParam = searchParams.get('lobbyID');

console.log("URL PARAMS:", urlLobbyIDParam)

class MultiplayerServer {
	constructor() {
		this.characterDataToProcess = [];

		this.n = new Network('c06320df-92e9-4754-b751-0dce2e9402ec', Settings.MULTIPLAYER_SERVER);
		this.id = '';

		this.inLobby = false;

		this.initWebRTC();
	}


	initWebRTC(){
		this.n.on('ready', () => {
			console.log('network ready', this.n.id);


			if(urlLobbyIDParam){
				this.n.join(urlLobbyIDParam);
			}else{
				this.n.create();
			}

			this.n.on('message', (peer, channel, data) => {
				if(data instanceof ArrayBuffer){
					const id = BufferSchema.getIdFromBuffer(data);

					if(id === characterModel.schema.id){
						this.receiveCharacterData(peer.id, data);
					}
				}
				if (channel === MESSAGE_TYPE.RELIABLE) {
					console.log(`${peer.id} said "${data}" via ${channel}`);
				}
			})
		})

		this.n.on('lobby', code => {
			console.log(`lobby code ready: ${code} (and you are ${this.n.id})`);
			if(!urlLobbyIDParam) alert(`${window.location.origin}${window.location.pathname}?lobbyID=${code} https://dev--jollyworld.netlify.app?lobbyID=${code}`);
			this.inLobby = true;
			globalEvents.dispatchEvent({type:SERVER_EVENTS.JOINED_LOBBY, code});
		})

		this.n.on('signalingerror', this.webRTCError);
		this.n.on('rtcerror', this.webRTCError);

		this.n.on('peerconnecting', peer => {
			console.log(`peer connecting ${peer.id}`);
		});

		this.n.on('peerdisconnected', peer => {
			console.log(`peer disconnected ${peer.id} (${this.n.size} peers now)`);
			globalEvents.dispatchEvent({type:SERVER_EVENTS.PLAYER_LEFT, id: peer.id});
		});

		this.n.on('peerconnected', peer => {
			console.log(`peer connected: ${peer.id} (${this.n.size} peers now)`);
			globalEvents.dispatchEvent({type:SERVER_EVENTS.PLAYER_JOINED, id: peer.id});
			this.introduceMyself(peer.id);

		});
	}

	introduceMyself(id){
		this.n.send(MESSAGE_TYPE.RELIABLE, id, {
			name: 'Erik'
		})
	}

	webRTCError(error){
		globalEvents.dispatchEvent({type:SERVER_EVENTS.LEFT_LOBBY, error});
	}

	getID() {
		return this.n.id
	}

	sendCharacterData(buffer) {
		this.n.broadcast(MESSAGE_TYPE.UNRELIABLE, buffer);
	}
	receiveCharacterData(peer, buffer) {
		this.characterDataToProcess.push({
			playerID: peer,
			buffer
		});
	}

	getCharacterDataToProcess() {
		const returnData = [...this.characterDataToProcess];
		this.characterDataToProcess.length = 0;
		return returnData;
	}
}

const server = new MultiplayerServer();
export default server;
