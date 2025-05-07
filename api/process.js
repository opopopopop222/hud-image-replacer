const express = require("express");
const formidable = require("formidable");
const fs = require("fs-extra");
const path = require("path");
const { uploadToTelegram } = require("../utils/upload");
const { updateJsCode, updateBackgroundImage } = require("../utils/replace");

const app = express();
const UPLOAD_DIR = path.join(__dirname, "../uploads");
const PROCESSED_DIR = path.join(__dirname, "../processed");

app.use(express.json({ limit: "50mb" }));

app.post("/api/process", async (req, res) => {
    const form = new formidable.IncomingForm();
    form.uploadDir = path.join(UPLOAD_DIR, "temp");
    form.keepExtensions = true;

    form.parse(req, async (err, fields, files) => {
        if (err) return res.status(500).send("Ошибка загрузки");

        const jsFilePath = files.jsFile[0].filepath;
        let jsCode = fs.readFileSync(jsFilePath, "utf-8");

        // weapon
        const weaponKeys = ["0", "24", "25", "31"];
        const weaponUrls = {};
        for (const key of weaponKeys) {
            const imagePath = path.join(UPLOAD_DIR, "weapon", `${key}.png`);
            if (fs.existsSync(imagePath)) {
                const url = await uploadToTelegram(imagePath);
                if (url) weaponUrls[key] = url;
            }
        }
        jsCode = updateJsCode(jsCode, "weapon", weaponUrls);

        // logo
        const logoUrls = {};
        for (let i = 1; i <= 21; i++) {
            const imagePath = path.join(UPLOAD_DIR, "logo", `${i}.png`);
            if (fs.existsSync(imagePath)) {
                const url = await uploadToTelegram(imagePath);
                if (url) logoUrls[i] = url;
            }
        }
        jsCode = updateJsCode(jsCode, "logo", logoUrls);

        // winauth
        const authPath = path.join(UPLOAD_DIR, "winauth", "auth.png");
        if (fs.existsSync(authPath)) {
            const authUrl = await uploadToTelegram(authPath);
            if (authUrl) {
                jsCode = updateBackgroundImage(jsCode, authUrl);
            }
        }

        // Сохраняем результат
        const outputPath = path.join(PROCESSED_DIR, "mxzzxtrx.txt");
        fs.writeFileSync(outputPath, jsCode);
        res.download(outputPath, "mxzzxtrx.txt");
    });
});

module.exports = app;