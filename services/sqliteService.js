const sqlite3 = require('sqlite3').verbose();
const states = Object.freeze({
    INITIAL: 1,
    OPEN: 2,
    CLOSED: 3,
});
const tables = Object.freeze({
    SETTINGS: 1,
    SAR: 2
});

let state = states.INITIAL;
let logger, db;

//#region Create Table if Not Exist
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
        case tables.SAR:
            // language=SQLite
            db.run(`
                CREATE TABLE IF NOT EXISTS sar (
                    guildId text NOT NULL,
                    roleId text NOT NULL,
                    settings text NOT NULL,
                    PRIMARY KEY (guildId, roleId)
                )
            `, callback);
            break;
        default:
            callback();
    }
}
//#endregion

module.exports = {

//#region Init
    init: function(phantasia) {
        let self = this;
        logger = phantasia.logger;
        db = new sqlite3.Database('./sqlite3.db', function(err) {
            if (err) {
                logger.error(err.message);
            } else {
                state = states.OPEN;
                logger.info('SQLite DB Connected!');
                db.run( 'PRAGMA journal_mode = WAL;' );
            }
        });
        phantasia.registerService('db', self);
    },
//#endregion

//#region Settings CRUD
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
                    // noinspection JSUnfilteredForInLoop, JSUnresolvedVariable
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
            // language=SQLite
            db.run(`INSERT OR REPLACE INTO settings (guildId, name, value) values (?, ?, ?)`, guildId, settingName, value, callback);
        });
    },
//#endregion

//#region Self-Assignable Roles CRUD
    getSAR: function (guildId, roleId, callback){
        assertTableExists(tables.SAR, function (err) {
            if (err){
                callback(err, null);
                return;
            }
            let toReturn = [];
            db.get(`SELECT roleId, settings FROM sar WHERE guildId = ? AND roleId = ?`, guildId, roleId, function (err, row) {
                if (err){
                    callback(err, null);
                    return;
                }
                if (row){
                    let settings = JSON.parse(row.settings) || {};
                    toReturn[0] = {id: row.roleId, settings: settings};
                }
                callback(null, toReturn);
            })
        });
    },
    getSARAll: function (guildId, callback){
        assertTableExists(tables.SAR, function (err) {
            if (err){
                callback(err, null);
                return;
            }
            let toReturn = [];
            // language=SQLite
            db.all(`SELECT roleId, settings FROM sar WHERE guildId = ?`, guildId, function (err, rows) {
                if (err){
                    callback(err, null);
                    return;
                }
                for (let i in rows){
                    // noinspection JSUnfilteredForInLoop
                    if (rows[i].roleId){
                        // noinspection JSUnfilteredForInLoop
                        let settings = JSON.parse(rows[i].settings) || {};
                        // noinspection JSUnfilteredForInLoop, JSUnresolvedVariable
                        toReturn[i] = {id: rows[i].roleId, settings: settings};
                    }
                }
                callback(null, toReturn);
            });
        });
    },
    setSAR: function (guildId, roleId, settings, callback){
        assertTableExists(tables.SAR, function (err) {
            if (err){
                callback(err, null);
                return;
            }
            // language=SQLite
            db.run(`INSERT OR REPLACE INTO sar (guildId, roleId, settings) values (?, ?, ?)`, guildId, roleId, settings, callback);
        });
    },
    removeSAR: function (guildId, roleId, callback){
        assertTableExists(tables.SAR, function (err) {
            if (err){
                callback(err, null);
                return;
            }
            // language=SQLite
            db.run(`DELETE FROM sar WHERE guildId = ? AND roleId = ?`, guildId, roleId, callback);
        });
    },
//#endregion

//#region Destroy
    close: function (callback) {
        state = states.CLOSED;
        db.close(callback);
    },
    states: states,
    getState: function () {
        return state;
    },
//#endregion

    destructor: function (completionCallback) {
        let self = this;
        if (self.getState() === states.OPEN) {
            self.close(function (err) {
                if (err) {
                    logger.error(err);
                } else {
                    logger.info('SQLite DB closed gracefully!');
                    completionCallback();
                }
            });
        } else {
            completionCallback();
        }
    }
};