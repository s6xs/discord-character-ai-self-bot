import { promises as fs } from 'node:fs';

export const logMessage = async (message) => {
  const log = `LOG: ${message}\n`;
  try {
    await fs.appendFile('logs.txt', log);
  } catch (err) {
    console.error("File write error:", err);
  }
};

export const formatUserMessage = (username, userId, content) => {
  return `${content}\nfrom: ${username} (ID: ${userId})`;
};