# Phantasia
A Discord Bot

## Requirements
 -  NodeJS 8.x or higher (may work on earlier version but it's not supported)

## Dependencies
 - discord.io (latest)
 - winston ^3.0.0
 - sqlite ^4.0.2

## Setup
1. Copy `config.example.json` to `config.json`
2. Edit `config.json` and change the value of `token` to your Discord bot's Token
3. Run the command `npm install` in the folder 

## Running the Bot
Run `node bot.js`

## Quiting the Bot
Just kill the process or exit the console it's running in. It will automatically handle the shutdown gracefully.