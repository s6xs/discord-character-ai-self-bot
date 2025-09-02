import { Client } from 'discord.js-selfbot-v13';
import { CharacterAI } from 'node_characterai-arm-fix';

// Add recommended options to avoid null errors
const discord = new Client({ checkUpdate: false, patchVoice: false, patchGuild: false });
const characterAI = new CharacterAI();

export async function startBot(discordToken, characterAIToken, characterAIUrl) {
  try {
    await discord.login(discordToken);
    console.log(`✅ Logged in as ${discord.user.username}`);

    await characterAI.authenticate(characterAIToken);
    console.log("✅ Logged into Character.AI");

    const character = await characterAI.fetchCharacter(characterAIUrl);
    const dmSession = await character.DM();
    console.log("✅ Character DM session initialized");

    return { discord, characterAI, dmSession };
  } catch (error) {
    console.error("❌ Error starting bot:", error);
    throw error;
  }
}

export function sendMessage(channel, message) {
  return channel.send(message);
}

export function getCharacterAI() {
  return characterAI;
}