import { test as teardown } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

teardown("cleanup database", async () => {
  console.log("Cleaning up database...");

  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
    throw new Error("SUPABASE_URL and SUPABASE_KEY must be set");
  }

  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

  const { error } = await supabase.from("batches").delete().neq("id", 0);

  if (error) {
    console.error("Error cleaning up database:", error);
    throw error;
  }

  console.log("Database cleaned up successfully");
});
