// process.js
const express = require("express");
const formidable = require("formidable");
const fs = require("fs-extra");
const path = require("path");
const os = require("os");
const { uploadToTelegram } = require("../utils/upload");
const { updateJsCode, updateBackgroundImage } = require("../utils/replace");

const app = express();

const TMP_DIR = path.join(os.tmpdir(), "uploads"); // Временная папка
const PROCESSED_DIR = path.join(os.tmpdir(), "processed");

// Инициализируем временные папки при запуске
async function initTempDirs() {
  await fs.ensureDir(TMP_DIR);
  await fs.ensureDir(path.join(TMP_DIR, "weapon"));
  await fs.ensureDir(path.join(TMP_DIR, "logo"));
  await fs.ensureDir(path.join(TMP_DIR, "winauth"));
  await fs.ensureDir(PROCESSED_DIR);
}

// Обработка загрузки файлов
app.post("/api/process", async (req, res) => {
  try {
    await initTempDirs();

    const form = new formidable.IncomingForm();
    form.uploadDir = path.join(TMP_DIR, "temp"); // Временная папка для загрузки
    form.keepExtensions = true;

    form.parse(req, async (err, fields, files) => {
      if (err) {
        console.error("[Ошибка парсинга формы]", err);
        return res.status(500).send("Ошибка загрузки файлов");
      }

      // 1. Сохраняем JS-файл во временную папку
      const jsFile = files.jsFile?.[0];
      if (!jsFile) return res.status(400).send("Не найден JS-файл");

      const jsPath = path.join(TMP_DIR, "original.js");
      await fs.copy(jsFile.filepath, jsPath);

      // 2. weapon/
      const weaponFiles = files.weaponImages || [];
      for (const file of Array.isArray(weaponFiles) ? weaponFiles : [weaponFiles]) {
        const key = file.originalFilename.replace(".png", "");
        const destPath = path.join(TMP_DIR, "weapon", `${key}.png`);
        await fs.copy(file.filepath, destPath);
      }

      // 3. logo/
      const logoFiles = files.logoImages || [];
      for (const file of Array.isArray(logoFiles) ? logoFiles : [logoFiles]) {
        const key = file.originalFilename.replace(".png", "");
        const destPath = path.join(TMP_DIR, "logo", `${key}.png`);
        await fs.copy(file.filepath, destPath);
      }

      // 4. winauth/auth.png
      const authFile = files.authImage;
      if (authFile) {
        const destPath = path.join(TMP_DIR, "winauth", "auth.png");
        await fs.copy(authFile.filepath, destPath);
      }

      // Загружаем JS-файл
      let jsCode = await fs.readFile(jsPath, "utf-8");

      // weapon: 0, 24, 25, 31
      const weaponUrls = {};
      for (const key of ["0", "24", "25", "31"]) {
        const imagePath = path.join(TMP_DIR, "weapon", `${key}.png`);
        if (await fs.pathExists(imagePath)) {
          const url = await uploadToTelegram(imagePath);
          if (url) weaponUrls[key] = url;
        }
      }

      // logo: 1-21
      const logoUrls = {};
      for (let i = 1; i <= 21; i++) {
        const imagePath = path.join(TMP_DIR, "logo", `${i}.png`);
        if (await fs.pathExists(imagePath)) {
          const url = await uploadToTelegram(imagePath);
          if (url) logoUrls[i] = url;
        }
      }

      // auth.png
      let winauthUrl = "";
      const authImagePath = path.join(TMP_DIR, "winauth", "auth.png");
      if (await fs.pathExists(authImagePath)) {
        winauthUrl = await uploadToTelegram(authImagePath);
      }

      // Обновляем JS-код
      jsCode = updateJsCode(jsCode, "weapon", weaponUrls);
      jsCode = updateJsCode(jsCode, "logo", logoUrls);
      if (winauthUrl) {
        jsCode = updateBackgroundImage(jsCode, winauthUrl);
      }

      // Сохраняем обработанный файл
      const outputPath = path.join(PROCESSED_DIR, "mxzzxtrx.txt");
      await fs.writeFile(outputPath, jsCode);

      // Отправляем как файл
      res.download(outputPath, "mxzzxtrx.txt");
    });
  } catch (error) {
    console.error("[Ошибка обработки]", error);
    res.status(500).send("Ошибка обработки файла");
  }
});

module.exports = app;
