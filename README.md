# Phantasia
A Discord Bot

## Requirements
 - NodeJS 8.x (may work on earlier or later version but it has not been tested and is not supported).

## Setup
1. Clone the repo: `git clone https://github.com/sonicer105/Phantasia`
2. Run the command `npm install` in the repo folder
3. **Copy** the file [`config.example.json`](https://github.com/sonicer105/phantasia/blob/master/config.example.json) and rename it to `config.json`.
   - **DO NOT DELETE OR RENAME THE ORIGINAL `config.example.json`!**
4. Edit the newly created file `config.json`:
   1. Change the value of `clientId` to your [Discord bot's Client Id](https://discordapp.com/developers/applications/).
   2. Change the value of `clientSecret` to your [Discord bot's Client Secret](https://discordapp.com/developers/applications/).
   3. Change the value of `authToken` to your [Discord bot's Token](https://discordapp.com/developers/applications/).
   4. Change the value of `oauthCallbackBasePath` to the URL your bot will be accessible from, including the port. **Must include the beginning `http(s)://` and trailing slash!**
   4. Change the value of `adminInterfacePort` to the port you want your bot's admin web server to be hosted on.
5. Required setup is complete!

## Running the Bot
Use `npm run-script run` to run in production mode.

Use `npm run-script run.dev` or `node bot.js` to run in development mode.

**WARNING: Running this bot in development mode enables a security override used for development and testing purposes.
Do not use this mode unless you know what you are doing.**

## Credits
Special thanks to all these projects and their dependencies that made this project possible: 
 - [`nodejs`](https://nodejs.org/en/)
   - [`discord.io`](https://github.com/izy521/discord.io)
   - [`sqlite3 for nodejs`](https://www.npmjs.com/package/sqlite3)
   - [`winston`](https://www.npmjs.com/package/winston)
   - [`path`](https://www.npmjs.com/package/path)
   - [`request`](https://www.npmjs.com/package/request)
   - [`express`](https://expressjs.com/)
     - [`express-session`](https://expressjs.com/)
     - [`connect-sqlite3`](https://www.npmjs.com/package/connect-sqlite3)
     - [`ejs`](https://ejs.co/)
 - [`fontawesome`](https://fontawesome.com/)
 - [`jquery`](https://jquery.com/)
 - [`popper.js`](https://popper.js.org/)
 - [`bootstrap`](https://getbootstrap.com/)

## Modification & Licensing
This software is under the ISC License. You are also encouraged but not required to make and share any improvements.
