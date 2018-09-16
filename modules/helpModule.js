const helpers = require('./helpers');

let bot;

module.exports = {
    commands: [
        "help"
    ],
    man: {
        help: {
            title: '{0}help [command]',
            description: 'Displays the list of commands or gets help with a specific command.\n\n' +
                'Example Usage: `{0}help ping`'
        },
        default: {
            title: 'Not Found',
            description: 'Help documentation for that command wasn\'t found.\n' +
                'Please check the command and try again.'
        }
    },
    init: function (initBot) {
        bot = initBot;
    },
    help: function (message) {
        let title, description, fields;
        if (message.args.length > 1){
            fields = [];
            if(bot.man[message.args[1].toLowerCase()]){
                let manual = bot.man[message.args[1].toLowerCase()];
                title = helpers.stringFormat(manual.title, message.evt.prefix);
                description = helpers.stringFormat(manual.description, message.evt.prefix);
            } else {
                title = bot.man.default.title;
                description = bot.man.default.description;
            }
        } else {
            title = 'Help';
            description = 'Listing all commands. Specify a command to see more information.';
            let allCommandsRaw = Object.keys(bot.man);
            let allCommands = '';
            for (let i = 0; i < allCommandsRaw.length; i++){
                if (allCommandsRaw[i] === 'default') continue;
                if (allCommands){
                    allCommands += ", ";
                }
                allCommands += '`' + allCommandsRaw[i] + '`';
            }
            fields = [{
                name: 'Commands',
                value: allCommands
            }]
        }
        bot.sendMessage({
            to: message.channelId,
            embed: {
                title: title,
                description: description,
                color: 1,
                fields: fields
            }
        });
    }
};