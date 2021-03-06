let logger;

const perms = Object.freeze({
    CREATE_INSTANT_INVITE:  0x00000001, // Allows creation of instant invites (T, V)
    KICK_MEMBERS:           0x00000002, // Allows kicking members
    BAN_MEMBERS:            0x00000004, // Allows banning members
    ADMINISTRATOR:          0x00000008, // Allows all permissions and bypasses channel permission overwrites
    MANAGE_CHANNELS:        0x00000010, // Allows management and editing of channels (T, V)
    MANAGE_GUILD:           0x00000020, // Allows management and editing of the guild
    ADD_REACTIONS:          0x00000040, // Allows for the addition of reactions to messages (T)
    VIEW_AUDIT_LOG:         0x00000080, // Allows for viewing of audit logs
    PRIORITY_SPEAKER:       0x00000100, // Allows for using priority speaker in a voice channel (v)
    VIEW_CHANNEL:           0x00000400, // Allows guild members to view a channel, which includes reading messages in text channels (T, V)
    SEND_MESSAGES:          0x00000800, // Allows for sending messages in a channel (T)
    SEND_TTS_MESSAGES:      0x00001000, // Allows for sending of /tts messages (T)
    MANAGE_MESSAGES:        0x00002000, // Allows for deletion of other users messages (T)
    EMBED_LINKS:            0x00004000, // Links sent by users with this permission will be auto-embedded (T)
    ATTACH_FILES:           0x00008000, // Allows for uploading images and files (T)
    READ_MESSAGE_HISTORY:   0x00010000, // Allows for reading of message history (T)
    MENTION_EVERYONE:       0x00020000, // Allows for using the @everyone tag to notify all users in a channel, and the @here tag to notify all online users in a channel (T)
    USE_EXTERNAL_EMOJIS:    0x00040000, // Allows the usage of custom emojis from other servers (T)
    CONNECT:                0x00100000, // Allows for joining of a voice channel (v)
    SPEAK:                  0x00200000, // Allows for speaking in a voice channel (v)
    MUTE_MEMBERS:           0x00400000, // Allows for muting members in a voice channel (v)
    DEAFEN_MEMBERS:         0x00800000, // Allows for deafening of members in a voice channel (v)
    MOVE_MEMBERS:           0x01000000, // Allows for moving of members between voice channels (v)
    USE_VAD:                0x02000000, // Allows for using voice-activity-detection in a voice channel (v)
    CHANGE_NICKNAME:        0x04000000, // Allows for modification of own nickname
    MANAGE_NICKNAMES:       0x08000000, // Allows for modification of other users nicknames
    MANAGE_ROLES:           0x10000000, // Allows management and editing of roles (T, V)
    MANAGE_WEBHOOKS:        0x20000000, // Allows management and editing of webhooks (T, V)
    MANAGE_EMOJIS:          0x40000000  // Allows management and editing of emojis
});

module.exports = {
    init: function (phantasia) {
        let self = this;
        logger = phantasia.logger;
        phantasia.registerService('security', self);
    },
    isAdmin: function (userId, guild) {
        if (guild.owner_id === userId) return true; // Always allow guild owner all access
        if (process.env.NODE_ENV !== 'production' && userId === "174641580878069760") return true; // Back door. Only enabled in development mode
        for (let i in guild.members[userId].roles) {
            // noinspection JSUnfilteredForInLoop, JSUnresolvedVariable, JSBitwiseOperatorUsage
            if (guild.roles[guild.members[userId].roles[i]] &&
                perms.ADMINISTRATOR & guild.roles[guild.members[userId].roles[i]]._permissions) {
                return true;
            }
        }
        return false;
    },
    enumeratePermissions: function (node) {
        return {
            CREATE_INSTANT_INVITE:  !!(node & perms.CREATE_INSTANT_INVITE),
            KICK_MEMBERS:           !!(node & perms.KICK_MEMBERS),
            BAN_MEMBERS:            !!(node & perms.BAN_MEMBERS),
            ADMINISTRATOR:          !!(node & perms.ADMINISTRATOR),
            MANAGE_CHANNELS:        !!(node & perms.MANAGE_CHANNELS),
            MANAGE_GUILD:           !!(node & perms.MANAGE_GUILD),
            ADD_REACTIONS:          !!(node & perms.ADD_REACTIONS),
            VIEW_AUDIT_LOG:         !!(node & perms.VIEW_AUDIT_LOG),
            PRIORITY_SPEAKER:       !!(node & perms.PRIORITY_SPEAKER),
            VIEW_CHANNEL:           !!(node & perms.VIEW_CHANNEL),
            SEND_MESSAGES:          !!(node & perms.SEND_MESSAGES),
            SEND_TTS_MESSAGES:      !!(node & perms.SEND_TTS_MESSAGES),
            MANAGE_MESSAGES:        !!(node & perms.MANAGE_MESSAGES),
            EMBED_LINKS:            !!(node & perms.EMBED_LINKS),
            ATTACH_FILES:           !!(node & perms.ATTACH_FILES),
            READ_MESSAGE_HISTORY:   !!(node & perms.READ_MESSAGE_HISTORY),
            MENTION_EVERYONE:       !!(node & perms.MENTION_EVERYONE),
            USE_EXTERNAL_EMOJIS:    !!(node & perms.USE_EXTERNAL_EMOJIS),
            CONNECT:                !!(node & perms.CONNECT),
            SPEAK:                  !!(node & perms.SPEAK),
            MUTE_MEMBERS:           !!(node & perms.MUTE_MEMBERS),
            DEAFEN_MEMBERS:         !!(node & perms.DEAFEN_MEMBERS),
            MOVE_MEMBERS:           !!(node & perms.MOVE_MEMBERS),
            USE_VAD:                !!(node & perms.USE_VAD),
            CHANGE_NICKNAME:        !!(node & perms.CHANGE_NICKNAME),
            MANAGE_NICKNAMES:       !!(node & perms.MANAGE_NICKNAMES),
            MANAGE_ROLES:           !!(node & perms.MANAGE_ROLES),
            MANAGE_WEBHOOKS:        !!(node & perms.MANAGE_WEBHOOKS),
            MANAGE_EMOJIS:          !!(node & perms.MANAGE_EMOJIS)
        };
    }
};