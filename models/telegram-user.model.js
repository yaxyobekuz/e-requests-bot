import mongoose from "mongoose";

/**
 * Telegram foydalanuvchisining telefon raqamini saqlaydi.
 * Bir marta kontakt ulashilgandan so'ng qayta so'ralmayd.
 */
const telegramUserSchema = new mongoose.Schema({
  telegramId: {
    type: Number,
    required: true,
    unique: true,
    index: true,
  },
  phone: {
    type: String,
    required: true,
  },
});

export const TelegramUser = mongoose.model("TelegramUser", telegramUserSchema);
