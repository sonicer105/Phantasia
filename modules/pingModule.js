let phantasia;

function ping(userID, channelID) {
    phantasia.sendMessage(userID, {
        to: channelID,
        message: 'Pong!'
    });
}

module.exports = {
    init: function (bot) {
        phantasia = bot;
        phantasia.registerMessageSentMiddleware(ping, 'ping');
        phantasia.registerCommandHelp(
            'ping',
            '{0}ping',
            'Pings the bot to see if it\'s alive.\n\n' +
            'Example Usage: `{0}ping`'
        );
    }
};