import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "../../db/supabase.client";
import { DictionaryService } from "../../lib/services/dictionary.service";

// Disable prerendering for API routes
export const prerender = false;

/**
 * GET /api/locations
 *
 * Retrieves a list of all available locations from the database.
 *
 * Returns:
 * - 200: GetLocationsResponseDto - Array of location objects
 * - 500: Internal Server Error - Database or server errors
 */
export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // Create supabase instance and service (public endpoint)
    const supabase = createSupabaseServerInstance({
      headers: request.headers,
      cookies,
    });
    const dictionaryService = new DictionaryService(supabase);
    const locations = await dictionaryService.getLocations();

    // Return successful response
    return new Response(JSON.stringify(locations), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle known service errors
    if (error instanceof Error) {
      return new Response(
        JSON.stringify({
          error: "Internal Server Error",
          message: error.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle unexpected errors
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
