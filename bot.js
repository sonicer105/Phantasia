const Discord = require('discord.io');
const winston = require('winston');
const config = require('./config.json');

// Configure logger settings
const logger = winston.createLogger({
    level: config.logLevel.console,
    format: winston.format.json(),
    transports: [
        new winston.transports.File({filename: 'bot.log', level: config.logLevel.file})
    ]
});
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

// Initialize Discord Bot
// noinspection SpellCheckingInspection
const bot = new Discord.Client({
    token: config.auth.token,
    autorun: true
});
bot.on('ready', function (evt) {
    logger.info('Connected');
    logger.info('Logged in as: ');
    logger.info(bot.username + ' - (' + bot.id + ')');
    logger.debug(bot);
});
bot.on('message', function (user, userID, channelID, message, evt) {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (message.substring(0, 1) === '!') {
        let args = message.substring(1).split(' ');
        const cmd = args[0];

        args = args.splice(1);
        switch(cmd) {
            case 'help':
                help(user, userID, channelID, message, evt);
                break;
            case 'snuggle':
                snuggle(user, userID, channelID, message, evt);
                break;
            case 'ping':
                ping(user, userID, channelID, message, evt);
                break;
            default:
                unknownCommand(user, userID, channelID, message, evt);
        }
    }
});

function help(user, userID, channelID, message, evt) {
    bot.sendMessage({
        to: channelID,
        message: ':information_source: **List of Commands**\n```\n' +
            '!help     Displays this message.\n' +
            '!snuggle  Gets Phantasia to snuggle you\n' +
            '!ping     Pong!' +
            '```'
    });
}

function snuggle(user, userID, channelID, message, evt) {
    let responseUsername = "<@" + userID + ">";
    bot.sendMessage({
        to: channelID,
        message: '*Snuggles with ' + responseUsername + '*'
    });
}

function ping(user, userID, channelID, message, evt) {
    logger.debug(user);
    logger.debug(userID);
    logger.debug(channelID);
    logger.debug(message);
    logger.debug(evt);
    bot.sendMessage({
        to: channelID,
        message: 'Pong!'
    });
}

function unknownCommand(user, userID, channelID, message, evt) {
    bot.sendMessage({
        to: channelID,
        message: ':warning: Unknown Command: `' + message + '`\n' +
            'Type `!help` for a list of commands.'
    });
}