let bot;

module.exports = {
    commands: [
        "prefix"
    ],
    man: {
        prefix: {
            title: '{0}prefix <symbol>',
            description: '**(Admin Only)**\n' +
                'Sets the command prefix.\n\n' +
                'Example Usage: `{0}prefix !`'
        }
    },
    init: function (initBot) {
        bot = initBot;
    },
    prefix: function (message) {
        let response;
        if (bot.services.security.isAdmin(message.userId, bot.servers[message.evt.d.guild_id])) {
            if (message.args[1]){
                if (message.args[1].length === 1){
                    bot.prefix[message.evt.d.guild_id] = message.args[1];
                    bot.services.db.setSetting(message.evt.d.guild_id, 'prefix', message.args[1], function (err) {
                        if (err) throw err;
                        bot.sendMessage({
                            to: message.channelId,
                            message: ':white_check_mark: Prefix set!'
                        });
                    });
                } else {
                    response = ':x: The prefix must be exactly one character long.';
                }
            } else {
                response = `:x: A prefix to set is required. Example: \`${message.evt.prefix}prefix !\``;
            }
        } else {
            response = ':x: You must be an Admin to run that command.';
        }
        bot.sendMessage({
            to: message.channelId,
            message: response
        });
    }
};