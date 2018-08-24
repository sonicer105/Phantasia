const Discord = require('discord.io');
const winston = require('winston');
const config = require('./config');

const db = require('./services/sqliteService');
const security = require('./services/securityService');

const prefix = '.';

//#region Configure logger settings
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
//#endregion logger

//#region Initialize services
db.init(logger);
security.init(logger);
//#endregion

//#region Initialize Discord bot
logger.info('Bot starting at ' + new Date().toISOString());
// noinspection SpellCheckingInspection
const bot = new Discord.Client({
    token: config.auth.token,
    autorun: true
});
bot.on('ready', function () {
    logger.info('Connected to Discord! Logged in as: ' + bot.username + ' - (' + bot.id + ')');
    // logger.debug(bot);
});
//#endregion

//#region Main switch-case for user messages
bot.on('message', function (userName, userId, channelId, message, evt) {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (message.substring(0, 1) === prefix) {
        logger.info(userName + ' <@!' + userId + '> issued the command \'' + message + '\'');
        let args = message.substring(1).split(' ');
        switch(args[0]) {
            case 'help':
                help(channelId);
                break;
            case 'snuggle':
                snuggle(userId, channelId);
                break;
            case 'ping':
                ping(userName, userId, channelId, evt);
                break;
            case 'iscute':
                isCute(userId, channelId, evt);
                break;
            case 'lsar':
                notYetImplemented(channelId);
                break;
            case 'iam':
                notYetImplemented(channelId);
                break;
            case 'iamnot':
                notYetImplemented(channelId);
                break;
            default:
                unknownCommand(channelId, message);
        }
    }
});
//#endregion

//#region Command help
function help(channelId) {
    bot.sendMessage({
        to: channelId,
        message: ':information_source: **List of Commands**\n```\n' +
            prefix + 'help     Displays this message\n' +
            prefix + 'snuggle  Gets Phantasia to snuggle you\n' +
            prefix + 'ping     Pings the bot to see if it\'s alive\n' +
            prefix + 'iscute   Determines if a user is cute\n' +
            prefix + 'lsar     Not Yet Implemented!\n' +
            prefix + 'iam      Not Yet Implemented!\n' +
            prefix + 'iamnot   Not Yet Implemented!\n' +
            '```'
    });
}
//endregion

//#region Command snuggle
function snuggle(userId, channelId) {
    let responseUsername = '<@' + userId + '>';
    bot.sendMessage({
        to: channelId,
        message: '*Snuggles with ' + responseUsername + '*'
    });
}
//endregion

//#region Command ping
function ping(userName, userId, channelId, evt) {
    logger.info(userName + ' is admin: ' + security.isAdmin(userId, bot.servers[evt.d.guild_id]));
    bot.sendMessage({
        to: channelId,
        message: 'Pong!'
    });
}
//endregion

//#region Command isCute
function isCute(userId, channelId, evt) {
    let message;
    if (evt.d.mentions.length === 0){
        message = 'You\'re just the cutest! :heart:';
    } else {
        message = '<@!' + evt.d.mentions[0].id + '> is such a cutie :heart:';
    }
    bot.sendMessage({
        to: channelId,
        message: message
    });
}
//endregion

//#region Command NYI
function notYetImplemented(channelId) {
    bot.sendMessage({
        to: channelId,
        message: ':information_source: This feature is not quite ready yet!\n' +
            'Contact a staff member if you need help.'
    });
}
//endregion

//#region Command unknown
function unknownCommand(channelId, message) {
    bot.sendMessage({
        to: channelId,
        message: ':warning: Unknown Command: `' + message + '`\n' +
            'Type `' + prefix + 'help` for a list of commands.'
    });
}
//endregion

//#region Handle exits gracefully and do cleanup
function exitHandler(options, exitCode) {
    logger.info('Caught exit event \'' + options.type + '\'');
    if(db.getState() === db.states.OPEN) {
        db.close(function (err) {
            if (err) {
                logger.error(err);
            } else {
                logger.info('SQLite DB closed gracefully!');
                exitHandlerFinish(options, exitCode);
            }
        });
    } else {
        exitHandlerFinish(options, exitCode);
    }
}
function exitHandlerFinish(options, exitCode) {
    if (exitCode || exitCode === 0) {
        logger.info('Exited with code ' + exitCode);
    }
    if (options.exit) {
        process.exit(exitCode);
    }
}

//do something when app is closing
process.on('exit', exitHandler.bind(null, {type:'exit'}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {type:'SIGINT',exit:true}));

// catches 'kill pid' (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {type:'SIGUSR1',exit:true}));
process.on('SIGUSR2', exitHandler.bind(null, {type:'SIGUSR2',exit:true}));

//catches uncaught exceptions
// process.on('uncaughtException', exitHandler.bind(null, {type:'Exception',exit:true}));
//#endregion