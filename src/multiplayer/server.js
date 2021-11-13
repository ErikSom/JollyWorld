class MultiplayerServer{
	constructor(){
		this.caracterDataToProcess = [];
	}
	getID(){
		return '12345';
	}

	sendCharacterData(buffer){
		this.receiveCharacterData(buffer);
	}
	receiveCharacterData(buffer){
		this.caracterDataToProcess.push({ playerID:this.getID(), buffer });
	}

	getCharacterDataToProcess(){
		const returnData = [...this.caracterDataToProcess];
		this.caracterDataToProcess.length = 0;
		return returnData;
	}
}

const server = new MultiplayerServer();
export default server;
