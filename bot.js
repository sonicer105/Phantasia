const Discord = require('discord.io');
const winston = require('winston');
const readLine = require('readline');
const config = require('./config');

// Discord.io Docs: https://izy521.github.io/discord.io-docs/Discord.Client.html
// Embed Visualizer: https://leovoel.github.io/embed-visualizer/

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
logger.info(`Bot starting at ${new Date().toISOString()}`);
// noinspection SpellCheckingInspection
const bot = new Discord.Client({
    token: config.auth.token,
    autorun: true
});
bot.on('ready', function () {
    logger.info(`Connected to Discord! Logged in as: ${bot.username} (id ${bot.id})`);
    bot.setPresence({
        game: {
            name: `with hypnosis`
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
        db.getSettingsAll('prefix', function (err, data) {
            if (err) throw err;
            prefix = data;
            prefix.default = '.';
            mainLogic2(userName, userId, channelId, message, evt);
        });
    } else {
        mainLogic2(userName, userId, channelId, message, evt);
    }
}
function mainLogic2(userName, userId, channelId, message, evt) {
    evt.prefix = prefix[evt.d.guild_id] || prefix.default;
    if (message.substring(0, 1) === evt.prefix) {
        logger.info(`${userName} (id ${userId}) issued the command '${message}'`);
        let args = message.substring(1).split(' ');
        switch(args[0]) {
            case 'help':
                help(userName, userId, channelId, message, evt);
                break;
            case 'ping':
                ping(userName, userId, channelId, message, evt);
                break;
            case 'snuggle':
                simpleAction(userName, userId, channelId, message, evt, 'snuggles');
                break;
            case 'boop':
                simpleAction(userName, userId, channelId, message, evt, 'boops');
                break;
            case 'iscute':
                isCute(userName, userId, channelId, message, evt);
                break;
            case 'roll':
                roll(userName, userId, channelId, message, evt);
                break;
            case 'prefix':
                setPrefix(userName, userId, channelId, message, evt);
                break;
            case 'lsar':
                listSelfAssignableRolls(userName, userId, channelId, message, evt);
                break;
            case 'asar':
                addSelfAssignableRolls(userName, userId, channelId, message, evt);
                break;
            case 'rsar':
                removeSelfAssignableRolls(userName, userId, channelId, message, evt);
                break;
            case 'iam':
            case 'im':
                assignSelfAssignableRolls(userName, userId, channelId, message, evt);
                break;
            case 'iamnot':
            case 'iamno':
            case 'imnot':
            case 'imno':
                unassignSelfAssignableRolls(userName, userId, channelId, message, evt);
                break;
        }
    }
}
//#endregion

//#region Command help
function help(userName, userId, channelId, message, evt) {
    let title, description, fields;
    let args = parseCommand(message);
    if (args.length > 1){
        fields = [];
        switch (args[1]) {
            case 'help':
                title = `${evt.prefix}help [command]`;
                description =
`Displays the list of commands or gets help with a specific command

Example Usage: \`${evt.prefix}help ping\``;
                break;
            case 'ping':
                title = `${evt.prefix}ping`;
                description =
`Pings the bot to see if it's alive

Example Usage: \`${evt.prefix}ping\``;
                break;
            case 'snuggle':
                title = `${evt.prefix}snuggle [user]`;
                description =
`Gets Phantasia to snuggle you or a user

Example Usage: \`${evt.prefix}snuggle @LinuxPony#3888\``;
                break;
            case 'boop':
                title = `${evt.prefix}boop [user]`;
                description =
`Gets Phantasia to boop you or a user

Example Usage: \`${evt.prefix}boop @LinuxPony#3888\``;
                break;
            case 'iscute':
                title = `${evt.prefix}iscute [user]`;
                description =
`Determines if a user is cute

Example Usage: \`${evt.prefix}iscute @LinuxPony#3888\``;
                break;
            case 'prefix':
                title = `${evt.prefix}prefix <symbol>`;
                description =
`**(Admin Only)**
Sets the command prefix

Example Usage: \`${evt.prefix}prefix !\``;
                break;
            case 'lsar':
                title = `${evt.prefix}lsar`;
                description =
`Lists roles you can assign yourself

Example Usage: \`${evt.prefix}lsar\``;
                break;
            case 'asar':
                title = `${evt.prefix}asar <role> [description]`;
                description =
`**(Admin Only)**
Adds a self assignable role.
*Note: Role name must be in quotes if it contains spaces*

Example Usage: \`${evt.prefix}asar "Event Notices" Be pinged every time there is a new event.\``;
                break;
            case 'rsar':
                title = `${evt.prefix}rsar <role>`;
                description =
`**(Admin Only)**
removes a self assignable role

Example Usage: \`${evt.prefix}rsar Event Notices\``;
                break;
            case 'iam':
                title = `${evt.prefix}iam <role>`;
                description =
`Assigns you a self assignable role

Example Usage: \`${evt.prefix}iam Event Notices\``;
                break;
            case 'iamnot':
                title = `${evt.prefix}iamnot <role>`;
                description =
`Takes a self assignable role from you

Example Usage: \`${evt.prefix}iamnot Event Notices\``;
                break;
            default:
                title = 'Not Found';
                description =
`Help documentation for this command wasn't found.
Please check the command and try again`;
        }
    } else {
        title = 'Help';
        description = 'Listing all commands. Specify a command to see more information.';
        fields = [{
            name: 'Commands',
            value: '`help`, `ping`, `snuggle`, `boop`, `iscute`, `roll`, `prefix`, `lsar`, `asar`, ' +
                '`rsar`, `iam`, `iamnot`'
        }]
    }
    bot.sendMessage({
        to: channelId,
        embed: {
            title: title,
            description: description,
            color: 1,
            fields: fields
        }
    });
}
//endregion

//#region Command ping
// noinspection JSUnusedLocalSymbols
function ping(userName, userId, channelId, message, evt) {
    bot.sendMessage({
        to: channelId,
        message: 'Pong!'
    });
}
//endregion

//#region Command simpleAction (snuggle, boop)
function simpleAction(userName, userId, channelId, message, evt, action) {
    let returnMessage;
    if (evt.d.mentions.length === 0){
        returnMessage = `*${action} ${evt.d.member.nick || userName}*`;
    } else if(evt.d.mentions[0].id === bot.id) {
        returnMessage = `I can't do that to myself :frowning:`;
    } else {
        returnMessage = `*${action} ${evt.d.mentions[0].member.nick || evt.d.mentions[0].username}*`;
    }
    bot.sendMessage({
        to: channelId,
        message: returnMessage
    });
}
//endregion

//#region Command isCute
function isCute(userName, userId, channelId, message, evt) {
    let returnMessage;
    if (evt.d.mentions.length === 0){
        returnMessage = `You're just the cutest! :heart:`;
    } else if(evt.d.mentions[0].id === bot.id) {
        returnMessage = 'I am totally cute! :heart:';
    } else {
        returnMessage = `${(evt.d.mentions[0].member.nick || evt.d.mentions[0].username)} is such a cutie :heart:`;
    }
    bot.sendMessage({
        to: channelId,
        message: returnMessage
    });
}
//endregion

//#region Command roll
function roll(userName, userId, channelId, message, evt) {
    let sids, returnMessage;
    let rolls = '';
    let dice = 1;
    let args = parseCommand(message);
    if (args && args.length > 1) {
        sids = Number.parseInt(args[1]) || Number.parseInt(args[1].substr(1));
    } else {
        sids = 6;
    }
    if (!isNaN(sids)){
        if (sids >= 2 && sids <= 100){
            if (args && args.length > 2){
                let diceTryParse = Number.parseInt(args[2]);
                if(!isNaN(diceTryParse)){
                    dice = diceTryParse;
                }
            }
            if (dice > 0 && dice <= 100){
                for (let i = 0; i < dice; i++) {
                    let thisRoll = Math.floor((Math.random() * sids) + 1);
                    if (rolls){
                        rolls += ', ' + thisRoll
                    } else {
                        rolls += thisRoll
                    }
                }
                if (dice === 1){
                    dice = "a"
                } else {
                    sids += "'s"
                }
                returnMessage = ` rolled ${dice} d${sids} and got ${rolls}`
            } else {
                returnMessage = `, I can't roll that many dice! Please keep it between 1 and 100`;
            }
        } else {
            returnMessage = `, I can't roll a die with that many sids! Please keep it between 2 and 100`;
        }
    } else {
        returnMessage = `, That die type isn't valid. Please try again. Ex: \`${evt.prefix}roll d20\``;
    }
    bot.sendMessage({
        to: channelId,
        message: (evt.d.member.nick || userName) + returnMessage
    });
}
//endregion

//#region Command setPrefix
function setPrefix(userName, userId, channelId, message, evt) {
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
            response = `:x: A prefix to set is required. Example: \`${evt.prefix}prefix !\``;
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
function listSelfAssignableRolls(userName, userId, channelId, message, evt) {
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
                        value: data[i].settings.description || 'No Description Provided',
                    };
                }
            }
        } if (fields.length === 0) {
            fields = [{
                name: 'None',
                value: 'No self assignable roles set.'
            }];
        }
        bot.sendMessage({
            to: channelId,
            embed: {
                title: 'Self-assignable Roles',
                description: `These are the roles you may give to yourself with the \`${evt.prefix}iam\` command.`,
                color: 1,
                fields: fields
            }
        });
    });
}
//endregion

