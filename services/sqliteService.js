const sqlite3 = require('sqlite3').verbose();
const states = Object.freeze({
    INITIAL: 1,
    OPEN: 2,
    CLOSED: 3,
});
const tables = Object.freeze({
    SETTINGS: 1
});

let state = states.INITIAL;
let logger, db;

function assertTableExists(table, callback){
    switch (table){
        case tables.SETTINGS:
            // language=SQLite
            db.run(`
                CREATE TABLE IF NOT EXISTS settings (
                    guildId text NOT NULL,
                    name text NOT NULL,
                    value text NOT NULL,
                    PRIMARY KEY (guildId, name)
                )
            `, callback);
            break;
        default:
            callback();
    }
}

module.exports = {
    init: function(initLogger) {
        logger = initLogger;
        db = new sqlite3.Database('./sqlite3.db', function(err) {
            state = states.OPEN;
            if (err) {
                logger.error(err.message);
            } else {
                logger.info('SQLite DB Connected!');
            }
        });
    },
    getSetting: function (guildId, settingName, callback){
        assertTableExists(tables.SETTINGS, callback);
    },
    getSettingsAll: function (settingName, callback){
        assertTableExists(tables.SETTINGS, function (err) {
            if (err){
                callback(err, null);
                return;
            }
            let toReturn = {};
            // language=SQLite
            db.all(`SELECT * FROM settings WHERE name = ?`, settingName, function (err, rows) {
                if (err){
                    callback(err, null);
                    return;
                }
                for (let i in rows){
                    // noinspection JSUnfilteredForInLoop
                    toReturn[rows[i].guildId] = rows[i].value
                }
                callback(null, toReturn);
            });
        });
    },
    setSetting: function (guildId, settingName, value, callback){
        assertTableExists(tables.SETTINGS, function (err) {
            if (err){
                callback(err, null);
                return;
            }
            db.run(`INSERT OR REPLACE INTO settings (guildId, name, value) values (?, ?, ?)`, guildId, settingName, value, callback);
        });
        // language=SQLite
    },
    close: function (callback) {
        state = states.CLOSED;
        db.close(callback);
    },
    states: states,
    getState: function () {
        return state;
    }
};