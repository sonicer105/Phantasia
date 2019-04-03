const helpers = require('./helpers');

let bot;

module.exports = {
    commands: [
        "lsar",
        "asar",
        "rsar",
        "iam",
        "iamnot"
    ],
    man: {
        lsar: {
            title: '{0}lsar',
            description: 'Lists roles you can assign yourself.\n\n' +
                'Example Usage: `{0}lsar`'
        },
        asar: {
            title: '{0}asar <role> [description]',
            description: '**(Admin Only)**\n' +
                'Adds a self assignable role.\n' +
                'Also allows you to update the description of a role\n' +
                '*Note: Role name must be in quotes if it contains spaces.*\n\n' +
                'Example Usage: `{0}asar "Event Notices" Be pinged every time there is a new event.`'
        },
        rsar: {
            title: '{0}rsar <role>',
            description: '**(Admin Only)**\n' +
                'Removes a self assignable role.\n\n' +
                'Example Usage: `{0}rsar Event Notices`'
        },
        iam: {
            title: '{0}iam <role>',
            description: 'Assigns you a self assignable role.\n\n' +
                'Example Usage: `{0}iam Event Notices`\n\n' +
                'See `{0}lsar` for a list of roles'
        },
        iamnot: {
            title: '{0}iamnot <role>',
            description: 'Takes a self assignable role from you.\n\n' +
                'Example Usage: `{0}iamnot Event Notices`\n\n' +
                'See `{0}lsar` for a list of roles'
        }
    },
    init: function (initBot) {
        bot = initBot;
    },

//#region Command List Self-Assignable Role
    lsar: function(message) {
        bot.services.db.getSARAll(message.evt.d.guild_id, function (err, data) {
            if (err) throw err;
            let fields = [];
            if (data.length > 0){
                for (let i in data){
                    if (!data.hasOwnProperty(i)) continue;
                    if (!bot.servers[message.evt.d.guild_id].roles[data[i].id]) continue;
                    fields.push({
                        name: bot.servers[message.evt.d.guild_id].roles[data[i].id].name,
                        value: data[i].settings.description || '<No Description Provided>',
                    });
                }
            } if (fields.length === 0) {
                fields = [{
                    name: 'None',
                    value: 'No self assignable roles set.'
                }];
            }
            bot.sendMessage({
                to: message.channelId,
                embed: {
                    title: 'Self-assignable Roles',
                    description: `These are the roles you may give to yourself with the \`${message.evt.prefix}iam\` command.`,
                    color: 0x000000,
                    fields: fields
                }
            });
        });
    },
//endregion

//#region Command Add Self-Assignable Role
    asar: function(message) {
        let response;
        if (bot.services.security.isAdmin(message.userId, bot.servers[message.evt.d.guild_id])) {
            if (message.args[1]){
                let id = helpers.roleIdFromName(message.args[1], message.evt.d.guild_id, bot);
                if (id) {
                    let settings;
                    if (message.args.length > 2) {
                        settings = {
                            description: helpers.joinRange(message.args, ' ', 2)
                        }
                    } else {
                        settings = {
                            description: null
                        }
                    }
                    bot.services.db.setSAR(message.evt.d.guild_id, id, JSON.stringify(settings), function (err) {
                        if (err) throw err;
                        bot.sendMessage({
                            to: message.channelId,
                            message: `:white_check_mark: Role ${message.args[1]} added!`
                        });
                    });
                } else {
                    response = `:x: Role ${message.args[1]} is not valid`;
                }
            } else {
                response = ':x: A role name is required';
            }
        } else {
            response = `:x: You must be an Admin to run that command`;
        }
        bot.sendMessage({
            to: message.channelId,
            message: response
        });
    },
//endregion

//#region Command Remove Self-Assignable Role
    rsar: function(message) {
        let response;
        if (bot.services.security.isAdmin(message.userId, bot.servers[message.evt.d.guild_id])) {
            if (message.args[1]){
                let id = helpers.roleIdFromName(helpers.joinRange(message.args, ' ', 1), message.evt.d.guild_id, bot);
                if (id) {
                    bot.services.db.removeSAR(message.evt.d.guild_id, id, function (err) {
                        if (err) throw err;
                        bot.sendMessage({
                            to: message.channelId,
                            message: `:white_check_mark: Role ${message.args[1]} removed!`
                        });
                    });
                } else {
                    response = `:x: Role ${helpers.joinRange(message.args, ' ', 1)} is not valid`;
                }
            } else {
                response = ':x: A role is required';
            }
        } else {
            response = ':x: You must be an Admin to run that command';
        }
        bot.sendMessage({
            to: message.channelId,
            message: response
        });
    },
//endregion

//#region Command Assigns Self-Assignable Role
    iam: function(message) {
        let returnMessage;
        if (message.args.length > 1){
            let roleId = helpers.roleIdFromName(helpers.joinRange(message.args, ' ', 1), message.evt.d.guild_id, bot);
            if (roleId){
                bot.services.db.getSAR(message.evt.d.guild_id, roleId, function (err, data) {
                    if (err) throw err;
                    if (data.length > 0){
                        bot.addToRole({
                            serverID: message.evt.d.guild_id,
                            userID: message.userId,
                            roleID: roleId
                        }, function (err) {
                            if (err) {
                                if (err.statusMessage === "FORBIDDEN"){
                                    bot.sendMessage({
                                        to: message.channelId,
                                        message: `:x: I'm sorry, but I don't seem to have permission to do that right ` +
                                        'now. This is probably a mistake and should be reported to an administrator'
                                    });
                                } else {
                                    throw err;
                                }
                            } else {
                                bot.sendMessage({
                                    to: message.channelId,
                                    message: `:white_check_mark: ${(message.evt.d.member.nick || message.userName)} now has the ` +
                                        `${helpers.joinRange(message.args, ' ', 1)} role.`
                                });
                            }
                        });
                    } else {
                        bot.sendMessage({
                            to: message.channelId,
                            message: `:x: That role isn't self assignable. Use \`${message.evt.prefix}lsar\` for a ` +
                                `list of available roles`
                        })
                    }
                });
            } else {
                returnMessage = `:x: That role isn't valid. Use \`${message.evt.prefix}lsar\` for a list of ` +
                    `available roles`;
            }
        } else {
            returnMessage = `:x: A role name is required. Use \`${message.evt.prefix}lsar\` for a list of ` +
                `available roles`;
        }
        if (returnMessage){
            bot.sendMessage({
                to: message.channelId,
                message: returnMessage
            })
        }
    },
//endregion

//#region Command Unassign Self-Assignable Role
    iamnot: function(message) {
        let returnMessage;
        if (message.args.length > 1){
            let roleId = helpers.roleIdFromName(helpers.joinRange(message.args, ' ', 1), message.evt.d.guild_id, bot);
            if (roleId){
                bot.services.db.getSAR(message.evt.d.guild_id, roleId, function (err, data) {
                    if (err) throw err;
                    if (data.length > 0){
                        bot.removeFromRole({
                            serverID: message.evt.d.guild_id,
                            userID: message.userId,
                            roleID: roleId
                        }, function (err) {
                            if (err) {
                                if (err.statusMessage === "FORBIDDEN"){
                                    bot.sendMessage({
                                        to: message.channelId,
                                        message: ':x: I\'m sorry, but I don\'t seem to have permission to do that right ' +
                                        'now. This is probably a mistake and should be reported to an administrator'
                                    });
                                } else {
                                    throw err;
                                }
                            } else {
                                bot.sendMessage({
                                    to: message.channelId,
                                    message: `:white_check_mark: ${(message.evt.d.member.nick || message.userName)} no longer has the ` +
                                        `${helpers.joinRange(message.args, ' ', 1)} role.`
                                });
                            }
                        });
                    } else {
                        bot.sendMessage({
                            to: message.channelId,
                            message: `:x: That role isn't self removable. Use \`${message.evt.prefix}lsar\` for a ` +
                            `list of available roles`
                        })
                    }
                });
            } else {
                returnMessage = `:x: That role isn't valid. Use \`${message.evt.prefix}lsar\` for a list of ` +
                    `available roles`;
            }
        } else {
            returnMessage = `:x: A role name is required. Use \`${message.evt.prefix}lsar\` for a list of ` +
                `available roles`;
        }
        if (returnMessage){
            bot.sendMessage({
                to: message.channelId,
                message: returnMessage
            })
        }
    }
//endregion
};

