const fs = require("fs");

const file = "docs/index.html";
let html = fs.readFileSync(file, "utf8");

const snippet = `
<link rel="manifest" href="manifest.json">
<link rel="apple-touch-icon" href="assets/logo_192.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="Ubica-Pin">
`;

if (!html.includes("apple-mobile-web-app-title")) {
  html = html.replace("</head>", snippet + "\n</head>");
}

fs.writeFileSync(file, html);
console.log("index.html parcheado");