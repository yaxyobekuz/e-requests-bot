import "dotenv/config";
import { Bot } from "grammy";
import { connectDB } from "./db.js";
import { handleStart, handleContact } from "./handlers/start.handler.js";

const { TELEGRAM_BOT_TOKEN, MONGODB_URI, WEB_APP_URL } = process.env;

if (!TELEGRAM_BOT_TOKEN) {
  console.error("TELEGRAM_BOT_TOKEN .env faylida ko'rsatilmagan");
  process.exit(1);
}
if (!MONGODB_URI) {
  console.error("MONGODB_URI .env faylida ko'rsatilmagan");
  process.exit(1);
}
if (!WEB_APP_URL) {
  console.error("WEB_APP_URL .env faylida ko'rsatilmagan");
  process.exit(1);
}

await connectDB(MONGODB_URI);

const bot = new Bot(TELEGRAM_BOT_TOKEN);

bot.command("start", handleStart);
bot.on("message:contact", handleContact);

bot.catch((err) => {
  console.error("Bot xatolik:", err);
});

await bot.start();
console.log("Bot ishga tushdi");
