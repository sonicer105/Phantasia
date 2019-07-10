const winston = require('winston');
const Discord = require('discord.io');
const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const path = require('path');
const fs = require('fs');
const request = require('request');

const helpers = require('../modules/helpers');

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
        self.web = express();

        // Set up sessions
        self.web.set('trust proxy', self.config.admin.trustProxy);
        self.web.use(session({
            store: new SQLiteStore({
                table: 'express_sessions',
                db: 'sqlite3.db',
                dir: '.',
                concurrentDB: 'true'
            }),
            secret: self.config.bot.clientSecret,
            resave: false,
            saveUninitialized: true,
            cookie: {
                secure: self.config.admin.secure,
                maxAge: 24 * 60 * 60 * 1000
            }
        }));

        // log request
        self.web.use(function (req, res, next) {
            let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            self.logger.debug(`${ip} requested page ${req.originalUrl}`);
            next();
        });

        // set EJS as the page renderer
        self.web.set('view engine', 'ejs');

        // serve static content from /public on root
        self.web.use(express.static('public'));

        // assign user info to res, if it exists in the session.
        self.web.use(function (req, res, next) {
            res.locals.userInfo = req.session.userInfo || null;
            next();
        });

        // handle index load
        self.web.get('/', function (req, res) {
            res.render('pages/index', {req: req, res: res, self: self});
            res.end();
        });

        // handle index load
        self.web.get('/login', function (req, res) {
            res.writeHead(301, {
                Location: self.generateDiscordOauthURL()
            });
            res.end();
        });

        // handle index load
        self.web.get('/logout', function (req, res) {
            req.session.destroy();
            res.writeHead(301, {
                Location: self.config.admin.oauthCallbackBasePath
            });
            res.end();
        });

        // handle index load
        self.web.get('/server/:id', function (req, res) {
            if(req.params.id && self.bot.servers[req.params.id] &&
                res.locals.userInfo && res.locals.userInfo.guilds && (
                self.services.security.enumeratePermissions(res.locals.userInfo.guilds.find(function(e){return e.id === req.params.id}).permissions).ADMINISTRATOR ||
                self.services.security.enumeratePermissions(res.locals.userInfo.guilds.find(function(e){return e.id === req.params.id}).permissions).MANAGE_GUILD)) {
                res.render('pages/server', {req: req, res: res, self: self});
            } else {
                res.status(400);
                res.render('pages/error', {req: req, res: res, self: self});
            }
            res.end();
        });

        self.web.get('/login/oauth2', function (req, res) {
            if(req.query.code && !req.query.guild_id && !req.query.permissions){
                self.getUserToken(req.query.code, function (err, httpResponse, body) {
                    if (err) throw err;
                    body = JSON.parse(body);
                    if(httpResponse.statusCode < 300){
                        req.session.token = body;
                        req.session.save();
                        self.getUserInfo(req.session.token.access_token, function (err, httpResponse, body) {
                            if (err) throw err;
                            body = JSON.parse(body);
                            if(httpResponse.statusCode < 300) {
                                req.session.userInfo = body;
                                req.session.userInfo.flags = {
                                    employee: (body.flags & (1<<0)) > 0,
                                    partner: (body.flags & (1<<1)) > 0,
                                    hyperSquadEvent: (body.flags & (1<<2)) > 0,
                                    bugHunter: (body.flags & (1<<3)) > 0,
                                    houseBravery: (body.flags & (1<<6)) > 0,
                                    houseBrilliance: (body.flags & (1<<7)) > 0,
                                    houseBalance: (body.flags & (1<<8)) > 0,
                                    earlySupporter: (body.flags & (1<<9)) > 0,
                                    teamUser: (body.flags & (1<<10)) > 0
                                };
                                req.session.save();
                                self.getUserGuilds(req.session.token.access_token, function (err, httpResponse, body) {
                                    if (err) throw err;
                                    body = JSON.parse(body);
                                    if(httpResponse.statusCode < 300) {
                                        req.session.userInfo.guilds = body;
                                        req.session.save();
                                    }
                                    res.writeHead(301, {
                                        Location: self.config.admin.oauthCallbackBasePath
                                    });
                                    res.end();
                                });
                            }
                        });
                    }
                });
            } else {
                res.writeHead(301, {
                    Location: self.config.admin.oauthCallbackBasePath
                });
                res.end();
            }
        });

        // Handle 404
        self.web.use(function (req, res) {
            res.status(404);
            res.render('pages/error', {req: req, res: res, self: self});
        });

        // Handle 500
        self.web.use(function (error, req, res, next) {
            res.status(500);
            res.render('pages/error', {req: req, res: res, self: self, error: error});
        });

        self.web.listen(self.config.admin.adminInterfacePort, function () {
            self.logger.info(`Admin interfacing listening on http port ${self.config.admin.adminInterfacePort}!`);
        });
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

    //#region oauth2 handlers

    generateDiscordOauthURL() {
        let self = this;
        let clientId = self.config.bot.clientId;
        let redirectUri = encodeURIComponent(
            self.config.admin.oauthCallbackBasePath + 'login/oauth2'
        );
        return `https://discordapp.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&` +
            `response_type=code&scope=identify%20guilds`;
    }

    generateDiscordBotInvite() {
        let self = this;
        let clientId = self.config.bot.clientId;
        let redirectUri = encodeURIComponent(
            self.config.admin.oauthCallbackBasePath + 'login/oauth2'
        );
        return `https://discordapp.com/oauth2/authorize?client_id=${clientId}&permissions=0&` +
            `redirect_uri=${redirectUri}&response_type=code&scope=bot`;
    }

    getUserToken(code, callback) {
        let self = this;

        request.post({
            url: 'https://discordapp.com/api/v6/oauth2/token',
            headers: {
                'User-Agent': 'Phantasia',
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            form: {
                'client_id': self.config.bot.clientId,
                'client_secret': self.config.bot.clientSecret,
                'grant_type': 'authorization_code',
                'redirect_uri': self.config.admin.oauthCallbackBasePath + 'login/oauth2',
                'scope': 'identify guilds',
                'code': code
            }
        }, callback);
    }

    getUserInfo(token, callback) {
        let self = this;

        request.get({
            url: 'https://discordapp.com/api/users/@me',
            headers: {
                'User-Agent': 'Phantasia'
            },
            auth: {
                'bearer': token
            }
        }, callback);
    }

    getUserGuilds(token, callback) {
        let self = this;

        request.get({
            url: 'https://discordapp.com/api/users/@me/guilds',
            headers: {
                'User-Agent': 'Phantasia'
            },
            auth: {
                'bearer': token
            }
        }, callback);
    }

    //$endregion oauth2 handlers

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