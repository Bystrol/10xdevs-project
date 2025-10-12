import type { APIRoute } from "astro";
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
export const GET: APIRoute = async () => {
  try {
    // Call service to get locations
    const dictionaryService = new DictionaryService();
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
