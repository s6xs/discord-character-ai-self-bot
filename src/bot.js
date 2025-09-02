import { Client } from 'discord.js-selfbot-v13';
import { CharacterAI } from 'node_characterai-arm-fix';
import { promises as fs } from 'node:fs';
import { encode } from 'html-entities';

export class BotClient {
  constructor(dataFile = './data.json', logFile = 'res.txt') {
    this.DATA_FILE = dataFile;
    this.LOG_FILE = logFile;

    this.discord = new Client({ checkUpdate: false });
    this.discord.options.shardCount = 1;
    this.characterAI = new CharacterAI();

    this.dataCache = null;
    this.dmSession = null;
    this.targetChannel = null;
    this.targetChannel2 = null;
    this.targetChannel3 = null;

    this.logBuffer = [];
    setInterval(() => this.flushLogBuffer(), 3000);

    this.discord.on('messageCreate', this.handleMessage.bind(this));
    this.discord.on('ready', () => this.logInfo(`✅ Logged in as ${this.discord.user.username}`));
    this.discord.on('disconnect', () => {
      this.logError("⚠️ Disconnected. Reconnecting...");
      this.discord.login(this.config.discordToken).catch(this.logError);
    });

    process.on("unhandledRejection", (r) => this.logError("⚠️ Unhandled:", r));
    process.on("uncaughtException", (e) => this.logError("💥 Uncaught:", e));
  }

  async start() {
    try {
      const rawData = await fs.readFile(this.DATA_FILE, 'utf8');
      this.dataCache = JSON.parse(rawData);
      this.config = this.dataCache.config;
      this.users = this.dataCache.users;

      await this.discord.login(this.config.discordToken);

      await this.characterAI.authenticate(this.config.characterAIToken);
      const character = await this.characterAI.fetchCharacter(this.config.characterAIUrl);
      this.dmSession = await character.DM();

      [this.targetChannel, this.targetChannel2, this.targetChannel3] = await Promise.all([
        this.discord.channels.fetch(this.config.chatId),
        this.discord.channels.fetch(this.config.chatId2),
        this.discord.channels.fetch(this.config.chatId3)
      ]);

      this.logInfo("🚀 Bot is up and running!");
    } catch (err) {
      this.logError("❌ Startup error:", err);
    }
  }

  async handleMessage(message) {
    try {
      if (
        message.author.id === this.discord.user.id ||
        ![this.config.chatId, this.config.chatId2, this.config.chatId3].includes(message.channel.id) ||
        !message.mentions.has(this.discord.user)
      ) return;

      const username = encode(message.author.username.toLowerCase());
      const userid = encode(message.author.id);
      const displayName = this.users?.[username] || username;
      const usrmsg = message.content.replace(/<@!?(\d+)>/, '').trim();
      const userMessage = `${usrmsg}\nfrom: ${displayName}`;

      if (usrmsg.startsWith('?')) {
        await this.handleAdminCommand(userid, usrmsg.toLowerCase(), message);
        return;
      }

      const aiResponse = await this.safeGetAIResponse(userMessage);
      await message.reply(aiResponse || "I didn't get that.");
      this.logBuffer.push(`MESSAGE: ${userMessage}\nRESP: ${aiResponse}\n\n---\n\n`);

    } catch (error) {
      this.logError("❌ handleMessage error:", error);
    }
  }

  async safeGetAIResponse(messageText) {
    try {
      if (!this.dmSession) {
        const character = await this.characterAI.fetchCharacter(this.config.characterAIUrl);
        this.dmSession = await character.DM();
      }
      return this.getAIResponse(messageText);
    } catch (err) {
      this.logError("AI error:", err);
      this.dmSession = null;
      return "Error getting response.";
    }
  }

  async getAIResponse(messageText) {
    const msg = await this.dmSession.sendMessage(messageText);
    return msg.content;
  }

  async handleAdminCommand(userId, cmd, message) {
    if (userId !== this.config.adminId) {
      return message.reply("⚠️ Unauthorized.");
    }
    const cmdKey = cmd.replace("?", "").trim();
    const handler = this.adminCommands[cmdKey];
    if (handler) {
      this.logInfo(`⚙️ Admin command executed: ${cmdKey}`);
      await handler(cmd, message);
    } else {
      await message.channel.send(`"${cmd}" is not a valid command.`);
    }
  }

  get adminCommands() {
    return {
      help: async (msg, message) => {
        const helpText =
          "Admin commands:\n```\n" +
          "?help - show this\n" +
          "?kill - exit\n" +
          "?update-desc - update description\n" +
          "?refresh - refresh AI session\n```";
        await Promise.all([
          message.channel.send(helpText),
          this.dmSession?.sendMessage(helpText)
        ]);
      },
      refresh: async (msg, message) => {
        try {
          const character = await this.characterAI.fetchCharacter(this.config.characterAIUrl);
          this.dmSession = await character.DM();
          await message.channel.send("🔁 Session refreshed!");
        } catch (e) {
          this.logError("❌ Refresh failed:", e);
          await message.channel.send("❌ Failed to refresh session.");
        }
      },
      "update-desc": async (msg, message) => {
        try {
          const character = await this.characterAI.fetchCharacter(this.config.characterAIUrl);
          await this.characterAI.edit(); // Placeholder
          await message.channel.send("✅ Description updated.");
        } catch (e) {
          this.logError("❌ Update failed:", e);
          await message.channel.send("❌ Failed to update description.");
        }
      },
      kill: async (msg, message) => {
        await message.channel.send("🛑 Shutting down...");
        process.exit(0);
      }
    };
  }

  async flushLogBuffer() {
    if (this.logBuffer.length === 0) return;
    const chunk = this.logBuffer.join("");
    this.logBuffer = [];
    try {
      await fs.appendFile(this.LOG_FILE, chunk);
    } catch (err) {
      this.logError("❌ Log write error:", err);
    }
  }

  logInfo(...a) {
    console.log(`[${new Date().toISOString()}]`, ...a);
  }

  logError(...a) {
    console.error(`[${new Date().toISOString()}]`, ...a);
  }
}
