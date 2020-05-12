//import all dependencies
const Discord = require('discord.js');
const { 
    prefix, 
    token, 
} = require('./config.json');
const ytdl = require('ytdl-core');
//create a new discord client object
const client = new Discord.Client();

//basic listeners
client.once('ready', () => {
    console.log('Ready!');
});
client.once('reconnecting', () => {
    console.log('Reconnecting!');
});
client.once('disconnect', () => {
    console.log('Disconnect!');
});

//listen for messages
client.on('message', async message => {
    if (message.author.bot) return;
    if (!message.content.startsWith(prefix)) return;

    const serverQueue = queue.get(message.guild.id);

    if (message.content.startsWith(`${prefix}play `)) {
        execute(message, serverQueue);
        return;
    } 
    else if (message.content.startsWith(`${prefix}skip `)) {
        skip(message, serverQueue);
        return;
    } 
    else if (message.content.startsWith(`${prefix}stop `)) {
        stop(message, serverQueue);
        return;
    } 
    else {
        message.channel.send('You need to enter a valid command!');
    }
});

//queue to save all the songs we type in chat
const queue = new Map();

//async function caleld execute and check if the user is in a voice chat
//and if the bot has the right permission
async function execute(message, serverQueue) {
    const args = message.content.split(' ');
    const voiceChannel = message.member.voiceChannel;
    if(!voiceChannel) return message.channel.send('You need to be in a voice channel to play music!');
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if(!permissions.has('CONNECT') || !permissions.has('SPEAK')) {
        return message.channel.send('I need the permissions to join and speak in your voice channel!')
    }

    //get song info and save into a song object
    const songInfo = await ytdl.getInfo(args[2])
    const song = {
        title: songInfo.title,
        url: songInfo.video_url,
    };

    //create a contract we can add to our queue
    if(!serverQueue) {
        const queueContruct = {
            textChannel: message.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 5,
            playing: true,
        };

        queue.set(message.guild.id, queueContruct);

        queueContruct.songs.push(song);

        try {
            var connection = await voiceChannel.join();
            queueContruct.connection = connection;
            play(message.guild, queueContruct.songs[0]);
        } catch (err) {
            console.log(err);
            queue.delete(message.guild.id);
            return message.channel.send(err);
        }
    }
    else {
        serverQueue.songs.push(song);
        console.log(serverQueue.song);
        return message.channel.send(`${song.title} has been added to the queue!`);
    }

}//end execute

//skip function
function skip(message, serverQueue) {
	if (!message.member.voiceChannel) return message.channel.send('You have to be in a voice channel to stop the music!');
	if (!serverQueue) return message.channel.send('There is no song that I could skip!');
	serverQueue.connection.dispatcher.end();
}

//stop function
function stop(message, serverQueue) {
	if (!message.member.voiceChannel) return message.channel.send('You have to be in a voice channel to stop the music!');
	serverQueue.songs = [];
	serverQueue.connection.dispatcher.end();
}

//play function
function play(guild, song) {
	const serverQueue = queue.get(guild.id);

	if (!song) {
		serverQueue.voiceChannel.leave();
		queue.delete(guild.id);
		return;
	}

	const dispatcher = serverQueue.connection.playStream(ytdl(song.url))
		.on('end', () => {
			console.log('Music ended!');
			serverQueue.songs.shift();
			play(guild, serverQueue.songs[0]);
		})
		.on('error', error => {
			console.error(error);
		});
	dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
}

//login
client.login(token);

/*  
 *  WORKING
 *  waits for message, then does stuff

client.on('message', msg => {
    if(!msg.content.startsWith(config.prefix))
        return;
    else 
        msg.channel.send(`${msg.author.username} just used a command!`);

    if(msg.toString().toLowerCase().includes('ping')){
        msg.channel.send('pong <3');
        msg.channel.send('私のタグは' + client.user.tag + '!');
    }
});
 */


/*  !working
 *  destroy client
 *  waits for 'Rina stop'

client.on('message', msg => {
    if(msg.content === 'Rina stop') 
    {
        console.log(`Logged out of ${client.user.tag}!`);
        msg.channel.send('お元気で！');
        client.disconnect();
    }
});
 */


/*  !working
 *  join voice channel
 *  waits for 'Rina join'

client.on('message', msg => {
    if(msg.content === 'Rina join')
    {
        console.log(`${client.user.tag} has joined ${client.channel}`);
        msg.channel.send('莉奈ちゃん、まいりました！');
        msg.author.channel.join();
    }
});
 */


/*  !working
 *  delete messages
 *  waits for 'Rina deletemsg'

client.on('message', msg => {
    if(msg.content === 'Rina deletemsg')
    {
        console.log('deleting messages');
        msg.channel.bulkDelete(10);
    }
});
 */

