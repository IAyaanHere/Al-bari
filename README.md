# Al Bari Organization Hub — Production-Ready Full-Stack System

A centralized, deployable web application engineered for **Al Bari Organization**, an Islamic education foundation managing multiple madrasas and schools.

The system empowers administrators, teachers, and public viewers to manage and access academic records, examination papers, student results, attendance registers, photographs, and educational resources with **zero recurring software licensing expenditures (₹0/month within free tiers)**.

---

## 🌟 Key Architecture Highlights

1. **Direct-to-Google-Drive Resumable Upload Engine**
   - **Zero file bytes pass through serverless functions or Vercel API routes.**
   - Browser uploads directly to Google Drive API v3 in 8 MiB chunks with Google chunk-boundary alignment.
   - Max 2 concurrent file uploads per post, individual & overall progress bars, paused/interrupted offset recovery, and automated retries.
   - Preserves both structured metadata (`_post.json`) and readable summaries (`_post.txt`) alongside files in deterministic folder paths.

2. **Client-Side Image Optimization**
   - Uses `browser-image-compression` to resize images up to 1600px at 0.8 JPEG quality before transfer.
   - Data-saving and fast on 3G/4G networks and low-end Android smartphones.
   - Explicit "Keep Original Quality" toggle for high-resolution certificate archives.
   - PDFs and office documents are never compressed.

3. **Public Viewing & Administrative Moderation**
   - **Zero Login Required for Public Dashboard:** Anyone can view approved public posts, examination results, photos, and madrasa timelines (`/`, `/dashboard`, `/madrasas`, `/madrasas/[id]`, `/posts/[id]`).
   - Moderation Workflow: Teacher uploads remain private and pending review until an administrator explicitly reviews and approves them.

4. **Secured Administrator-Created Teacher Accounts**
   - No public teacher registration. Only authenticated administrators create teacher accounts (`/admin/users`).
   - Unique usernames with secure internal identity mapping.
   - Temporary password generated for first sign-in, with mandatory password change on first login (`/first-login`).
   - Teachers can only select and upload to madrasas they are explicitly assigned to.

5. **Trilingual Localization (LTR & RTL)**
   - **English (LTR)**
   - **Hindi / हिन्दी (LTR)**
   - **Urdu / اردو (RTL)** with native Nastaliq typography and auto-directional text (`dir="auto"`) for user titles and descriptions.

6. **PC and Mobile Full Responsiveness**
   - Fully optimized for desktop monitors, tablets, and low-end mobile devices.
   - Touch-friendly interactive targets (minimum 44px), collapsible mobile drawer navigation, responsive card/grid layouts, and responsive chart viewports.

---

## 🛠️ Technology Stack

- **Framework:** Next.js 14+ (App Router, Server & Client Components)
- **Language:** TypeScript with strict type checking
- **Styling:** Tailwind CSS with deep emerald (`#064e3b`), ivory warm white (`#fcfbf7`), and muted gold accents (`#d97706`)
- **Database & Auth:** Supabase PostgreSQL, Row Level Security (RLS), and Supabase SSR Auth
- **File Storage:** Google Drive API v3 via `googleapis` with OAuth2 refresh token authentication
- **Image Compression:** `browser-image-compression`
- **Analytics Charts:** Recharts (responsive SVG rendering)
- **Validation:** Zod schemas
- **Icons:** Lucide React
- **Testing:** Vitest unit and integration test suite

---

## 📂 Google Drive Storage Architecture

All uploaded files are stored in the foundation's Google Drive under a structured, idempotent hierarchy:

```text
Al Bari Organization Data/
└── [Madrasa Name]/
    └── [YYYY]/
        └── [MM]/
            └── [category]/
                └── [YYYY-MM-DD]_[title-slug]_[shortid]/
                    ├── 01_document.pdf
                    ├── 02_photo.jpg
                    ├── _post.json
                    └── _post.txt
```

Every uploaded file is tagged with Google Drive `appProperties`:
- `postId`
- `madrasaId`
- `teacherId`
- `category`
- `source: "AlBariHub"`

---

## 🔒 Security & Row-Level Authorization (RLS)

- **Strict Server Enforcement:** Client-provided roles or permissions are never trusted. Privileged operations are verified on the server using Supabase session validation and service-role execution.
- **Deactivated Accounts:** Instantly blocked from signing in, uploading, or querying protected resources.
- **Deactivated Madrasas:** Existing records remain preserved according to public visibility rules, while new uploads to that madrasa are strictly blocked.
- **Protected File Delivery:** Private/pending educational documents are authenticated via `/api/files/[driveFileId]/thumb`. Public files have private-safe caching headers without exposing public Drive folder links.

