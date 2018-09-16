const Discord = require('discord.io');
const winston = require('winston');
const readLine = require('readline');
const config = require('./config');
const helpers = require('./modules/helpers');

// Discord.io Docs: https://izy521.github.io/discord.io-docs/Discord.Client.html
// Embed Visualizer: https://leovoel.github.io/embed-visualizer/

//#region Configure logger
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

//#region Initialize Discord bot
logger.info(`Bot starting at ${new Date().toISOString()}`);
// noinspection SpellCheckingInspection
const bot = new Discord.Client({
    token: config.auth.token,
    autorun: true
});
bot.logger = logger;
bot.on('ready', function () {
    logger.info(`Connected to Discord! Logged in as: ${bot.username} (id ${bot.id})`);
    bot.setPresence({
        game: {
            name: `with hypnosis`
        }
    });
});
//#endregion

//#region Initialize services and modules
bot.services = {};
bot.commands = {};
bot.middleWare = [];
for(let si = 0; si < config.services.length; si++){
    try{
        let service = require('./services/' + config.services[si].fileName);
        bot.services[config.services[si].importAs] = service;
        if(service.init) {
            service.init(bot);
        }
        if(service.middleWare){
            bot.middleWare.push(service.middleWare);
        }
    } catch (e) {
        logger.error('Could not import service with name "' + config.services[si].fileName + '"');
    }
}
for(let mi = 0; mi < config.modulesFileNames.length; mi++){
    try{
        let module = require("./modules/" + config.modulesFileNames[mi]);
        if(module.init) {
            module.init(bot);
        }
        if(module.man) {
            bot.man = Object.assign({}, bot.man, module.man);
        }
        if(module.commands){
            for(let ci = 0; ci < module.commands.length; ci++){
                let commandName = module.commands[ci];
                bot.commands[commandName] = module[commandName];
            }
        }
    } catch (e) {
        logger.error('Could not import module with name "' + config.modulesFileNames[mi] + '"');
    }
}
//#endregion

//#region Main logic for user messages
bot.on('message', function(userName, userId, channelId, message, evt) {
    // Ignore messages from the bot
    if (userId === bot.id) return;
    let userMessage = new helpers.Message(userName, userId, channelId, message, evt, 'ServerMessage');
    verifyPrefix(userMessage);
});
function verifyPrefix(message) {
    if (typeof bot.prefix === "undefined") {
        bot.services.db.getSettingsAll('prefix', function (err, data) {
            if (err) throw err;
            bot.prefix = data;
            bot.prefix.default = '.';
            executeCommand(message);
        });
    } else {
        executeCommand(message);
    }
}
function executeCommand(message) {
    message.evt.prefix = bot.prefix[message.evt.d.guild_id] || bot.prefix.default;
    if (message.message.substring(0, 1) === message.evt.prefix) {
        logger.info(`${message.userName} (id ${message.userId}) issued the command '${message.message}'`);
        if(message.args[0]){
            let command = message.args[0].substring(1).toLowerCase();
            if(command && bot.commands[command]){
                bot.commands[command](message)
            }
        }
    }
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
    let cmd = helpers.parseCommand(line);
    if (cmd.length >= 3){
        if (bot.channels[cmd[1]]) {
            let message = helpers.joinRange(cmd, ' ', 2);
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
    bot.disconnect();
    logger.info('Caught exit event \'' + options.type + '\'');
    if(bot.services.db && (bot.services.db.getState() === bot.services.db.states.OPEN)) {
        bot.services.db.close(function (err) {
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