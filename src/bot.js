import { startBot, sendMessage } from './export.js';
import fs from 'fs';

// Load config from data.json
const data = JSON.parse(fs.readFileSync('./data.json', 'utf-8'));
const DISCORD_TOKEN = data.config.discordToken;
const CHARACTERAI_TOKEN = data.config.characterAIToken;
const CHARACTERAI_URL = data.config.characterAIUrl;

async function main() {
  const { discord, dmSession } = await startBot(DISCORD_TOKEN, CHARACTERAI_TOKEN, CHARACTERAI_URL);

  discord.on('messageCreate', async (msg) => {
    // Ignore messages from the bot itself
    if (msg.author.id === discord.user.id) return;

    try {
      // Send user message to Character.AI
      const reply = await dmSession.sendAndAwaitResponse(msg.content);
      // Send Character.AI reply back to Discord channel
      await sendMessage(msg.channel, reply.text);
    } catch (err) {
      console.error('Error handling message:', err);
    }
  });
}

main();