---

## 🚀 Setup & Free-Tier Deployment Guide (₹0 Recurring Bill)

Targeting ₹0 mandatory software expenditure using **Vercel Hobby** and **Supabase Free Tier**.

### 1. Google Cloud Platform (Google Drive API)
1. Go to [Google Cloud Console](https://console.cloud.google.com).
2. Create a new project: `Al Bari Organization Hub`.
3. In **APIs & Services > Library**, search for and enable **Google Drive API**.
4. In **OAuth consent screen**:
   - User Type: **External**
   - App Name: `Al Bari Organization Hub`
   - User support email: your organization email
   - Developer contact: your email
   - Scopes: Add `https://www.googleapis.com/auth/drive.file`
   - Test users: Add your Google account email
5. In **Credentials**:
   - Click **Create Credentials > OAuth client ID**.
   - Application type: **Web application**.
   - Name: `Al Bari Hub Local Auth`.
   - Authorized redirect URIs: `http://localhost:3000/oauth2callback`.
   - Copy the generated `Client ID` and `Client Secret`.
6. Run the local OAuth refresh token helper script:
   ```bash
   node scripts/get-refresh-token.mjs
   ```
   Open the displayed URL in your browser, approve permissions, and the script will print your `GOOGLE_REFRESH_TOKEN`.

### 2. Supabase Free Database & Auth
1. Create a free account at [Supabase](https://supabase.com).
2. Create a new project: `al-bari-hub` (choose a region close to your users, e.g., Mumbai `ap-south-1`).
3. In **Project Settings > API**, copy:
   - Project URL (`NEXT_PUBLIC_SUPABASE_URL`)
   - `anon` `public` key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - `service_role` `secret` key (`SUPABASE_SERVICE_ROLE_KEY`)
4. In **SQL Editor**, open and execute `supabase/migrations/001_init.sql` to initialize all tables, enums, indexes, and RLS policies.
5. In **Authentication > Providers > Email**:
   - Enable Email provider.
   - Disable "Confirm email" if you wish admin-created teacher accounts to be active immediately without email confirmation links.

### 3. Bootstrap the Initial Administrator
1. Set the required variables in your `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
   FIRST_ADMIN_EMAIL=admin@albari.org
   ```
2. Run the admin bootstrap script:
   ```bash
   node scripts/seed-admin.mjs
   ```
   This creates the Supabase Auth user and registers the profile with the `admin` role and initial credentials.

### 4. Deploying to Vercel (Hobby Tier)
1. Push your repository to GitHub.
2. Go to [Vercel](https://vercel.com) and import the repository.
3. Add the environment variables:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GOOGLE_REFRESH_TOKEN=your-google-refresh-token
   FIRST_ADMIN_EMAIL=admin@albari.org
   MOCK_DRIVE=false
   ```
4. Click **Deploy**.

---

## 💻 Local Development & Mock Mode

The application includes a **Mock Drive Adapter** allowing 100% offline development and unit testing without Google credentials:

```bash
# Clone the repository
git clone <repo-url>
cd "al bari"

# Install dependencies
npm install

# In .env.local, ensure MOCK_DRIVE is true:
MOCK_DRIVE=true

# Run unit and integration tests
npm run test

# Run Next.js development server
npm run dev
```

Visit `http://localhost:3000` to interact with the application.

---

## 🧪 Testing Suite

Run tests via Vitest:
```bash
npm run test
```

### Covered Test Specs:
- **Unicode-aware Slug Generation:** Tested for English, Urdu, and Hindi Devanagari text with composite Unicode marks (`\p{M}`).
- **Filename Sanitization:** Path traversal striping (`../../`), control characters removal.
- **Validation:** 100 MB file limit, 20 files per post limit, MIME and extension allowlists.
- **Drive Path Construction:** Year/Month/Category/Slug hierarchy and sequential file prefixes (`01_name.pdf`).
- **RBAC Rules:** Public viewing rules, teacher-only madrasa restrictions, admin elevation, soft-deletion protection.
- **Mock Drive State Machine:** Deterministic idempotent folder IDs, mock resumable chunking, and file verification.
- **Dashboard Aggregation:** File counting, incomplete upload detection, category and madrasa breakdown.

---

## 📜 License
Developed for Al Bari Organization Islamic Education Foundation. All rights reserved.
