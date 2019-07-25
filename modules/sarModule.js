const helpers = require('../core/helpers');

let phantasia;

//#region Command List Self-Assignable Role
function lsar(userID, channelID, message, event) {
    phantasia.services.db.getSARAll(event.d.guild_id, function (err, data) {
        if (err) throw err;
        let fields = [];
        if (data.length > 0){
            for (let i in data){
                if (!data.hasOwnProperty(i)) continue;
                if (!phantasia.bot.servers[event.d.guild_id].roles[data[i].id]) continue;
                fields.push({
                    name: phantasia.bot.servers[event.d.guild_id].roles[data[i].id].name,
                    value: data[i].settings.description || '<No Description Provided>',
                });
            }
        } if (fields.length === 0) {
            fields = [{
                name: 'None',
                value: 'No self assignable roles set.'
            }];
        }
        let prefix = phantasia.config.prefixes[event.d.guild_id];
        phantasia.sendMessage(userID, {
            to: channelID,
            embed: {
                title: 'Self-assignable Roles',
                description: `These are the roles you may give to yourself with the \`${prefix}iam\` command.`,
                color: 0x000000,
                fields: fields
            }
        });
    });
}
//endregion

//#region Command Add Self-Assignable Role
// noinspection SpellCheckingInspection
function asar(userID, channelID, message, event) {
    let response;
    // noinspection JSUnresolvedVariable
    if (phantasia.services.security.isAdmin(userID, phantasia.bot.servers[event.d.guild_id])) {
        let args = helpers.parseCommandParameters(message);
        if (args[1]){
            let id = helpers.roleIdFromName(args[1], event.d.guild_id, phantasia.bot);
            if (id) {
                let settings;
                if (args.length > 2) {
                    settings = {
                        description: helpers.joinRange(args, ' ', 2)
                    }
                } else {
                    settings = {
                        description: null
                    }
                }

                phantasia.services.db.getSAR(event.d.guild_id, id, function (err, data) {
                    if (!err && data.length <= 0) {
                        phantasia.services.db.setSAR(event.d.guild_id, id, JSON.stringify(settings), function (err) {
                            if (err) throw err;
                            phantasia.sendMessage(userID, {
                                to: channelID,
                                message: `:white_check_mark: Role ${args[1]} added!`
                            });
                        });
                    } else {
                        phantasia.sendMessage(userID, {
                            to: channelID,
                            message: `:white_check_mark: Role ${args[1]} is already self assignable.`
                        });
                    }
                });

            } else {
                response = `:x: Role ${args[1]} is not valid (quotes may be required. See help page.)`;
            }
        } else {
            response = ':x: A role name is required';
        }
    } else {
        response = `:x: You must be an Admin to run that command`;
    }
    if (response) {
        phantasia.sendMessage(userID, {
            to: channelID,
            message: response
        });
    }
}
//endregion

//#region Command Remove Self-Assignable Role
// noinspection SpellCheckingInspection
function rsar(userID, channelID, message, event) {
    let response;
    // noinspection JSUnresolvedVariable
    if (phantasia.services.security.isAdmin(userID, phantasia.bot.servers[event.d.guild_id])) {
        let command = helpers.joinRange(helpers.parseCommandParameters(message), ' ', 1);
        if (command && command.length > 0){
            let id = helpers.roleIdFromName(command, event.d.guild_id, phantasia.bot);
            if (id) {
                phantasia.services.db.getSAR(event.d.guild_id, id, function (err, data) {
                    if (!err && data.length > 0) {
                        phantasia.services.db.removeSAR(event.d.guild_id, id, function (err) {
                            if (err) throw err;
                            phantasia.sendMessage(userID, {
                                to: channelID,
                                message: `:white_check_mark: Role ${command} removed!`
                            });
                        });
                    } else {
                        phantasia.sendMessage(userID, {
                            to: channelID,
                            message: `:white_check_mark: Role ${command} already isn't self assignable.`
                        });
                    }
                });
            } else {
                response = `:x: Role ${command} is not valid`;
            }
        } else {
            response = ':x: A role is required';
        }
    } else {
        response = ':x: You must be an Admin to run that command';
    }
    if(response) {
        phantasia.sendMessage(userID, {
            to: channelID,
            message: response
        });
    }
}
//endregion

