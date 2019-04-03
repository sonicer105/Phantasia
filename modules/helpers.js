module.exports = {
    roleIdFromName: function(roleName, serverId, bot) {
        for (let i in bot.servers[serverId].roles){
            if (bot.servers[serverId].roles[i].name.toLowerCase() === roleName.toLowerCase()){
                return bot.servers[serverId].roles[i].id;
            }
        }
        return null;
    },
    getUserAvatarUrl: function(userId, bot, size = 64) {
        return 'https://cdn.discordapp.com/avatars/' + userId + '/' + bot.users[userId].avatar + '.webp?size=' + size
    },
    parseCommand: function(str) {
        let re = /(?:")([^"]+)(?:")|([^\s"]+)(?=\s+|$)/g;
        let res=[], arr;
        while (arr = re.exec(str)) { res.push(arr[1] ? arr[1] : arr[0]);}
        return res;
    },
    joinRange: function(arrayToCut, separator, start, end){
        if(!start) start = 0;
        if(!end) end = arrayToCut.length;
        return arrayToCut.slice(start, end).join(separator);
    },
    stringFormat: function(format) {
        let args = Array.prototype.slice.call(arguments, 1);
        return format.replace(/{(\d+)}/g, function(match, number) {
            return typeof args[number] !== 'undefined'? args[number] : match;
        });
    },
    /**
     * @param {string} userName
     * @param {string} userId
     * @param {string} channelId
     * @param {string} message
     * @param {object} evt
     * @param {string} source
     * @constructor
     */
    Message: function(userName, userId, channelId, message, evt, source){
        this.userName = userName;
        this.userId = userId;
        this.channelId = channelId;
        this.message = message;
        this.args = module.exports.parseCommand(message);
        this.evt = evt;
        // noinspection JSUnusedGlobalSymbols
        this.source = source
    }
};



