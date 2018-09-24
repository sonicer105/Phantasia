const helpers = require('./helpers');

let bot;

function simpleAction(message, actionText) {
    let returnMessage;
    if (message.evt.d.mentions.length === 0){
        let username = message.evt.d.member.nick || message.userName;
        returnMessage = helpers.stringFormat(actionText.noMention, username);
    } else if(message.evt.d.mentions[0].id === bot.id) {
        returnMessage = actionText.mentionBot;
    } else {
        let username = message.evt.d.mentions[0].member.nick || message.evt.d.mentions[0].username;
        returnMessage = helpers.stringFormat(actionText.mentionUser, username);
    }
    bot.sendMessage({
        to: message.channelId,
        message: returnMessage
    });
}

module.exports = {
    commands: [
        "snuggle",
        "boop",
        "bap",
        "iscute"
    ],
    man: {
        snuggle: {
            title: '{0}snuggle [user]',
            description: 'Gets Phantasia to snuggle you or a user.\n\n' +
                'Example Usage: `{0}snuggle @LinuxPony#3888`'
        },
        boop: {
            title: '{0}boop [user]',
            description: 'Gets Phantasia to boop you or a user.\n\n' +
                'Example Usage: `{0}boop @LinuxPony#3888`'
        },
        bap: {
            title: '{0}bap [user]',
            description: 'Gets Phantasia to bap you or a user.\n\n' +
            'Example Usage: `{0}bap @LinuxPony#3888`'
        },
        iscute: {
            title: '{0}iscute [user]',
            description: 'Determines if a user is cute.\n\n' +
                'Example Usage: `{0}iscute @LinuxPony#3888`'
        }
    },
    init: function (initBot) {
        bot = initBot;
    },
    snuggle: function (message) {
        simpleAction(message, {
            noMention: '*Wraps my arms around {0} and snuggles them.*',
            mentionBot: 'I can\'t snuggle myself T-T',
            mentionUser: '*Goes up to {0} and snuggles them.*'
        })
    },
    boop: function (message) {
        simpleAction(message, {
            noMention: '*boops {0}*',
            mentionBot: ':U I have been booped!',
            mentionUser: '*boops {0}*'
        })
    },
    bap: function (message) {
        simpleAction(message, {
            noMention: '*baps {0}*',
            mentionBot: 'T-T why would you want do that to me?',
            mentionUser: '*baps {0}*'
        })
    },
    iscute: function (message) {
        simpleAction(message, {
            noMention: 'You\'re just the cutest, {0}! :heart:',
            mentionBot: 'I\'m totally cute! :heart:',
            mentionUser: '{0} is such a cutie :heart:'
        })
    }
};

