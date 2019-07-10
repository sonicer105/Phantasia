const helpers = require('./helpers');
const fs = require("fs");

let phantasia;

function version(userID, channelID) {
    let content = JSON.parse(fs.readFileSync("package.json"));
    phantasia.sendMessage(userID, {
        to: channelID,
        embed: {
            title: "Phantasia Version " + content.version,
            description: "Created by " + content.author.name + "\n" +
                "Licensed under " + content.license,
            color: 0x000000,
            url: content.repository.url,
            thumbnail: {
                url: helpers.getUserAvatarUrl(phantasia.bot.id, phantasia.bot, 64),
                height: '64',
                width: '64'
            }
        }
    });
}

module.exports = {
    init: function (bot) {
        phantasia = bot;
        phantasia.registerMessageSentMiddleware(version, 'version');
        phantasia.registerCommandHelp(
            'version',
            '{0}version',
            'Shows the version of Phantasia and related information.'
        );
    }
};