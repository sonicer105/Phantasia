const helpers = require('./helpers');
const express = require('express');
const session = require('express-session');
const SQLiteStore = require('connect-sqlite3')(session);
const request = require('request');

let phantasia;
let app;

function init(bot) {
    phantasia = bot;

    app = express();

    // Set up sessions
    app.set('trust proxy', phantasia.config.admin.trustProxy);
    app.use(session({
        store: new SQLiteStore({
            table: 'express_sessions',
            db: 'sqlite3.db',
            dir: '.',
            concurrentDB: 'true'
        }),
        secret: phantasia.config.bot.clientSecret,
        resave: false,
        saveUninitialized: true,
        cookie: {
            secure: phantasia.config.admin.secure,
            maxAge: 24 * 60 * 60 * 1000
        }
    }));

    // log request
    app.use(function (req, res, next) {
        let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        phantasia.logger.debug(`${ip} requested page ${req.originalUrl}`);
        next();
    });

    // set EJS as the page renderer
    app.set('view engine', 'ejs');

    // serve static content from /public on root
    app.use(express.static('public'));
    app.use('/css', express.static('node_modules/@fortawesome/fontawesome-free/css'));
    app.use('/webfonts', express.static('node_modules/@fortawesome/fontawesome-free/webfonts'));
    app.use(express.static('node_modules/bootstrap/dist'));
    app.use('/js', express.static('node_modules/jquery/dist'));
    app.use('/js', express.static('node_modules/popper.js/dist/umd'));

    // assign user info to res, if it exists in the session.
    app.use(function (req, res, next) {
        res.locals.userInfo = req.session.userInfo || null;
        next();
    });

    // handle index load
    app.get('/', function (req, res) {
        res.render('pages/index', {req: req, res: res, self: phantasia});
        res.end();
    });

    // handle index load
    app.get('/login', function (req, res) {
        res.writeHead(302, {
            'Cache-Control': 'no-cache no-store',
            Location: generateDiscordOauthURL()
        });
        res.end();
    });

    // handle index load
    app.get('/logout', function (req, res) {
        req.session.destroy();
        res.writeHead(302, {
            'Cache-Control': 'no-cache no-store',
            Location: phantasia.config.admin.oauthCallbackBasePath
        });
        res.end();
    });

    // handle index load
    app.get('/server/:id', function (req, res) {
        if(req.params.id && phantasia.bot.servers[req.params.id] &&
            res.locals.userInfo && res.locals.userInfo.guilds && (
                phantasia.services.security.enumeratePermissions(res.locals.userInfo.guilds.find(function(e){return e.id === req.params.id}).permissions).ADMINISTRATOR ||
                phantasia.services.security.enumeratePermissions(res.locals.userInfo.guilds.find(function(e){return e.id === req.params.id}).permissions).MANAGE_GUILD)) {
            res.render('pages/server', {req: req, res: res, self: phantasia});
        } else {
            res.status(400);
            res.render('pages/error', {req: req, res: res, self: phantasia});
        }
        res.end();
    });

    app.get('/login/oauth2', function (req, res) {
        if(req.query.code && !req.query.guild_id && !req.query.permissions){
            getUserToken(req.query.code, function (err, httpResponse, body) {
                if (err) throw err;
                body = JSON.parse(body);
                if(httpResponse.statusCode < 300){
                    req.session.token = body;
                    req.session.save();
                    getUserInfo(req.session.token.access_token, function (err, httpResponse, body) {
                        if (err) throw err;
                        body = JSON.parse(body);
                        if(httpResponse.statusCode < 300) {
                            req.session.userInfo = body;
                            req.session.userInfo.flags = {
                                employee: (body.flags & (1<<0)) > 0,
                                partner: (body.flags & (1<<1)) > 0,
                                hyperSquadEvent: (body.flags & (1<<2)) > 0,
                                bugHunter: (body.flags & (1<<3)) > 0,
                                houseBravery: (body.flags & (1<<6)) > 0,
                                houseBrilliance: (body.flags & (1<<7)) > 0,
                                houseBalance: (body.flags & (1<<8)) > 0,
                                earlySupporter: (body.flags & (1<<9)) > 0,
                                teamUser: (body.flags & (1<<10)) > 0
                            };
                            req.session.save();
                            getUserGuilds(req.session.token.access_token, function (err, httpResponse, body) {
                                if (err) throw err;
                                body = JSON.parse(body);
                                if(httpResponse.statusCode < 300) {
                                    req.session.userInfo.guilds = body;
                                    req.session.save();
                                }
                                res.writeHead(302, {
                                    'Cache-Control': 'no-cache no-store',
                                    Location: phantasia.config.admin.oauthCallbackBasePath
                                });
                                res.end();
                            });
                        }
                    });
                }
            });
        } else {
            res.writeHead(302, {
                'Cache-Control': 'no-cache no-store',
                Location: phantasia.config.admin.oauthCallbackBasePath
            });
            res.end();
        }
    });

    // Handle 404
    app.use(function (req, res) {
        res.status(404);
        res.render('pages/error', {req: req, res: res, self: phantasia});
    });

    // Handle 500
    app.use(function (error, req, res, next) {
        res.status(500);
        res.render('pages/error', {req: req, res: res, self: phantasia, error: error});
    });

    app.listen(phantasia.config.admin.adminInterfacePort, function () {
        phantasia.logger.info(`Admin interfacing listening on http port ${phantasia.config.admin.adminInterfacePort}!`);
    });
}

//#region oauth2 handlers

function generateDiscordOauthURL() {
    let clientId = phantasia.config.bot.clientId;
    let redirectUri = encodeURIComponent(
        phantasia.config.admin.oauthCallbackBasePath + 'login/oauth2'
    );
    return `https://discordapp.com/oauth2/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&` +
        `response_type=code&scope=identify%20guilds`;
}

function generateDiscordBotInvite() {
    let clientId = phantasia.config.bot.clientId;
    let redirectUri = encodeURIComponent(
        phantasia.config.admin.oauthCallbackBasePath + 'login/oauth2'
    );
    return `https://discordapp.com/oauth2/authorize?client_id=${clientId}&permissions=0&` +
        `redirect_uri=${redirectUri}&response_type=code&scope=bot`;
}

function getUserToken(code, callback) {
    request.post({
        url: 'https://discordapp.com/api/v6/oauth2/token',
        headers: {
            'User-Agent': 'Phantasia',
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        form: {
            'client_id': phantasia.config.bot.clientId,
            'client_secret': phantasia.config.bot.clientSecret,
            'grant_type': 'authorization_code',
            'redirect_uri': phantasia.config.admin.oauthCallbackBasePath + 'login/oauth2',
            'scope': 'identify guilds',
            'code': code
        }
    }, callback);
}

function getUserInfo(token, callback) {
    request.get({
        url: 'https://discordapp.com/api/users/@me',
        headers: {
            'User-Agent': 'Phantasia'
        },
        auth: {
            'bearer': token
        }
    }, callback);
}

function getUserGuilds(token, callback) {
    request.get({
        url: 'https://discordapp.com/api/users/@me/guilds',
        headers: {
            'User-Agent': 'Phantasia'
        },
        auth: {
            'bearer': token
        }
    }, callback);
}

//$endregion oauth2 handlers

module.exports = {
    init: init,
    generateDiscordBotInvite: generateDiscordBotInvite
};