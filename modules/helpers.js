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
    parseCommandParameters: function (message) {
        return message.match(/\\?.|^$/g).reduce((p, c) => {
            if(c === '"'){
                p.quote ^= 1;
            }else if(!p.quote && c === ' '){
                p.a.push('');
            }else{
                p.a[p.a.length-1] += c.replace(/\\(.)/,"$1");
            }
            return  p;
        }, {a: ['']}).a
    }
};



