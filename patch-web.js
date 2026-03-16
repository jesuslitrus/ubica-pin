const fs = require("fs");
const { execSync } = require("child_process");

// 1 export web
console.log("Exportando web...");
execSync("npx expo export --platform web", { stdio: "inherit" });

// 2 arreglar rutas _expo
let html = fs.readFileSync("dist/index.html", "utf8");
html = html.replace(/\/_expo/g, "_expo");

fs.writeFileSync("dist/index.html", html);

// 3 borrar docs
if (fs.existsSync("docs")) {
  fs.rmSync("docs", { recursive: true, force: true });
}

// 4 renombrar dist -> docs
fs.renameSync("dist", "docs");

// 5 copiar assets
if (!fs.existsSync("docs/assets")) {
  fs.mkdirSync("docs/assets", { recursive: true });
}

fs.copyFileSync("assets/logo_192.png", "docs/assets/logo_192.png");
fs.copyFileSync("assets/logo_512.png", "docs/assets/logo_512.png");

// 6 parche adicional index.html
let docHtml = fs.readFileSync("docs/index.html", "utf8");

const snippet = `
<link rel="apple-touch-icon" href="assets/logo_192.png">
<meta name="theme-color" content="#ffffff">
`;

if (!docHtml.includes("apple-touch-icon")) {
  docHtml = docHtml.replace("</head>", snippet + "\n</head>");
}

fs.writeFileSync("docs/index.html", docHtml);

// 7 crear .nojekyll
fs.writeFileSync("docs/.nojekyll", "");

console.log("Web preparada");

// 8 git commit + push
execSync("git add .", { stdio: "inherit" });
execSync('git commit -m "update"', { stdio: "inherit" });
execSync("git push", { stdio: "inherit" });

console.log("Deploy completado");