import { BotClient } from './src/bot.js';

const bot = new BotClient('./data.json');
bot.start();