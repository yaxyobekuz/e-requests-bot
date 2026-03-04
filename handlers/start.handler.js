import { Keyboard } from "grammy";

const { WEB_APP_URL } = process.env;
import { randomInt } from "crypto";
import { OtpCode } from "../models/otp-code.model.js";
import { TelegramUser } from "../models/telegram-user.model.js";

/**
 * Telegram-dan kelgan telefon raqamini +998XXXXXXXXX formatiga keltiradi
 * @param {string} raw - Telegram contact.phone_number
 * @returns {string} Normallashtirilgan telefon raqam
 */
const normalizePhone = (raw) => {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("998")) return `+${digits}`;
  if (digits.length === 9) return `+998${digits}`;
  return `+${digits}`;
};

/**
 * Ariza yuborish keyboard tugmasini qaytaradi (Web App button)
 * @returns {Keyboard}
 */
const applyKeyboard = () =>
  new Keyboard().webApp("📝 Ariza yuborish", WEB_APP_URL).resized();

/**
 * Telefon raqamga OTP yuboradi. Rate limiting tekshiradi.
 * @param {import("grammy").Context} ctx
 * @param {string} phone - Normallashtirilgan telefon raqam
 */
const sendOtp = async (ctx, phone) => {
  // Rate limiting: 60 soniyada 1 ta kod
  const sixtySecondsAgo = new Date(Date.now() - 60 * 1000);
  const recent = await OtpCode.findOne({
    phone,
    createdAt: { $gt: sixtySecondsAgo },
  });

  if (recent) {
    const secondsLeft = Math.ceil(
      (recent.createdAt.getTime() + 60_000 - Date.now()) / 1000,
    );
    return ctx.reply(
      `⏳ Iltimos, ${secondsLeft} soniya kuting va qayta urinib ko'ring.`,
      { reply_markup: applyKeyboard() },
    );
  }

  // Eski kodni o'chirib, yangi OTP yaratish
  await OtpCode.deleteOne({ phone });
  const code = randomInt(10000, 100000).toString();
  await OtpCode.create({ phone, code });

  await ctx.reply(
    `✅ Sizning kirish kodingiz:\n\n<code>${code}</code>\n\n⏱ Kod <b>30 daqiqa</b> davomida amal qiladi.\n\n🔒 Kodni hech kimga bermang.`,
    {
      parse_mode: "HTML",
      reply_markup: applyKeyboard(),
    },
  );
};

/**
 * /start komandasi uchun handler.
 * Saqlangan telefon raqam bo'lsa OTP yuboradi, bo'lmasa kontakt so'raydi.
 * @param {import("grammy").Context} ctx
 */
export const handleStart = async (ctx) => {
  const telegramId = ctx.from.id;

  const saved = await TelegramUser.findOne({ telegramId });

  if (saved) {
    return sendOtp(ctx, saved.phone);
  }

  const keyboard = new Keyboard()
    .requestContact("📱 Telefon raqamni ulashing")
    .row()
    .webApp("📝 Ariza yuborish", WEB_APP_URL)
    .resized();

  await ctx.reply(
    "👋 Assalomu alaykum!\n\n" +
      "Men <b>e-Murojaat</b> tizimining rasmiy botiman.\n\n" +
      "Tizimga kirish uchun telefon raqamingizni ulashing — kod yuboriladi.",
    {
      parse_mode: "HTML",
      reply_markup: keyboard,
    },
  );
};

/**
 * Foydalanuvchi kontakt yuborganida telefon raqamni saqlaydi va OTP yuboradi.
 * @param {import("grammy").Context} ctx
 */
export const handleContact = async (ctx) => {
  const contact = ctx.message?.contact;
  if (!contact) return;

  // Faqat o'z kontaktini ulashishga ruxsat
  if (contact.user_id !== ctx.from.id) {
    return ctx.reply("❌ Iltimos, faqat o'z telefon raqamingizni ulashing.");
  }

  const phone = normalizePhone(contact.phone_number);
  const telegramId = ctx.from.id;

  // Telefon raqamni bir marta saqlash (upsert)
  await TelegramUser.updateOne(
    { telegramId },
    { phone },
    { upsert: true },
  );

  await sendOtp(ctx, phone);
};
