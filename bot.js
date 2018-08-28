const Discord = require('discord.io'); // Docs: https://izy521.github.io/discord.io-docs/Discord.Client.html
const winston = require('winston');
const readLine = require('readline');
const config = require('./config');

// Embed visualizer: https://leovoel.github.io/embed-visualizer/

const db = require('./services/sqliteService');
const security = require('./services/securityService');

let prefix = null;

//#region Prototypes
Array.prototype.joinRange = function(seperator,start,end){
    if(!start) start = 0;
    if(!end) end = this.length - 1;
    end++;
    return this.slice(start,end).join(seperator);
};
//#endregion

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
    bot.setPresence({
        game: {
            name: "with hypnosis"
        }
    });
    // logger.debug(bot);
});
//#endregion

//#region Main switch-case for user messages
bot.on('message', mainLogic1);
function mainLogic1(userName, userId, channelId, message, evt) {
    // Ignore messages from the bot
    // if (userId === bot.id) return;
    // Check if we have already fetched server specific prefixes. If not, fetch them.
    if (prefix === null) {
        db.getSettingsAll("prefix", function (err, data) {
            if (err) throw err;
            prefix = data;
            prefix.default = ".";
            mainLogic2(userName, userId, channelId, message, evt);
        });
    } else {
        mainLogic2(userName, userId, channelId, message, evt);
    }
}
function mainLogic2(userName, userId, channelId, message, evt) {
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
            case 'lsar':
                listSelfAssignableRolls(channelId, evt);
                break;
            case 'asar':
                addSelfAssignableRolls(userId, channelId, message, evt);
                break;
            case 'rsar':
                removeSelfAssignableRolls(userId, channelId, message, evt);
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
        embed: {
            title: ":information_source: **List of Commands**",
            // description: "These are the roles you may give to yourself with the `.iam` command.",
            color: 1,
            fields: [
                {
                    name: evt.prefix + 'help',
                    value: 'Displays this message'
                },
                {
                    name: evt.prefix + 'ping',
                    value: 'Pings the bot to see if it\'s alive'
                },
                {
                    name: evt.prefix + 'snuggle [user]',
                    value: 'Gets Phantasia to snuggle you or a user'
                },
                {
                    name: evt.prefix + 'iscute [user]',
                    value: 'Determines if a user is cute'
                },
                {
                    name: evt.prefix + 'setprefix <symbol>',
                    value: 'Sets the command prefix **(Admin Only)**'
                },
                {
                    name: evt.prefix + 'lsar',
                    value: 'Lists roles you can assign yourself'
                },
                {
                    name: evt.prefix + 'asar',
                    value: 'Adds a self assignable role **(Admin Only)**'
                },
                {
                    name: evt.prefix + 'rsar',
                    value: 'removes a self assignable role **(Admin Only)**'
                }
            ]
        }
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

//#region Command List Self-Assignable Role
function listSelfAssignableRolls(channelId, evt) {
    db.getSARAll(evt.d.guild_id, function (err, data) {
        if (err) throw err;
        let fields = [];
        if (data.length > 0){
            for (let i in data){
                // noinspection JSUnfilteredForInLoop
                if (data[i].id){
                    // noinspection JSUnfilteredForInLoop
                    fields[i] = {
                        name: bot.servers[evt.d.guild_id].roles[data[i].id].name,
                        value: data[i].settings.description || "No Description Provided",
                    };
                }
            }
        } if (fields.length === 0) {
            fields = [{
                name: 'None',
                value: 'No self assignable roles set. Check back later.'
            }];
        }
        bot.sendMessage({
            to: channelId,
            embed: {
                title: "Self-assignable Roles",
                description: "These are the roles you may give to yourself with the `.iam` command.",
                color: 1,
                fields: fields
            }
        });
    });
}
//endregion

//#region Command Add Self-Assignable Role
function addSelfAssignableRolls(userId, channelId, message, evt) {
    let response;
    let args = parseCommand(message);
    if (security.isAdmin(userId, bot.servers[evt.d.guild_id])) {
        if (args[1]){
            let id = roleIdFromName(args[1], evt.d.guild_id);
            if (id) {
                let settings;
                if (args.length > 2) {
                    settings = {
                        description: args.joinRange(" ", 2, args.length - 1)
                    }
                } else {
                    settings = {
                        description: null
                    }
                }
                db.setSAR(evt.d.guild_id, id, JSON.stringify(settings), function (err) {
                    if (err) throw err;
                    bot.sendMessage({
                        to: channelId,
                        message: ':white_check_mark: Role added!'
                    });
                });
            } else {
                response = ':x: Role is not valid';
            }
        } else {
            response = ':x: A role is required';
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

//#region Command Remove Self-Assignable Role
function removeSelfAssignableRolls(userId, channelId, message, evt) {
    let response;
    let args = parseCommand(message);
    if (security.isAdmin(userId, bot.servers[evt.d.guild_id])) {
        if (args[1]){
            let id = roleIdFromName(args[1], evt.d.guild_id);
            if (id) {
                db.removeSAR(evt.d.guild_id, id, function (err) {
                    if (err) throw err;
                    bot.sendMessage({
                        to: channelId,
                        message: ':white_check_mark: Role removed!'
                    });
                });
            } else {
                response = ':x: Role is not valid';
            }
        } else {
            response = ':x: A role is required';
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

//#region Helpers
function roleIdFromName(roleName, serverId) {
    for (let i in bot.servers[serverId].roles){
        if (bot.servers[serverId].roles[i].name.toLowerCase() === roleName.toLowerCase()){
            return bot.servers[serverId].roles[i].id;
        }
    }
    return null;
}

function parseCommand(str) {
    let re = /(?:")([^"]+)(?:")|([^\s"]+)(?=\s+|$)/g;
    let res=[], arr;
    while (arr = re.exec(str)) { res.push(arr[1] ? arr[1] : arr[0]);}
    return res;
}
//#endregion

//#region stdin handling for commandline input
if (require('tty').isatty(1) || typeof v8debug === 'object' || /--debug|--inspect/.test(process.execArgv.join(' '))) {
    let rl = readLine.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false
    });
    rl.on('line', function(line){
        logger.debug('user issued the command "' + line + '" via the command line');
        if(line){
            let cmd = line.split(' ')[0].toLowerCase();
            switch (cmd){
                case 'help':
                    logger.info('Commands: help, say');
                    break;
                case 'say':
                    say(line);
                    break;
                default:
                    logger.info('Unknown Command. Use "help" for a list of commands');
            }
        }
    });
}
//#endregion

//#region Command botSay from tty
function say(line) {
    let cmd = line.split(' ');
    if (cmd.length >= 3){
        if (bot.channels[cmd[1]]){
            let message = cmd.joinRange(' ', 2, cmd.length - 1);
            bot.sendMessage({
                to: cmd[1],
                message: message
            });
            logger.info('Message sent to ' + cmd[1])
        } else {
            logger.error('Channel ID not found. Syntax: say <Channel ID> <Message>');
        }
    } else {
        logger.error('Too few operators. Syntax: say <Channel ID> <Message>');
    }
}
//#endregion

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