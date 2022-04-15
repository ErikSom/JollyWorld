import { BufferSchema } from '@geckos.io/typed-array-buffer-schema';
import 
	{ Network }
 from '../../libs/netlib';
import { Settings } from '../Settings';
import { globalEvents } from '../utils/EventDispatcher';
import { introductionBuffer } from './messagePacker';
import { adminIntroductionModel, changeServerLevelModel, characterModel, chatMessageModel, endCountDownMessageModel, introductionModel, levelVotesMessageModel, levelWonModel, simpleMessageModel, startLoadLevelModel } from './schemas';


console.log('***NETWORK:', Network);

export const SERVER_EVENTS = {
	NETWORK_READY: 'networkReady',
	PLAYER_JOINED: 'playerJoined',
	PLAYER_LEFT: 'playerLeft',
	PLAYER_INTRODUCTION: 'playerIntroduction',
	JOINED_LOBBY: 'lobbyJoined',
	LEFT_LOBBY: 'lobbyLeft',
	SIMPLE_MESSAGE: 'simpleMessage',
	CHANGE_LEVEL: 'changeLevel',
	START_LOAD_LEVEL: 'startLoadLevel',
	RECEIVE_SKIN: 'receiveSkin',
	LEVEL_WON: 'levelWon',
	CHAT_MESSAGE: 'chatMessage',
	END_COUNTDOWN: 'endCountDown',
	LEVEL_VOTES: 'levelVotes',
}

const MESSAGE_TYPE = {
	RELIABLE: 'reliable',
	UNRELIABLE: 'unreliable',
}

class MultiplayerServer {
	constructor() {
		this.characterDataToProcess = [];

		this.n = null;

		this.id = '';

		this.admin = false;
		this.inLobby = false;
	}

	connect(){
		this.n = new Network('c06320df-92e9-4754-b751-0dce2e9402ec');
		this.initWebRTC();
	}

	disconnect(){
		this.n.close();
		this.n = null;
	}

	createLobby(){
		this.admin = true;
		this.n.create();
	}

	joinLobby(lobby){
		console.log("JOIN LOBBY:", lobby);
		this.n.join(lobby);
	}

	initWebRTC(){
		this.n.on('ready', () => {
			console.log('network ready', this.n);
			globalEvents.dispatchEvent({type:SERVER_EVENTS.NETWORK_READY});

			this.n.on('message', (peer, channel, data) => {
				// MAKE SURE BINARY TYPE IS ARRAY BUFFER
				if(data instanceof ArrayBuffer){
					const id = BufferSchema.getIdFromBuffer(data);

					switch(id){
						case characterModel.schema.id:
							this.receiveCharacterData(peer, data);
							break;
						case introductionModel.schema.id:
							this.receivePlayerIntroduction(peer.id, data);
							break;
						case adminIntroductionModel.schema.id:
							this.receivePlayerIntroduction(peer.id, data, true);
							break;
						case simpleMessageModel.schema.id:
							this.receiveSimpleMessage(peer.id, data);
							break;
						case changeServerLevelModel.schema.id:
							this.receiveChangeServerLevel(peer.id, data);
							break;
						case startLoadLevelModel.schema.id:
							this.receiveStartLoadLevel(peer.id, data);
							break;
						case levelWonModel.schema.id:
							this.receiveLevelWon(peer.id, data);
							break;
						case chatMessageModel.schema.id:
							this.receiveChatMessage(peer.id, data);
							break;
						case endCountDownMessageModel.schema.id:
							this.receiveEndCountDownMessage(peer.id, data);
							break;
						case levelVotesMessageModel.schema.id:
							this.receiveLevelVotesMessage(peer.id, data);
							break;
						default:
							if(id.indexOf('PNG') >= 0){
								this.receiveSkin(peer.id, data);
							}else{
								console.info("******** Can't map BufferSchema *******", id, characterModel.schema.id);
							}
							break;
					}
				}else{
					console.warn("Invalid data type")
				}
			});
		});

		this.n.on('lobby', code => {
			console.log(`lobby code ready: ${code} (and you are ${this.n.id})`);
			this.inLobby = true;
			globalEvents.dispatchEvent({type:SERVER_EVENTS.JOINED_LOBBY, code, admin: this.admin});
		})

		this.n.on('signalingerror', this.webRTCError);
		this.n.on('rtcerror', this.webRTCError);

		this.n.on('connecting', peer => {
			console.log(`peer connecting ${peer.id}`);
		});

		this.n.on('disconnected', peer => {
			console.log(`peer disconnected ${peer.id} (${this.n.size} peers now)`);
			globalEvents.dispatchEvent({type:SERVER_EVENTS.PLAYER_LEFT, id: peer.id});
		});

		this.n.on('connected', peer => {
			console.log(`peer connected: ${peer.id} (${this.n.size} peers now)`);
			console.log(peer, peer.latency);
			globalEvents.dispatchEvent({type:SERVER_EVENTS.PLAYER_JOINED, id: peer.id});
		});
	}


