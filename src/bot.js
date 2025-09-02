// --- IMPORTS ---
import { Client } from 'discord.js-selfbot-v13';
import { CharacterAI } from 'node_characterai-arm-fix';
import { promises as fs } from 'node:fs';
import { encode } from 'html-entities';
import { createWriteStream, watch } from 'node:fs';

export class BotClient {
  constructor(dataFile = './data.json', logFile = 'res.txt') {
    this.DATA_FILE = dataFile;
    this.LOG_FILE = logFile;

    this.discord = new Client({ checkUpdate: false });
    this.discord.options.shardCount = 1;
    this.characterAI = new CharacterAI();

    this.config = null;
    this.users = null;
    this.dmSession = null;
    this.allowedChannels = new Set();

    // Efficient log stream
    this.logStream = createWriteStream(this.LOG_FILE, { flags: 'a' });

    this.discord.on('messageCreate', (msg) => this.handleMessage(msg));
    this.discord.on('ready', () =>
      this.logInfo(`✅ Logged in as ${this.discord.user.username}`)
    );
    this.discord.on('disconnect', () => {
      this.logError("⚠️ Disconnected. Reconnecting...");
      this.discord.login(this.config.discordToken).catch(this.logError);
    });

    process.on("unhandledRejection", (r) => this.logError("⚠️ Unhandled:", r));
    process.on("uncaughtException", (e) => this.logError("💥 Uncaught:", e));
  }

  async start() {
    try {
      await this.loadData();

      await this.discord.login(this.config.discordToken);

      await this.characterAI.authenticate(this.config.characterAIToken);
      const character = await this.characterAI.fetchCharacter(this.config.characterAIUrl);
      this.dmSession = await character.DM();

      this.watchDataFile(); // start watching for changes
      this.logInfo("🚀 Bot is up and running with live data.json sync!");
    } catch (err) {
      this.logError("❌ Startup error:", err);
    }
  }

  // --- CONFIG LOADING & SAVING ---
  async loadData() {
    const rawData = await fs.readFile(this.DATA_FILE, 'utf8');
    const { config, users } = JSON.parse(rawData);
    this.config = config;
    this.users = users;
    this.allowedChannels = new Set(config.chatIds || []);
  }

  async saveData() {
    try {
      const data = {
        config: this.config,
        users: this.users,
      };
      await fs.writeFile(this.DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
      this.logInfo("💾 data.json updated.");
    } catch (err) {
      this.logError("❌ Failed to save data.json:", err);
    }
  }

  watchDataFile() {
    let debounceTimer = null;
    watch(this.DATA_FILE, async (eventType) => {
      if (eventType === "change") {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(async () => {
          try {
            await this.loadData();
            this.logInfo("🔄 Reloaded config/users from data.json");
          } catch (err) {
            this.logError("❌ Failed to reload data.json:", err);
          }
        }, 500);
      }
    });
  }

  // --- MESSAGES ---
  async handleMessage(message) {
    try {
      if (
        message.author.id === this.discord.user.id ||
        !this.allowedChannels.has(message.channel.id) ||
        !message.mentions.has(this.discord.user)
      ) return;

      const username = encode(message.author.username);
      const userid = message.author.id;
      const displayName = this.users?.[username.toLowerCase()] || username;
      const usrmsg = message.content.replace(/<@!?(\d+)>/, '').trim();

      if (!usrmsg) return;

      if (usrmsg.startsWith('?')) {
        await this.handleAdminCommand(userid, usrmsg.toLowerCase(), message);
        return;
      }

      const aiResponse = await this.safeGetAIResponse(
        `${usrmsg}\nfrom: ${displayName}`
      );

      await message.reply(aiResponse || "I didn't get that.");
      this.logMessage(usrmsg, aiResponse, displayName);

    } catch (error) {
      this.logError("❌ handleMessage error:", error);
    }
  }

  // --- AI HANDLING ---
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

  // --- ADMIN COMMANDS ---
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
      help: async (_msg, message) => {
        const helpText =
          "Admin commands:\n```\n" +
          "?help - show this\n" +
          "?kill - exit\n" +
          "?update-desc - update description\n" +
          "?refresh - refresh AI session\n" +
          "?add-user <discord> <name> - add user mapping\n```";
        await Promise.all([
          message.channel.send(helpText),
          this.dmSession?.sendMessage(helpText)
        ]);
      },

      refresh: async (_msg, message) => {
        try {
          const character = await this.characterAI.fetchCharacter(this.config.characterAIUrl);
          this.dmSession = await character.DM();
          await message.channel.send("🔁 Session refreshed!");
        } catch (e) {
          this.logError("❌ Refresh failed:", e);
          await message.channel.send("❌ Failed to refresh session.");
        }
      },

      "update-desc": async (_msg, message) => {
        try {
          await this.characterAI.edit(); // placeholder
          await message.channel.send("✅ Description updated.");
        } catch (e) {
          this.logError("❌ Update failed:", e);
          await message.channel.send("❌ Failed to update description.");
        }
      },

      "add-user": async (msg, message) => {
        const parts = msg.split(" ");
        if (parts.length < 3) {
          return message.channel.send("Usage: ?add-user <discordName> <displayName>");
        }
        const [_, discordName, displayName] = parts;
        this.users[discordName.toLowerCase()] = displayName;
        await this.saveData();
        await message.channel.send(`✅ Added user mapping: ${discordName} → ${displayName}`);
      },
      
      kill: async (_msg, message) => {
        await message.channel.send("🛑 Shutting down...");
        process.exit(0);
      }
    };
  }

  // --- LOGGING ---
  logMessage(userMessage, aiResponse, displayName) {
    const entry = `MESSAGE from ${displayName}: ${userMessage}\nRESP: ${aiResponse}\n\n---\n\n`;
    this.logStream.write(entry);
  }

  logInfo(...a) {
    console.log(`[${new Date().toISOString()}]`, ...a);
  }

  logError(...a) {
    console.error(`[${new Date().toISOString()}]`, ...a);
  }
}
