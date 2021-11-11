class MultiplayerServer{
	constructor(){
		this.caracterDataToProcess = [];
	}
	getID(){
		return '12345';
	}

	sendCharacterData(buffer){
		receiveCharacterData(buffer);
	}
	receiveCharacterData(){
		this.caracterDataToProcess.push({ playerID:this.getID(), buffer });
	}

	getCharacterDataToProcess(){
		return this.caracterDataToProcess;
	}
}

const server = new MultiplayerServer();
export default server;