	webRTCError(error){
		globalEvents.dispatchEvent({type:SERVER_EVENTS.LEFT_LOBBY, error});
	}

	getID() {
		return this.n.id
	}

	sendIntroduction(buffer, id){
		this.n.send(MESSAGE_TYPE.RELIABLE, id, buffer);
	}

	sendSkinBuffer(buffer, id){
		this.n.send(MESSAGE_TYPE.RELIABLE, id, buffer);
	}

	sendSimpleMessageAll(buffer){
		this.n.broadcast(MESSAGE_TYPE.RELIABLE, buffer);
	}

	sendSimpleMessage(buffer, id){
		this.n.send(MESSAGE_TYPE.RELIABLE, id, buffer);
	}

	receiveSimpleMessage(peer, buffer){
		globalEvents.dispatchEvent({type:SERVER_EVENTS.SIMPLE_MESSAGE, peer, buffer});
	}

	receivePlayerIntroduction(peer, buffer, admin = false){
		globalEvents.dispatchEvent({type:SERVER_EVENTS.PLAYER_INTRODUCTION, peer, buffer, admin});
	}

	receiveSkin(peer, buffer){
		globalEvents.dispatchEvent({type:SERVER_EVENTS.RECEIVE_SKIN, peer, buffer})
	}

	receiveChangeServerLevel(peer, buffer){
		globalEvents.dispatchEvent({type:SERVER_EVENTS.CHANGE_LEVEL, peer, buffer});
	}

	receiveStartLoadLevel(peer, buffer){
		globalEvents.dispatchEvent({type:SERVER_EVENTS.START_LOAD_LEVEL, peer, buffer});
	}
	
	receiveLevelWon(peer, buffer){
		globalEvents.dispatchEvent({type:SERVER_EVENTS.LEVEL_WON, peer, buffer});
	}
	receiveChatMessage(peer, buffer){
		globalEvents.dispatchEvent({type:SERVER_EVENTS.CHAT_MESSAGE, peer, buffer});
	}
	receiveEndCountDownMessage(peer, buffer){
		globalEvents.dispatchEvent({type:SERVER_EVENTS.END_COUNTDOWN, peer, buffer});
	}
	receiveLevelVotesMessage(peer, buffer){
		globalEvents.dispatchEvent({type:SERVER_EVENTS.LEVEL_VOTES, peer, buffer});
	}

	sendCharacterData(buffer) {
		this.n.broadcast(MESSAGE_TYPE.UNRELIABLE, buffer);
	}

	receiveCharacterData(peer, buffer) {
		this.characterDataToProcess.push({
			playerID: peer.id,
			buffer,
			time: performance.now(),
			ping: Math.min(peer.latency.average, peer.latency.last, Settings.maxTolerableLatency * 2) / 2,
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
