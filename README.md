# Discord Bot Export

## Overview
This project is a Discord bot that integrates with the Character.AI API. It is designed to handle messages in specified Discord channels and respond using AI-generated content. The bot can be controlled via admin commands and logs interactions for review.

## Project Structure
```
discord-bot-export
├── src
│   ├── bot.js          # Main logic for the Discord bot
│   ├── export.js       # Functionality export module
│   └── utils
│       └── index.js    # Utility functions
├── data.json           # User data and configurations
├── package.json        # npm configuration file
├── .env                # Environment variables
└── README.md           # Project documentation
```

## Setup Instructions

1. **Clone the repository:**
   ```
   git clone <repository-url>
   cd discord-bot-export
   ```

2. **Install dependencies:**
   Ensure you have Node.js installed, then run:
   ```
   npm install
   ```

3. **Configure environment variables:**
   Create a `.env` file in the root directory and add the following variables:
   ```
   DISC_TOKEN=<your_discord_token>
   CAI_TOKEN=<your_character_ai_token>
   DISC_CHAT_ID=<your_discord_chat_id>
   DISC_CHAT_ID2=<your_second_discord_chat_id>
   DISC_ADMIN_ID=<your_discord_admin_id>
   CAI_URL=<your_character_ai_url>
   ```

4. **Run the bot:**
   Use the following command to start the bot:
   ```
   node src/bot.js
   ```

## Usage Guidelines
- The bot listens for messages in specified channels and responds using AI-generated content.
- Admin commands can be issued by the user specified in the `DISC_ADMIN_ID` environment variable.
- The bot logs all interactions in a file for review.

## Features
- Integration with Discord and Character.AI.
- Admin command functionality for bot management.
- Message logging for tracking interactions.

## Contributing
Feel free to submit issues or pull requests to improve the bot's functionality or documentation.