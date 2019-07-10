const helpers = require('./helpers');

let phantasia;

function simpleActionSend(userID, channelID, message, event, actionText) {
    let returnMessage;
    if (event.d.mentions.length === 0){
        let username = event.d.member.nick || phantasia.bot.users[userID].username;
        returnMessage = helpers.stringFormat(actionText.noMention, username);
    } else if(event.d.mentions[0].id === phantasia.bot.id) {
        returnMessage = actionText.mentionBot;
    } else {
        let username = event.d.mentions[0].member.nick || event.d.mentions[0].username;
        returnMessage = helpers.stringFormat(actionText.mentionUser, username);
    }
    phantasia.sendMessage(userID, {
        to: channelID,
        message: returnMessage
    });
}

function simpleAction(userID, channelID, message, event) {
    let self = this;
    switch (self.command) {
        case 'snuggle':
            simpleActionSend(userID, channelID, message, event, {
                noMention: '*Wraps my arms around {0} and snuggles them.*',
                mentionBot: 'I can\'t snuggle myself T-T',
                mentionUser: '*Goes up to {0} and snuggles them.*'
            });
            break;
        case 'boop':
            simpleActionSend(userID, channelID, message, event, {
                noMention: '*boops {0}*',
                mentionBot: ':U I have been booped!',
                mentionUser: '*boops {0}*'
            });
            break;
        case 'bap':
            simpleActionSend(userID, channelID, message, event, {
                noMention: '*baps {0}*',
                mentionBot: 'T-T I don\'t want to be bapped!',
                mentionUser: '*baps {0}*'
            });
            break;
        case 'iscute':
            simpleActionSend(userID, channelID, message, event, {
                noMention: 'You\'re just the cutest, {0}! :heart:',
                mentionBot: 'I\'m totally cute! :heart:',
                mentionUser: '{0} is such a cutie :heart:'
            });
            break;
    }
}

module.exports = {
    init: function (bot) {
        phantasia = bot;
        phantasia.registerMessageSentMiddleware(simpleAction);
        phantasia.registerCommandHelp(
            'snuggle',
            '{0}snuggle [user]',
            'Gets Phantasia to snuggle you or a user.\n\nExample Usage: `{0}snuggle @LinuxPony#3888`'
        );
        phantasia.registerCommandHelp(
            'boop',
            '{0}boop [user]',
            'Gets Phantasia to boop you or a user.\n\nExample Usage: `{0}boop @LinuxPony#3888`'
        );
        phantasia.registerCommandHelp(
            'bap',
            '{0}bap [user]',
            'Gets Phantasia to bap you or a user.\n\nExample Usage: `{0}bap @LinuxPony#3888`'
        );
        phantasia.registerCommandHelp(
            'iscute',
            '{0}iscute [user]',
            'Gets Phantasia to determines if a user is cute.\n\nExample Usage: `{0}iscute @LinuxPony#3888`'
        );
    }
};

