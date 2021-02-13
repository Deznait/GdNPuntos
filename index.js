require('dotenv').config();
const Discord = require('discord.js');
const google = require('./functions/google.js');
const noderiowrapper = require('noderiowrapper');
const nodeRIO = new noderiowrapper();

const client = new Discord.Client();
const prefix = '!';
const commandList = ['!puntos', '!rio'];
const adminRoles = ['Moderador', 'Oficial', 'Guild Leader'];

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
					sendMessage(`${message.author}, no te hemos encontrado en la lista de gremithos. :sob:`, message);
				}
				else {
					sendMessage(`¡${message.author}, tienes ${val.total_points} gremithos acumulados!`, message);
				}
			}, function(e) {
				console.error(e);
			});
		}
		else if (args[0] === 'detalle') {
			google.getMemberData(nick).then(function(val) {
				if(!val) {
					sendMessage(`${message.author}, no te hemos encontrado en la lista de gremithos. :sob:`, message);
				}
				else {
					const fields = [
						{ name: 'Gremithos totales', value: val.total_points, inline: true },
						{ name: 'Gremithos semanales', value: val.weekly_points, inline: true },
					];

					if(val.interview) {
						fields.push({ name: 'Entrevista realizada', value: 'Sí' });
					}

					const embed = new Discord.MessageEmbed()
						.setColor('#0099ff')
						.setTitle(`Gremithos de ${nick}`)
						.addFields(fields);
					sendMessage(embed, message);
				}
			}, function(e) {
				console.error(e);
			});
		}
		else if (args[0] === 'listar') {
			// Listar la tabla completa de gremithos
			google.getAllMembersData().then(function(val) {
				let output = '';

				val.forEach(data => {
					output += `${data.name} - ${data.total_points}\n`;
				});

				sendMessage(output, message);
			}, function(e) {
				console.error(e);
			});
		}
		else {
			// Recuperar los gremithos de los miembros indicados
			processMyArray(args).then(val => {
				val.sort(function(a, b) {
					if (a.total_points > b.total_points) {
						return -1;
					}
					if (a.total_points < b.total_points) {
						return 1;
					}
					// a must be equal to b
					return 0;
				});

				val.forEach(member => {
					const output = `${member.name} - ${member.total_points}\n`;
					sendMessage(output, message);
				});
			});
		}
	}
	else if(command === '!rio') {

		if (!args.length) {
			// No parameters, returns raider.io score of the user
			google.getMemberData(nick).then(member => {
				if(!member) {
					sendMessage(`${message.author}, no te hemos encontrado en la lista de gremithos. :sob:`, message);
				}
				else {
					sendRioMessage(member, message);
				}
			}, e => {
				console.error(e);
			});
		}
		else if (args[0] === 'guild') {
			// Listar la tabla completa de semanales para todos los miembros
			if (message.member.roles.cache.some(role => role.name === 'Guild Leader') ||
			message.member.roles.cache.some(role => role.name === 'Oficial') ||
			message.member.roles.cache.some(role => role.name === 'Moderador')
			) {
				// No parameters, returns raider.io score of the user
				google.getAllMembersData().then(members => {
					for (const [key, member] of Object.entries(members)) {
						sendRioMessage(member, message, false);
					}
					sendMessage('Se han actualizado las M+ semanales de todos los miembros', message);
				}, e => {
					console.error(e);
				});
			}
		}
		else {
			// Recuperar la clasificacion del pj indicado
			args.sort();

			args.forEach(memberName => {
				google.getMemberData(memberName).then(function(val) {
					if(val) {
						sendRioMessage(val, message);
					}
				}, function(e) {
					console.error(e);
				});
			});
		}
	}
});

async function processMyArray(args) {
	const memberList = [];

	for(const memberName of args) {
		const member = await google.getMemberData(memberName);
		if (member) memberList.push(member);
	}

	return memberList;
}

function sendRioMessage(member, message, sendmessage = true) {
	const realm = member.realm.replace(/'/g, '-');

	nodeRIO.Character.getMythicPlusWeeklyHighestRuns('eu', realm, member.name).then((result) => {
		const weekly_mithics = result.mythic_plus_weekly_highest_level_runs;
		if (typeof weekly_mithics !== 'undefined' && weekly_mithics.length > 0) {
			const top_mithic = weekly_mithics[Object.keys(weekly_mithics)[0]];

			const mydate = new Date(top_mithic.clear_time_ms);
			const fields = [
				{ name: 'Mazmorra', value: top_mithic.dungeon },
				{ name: 'Tiempo', value: mydate.getMinutes() + ' minutos ' + mydate.getSeconds() + ' segundos' },
			];

			google.saveMythicScore(member.name, top_mithic);
			if(sendmessage) {
				const embed = new Discord.MessageEmbed()
					.setColor('#0099ff')
					.setTitle(`¡${member.name}, tu M+ más alta de esta semana ha sido +${top_mithic.mythic_level}!`)
					.setThumbnail('https://images-ext-2.discordapp.net/external/ghxNNx7q-Dmw94AbS5yc1IWV2vrS8X9UtfdQ1W656WY/%3F2019-11-18/http/cdnassets.raider.io/images/fb_app_image.jpg?width=80&height=80')
					.setAuthor('Raider.io')
					.setURL(top_mithic.url)
					.addFields(fields);
				sendMessage(embed, message);
			}
		}
		else if(sendmessage) {
			sendMessage(`${member.name}, esta semana no has hecho ninguna M+. :sob:`, message);
		}
	});
}

function sendMessage(text, message) {
	if(process.env.DEV_MODE === 'true') {
		console.log(text);
	}
	else{
		message.channel.send(text);
	}
}

const token = process.env.DISCORD_BOT_TOKEN;
client.login(token);
