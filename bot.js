const Phantasia = require('./core/phantasiaClass');

// Discord.io Docs: https://izy521.github.io/discord.io-docs/Discord.Client.html
// Embed Visualizer: https://leovoel.github.io/embed-visualizer/

//#region Validate Config

let configValidator = require('./core/validateConfig');
let config = {};
try {
    config = configValidator.validate(require('./config'));
} catch (e) {
    if (e instanceof configValidator.ConfigError) {
        console.error(e.message || "There was a problem with the config.");
        process.env.exitCode = -1;
        return;
    } else throw e;
}

//#endregion

let phantasia = null;

//#region Handle exits gracefully and do cleanup
function exitHandler(options, exitCode) {
    if (phantasia && phantasia.logger && phantasia.logger.info) {
        phantasia.logger.info(`Caught exit event '${options.type}'`);
        phantasia.destructor(function () {
            exitHandlerFinish(options, exitCode);
        })
    } else {
        exitHandlerFinish(options, exitCode);
    }
}

function exitHandlerFinish(options, exitCode) {
    if ((exitCode || exitCode === 0) && phantasia && phantasia.logger && phantasia.logger.info) {
        phantasia.logger.info('Exited with code ' + exitCode);
    }
    if (options && options.exit) {
        process.exit(exitCode);
    }
}

//do something when app is closing
process.on('exit', exitHandler.bind(null, {type: 'exit'}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {type: 'SIGINT', exit: true}));

// catches 'kill pid' (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {type: 'SIGUSR1', exit: true}));
process.on('SIGUSR2', exitHandler.bind(null, {type: 'SIGUSR2', exit: true}));

//catches uncaught exceptions
// process.on('uncaughtException', exitHandler.bind(null, {type:'Exception',exit:true}));
//#endregion

phantasia = new Phantasia(config);