import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Supabase URL or Anon Key is missing from environment variables. Please check your .env file in the cvdekh-backend directory.",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
