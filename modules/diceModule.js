let bot;

module.exports = {
    commands: [
        "roll"
    ],
    man: {
        roll: {
            title: '{0}roll [sids] [quantity]',
            description: 'Roll up to 100 dice with 100 sids!\n\n' +
            'Example Usage: `{0}roll d20 1` or just `{0}roll 20 1`'
        }
    },
    init: function (initBot) {
        bot = initBot;
    },
    roll: function (message) {
        let sids, returnMessage;
        let rolls = '';
        let dice = 1;
        if (message.args.length > 1) {
            sids = Number.parseInt(message.args[1]) || Number.parseInt(message.args[1].substr(1));
        } else {
            sids = 6;
        }
        if (!isNaN(sids)){
            if (sids >= 2 && sids <= 100){
                if (message.args.length > 2){
                    dice = Number.parseInt(message.args[2]);
                }
                if(!isNaN(dice)) {
                    if (dice > 0 && dice <= 100) {
                        for (let i = 0; i < dice; i++) {
                            let thisRoll = Math.floor((Math.random() * sids) + 1);
                            if (rolls) {
                                rolls += ', ' + thisRoll
                            } else {
                                rolls += thisRoll
                            }
                        }
                        if (dice === 1) {
                            dice = "a"
                        } else {
                            sids += "s"
                        }
                        returnMessage = ` rolled ${dice} d${sids} and got ${rolls}`
                    } else {
                        returnMessage = `, I can't roll that many dice! Please keep it between 1 and 100`;
                    }
                } else {
                    returnMessage = `, That dice amount isn't valid. Please try again. Ex: \`${message.evt.prefix}roll d20 1\``;
                }
            } else {
                returnMessage = `, I can't roll a die with that many sids! Please keep it between 2 and 100`;
            }
        } else {
            returnMessage = `, That die type isn't valid. Please try again. Ex: \`${message.evt.prefix}roll d20\``;
        }
        bot.sendMessage({
            to: message.channelId,
            message: (message.evt.d.member.nick || message.userName) + returnMessage
        });
    }
};

