function sendMessage(text, message) {
	console.log(process.env.DEV_MODE);
	if(process.env.DEV_MODE === 'true') {
		console.log(text);
	}
	else{
		message.channel.send(text);
	}
}

module.exports = {
	sendMessage,
};