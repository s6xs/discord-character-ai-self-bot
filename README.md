# Discord Character.AI Bot

A Discord selfbot that integrates with [Character.AI](https://beta.character.ai/) to simulate conversations in specified channels.  
The bot listens for mentions, replies with AI-generated responses, and supports admin commands for maintenance.

---

## 📂 Project Structure
```
.
├── src/
│   ├── bot.js        # Core bot logic
│   └── index.js      # Entry point
├── data.json         # Configuration and user mappings
├── package.json      # Dependencies and scripts
└── res.txt           # Log output (auto-generated)
```

---

## 🚀 Features
- Connects a Discord selfbot using `discord.js-selfbot-v13`.
- Authenticates with Character.AI via `node_characterai-arm-fix`.
- Responds to mentions in **any number of configured channels**.
- Maintains user display name mappings via `data.json`.
- Admin commands for control:
  - `?help` — Show available commands.
  - `?refresh` — Refresh AI session.
  - `?update-desc` — Update character description (placeholder).
  - `?kill` — Shut down the bot.

---

## ⚙️ Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR-USERNAME/discord-character-ai-bot.git
   cd discord-character-ai-bot
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up configuration in `data.json`:
   ```json
   {
     "users": {
       "exampleuser": "Nickname"
     },
     "config": {
       "adminId": "YOUR_DISCORD_ID",
       "chatIds": [
         "DISCORD_CHANNEL_ID_1",
         "DISCORD_CHANNEL_ID_2",
         "DISCORD_CHANNEL_ID_3"
       ],
       "characterAIUrl": "CHARACTER_URL_ID",
       "discordToken": "YOUR_DISCORD_TOKEN",
       "characterAIToken": "YOUR_CHARACTER_AI_TOKEN"
     }
   }
   ```

⚠️ **Important:**  
- Never commit your real tokens to GitHub!  
- Replace sensitive fields with environment variables or `.env` file for safety.

---

## ▶️ Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

---

## 📝 Logs
Bot messages and responses are streamed to `res.txt` for efficiency.

---

## 📜 License
This project is licensed under the [MIT License](LICENSE).

---

## 🙏 Credits
- [discord.js-selfbot-v13](https://www.npmjs.com/package/discord.js-selfbot-v13)  
- [node_characterai-arm-fix](https://www.npmjs.com/package/node_characterai-arm-fix)  
- Author: **s6xs**