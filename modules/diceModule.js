let phantasia;

function roll(userID, channelID, message, event) {
    let sids, returnMessage;
    let rolls = '';
    let dice = 1;
    let args = message.split(' ');
    let prefix = phantasia.config.prefixes[event.d.guild_id];
    if (args.length > 1) {
        sids = Number.parseInt(args[1]) || Number.parseInt(args[1].substr(1));
    } else {
        sids = 6;
    }
    if (!isNaN(sids)){
        if (sids >= 1 && sids <= 100){
            if (args.length > 2){
                dice = Number.parseInt(args[2]);
            }
            if(!isNaN(dice)) {
                if (dice > 0 && dice <= 100) {
                    let total = 0;
                    for (let i = 0; i < dice; i++) {
                        let thisRoll = Math.floor((Math.random() * sids) + 1);
                        if (rolls) {
                            rolls += ', ' + thisRoll
                        } else {
                            rolls += thisRoll
                        }
                        total += thisRoll
                    }
                    if (dice === 1) {
                        dice = 'a'
                    } else {
                        sids += 's'
                    }
                    returnMessage = `Rolled ${dice} d${sids} and got ${rolls}`;
                    if (dice > 1){
                        returnMessage += ` (${total} Total)`
                    }
                } else {
                    returnMessage = `I can't roll that many dice! Please keep it between 1 and 100`;
                }
            } else {
                returnMessage = `That dice amount isn't valid. Please try again. Ex: \`${prefix}roll d20 1\``;
            }
        } else {
            returnMessage = `I can't roll a die with that many sids! Please keep it between 1 and 100`;
        }
    } else {
        returnMessage = `That die type isn't valid. Please try again. Ex: \`${prefix}roll d20\``;
    }
    phantasia.sendMessage(userID, {
        to: channelID,
        message: returnMessage
    });
}

module.exports = {
    init: function (bot) {
        phantasia = bot;
        phantasia.registerMessageSentMiddleware(roll, 'roll');
        phantasia.registerCommandHelp(
            'roll',
            '{0}roll [sids] [quantity]',
            'Roll up to 100 dice with 100 sides!\n\n' +
            'Example Usage: `{0}roll d20 1` or just `{0}roll 20 1`'
        );
    }
};
