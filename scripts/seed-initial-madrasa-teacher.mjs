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

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing SUPABASE credentials in .env.local");
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("Connecting to Supabase...");

  // 1. Create Madrasa: Darul Uloom Alamgir Ahmednagar
  const madrasaName = "Darul Uloom Alamgir Ahmednagar";
  const city = "Ahmednagar";

  let { data: existingMadrasa } = await supabase
    .from("madrasas")
    .select("*")
    .ilike("name", `%Alamgir%`)
    .maybeSingle();

  if (!existingMadrasa) {
    console.log(`Inserting Madrasa: ${madrasaName}...`);
    const { data: newMadrasa, error: madrasaErr } = await supabase
      .from("madrasas")
      .insert({
        name: madrasaName,
        city: city,
        contact_person: "Head In-Charge (Ahmednagar)",
        active: true,
      })
      .select()
      .single();

    if (madrasaErr) {
      console.error("Error creating madrasa:", madrasaErr);
      process.exit(1);
    }
    existingMadrasa = newMadrasa;
    console.log("Madrasa created with ID:", existingMadrasa.id);
  } else {
    console.log("Madrasa already exists with ID:", existingMadrasa.id, existingMadrasa.name);
  }

  // 2. Create Teacher: alamgir_teacher
  const teacherUsername = "alamgir_teacher";
  const teacherFullName = "Teacher - Darul Uloom Alamgir";
  const teacherEmail = `${teacherUsername}@internal.albari.org`;
  const teacherPassword = "AlamgirTeacher@2026";

  const { data: usersData } = await supabase.auth.admin.listUsers();
  let targetUser = usersData?.users?.find(
    (u) => u.email?.toLowerCase() === teacherEmail.toLowerCase()
  );

  if (!targetUser) {
    console.log(`Creating Auth user: ${teacherEmail}...`);
    const { data: authCreated, error: authErr } = await supabase.auth.admin.createUser({
      email: teacherEmail,
      password: teacherPassword,
      email_confirm: true,
      user_metadata: {
        full_name: teacherFullName,
        username: teacherUsername,
        role: "teacher",
      },
    });

    if (authErr || !authCreated.user) {
      console.error("Auth creation error:", authErr);
      process.exit(1);
    }
    targetUser = authCreated.user;
    console.log("Auth user created with ID:", targetUser.id);
  } else {
    console.log("Auth user already exists with ID:", targetUser.id);
    // Ensure password is set to AlamgirTeacher@2026
    await supabase.auth.admin.updateUserById(targetUser.id, {
      password: teacherPassword,
    });
  }

  // 3. Upsert Profile
  const { error: profErr } = await supabase.from("profiles").upsert({
    id: targetUser.id,
    full_name: teacherFullName,
    username: teacherUsername,
    role: "teacher",
    active: true,
    must_change_password: false,
  });

  if (profErr) {
    console.error("Profile upsert error:", profErr);
    process.exit(1);
  }
  console.log("Teacher profile updated successfully!");

  // 4. Assign Teacher to Madrasa
  const { error: assignErr } = await supabase.from("teacher_madrasas").upsert(
    {
      teacher_id: targetUser.id,
      madrasa_id: existingMadrasa.id,
    },
    { onConflict: "teacher_id,madrasa_id" }
  );

  if (assignErr) {
    console.error("Teacher assignment error:", assignErr);
    process.exit(1);
  }
  console.log("Teacher assigned to Madrasa successfully!");

  console.log("\n==============================================");
  console.log("SUCCESSFULLY PROVISIONED MADRASA & TEACHER!");
  console.log("Madrasa:", existingMadrasa.name, `(${existingMadrasa.city})`);
  console.log("Teacher Username:", teacherUsername);
  console.log("Teacher Password:", teacherPassword);
  console.log("==============================================\n");
}

main().catch(console.error);
