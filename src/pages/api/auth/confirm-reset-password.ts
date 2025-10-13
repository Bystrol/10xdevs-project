import type { APIRoute } from "astro";
import { z } from "zod";
import { createSupabaseServerInstance } from "../../../db/supabase.client.ts";

const confirmResetPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const validation = confirmResetPasswordSchema.safeParse(body);

    if (!validation.success) {
      return new Response(JSON.stringify({ error: "Invalid input data" }), {
        status: 400,
      });
    }

    const { password } = validation.data;

    const supabase = createSupabaseServerInstance({ cookies, headers: request.headers });

    const { data, error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
      });
    }

    return new Response(JSON.stringify({ user: data.user }), {
      status: 200,
    });
  } catch (error) {
    console.error("Confirm reset password error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
};
