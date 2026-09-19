import { access, readFile, writeFile } from "node:fs/promises";

try {
  const envFile = await readFile(".env", "utf8");
  for (const line of envFile.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].replace(/^(["'])(.*)\1$/, "$2");
    }
  }
} catch {
  // Vercel supplies environment variables directly.
}

const required = [
  "FIREBASE_API_KEY",
  "FIREBASE_AUTH_DOMAIN",
  "FIREBASE_PROJECT_ID",
  "FIREBASE_STORAGE_BUCKET",
  "FIREBASE_MESSAGING_SENDER_ID",
  "FIREBASE_APP_ID"
];

const missing = required.filter((name) => !process.env[name]);
if (missing.length) {
  throw new Error(`Missing Firebase environment variables: ${missing.join(", ")}`);
}

const config = Object.fromEntries(
  required.map((name) => [
    name.replace(/^FIREBASE_/, "").toLowerCase().replace(/_([a-z])/g, (_, letter) => letter.toUpperCase()),
    process.env[name]
  ])
);

const output = `window.firebaseConfig = ${JSON.stringify(config, null, 2)};\n`;
await writeFile("firebase-config.js", output, "utf8");

let sourceFile = "sari-sari-pos.html";
try {
  await access(sourceFile);
} catch {
  sourceFile = "index.html";
}

const html = await readFile(sourceFile, "utf8");
await writeFile("index.html", html, "utf8");
console.log(`Generated firebase-config.js and index.html from ${sourceFile}`);
