/**
 * Project: Token Bot
 * Purpose: Imitate the act of having the ball in your hands to talk, like in class
 * Creator: Terry Yu
 * 
 * 
 * How to use:
 * You need to have some version of node installed. I'm using Windows Subsystem for Linux (WSL).
 * You need some libraries. Do the following commands
 * npm install ffmpeg-binaries
 * npm install opusscript
 * 
 * Create a Discord bot application at "https://discordapp.com/developers/applications/"
 * I suggest following AnIdiotsGuide at "https://anidiotsguide_old.gitbooks.io/discord-js-bot-guide/content/getting-started/linux-tldr.html"
 * All the way at the bottom is where you add the bot's token. DO NOT SHARE THIS TOKEN WITH ANYONE.
 * 
 * Once you get the bot added on your server create a role with whatever name you want WITH ADMINISTRATOR PERMISSIONS
 * The reason it needs administrator permissions is to mute/unmute all users. Plus I got lazy.
 * Once the role has been created, edit the adminRole line to match the role's name
 *  
 * 
 * Now at this point the following should be setup
 * Node
 * Certain libraries
 * discord js
 * bot is in  your server
 * 
 * Turn on the bot by entering "node tokenBot.js"
 * It should come online on the server and respond to commands
 * 
 * Admins/@role have access to all commands
 * $summon: brings bot into voice channel
 * $leave: disconnects bot from voice channel
 * $lock: mutes everyone but yourself
 * $unlock: unmutes everybody
 * 
 * Commands everyone can use
 * $req: puts you in queue to talk i.e. waiting in line
 * $next/done: you are done talking and next person in line can talk
 * $status/queue: displays waiting line
 * $help: displays all commands
 * 
 * Admins can override who has the ball and pass it to the next person in queue with the next/done commmand
 * 
 * 
 * 
 * 
 * This isn't my best code as I had to learn Javascript and how to code a Discord bot in a short time notice
 * There are without a doubt efficiency changes that can be made
 * (e.g. queue as a data structure and using shift(). Can consume a lot of processing power with very, very large voice channel)
 * This was created for a small server for people I care for.
 * 
 * This code is free to use, modify, integrate. No credit is necessary.
 * Do not expect extended support or additional features.
 * Bitbucket: https://bitbucket.org/terryzyu/
 * Date: October 12, 2018.
 */

const Discord = require("discord.js");
const client = new Discord.Client();
const pref = "$"; //Precondition to use commands

//Upon a successful login the console will display message
client.on("ready", () => {
	console.log("Successful login and online"); //console message
  	client.user.setActivity("Type " + pref + "help for all commands"); //That "playing" message
});

var q = []; //Stores queue
var speakerID; //Stores ID of speaker
var speakerMember; //Stores member object of speaker

//Triggers when a message is received, DM or server
client.on("message", async message =>{

	var adminRole = message.guild.roles.find(x => x.name == "TYPE THAT AWESOME NEW ROLE YOU JUST MADE HERE");
	//Ignores any bot message and itself
	if(message.author.bot) return;

	if(message.member.roles.has(adminRole.id)){ //Commands only to admin
		if(message.content == (pref + "summon")){//Needs to have specific role
			console.log("Entered summon");

			if(message.member.voiceChannel){ //If person who summoned is in a voice channel
				if(!message.guild.voiceConnection){ //If bot is in multiple guilds
					message.member.voiceChannel.join()
						.then(connection => {
							message.reply("Joined voice channel");
							console.log("Joined Successfully");
						})
				}
			}
			else{
				message.reply("No privileges or in voice channel");
			}

		} //summon


		if(message.content == (pref + "leave")){
			console.log("Entered leave");
			if(message.guild.voiceConnection){ //Member must be in voice channel
				message.guild.voiceConnection.disconnect();
			}
			else{
				message.reply("No privileges or in voice channel");
			}
		} //leave


		if(message.content == (pref + "lock")){ //mutes all but the one who called it
			console.log("Entered lock");

			if(message.guild.voiceConnection){ //Member must be in voice channel
				var members = message.member.voiceChannel.members; //Gets all members of voice channel
				members.forEach((mem) => {
					mem.setMute(true);
					console.log("Muted " + mem.displayName);
				})
				message.member.setMute(false);
				speakerID = message.member.id;
				speakerMember = message.member;
			}
			else{
				message.reply("No privileges or in voice channel");
			}
		} //lock


		if(message.content == (pref + "unlock")){ //mutes all but the one who called it
			console.log("Entered unlock");
			
			if(message.guild.voiceConnection){ //Member must be in voice channel
				var members = message.member.voiceChannel.members; //Gets all members of server
				members.forEach((mem) => {
					mem.setMute(false);
					console.log("Unmuted " + mem.displayName);
				})
			}
			else{
				message.reply("No privileges or in voice channel");
			}
		} //lock
	} //admin commands

	else{
		message.reply("No privalaigeosges or in voice channel")
	}


//REST OF COMMANDS OPEN TO ALL

	if(message.content == (pref + "req")){
		console.log("Entered req");
		if(message.guild.voiceConnection && !q.includes(message.member)){ //Member must be in voice channel
			q.push(message.member);
			console.log("NEW MEMBER");
			message.reply("You have been added to the queue, you are in position: " + q.length);
		}
		else
			message.reply("You are already in queue");
	}

	if(message.content == (pref + "status")
		|| message.content == (pref + "queue")){
		console.log("Entered status");
		if(message.guild.voiceConnection || q.length == 0 || q === undefined){ //Member must be in voice channel and q non-empty
			var queueList = ""
			for(var i = 0; i < q.length; i++){
				queueList += (i+1) + ". " + q[i].displayName + "\n";
			}
			message.reply("The here is the order of the queue\n" + queueList);
		}
		else
			message.reply("You are either not in voice channel or no one is in the queue");
	}

	if((message.content == (pref + "done")
		|| message.content == (pref + "next"))
	   		&& (message.member.id == speakerID 
	   			|| message.member.roles.has(adminRole.id))){ //Only current speaker can call it or is admin

		console.log("Entered next");

		if(message.guild.voiceConnection){ //must be in voice
			if(q.length == 0)
				return;
			else{
				speakerMember.setMute(true); //CONTAINS OLD SPEAKER
				speakerMember = q.shift(); //SETS NEW SPEAKER
				speakerMember.setMute(false);
				console.log(speakerMember.displayName);
				speakerID = speakerMember.id;
			}
		}
	}

	if(message.content == ("$help")){
		var helpMessage = ("I function the same way as if you had to pass the ball in class to talk.\n\
$req: puts you in queue to talk i.e. waiting in line\n\
$next/done: you are done talking and next person in line can talk\n\
$status/queue: displays waiting line\n\
$commands: displays commands without intro message\n\
$help: displays this message");

		message.reply(helpMessage);
	}

	if(message.content == ("$commands")){
		var helpMessage = ("\n$req: puts you in queue to talk i.e. waiting in line\n\
$next/done: you are done talking and next person in line can talk\n\
$status/queue: displays waiting line\n\
$commands: displays commands without intro message\n\
$help: displays this message");

		message.reply(helpMessage);
	}
});








client.login("ADD SUPER SECRET TOKEN DOWN HERE");