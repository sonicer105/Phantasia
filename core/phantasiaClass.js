const winston = require('winston');
const Discord = require('discord.io');
const path = require('path');
const fs = require('fs');

const helpers = require('./helpers');
const webCore = require('./webCore');

// Are core class for encapsulation
module.exports = class Phantasia {
    constructor(config) {
        let self = this;
        self.config = config;
        self._initLogger();

        self.logger.info(`Bot starting at ${new Date().toISOString()}`);

        self._initDiscordBot();
        self._initExpressApp();
        self._initComponent('services', function () {
            self.services.db.getSettingsAll('prefix', function (err, prefixes) {
                if (!err) {
                    self.config.prefixes = prefixes
                }
                else self.logger.alert(err);
            });
            self._initComponent('modules', function () {
            });
        })
    }

    //#region constructor calls

    _initLogger() {
        let self = this;
        let transports = [
            new winston.transports.File({filename: 'bot.log', level: self.config.logLevel.file})
        ];

        let isDevMode = false;
        if (!process.env.NODE_ENV || process.env.NODE_ENV.toUpperCase() !== 'production'.toUpperCase()) {
            transports.push(new winston.transports.Console({format: winston.format.simple()}));
            isDevMode = true;
        }

        self.logger = winston.createLogger({
            level: self.config.logLevel.console,
            format: winston.format.json(),
            transports: transports
        });
        if (isDevMode) {
            self.logger.warn("DEVELOPMENT MODE: Development security overrides are active. Please see documentation.");
        }
    }

    _initDiscordBot() {
        let self = this;
        let connectionsFailed = 0;
        // noinspection SpellCheckingInspection
        self.bot = new Discord.Client({
            token: self.config.bot.authToken,
            autorun: false
        });
        self.bot.on('ready', function () {
            connectionsFailed = 0;
            self.logger.info(`Connected to Discord! Logged in as: ${self.bot.username} (id ${self.bot.id})`);
            if (self.config.bot.presence && self.config.bot.presence.length > 0) {
                // noinspection JSCheckFunctionSignatures
                self.bot.setPresence({
                    game: {
                        name: self.config.bot.presence
                    }
                })
            }
        });
        self.bot.on('disconnect', function (errMsg, code) {
            connectionsFailed++;
            self.logger.error(`An exception occurred while trying to log into the Discord Gateway.`);
            self.logger.error(`Response: ${errMsg} (Code ${code}). Retry in ${connectionsFailed} minute(s)`);
            setTimeout(self.bot.connect, connectionsFailed * 60 * 1000);
        });
        self.bot.on('message', self._onMessageSent.bind(self));
        self.bot.connect()
    }

    _initExpressApp() {
        let self = this;
        self.web = webCore;
        self.web.init(self);
    }

    _initComponent(component, completionCallback) {
        let self = this;
        fs.readdir(path.join(__dirname, '..', component), function (err, data) {
            if (!err) {
                for (let i in data) {
                    let module = require(path.join(__dirname, '..', component, data[i]));
                    if (module.init) module.init(self);
                }
            }
            completionCallback();
        });
    }

    //#endregion constructor calls

    //#region registration hooks for modules

    registerService(serviceName, objectToRegister) {
        let self = this;
        if (!self.services) {
            self.services = {};
        }
        self.services[serviceName] = objectToRegister
    }

    registerMessageSentMiddleware(methodReference, command = null, prefixOnly = true, priority = 0) {
        let self = this;
        if (!self.messageSentMiddleware) {
            self.messageSentMiddleware = [];
        }
        self.messageSentMiddleware.push({
            method: methodReference,
            command: command,
            prefix: prefixOnly,
            priority: priority
        });
        self.messageSentMiddleware = self.messageSentMiddleware.sort(function (a, b) {
            return b.priority - a.priority;
        })
    }

    registerCommandHelp(command, title, description) {
        let self = this;
        if (!self.helpDocs) {
            self.helpDocs = {};
        }
        self.helpDocs[command] = {
            title: title,
            description: description
        }
    }

    //#endregion registration hooks for modules

    //#region Event Handlers

    _onMessageSent(user, userID, channelID, message, event) {
        let self = this;

        if(userID === self.bot.id) return;

        let server = self.bot.servers[event.d.guild_id].name;
        let channel = self.bot.servers[event.d.guild_id].channels[channelID].name;
        self.logger.debug(`${server} > #${channel} > ${user}: ${message}`);

        let prefix = self.config.prefixes[event.d.guild_id] || self.config.bot.defaultPrefix;
        let prefixUsed = (message.indexOf(prefix) === 0);
        message = message.split(prefix).slice(1).join("");
        if(message && message.trim) message = message.trim();
        if (self.messageSentMiddleware) {
            for (let i in self.messageSentMiddleware) {
                self.command = message.split(' ')[0].toLowerCase();
                if (!self.messageSentMiddleware.hasOwnProperty(i)) continue;
                if (self.messageSentMiddleware[i].prefix && !prefixUsed) continue;
                if (typeof self.messageSentMiddleware[i].command === 'string' &&
                    self.messageSentMiddleware[i].command !== self.command) continue;
                if(self.messageSentMiddleware[i].method.bind(self, userID, channelID, message, event)()) break;
            }
        }
    }

    //#endregion Event Handlers

    //#region Bot Actions

    sendMessage(author, opts, callback) {
        let self = this;
        if (opts && typeof opts === 'object') {
            if (!opts.embed || !opts.embed.author) {
                if (!opts.embed) {
                    opts.embed = {};
                }
                if (!opts.embed.color && opts.embed.color !== 0) {
                    opts.embed.color = 0xff0000;
                }
                if (!opts.embed.author) {
                    opts.embed.author = {
                        name: 'requested by ' + self.bot.users[author].username,
                        icon_url: helpers.getUserAvatarUrl(self.bot.users[author].id, self.bot, 20)
                    }
                }
            }
            self.bot.sendMessage(opts, callback);
        }
    }

    //#endregion Bot Actions

// bot.services = {};
// bot.commands = {};
// bot.middleWare = [];
// for (let si = 0; si < config.services.length; si++) {
//     try {
//         let service = require('./services/' + config.services[si].fileName);
//         bot.services[config.services[si].importAs] = service;
//         if (service.init) {
//             service.init(bot);
//         }
//         if (service.middleWare) {
//             bot.middleWare.push(service.middleWare);
//         }
//     } catch (e) {
//         logger.error('Could not import service with name "' + config.services[si].fileName + '"');
//     }
// }
// for (let mi = 0; mi < config.modulesFileNames.length; mi++) {
//     try {
//         let module = require("./modules/" + config.modulesFileNames[mi]);
//         if (module.init) {
//             module.init(bot);
//         }
//         if (module.man) {
//             bot.man = Object.assign({}, bot.man, module.man);
//         }
//         if (module.commands) {
//             for (let ci = 0; ci < module.commands.length; ci++) {
//                 let commandName = module.commands[ci];
//                 bot.commands[commandName] = module[commandName];
//             }
//         }
//     } catch (e) {
//         logger.error('Could not import module with name "' + config.modulesFileNames[mi] + '"');
//     }
// }

// Main logic for user messages
// bot.on('message', function (userName, userId, channelId, message, evt) {
//     // Ignore messages from the bot
//     if (userId === bot.id) return;
//     let userMessage = new helpers.Message(userName, userId, channelId, message, evt, 'ServerMessage');
//     verifyPrefix(userMessage);
// });
//
// function verifyPrefix(message) {
//     if (typeof bot.prefix === "undefined") {
//         bot.services.db.getSettingsAll('prefix', function (err, data) {
//             if (err) throw err;
//             bot.prefix = data;
//             bot.prefix.default = '.';
//             executeCommand(message);
//         });
//     } else {
//         executeCommand(message);
//     }
// }
//
// function executeCommand(message) {
//     message.evt.prefix = bot.prefix[message.evt.d.guild_id] || bot.prefix.default;
//     if (message.message.substring(0, 1) === message.evt.prefix) {
//         logger.info(`${message.userName} (id ${message.userId}) issued the command '${message.message}'`);
//         if (message.args[0]) {
//             let command = message.args[0].substring(1).toLowerCase();
//             if (command && bot.commands[command]) {
//                 bot.commands[command](message)
//             }
//         }
//     }
// }

// stdin handling for commandline input
// if (require('tty').isatty(1) || typeof v8debug === 'object' || /--debug|--inspect/.test(process.execArgv.join(' '))) {
//     let rl = readLine.createInterface({
//         input: process.stdin,
//         output: process.stdout,
//         terminal: false
//     });
//     rl.on('line', function (line) {
//         logger.debug(`User issued the command "${line}" via the command line`);
//         if (line) {
//             let cmd = line.split(' ')[0].toLowerCase();
//             switch (cmd) {
//                 case 'help':
//                     logger.info('Commands: help, say');
//                     break;
//                 case 'say':
//                     say(line);
//                     break;
//                 default:
//                     logger.info('Unknown Command. Use "help" for a list of commands');
//             }
//         }
//     });
// }

    //#region exit handler

    destructor(completionCallback) {
        let self = this;
        if (self.bot && self.bot.disconnect) {
            self.bot.disconnect();
        }
        if (self.services && typeof self.services === 'object') {
            let totalServices = Object.keys(self.services).length;
            let completedServices = 0;
            for (let i in self.services) {
                if (self.services.hasOwnProperty(i)) {
                    if (self.services[i].hasOwnProperty('destructor') &&
                        typeof self.services[i].destructor === "function") {
                        self.services[i].destructor(function () {
                            completedServices++;
                            if (totalServices <= completedServices) {
                                completionCallback();
                            }
                        });
                    } else {
                        completedServices++;
                        if (totalServices <= completedServices) {
                            completionCallback();
                        }
                    }
                }
            }
        }
    }

    //#endregion exit handler
};