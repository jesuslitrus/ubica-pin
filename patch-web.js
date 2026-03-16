const fs = require("fs");
const { execSync } = require("child_process");

// 1 export web
console.log("Exportando web...");
execSync("npx expo export --platform web", { stdio: "inherit" });

// 2 arreglar rutas _expo
let html = fs.readFileSync("dist/index.html", "utf8");
html = html.replace(/\/_expo/g, "_expo");

// 3 insertar meta tag iOS
if (!html.includes("apple-mobile-web-app-capable")) {
  html = html.replace(
    "<head>",
    `<head>
<meta name="apple-mobile-web-app-capable" content="yes">`
  );
}

fs.writeFileSync("dist/index.html", html);

// 4 borrar docs
if (fs.existsSync("docs")) {
  fs.rmSync("docs", { recursive: true, force: true });
}

// 5 renombrar dist -> docs
fs.renameSync("dist", "docs");

// 6 copiar assets
if (!fs.existsSync("docs/assets")) {
  fs.mkdirSync("docs/assets", { recursive: true });
}

fs.copyFileSync("assets/logo_192.png", "docs/assets/logo_192.png");
fs.copyFileSync("assets/logo_512.png", "docs/assets/logo_512.png");

// 7 parche adicional index.html
let docHtml = fs.readFileSync("docs/index.html", "utf8");

const snippet = `
<link rel="manifest" href="manifest.json">
<link rel="apple-touch-icon" href="assets/logo_192.png">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Ubica-Pin">
<meta name="theme-color" content="#ffffff">
`;

if (!docHtml.includes("apple-mobile-web-app-title")) {
  docHtml = docHtml.replace("</head>", snippet + "\n</head>");
}

fs.writeFileSync("docs/index.html", docHtml);

// 8 crear .nojekyll
fs.writeFileSync("docs/.nojekyll", "");

console.log("Web preparada");

// 9 git commit + push
execSync("git add .", { stdio: "inherit" });
execSync('git commit -m "update"', { stdio: "inherit" });
execSync("git push", { stdio: "inherit" });

console.log("Deploy completado");