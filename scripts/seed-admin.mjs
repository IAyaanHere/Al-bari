/**
 * Al Bari Organization Hub - Administrator Bootstrap Script
 * Run: node scripts/seed-admin.mjs
 */

import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

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

async function bootstrapAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const adminEmail = process.env.FIRST_ADMIN_EMAIL;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Error: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.");
    process.exit(1);
  }

  if (!adminEmail) {
    console.error("Error: FIRST_ADMIN_EMAIL is required to bootstrap the initial organization administrator.");
    console.error("Please set FIRST_ADMIN_EMAIL in your .env.local file.");
    process.exit(1);
  }

  const cleanEmail = adminEmail.trim().toLowerCase();
  console.log(`Bootstrapping administrator account for: ${cleanEmail}`);

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 1. Check if auth user exists
  const { data: usersData, error: listError } = await adminClient.auth.admin.listUsers();
  if (listError) {
    console.error("Failed to query Supabase Auth users:", listError.message);
    process.exit(1);
  }

  let targetUser = usersData.users.find((u) => u.email?.toLowerCase() === cleanEmail);

  if (!targetUser) {
    console.log(`User not found in Supabase Auth. Creating new user: ${cleanEmail}`);
    const defaultPassword = process.env.FIRST_ADMIN_PASSWORD || "AlBariAdmin@2026";

    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email: cleanEmail,
      password: defaultPassword,
      email_confirm: true,
      user_metadata: {
        full_name: "Organization Administrator",
        role: "admin",
      },
    });

    if (createError || !created.user) {
      console.error("Failed to create admin user in Supabase Auth:", createError?.message);
      process.exit(1);
    }

    targetUser = created.user;
    console.log(`Created admin user ID: ${targetUser.id}`);
    if (!process.env.FIRST_ADMIN_PASSWORD) {
      console.log(`Default initial password set: ${defaultPassword}`);
      console.log("Please change this password immediately after first sign-in!");
    }
  } else {
    console.log(`Existing Supabase user found with ID: ${targetUser.id}`);
  }

  // 2. Ensure profile exists and has role 'admin'
  const { data: existingProfile } = await adminClient
    .from("profiles")
    .select("*")
    .eq("id", targetUser.id)
    .maybeSingle();

  if (!existingProfile) {
    console.log("Creating admin profile in database...");
    const { error: insertErr } = await adminClient.from("profiles").insert({
      id: targetUser.id,
      full_name: targetUser.user_metadata?.full_name || "Head Administrator",
      username: "admin",
      role: "admin",
      active: true,
      must_change_password: false,
    });

    if (insertErr) {
      console.error("Failed to create admin profile:", insertErr.message);
      process.exit(1);
    }
  } else {
    console.log(`Updating profile ${existingProfile.id} to role: 'admin'...`);
    const { error: updateErr } = await adminClient
      .from("profiles")
      .update({
        role: "admin",
        active: true,
      })
      .eq("id", targetUser.id);

    if (updateErr) {
      console.error("Failed to update profile to admin:", updateErr.message);
      process.exit(1);
    }
  }

  // 3. Record audit log
  await adminClient.from("audit_logs").insert({
    actor_id: targetUser.id,
    action: "BOOTSTRAP_ADMIN",
    target_type: "profile",
    target_id: targetUser.id,
    details: { email: cleanEmail, bootstrappedAt: new Date().toISOString() },
  });

  console.log("SUCCESS: Administrator bootstrapped successfully!");
}

bootstrapAdmin().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
