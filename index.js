require('dotenv').config();
const Discord = require('discord.js');
const google = require('./functions/google.js');

const client = new Discord.Client();
const prefix = '!';
const commandList = ['!puntos'];

client.on('ready', () => {
	console.log('Bot Now connected!');
	console.log('Logged In as', client.user.tag);
});

// Bot listenning messages
client.on('message', message => {
	if (!message.content.startsWith(prefix) || message.author.bot) return;

	const args = message.content.trim().split(/ +/);
	const command = args.shift().toLowerCase();
	console.log(command);

	if (!commandList.includes(command)) return;

	const nick = message.member.nickname !== null ? message.member.nickname : message.author.username;

	if(command === '!puntos') {
		if (!args.length) {
			// No parameters, returns points of the user
			google.getMemberData(nick).then(function(val) {
				if(!val) {
					message.channel.send(`${message.author}, no te hemos encontrado en la lista de puntos. :sob:`);
				}
				else {
					message.channel.send(`¡${message.author}, tienes ${val.total_points} puntos acumulados!`);
				}
			}, function(e) {
				console.error(e);
			});
		}
		else if (args[0] === 'detalle') {
			google.getMemberData(nick).then(function(val) {
				if(!val) {
					message.channel.send(`${message.author}, no te hemos encontrado en la lista de puntos. :sob:`);
				}
				else {
					const fields = [
						{ name: 'Puntos totales', value: val.total_points, inline: true },
						{ name: 'Puntos semanales', value: val.weekly_points, inline: true },
					];

					if(val.interview) {
						fields.push({ name: 'Entrevista realizada', value: 'Sí' });
					}

					const embed = new Discord.MessageEmbed()
						.setColor('#0099ff')
						.setTitle(`Puntos de ${nick}`)
						.addFields(fields);
					message.channel.send(embed);
				}
			}, function(e) {
				console.error(e);
			});
		}
		else if (args[0] === 'listar') {
			// Listar la tabla completa de puntos
			google.getAllMembersData().then(function(val) {
				let output = '';

				val.forEach(data => {
					output += `${data.name} - ${data.total_points}\n`;
				});

				message.channel.send(output);
			}, function(e) {
				console.error(e);
			});
		}
		else if (args[0] === 'limpiar') {
			if(message.author.username === 'Deznait') {message.channel.bulkDelete(100, true);}
		}
		else {
			// Recuperar los puntos de los miembros indicados
			args.sort();

			args.forEach(memberName => {
				google.getMemberData(memberName).then(function(val) {
					if(val) {
						const output = `${memberName} - ${val.total_points}\n`;
						message.channel.send(output);
					}
				}, function(e) {
					console.error(e);
				});
			});
		}
	}
});


const token = process.env.DISCORD_BOT_TOKEN;
client.login(token);
