// replace.js
function findJsObject(code, objName) {
  const pattern = new RegExp(`${objName}:\\s*\\{([^}]*)\\}`, "s");
  const match = code.match(pattern);
  return match ? match[0] : null;
}

function updateJsCode(code, objName, urlMapping) {
  const objStr = findJsObject(code, objName);
  if (!objStr) return code;

  let content = objStr.slice(objStr.indexOf("{") + 1, objStr.lastIndexOf("}")).trim();

  // Точная замена только нужных ключей
  for (const [key, url] of Object.entries(urlMapping)) {
    const regex = new RegExp(`"${key}"\\s*:\\s*"[^"]*"`, "g");
    content = content.replace(regex, `"${key}": "${url}"`);
  }

  const newObj = objStr.split("{")[0] + "{" + content + "}";
  return code.replace(objStr, newObj);
}

function updateBackgroundImage(code, url) {
  const lines = code.split("\n");
  if (lines.length >= 475) {
    const line = lines[474];
    const match = line.match(/url\s*$([^)]*)$/);
    if (match) {
      lines[474] = line.replace(match[1], url);
      return lines.join("\n");
    }
  }
  return code;
}

module.exports = { updateJsCode, updateBackgroundImage };