//#region Command Add Self-Assignable Role
function addSelfAssignableRolls(userName, userId, channelId, message, evt) {
    let response;
    if (security.isAdmin(userId, bot.servers[evt.d.guild_id])) {
        let args = parseCommand(message);
        if (args[1]){
            let id = roleIdFromName(args[1], evt.d.guild_id);
            if (id) {
                let settings;
                if (args.length > 2) {
                    settings = {
                        description: joinRange(args, ' ', 2)
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
                        message: `:white_check_mark: Role ${args[1]} added!`
                    });
                });
            } else {
                response = `:x: Role ${args[1]} is not valid`;
            }
        } else {
            response = ':x: A role name is required';
        }
    } else {
        response = `:x: You must be an Admin to run that command`;
    }
    bot.sendMessage({
        to: channelId,
        message: response
    });
}
//endregion

//#region Command Remove Self-Assignable Role
function removeSelfAssignableRolls(userName, userId, channelId, message, evt) {
    let response;
    if (security.isAdmin(userId, bot.servers[evt.d.guild_id])) {
        let args = parseCommand(message);
        if (args[1]){
            let id = roleIdFromName(args[1], evt.d.guild_id);
            if (id) {
                db.removeSAR(evt.d.guild_id, id, function (err) {
                    if (err) throw err;
                    bot.sendMessage({
                        to: channelId,
                        message: `:white_check_mark: Role ${args[1]} removed!`
                    });
                });
            } else {
                response = `:x: Role ${args[1]} is not valid`;
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

//#region Command Assigns Self-Assignable Role
function assignSelfAssignableRolls(userName, userId, channelId, message, evt) {
    let returnMessage;
    let args = parseCommand(message);
    if (args.length > 1){
        let roleId = roleIdFromName(joinRange(args, ' ', 1), evt.d.guild_id);
        if (roleId){
            db.getSAR(evt.d.guild_id, roleId, function (err, data) {
                if (err) throw err;
                if (data.length > 0){
                    bot.addToRole({
                        serverID: evt.d.guild_id,
                        userID: userId,
                        roleID: roleId
                    }, function (err) {
                        if (err) {
                            if (err.statusMessage === "FORBIDDEN"){
                                bot.sendMessage({
                                    to: channelId,
                                    message: `:x: I'm sorry, but I don't seem to have permission to do that right ` +
                                    'now. This is probably a mistake and should be reported to an administrator'
                                });
                            } else {
                                throw err;
                            }
                        } else {
                            bot.sendMessage({
                                to: channelId,
                                message: `:white_check_mark: ${(evt.d.member.nick || userName)} now has the ` +
                                    `${joinRange(args, ' ', 1)} role.`
                            });
                        }
                    });
                } else {
                    bot.sendMessage({
                        to: channelId,
                        message: ':x: That role isn\'t self assignable'
                    })
                }
            });
        } else {
            returnMessage = ':x: That role isn\'t valid';
        }
    } else {
        returnMessage = ':x: A role name is required';
    }
    if (returnMessage){
        bot.sendMessage({
            to: channelId,
            message: returnMessage
        })
    }
}
//endregion

//#region Command Unassign Self-Assignable Role
function unassignSelfAssignableRolls(userName, userId, channelId, message, evt) {
    let returnMessage;
    let args = parseCommand(message);
    if (args.length > 1){
        let roleId = roleIdFromName(joinRange(args, ' ', 1), evt.d.guild_id);
        if (roleId){
            db.getSAR(evt.d.guild_id, roleId, function (err, data) {
                if (err) throw err;
                if (data.length > 0){
                    bot.removeFromRole({
                        serverID: evt.d.guild_id,
                        userID: userId,
                        roleID: roleId
                    }, function (err) {
                        if (err) {
                            if (err.statusMessage === "FORBIDDEN"){
                                bot.sendMessage({
                                    to: channelId,
                                    message: ':x: I\'m sorry, but I don\'t seem to have permission to do that right ' +
                                    'now. This is probably a mistake and should be reported to an administrator'
                                });
                            } else {
                                throw err;
                            }
                        } else {
                            bot.sendMessage({
                                to: channelId,
                                message: `:white_check_mark: ${(evt.d.member.nick || userName)} no longer has the ` +
                                    `${joinRange(args, ' ', 1)} role.`
                            });
                        }
                    });
                } else {
                    bot.sendMessage({
                        to: channelId,
                        message: ':x: That role isn\'t self removable'
                    })
                }
            });
        } else {
            returnMessage = ':x: That role isn\'t valid';
        }
    } else {
        returnMessage = ':x: A role name is required';
    }
    if (returnMessage){
        bot.sendMessage({
            to: channelId,
            message: returnMessage
        })
    }
}
//endregion

//#region stdin handling for commandline input
if (require('tty').isatty(1) || typeof v8debug === 'object' || /--debug|--inspect/.test(process.execArgv.join(' '))) {
    let rl = readLine.createInterface({
        input: process.stdin,
        output: process.stdout,
        terminal: false
    });
    rl.on('line', function(line){
        logger.debug(`User issued the command "${line}" via the command line`);
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
            let message = joinRange(cmd, ' ', 2);
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

function joinRange(arrayToCut, separator, start, end){
    if(!start) start = 0;
    if(!end) end = arrayToCut.length;
    return arrayToCut.slice(start, end).join(separator);
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