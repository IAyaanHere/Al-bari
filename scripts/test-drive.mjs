import fs from "fs";
import path from "path";
import { google } from "googleapis";

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

async function main() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  console.log("Testing Google Drive live API connection...");
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const drive = google.drive({ version: "v3", auth: oauth2Client });

  // 1. Create or verify root folder
  const query = "mimeType = 'application/vnd.google-apps.folder' and name = 'Al Bari Organization Data' and trashed = false";
  const listRes = await drive.files.list({ q: query, fields: "files(id, name)" });

  let folderId = null;
  if (listRes.data.files && listRes.data.files.length > 0) {
    folderId = listRes.data.files[0].id;
    console.log(`ROOT FOLDER ALREADY EXISTS ON GOOGLE DRIVE! Name: ${listRes.data.files[0].name}, ID: ${folderId}`);
  } else {
    const createRes = await drive.files.create({
      requestBody: {
        name: "Al Bari Organization Data",
        mimeType: "application/vnd.google-apps.folder",
      },
      fields: "id, name",
    });
    folderId = createRes.data.id;
    console.log(`NEW ROOT FOLDER CREATED ON GOOGLE DRIVE! Name: ${createRes.data.name}, ID: ${folderId}`);
  }

  // Update DRIVE_ROOT_FOLDER_ID in .env.local
  const envPath = path.resolve(process.cwd(), ".env.local");
  let envContent = fs.readFileSync(envPath, "utf-8");
  envContent = envContent.replace(/DRIVE_ROOT_FOLDER_ID=.*/, `DRIVE_ROOT_FOLDER_ID=${folderId}`);
  fs.writeFileSync(envPath, envContent, "utf-8");
  console.log(`SAVED DRIVE_ROOT_FOLDER_ID=${folderId} to .env.local!`);
  console.log("GOOGLE DRIVE INTEGRATION IS 100% OPERATIONAL!");
}

main().catch((err) => {
  console.error("Test Drive Error:", err.message);
  process.exit(1);
});
