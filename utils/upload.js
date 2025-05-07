// upload.js
const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");

async function uploadToTelegram(filePath) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!token || !chatId) {
    throw new Error("Отсутствуют TELEGRAM_BOT_TOKEN или TELEGRAM_CHAT_ID");
  }

  const formData = new FormData();
  const file = fs.createReadStream(filePath);
  formData.append("photo", file);
  formData.append("chat_id", chatId);

  try {
    const res = await axios.post(`https://api.telegram.org/bot${token}/sendPhoto`, formData, {
      headers: formData.getHeaders()
    });

    const fileId = res.data.result.photo[0].file_id;

    const fileInfoRes = await axios.get(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
    const filePath = fileInfoRes.data.result.file_path;
    return `https://api.telegram.org/file/bot${token}/${filePath}`;
  } catch (err) {
    console.error("[Ошибка загрузки в Telegram]", err.message);
    return "";
  }
}

module.exports = { uploadToTelegram };
