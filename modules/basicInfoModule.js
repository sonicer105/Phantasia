const helpers = require('./helpers');
const fs = require("fs");

let bot;

module.exports = {
    commands: [
        "version"
    ],
    man: {
        version: {
            title: '{0}version',
            description: 'Shows the version of Phantasia and related information.'
        }
    },
    init: function (initBot) {
        bot = initBot;
    },
    version: function (message) {
        let content = JSON.parse(fs.readFileSync("package.json"));
        bot.sendMessage({
            to: message.channelId,
            embed: {
                title: "Phantasia Version " + content.version,
                description: "Created by LinuxPony\n" +
                "Licensed under " + content.license,
                color: 0x000000,
                url: content.repository.url,
                thumbnail: {
                    url: helpers.getUserAvatarUrl(bot.id, bot),
                    height: '64',
                    width: '64'
                },
                footer: {
                    text: "Requested by " + message.userName,
                    icon_url: helpers.getUserAvatarUrl(message.userId, bot, 16)
                }
            }
        });
    }
};

