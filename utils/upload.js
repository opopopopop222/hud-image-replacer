const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");

async function uploadToTelegram(filePath) {
    const formData = new FormData();
    const file = fs.createReadStream(filePath);
    formData.append("photo", file);
    formData.append("chat_id", process.env.TELEGRAM_CHAT_ID);

    try {
        const res = await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendPhoto`, formData, {
            headers: formData.getHeaders()
        });
        const fileId = res.data.result.photo[0].file_id;

        const fileInfoRes = await axios.get(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`);
        const filePath = fileInfoRes.data.result.file_path;
        return `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${filePath}`;
    } catch (err) {
        console.error("[Ошибка загрузки] Telegram:", err.message);
        return "";
    }
}

module.exports = { uploadToTelegram };