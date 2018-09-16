let bot;

module.exports = {
    commands: [
        "ping"
    ],
    man: {
        ping: {
            title: '{0}ping',
            description: 'Pings the bot to see if it\'s alive.\n\n' +
                'Example Usage: `{0}ping`'
        }
    },
    init: function (initBot) {
        bot = initBot;
    },
    ping: function (message) {
        bot.sendMessage({
            to: message.channelId,
            message: 'Pong!'
        });
    }
};

