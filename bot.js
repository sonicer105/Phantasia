const Discord = require('discord.io');
const winston = require('winston');
const config = require('./config');

const db = require('./services/sqliteService');
const security = require('./services/securityService');

let prefix = null;

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
    // Ignore messages from the bot
    if (userId === bot.id) return;
    // Check if we have already fetched server specific prefixes. If not, fetch them.
    if (prefix === null) {
        db.getSettingsAll("prefix", function (err, data) {
            if (err) throw err;
            prefix = data;
            prefix.default = ".";
            mainLogic(userName, userId, channelId, message, evt);
        });
    } else {
        mainLogic(userName, userId, channelId, message, evt);
    }
});
function mainLogic(userName, userId, channelId, message, evt) {
    evt.prefix = prefix[evt.d.guild_id] || prefix.default;
    if (message.substring(0, 1) === evt.prefix) {
        logger.info(userName + ' <@!' + userId + '> issued the command \'' + message + '\'');
        let args = message.substring(1).split(' ');
        switch(args[0]) {
            case 'help':
                help(channelId, evt);
                break;
            case 'ping':
                ping(userName, userId, channelId, evt);
                break;
            case 'snuggle':
                snuggle(userId, channelId, evt);
                break;
            case 'iscute':
                isCute(userId, channelId, evt);
                break;
            case 'setprefix':
                setPrefix(userId, channelId, message, evt);
                break;
            default:
                unknownCommand(channelId, message, evt);
        }
    }
}
//#endregion

//#region Command help
function help(channelId, evt) {
    bot.sendMessage({
        to: channelId,
        message: `:information_source: **List of Commands**
\`\`\`
${evt.prefix}help                Displays this message
${evt.prefix}ping                Pings the bot to see if it's alive
${evt.prefix}snuggle [user]      Gets Phantasia to snuggle you or a user
${evt.prefix}iscute [user]       Determines if a user is cute
\`\`\`
:crown: **Admin Commands**
\`\`\`
${evt.prefix}setprefix <symbol>  Sets the command prefix
\`\`\``
    });
}
//endregion

//#region Command ping
function ping(userName, userId, channelId) {
    bot.sendMessage({
        to: channelId,
        message: 'Pong!'
    });
}
//endregion

//#region Command snuggle
function snuggle(userId, channelId, evt) {
    let message;
    if (evt.d.mentions.length === 0){
        message = '*Snuggles with <@' + userId + '>*';
    } else if(evt.d.mentions[0].id === bot.id) {
        message = 'I can\'t snuggle myself :frowning:';
    } else {
        message = '*Snuggles with <@' + evt.d.mentions[0].id + '>*';
    }
    bot.sendMessage({
        to: channelId,
        message: message
    });
}
//endregion

//#region Command isCute
function isCute(userId, channelId, evt) {
    let message;
    if (evt.d.mentions.length === 0){
        message = 'You\'re just the cutest! :heart:';
    } else if(evt.d.mentions[0].id === bot.id) {
        message = 'I am totally cute! :heart:';
    } else {
        message = '<@!' + evt.d.mentions[0].id + '> is such a cutie :heart:';
    }
    bot.sendMessage({
        to: channelId,
        message: message
    });
}
//endregion

//#region Command setPrefix
function setPrefix(userId, channelId, message, evt) {
    let response;
    let args = message.split(' ');
    if (security.isAdmin(userId, bot.servers[evt.d.guild_id])) {
        if (args[1]){
            if (args[1].length === 1){
                prefix[evt.d.guild_id] = args[1];
                db.setSetting(evt.d.guild_id, 'prefix', args[1], function (err) {
                    if (err) throw err;
                    bot.sendMessage({
                        to: channelId,
                        message: ':white_check_mark: Prefix set!'
                    });
                });
            } else {
                response = ':x: The prefix must be exactly one character long';
            }
        } else {
            response = ':x: A prefix to set is required. Example: `' + evt.prefix + 'setprefix !`';
        }
    } else {
        response = ':x: You must be an Admin to run that command';
    }
    bot.sendMessage({
        to: channelId,
        message: response
    });
}
//endregion

//#region Command unknown
function unknownCommand(channelId, message, evt) {
    bot.sendMessage({
        to: channelId,
        message: ':warning: Unknown Command!\n' +
            'Type `' + evt.prefix + 'help` for a list of commands.'
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