let phantasia;

function prefix(userID, channelID, message, event) {
    let response;
    let args = message.split(' ');
    if (phantasia.services.security.isAdmin(userID, phantasia.bot.servers[event.d.guild_id])) {
        if (args[1]){
            phantasia.config.prefixes[event.d.guild_id] = args[1];
            phantasia.services.db.setSetting(event.d.guild_id, 'prefix', args[1], function (err) {
                if (err) throw err;
                phantasia.sendMessage(userID, {
                    to: channelID,
                    message: ':white_check_mark: Prefix set!'
                });
            });
        } else {
            let prefix = phantasia.config.prefixes[event.d.guild_id];
            response = `:x: A prefix to set is required. Example: \`${prefix}prefix !\``;
        }
    } else {
        response = ':x: You must be an Admin to run that command.';
    }
    if(response) {
        phantasia.sendMessage(userID, {
            to: channelID,
            message: response
        });
    }
}

module.exports = {
    init: function (bot) {
        phantasia = bot;
        phantasia.registerMessageSentMiddleware(prefix, 'prefix');
        phantasia.registerCommandHelp(
            'prefix',
            '{0}prefix [command]',
            '**(Admin Only)**\n' +
            'Sets the command prefix.\n\n' +
            'Example Usage: `{0}prefix !`'
        );
    }
};