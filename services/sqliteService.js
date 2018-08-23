const sqlite3 = require('sqlite3').verbose();
const states = Object.freeze({
    INITIAL: 1,
    OPEN: 2,
    CLOSED: 3,
});

let state = states.INITIAL;
let logger, db;

module.exports = {
    init: function(initLogger) {
        logger = initLogger;
        db = new sqlite3.Database('./sqlite3.db', function(err) {
            state = states.OPEN;
            if (err) {
                logger.error(err.message);
            } else {
                logger.info("SQLite DB Connected!");
            }
        });
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