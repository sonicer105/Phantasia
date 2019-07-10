const helpers = require('./helpers');

let phantasia;

function help(userID, channelID, message, event) {
    let title, description, fields, args, prefix;
    args = message.split(' ');
    if (args.length > 1){
        prefix = phantasia.config.prefixes[event.d.guild_id];
        fields = [];
        if(phantasia.helpDocs[args[1].toLowerCase()]){
            let command = phantasia.helpDocs[args[1].toLowerCase()];
            title = helpers.stringFormat(command.title, prefix);
            description = helpers.stringFormat(command.description, prefix);
        } else {
            title = 'Not Found';
            description = 'Help documentation for that command wasn\'t found.\n' +
                'Please check the command and try again.'
        }
    } else {
        title = 'Help';
        description = 'Listing all commands. Specify a command to see more information.';
        let allCommandsRaw = Object.keys(phantasia.helpDocs);
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
    phantasia.sendMessage(userID, {
        to: channelID,
        embed: {
            title: title,
            description: description,
            color: 0x000000,
            fields: fields
        }
    });
}

module.exports = {
    init: function (bot) {
        phantasia = bot;
        phantasia.registerMessageSentMiddleware(help, 'help');
        phantasia.registerCommandHelp(
            'help',
            '{0}help [command]',
            'Displays the list of commands or gets help with a specific command.\n\n' +
            'Example Usage: `{0}help ping`'
        );
    }
};