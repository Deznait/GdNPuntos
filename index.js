require('dotenv').config();
const { Client, MessageEmbed } = require('discord.js');

const client = new Client();

const prefix = '!puntos';

client.on('ready', () => {
    console.log('Bot Now connected!');
    console.log('Logged In as', client.user.tag)

    // Bot sending a Message to a text channel called test
    const testChannel = client.channels.cache.find(x => x.name === 'test-bots');
    testChannel.send('Hello Server!');
    // client.channels.find(c => c.name === 'test').send('Hello Server!')
});

// Bot listenning messages
client.on('message', message => {
    if (!message.content.startsWith(prefix) || message.author.bot) return;

    const args = message.content.trim().split(/ +/);
    const command = args.shift().toLowerCase();

    // No parameters
    if (!args.length) {
        message.channel.send(`¡${message.author}, tienes XX puntos acumulados!`);
    } else if (args[0] === 'listar') {
        message.reply('Lista completa de puntos')
    } else if (args[0] === 'hola') {
        message.channel.send(`Hola ${message.author}`);
    }

    message.channel.send(`Command name: ${command}\nArguments: ${args}`);
});


const token = process.env.DISCORD_BOT_TOKEN;
client.login(token);
