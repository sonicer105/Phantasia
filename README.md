# Phantasia
A Discord Bot

## Requirements
 -  NodeJS 8.x or higher (may work on earlier version but it's not supported)

## Dependencies
 - discord.io (latest)
 - winston ^3.0.0
 - sqlite ^4.0.2

## Setup
1. Copy the file [`config.example.json`](https://github.com/sonicer105/phantasia/blob/master/config.example.json) and rename it to `config.json`
2. Edit the newly created file `config.json` and change the value of `token` to your [Discord bot's Token](https://discordapp.com/developers/applications/)
3. Run the command `npm install` in the folder 

## Running the Bot
Run `node bot.js`

## Quiting the Bot
Just kill the process or exit the console it's running in. It will automatically handle the shutdown gracefully. A quite command for the console is on the todo list.

## Modification & Licensing
This software is under the ISC Liscense. You are also encourged but not required to make and share any improvments.
