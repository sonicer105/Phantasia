const Discord = require('discord.io');
const winston = require('winston');
const config = require('./config');

const db = require('./services/sqliteService');

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

//#region Initialize database
db.init(logger);
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
    logger.debug(bot);
});
//#endregion

//#region Main switch-case for user messages
bot.on('message', function (user, userID, channelID, message, evt) {
    // Our bot needs to know if it will execute a command
    // It will listen for messages that will start with `!`
    if (message.substring(0, 1) === prefix) {
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
            case 'lsar':
                notYetImplemented(user, userID, channelID, message, evt);
                break;
            case 'iam':
                notYetImplemented(user, userID, channelID, message, evt);
                break;
            case 'iamnot':
                notYetImplemented(user, userID, channelID, message, evt);
                break;
            default:
                unknownCommand(user, userID, channelID, message, evt);
        }
    }
});
//#endregion

//#region Command help
function help(user, userID, channelID, message, evt) {
    bot.sendMessage({
        to: channelID,
        message: ':information_source: **List of Commands**\n```\n' +
            prefix + 'help     Displays this message.\n' +
            prefix + 'snuggle  Gets Phantasia to snuggle you\n' +
            prefix + 'ping     Pings the bot to see if it\'s alive\n' +
            prefix + 'lsar     Not Yet Implemented!\n' +
            prefix + 'iam      Not Yet Implemented!\n' +
            prefix + 'iamnot   Not Yet Implemented!\n' +
            '```'
    });
}
//endregion

//#region Command snuggle
function snuggle(user, userID, channelID, message, evt) {
    let responseUsername = '<@' + userID + '>';
    bot.sendMessage({
        to: channelID,
        message: '*Snuggles with ' + responseUsername + '*'
    });
}
//endregion

//#region Command ping
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
//endregion

//#region Command NYI
function notYetImplemented(user, userID, channelID, message, evt) {
    bot.sendMessage({
        to: channelID,
        message: ':information_source: This feature is not quite ready yet!\n' +
            'Contact a staff member if you need help.'
    });
}
//endregion

//#region Command unknown
function unknownCommand(user, userID, channelID, message, evt) {
    bot.sendMessage({
        to: channelID,
        message: ':warning: Unknown Command: `' + message + '`\n' +
            'Type `!help` for a list of commands.'
    });
}
//endregion

//#region Handle exits gracefully and do cleanup
function exitHandler(options, exitCode) {
    logger.info("Caught exit event '" + options.type + "'");
    if(db.getState() === db.states.OPEN) {
        db.close(function (err) {
            if (err) {
                logger.error(err);
            } else {
                logger.info("SQLite DB closed gracefully!");
                exitHandlerFinish(options, exitCode);
            }
        });
    } else {
        exitHandlerFinish(options, exitCode);
    }
}
function exitHandlerFinish(options, exitCode) {
    if (exitCode || exitCode === 0) {
        logger.info("Exited with code " + exitCode);
    }
    if (options.exit) {
        process.exit(exitCode);
    }
}

//do something when app is closing
process.on('exit', exitHandler.bind(null, {type:"exit"}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {type:"SIGINT",exit:true}));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {type:"SIGUSR1",exit:true}));
process.on('SIGUSR2', exitHandler.bind(null, {type:"SIGUSR2",exit:true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {type:"Exception",exit:true}));
//#endregion