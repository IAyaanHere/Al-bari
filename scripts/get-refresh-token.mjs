/**
 * Google OAuth Refresh Token Generator
 * Al Bari Organization Hub
 *
 * Runs a local loopback server (http://localhost:3000/oauth2callback)
 * to receive the OAuth authorization code and print the refresh token.
 */

import http from "http";
import url from "url";
import fs from "fs";
import path from "path";
import { google } from "googleapis";

// Simple zero-dependency env loader
function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf-8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
}

loadEnv();

const SCOPES = ["https://www.googleapis.com/auth/drive.file"];
const PORT = 3000;
const REDIRECT_URI = `http://localhost:${PORT}/oauth2callback`;

async function main() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret || clientId === "dummy-client-id") {
    console.error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env.local");
    process.exit(1);
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, REDIRECT_URI);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });

  console.log("=================================================================");
  console.log("AUTHORIZATION_URL_START");
  console.log(authUrl);
  console.log("AUTHORIZATION_URL_END");
  console.log("=================================================================");
  console.log(`Waiting for Google callback on ${REDIRECT_URI} ...`);

  const server = http.createServer(async (req, res) => {
    try {
      const parsedUrl = url.parse(req.url, true);
      if (parsedUrl.pathname === "/oauth2callback") {
        const code = parsedUrl.query.code;

        if (!code) {
          res.writeHead(400, { "Content-Type": "text/html" });
          res.end("<h1>Error: No authorization code received.</h1>");
          return;
        }

        const { tokens } = await oauth2Client.getToken(code);

        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(`
          <div style="font-family: sans-serif; text-align: center; padding: 40px;">
            <h1 style="color: #065f46;">Authorization Successful!</h1>
            <p>You can close this window now. Check your terminal for the refresh token.</p>
          </div>
        `);

        console.log("\n=================================================================");
        console.log("REFRESH_TOKEN_FOUND:");
        console.log(tokens.refresh_token);
        console.log("=================================================================\n");

        // Automatically update .env.local with the new refresh token
        const envPath = path.resolve(process.cwd(), ".env.local");
        if (fs.existsSync(envPath) && tokens.refresh_token) {
          let envContent = fs.readFileSync(envPath, "utf-8");
          envContent = envContent.replace(
            /GOOGLE_REFRESH_TOKEN=.*/,
            `GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`
          );
          fs.writeFileSync(envPath, envContent, "utf-8");
          console.log("Updated .env.local automatically with GOOGLE_REFRESH_TOKEN!");
        }

        setTimeout(() => {
          server.close();
          process.exit(0);
        }, 1000);
      }
    } catch (err) {
      console.error("Token exchange failed:", err.message);
      res.writeHead(500, { "Content-Type": "text/html" });
      res.end(`<h1>Token Error: ${err.message}</h1>`);
      server.close();
      process.exit(1);
    }
  });

  server.listen(PORT);
}

main();