//#region Command Assigns Self-Assignable Role
function iam(userID, channelID, message, event) {
    let returnMessage;
    let prefix = phantasia.config.prefixes[event.d.guild_id];
    let args = helpers.parseCommandParameters(message);
    if (message.length > 1){
        let command = helpers.joinRange(args, ' ', 1);
        let roleID = helpers.roleIdFromName(command, event.d.guild_id, phantasia.bot);
        if (roleID){
            phantasia.services.db.getSAR(event.d.guild_id, roleID, function (err, data) {
                if (err) throw err;
                if (data.length > 0){
                    // noinspection JSCheckFunctionSignatures
                    phantasia.bot.addToRole({
                        serverID: event.d.guild_id,
                        userID: userID,
                        roleID: roleID
                    }, function (err) {
                        if (err) {
                            if (err.statusMessage === "FORBIDDEN"){
                                phantasia.sendMessage(userID, {
                                    to: channelID,
                                    message: `:x: I'm sorry, but I don't seem to have permission to do that right ` +
                                    'now. This is probably a mistake and should be reported to an administrator'
                                });
                            } else {
                                throw err;
                            }
                        } else {
                            phantasia.sendMessage(userID, {
                                to: channelID,
                                message: `:white_check_mark: You now have the ${command} role.`
                            });
                        }
                    });
                } else {
                    phantasia.sendMessage(userID, {
                        to: channelID,
                        message: `:x: That role isn't self assignable. Use \`${prefix}lsar\` for a ` +
                            `list of available roles`
                    })
                }
            });
        } else {
            returnMessage = `:x: That role isn't valid. Use \`${prefix}lsar\` for a list of ` +
                `available roles`;
        }
    } else {
        returnMessage = `:x: A role name is required. Use \`${prefix}lsar\` for a list of ` +
            `available roles`;
    }
    if (returnMessage){
        phantasia.sendMessage(userID, {
            to: channelID,
            message: returnMessage
        })
    }
}
//endregion

//#region Command Unassign Self-Assignable Role
// noinspection SpellCheckingInspection
function iamnot(userID, channelID, message, event) {
    let returnMessage;
    let prefix = phantasia.config.prefixes[event.d.guild_id];
    let args = helpers.parseCommandParameters(message);
    if (args.length > 1){
        let command = helpers.joinRange(args, ' ', 1);
        let roleId = helpers.roleIdFromName(command, event.d.guild_id, phantasia.bot);
        if (roleId){
            phantasia.services.db.getSAR(event.d.guild_id, roleId, function (err, data) {
                if (err) throw err;
                if (data.length > 0){
                    // noinspection JSCheckFunctionSignatures
                    phantasia.bot.removeFromRole({
                        serverID: event.d.guild_id,
                        userID: userID,
                        roleID: roleId
                    }, function (err) {
                        if (err) {
                            if (err.statusMessage === "FORBIDDEN"){
                                phantasia.sendMessage(userID, {
                                    to: channelID,
                                    message: ':x: I\'m sorry, but I don\'t seem to have permission to do that right ' +
                                    'now. This is probably a mistake and should be reported to an administrator'
                                });
                            } else {
                                throw err;
                            }
                        } else {
                            phantasia.sendMessage(userID, {
                                to: channelID,
                                message: `:white_check_mark: You no longer have the ${command} role.`
                            });
                        }
                    });
                } else {
                    phantasia.sendMessage(userID, {
                        to: channelID,
                        message: `:x: That role isn't self removable. Use \`${prefix}lsar\` for a ` +
                        `list of available roles`
                    })
                }
            });
        } else {
            returnMessage = `:x: That role isn't valid. Use \`${prefix}lsar\` for a list of ` +
                `available roles`;
        }
    } else {
        returnMessage = `:x: A role name is required. Use \`${prefix}lsar\` for a list of ` +
            `available roles`;
    }
    if (returnMessage){
        phantasia.sendMessage(userID, {
            to: channelID,
            message: returnMessage
        })
    }
}
//endregion

module.exports = {
    init: function (bot) {
        phantasia = bot;
        phantasia.registerMessageSentMiddleware(lsar, 'lsar');
        phantasia.registerMessageSentMiddleware(asar, 'asar');
        phantasia.registerMessageSentMiddleware(rsar, 'rsar');
        phantasia.registerMessageSentMiddleware(iam, 'iam');
        phantasia.registerMessageSentMiddleware(iamnot, 'iamnot');
        phantasia.registerCommandHelp(
            'lsar',
            '{0}lsar',
            'Lists roles you can assign yourself.\n\n' +
            'Example Usage: `{0}lsar`'
        );
        phantasia.registerCommandHelp(
            'asar',
            '{0}asar <role> [description]',
            '**(Admin Only)**\n' +
            'Adds a self assignable role.\n' +
            'Also allows you to update the description of a role\n' +
            '*Note: Role name must be in quotes if it contains spaces.*\n\n' +
            'Example Usage: `{0}asar "Event Notices" Be pinged every time there is a new event.`'
        );
        phantasia.registerCommandHelp(
            'rsar',
            '{0}rsar <role>',
            '**(Admin Only)**\n' +
            'Removes a self assignable role.\n\n' +
            'Example Usage: `{0}rsar Event Notices`'
        );
        phantasia.registerCommandHelp(
            'iam',
            '{0}iam <role>',
            'Assigns you a self assignable role.\n\n' +
            'Example Usage: `{0}iam Event Notices`\n\n' +
            'See `{0}lsar` for a list of roles'
        );
        phantasia.registerCommandHelp(
            'iamnot',
            '{0}iamnot <role>',
            'Takes a self assignable role from you.\n\n' +
            'Example Usage: `{0}iamnot Event Notices`\n\n' +
            'See `{0}lsar` for a list of roles'
        );
    }
};
