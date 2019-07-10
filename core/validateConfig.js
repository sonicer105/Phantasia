const defaults = require('../config.example');

class ConfigError extends Error {
    constructor(message) {
        if(message && typeof message === "string" && message.length > 0){
            message = message + ". Please reefer to the README.md"
        }
        // noinspection JSCheckFunctionSignatures
        super(message);
        this.name = "ConfigError"
    }
}

function validate(config) {
    if(!config) throw new ConfigError("No config file present");
    if(!config.logLevel) config.logLevel = {};
    if(!config.logLevel.console) config.logLevel.console = defaults.logLevel.console;
    if(!config.logLevel.file) config.logLevel.file = defaults.logLevel.file;
    if(!config.bot) config.bot = {};
    if(!config.bot.clientId) config.bot.clientId = "";
    if(!config.bot.clientId) config.bot.clientSecret = "";
    if(!config.bot.authToken) config.bot.authToken = "";
    if(!config.bot.presence) config.bot.presence = defaults.bot.presence;
    if(!config.bot.presence) config.bot.defaultPrefix = defaults.bot.defaultPrefix;
    if(!config.admin) config.admin = {};
    if(!config.admin.adminInterfacePort) config.admin.adminInterfacePort = defaults.admin.adminInterfacePort;
    if(!config.admin.trustProxy) config.admin.trustProxy = defaults.admin.trustProxy;
    if(!config.admin.secure) config.admin.secure = defaults.admin.secure;
    if(!config.admin.oauthCallbackBasePath) config.admin.oauthCallbackBasePath = defaults.admin.oauthCallbackBasePath;
    if(config.bot.clientId.length === 0) throw new ConfigError("No client id provided");
    if(config.bot.clientSecret.length === 0) throw new ConfigError("No client secret provided");
    if(config.bot.authToken.length === 0) throw new ConfigError("No auth token provided");
    return config;
}

module.exports = {
    validate: validate,
    ConfigError: ConfigError
};
