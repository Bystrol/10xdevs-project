import { test as teardown } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

teardown("cleanup database", async () => {
  console.log("Cleaning up database...");

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    throw new Error("SUPABASE_URL and SUPABASE_KEY must be set");
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

  if (!process.env.E2E_USERNAME || !process.env.E2E_PASSWORD) {
    throw new Error("E2E_USERNAME and E2E_PASSWORD must be set");
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: process.env.E2E_USERNAME,
    password: process.env.E2E_PASSWORD,
  });

  if (signInError) {
    console.error("Error signing in:", signInError);
    throw signInError;
  }

  const { error } = await supabase.from("batches").delete().neq("id", 0);

  if (error) {
    console.error("Error cleaning up database:", error);
    throw error;
  }

  console.log("Database cleaned up successfully");
});
