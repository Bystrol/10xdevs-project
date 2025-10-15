import type { APIRoute } from "astro";
import { z } from "zod";
import { createSupabaseServerInstance } from "../../db/supabase.client";
import { BatchService } from "../../lib/services/batch.service";

// Disable prerendering for API routes
export const prerender = false;

/**
 * Query parameters validation schema for GET /api/batches
 */
const querySchema = z.object({
  page: z
    .string()
    .optional()
    .default("1")
    .transform((val) => {
      const parsed = parseInt(val, 10);
      if (isNaN(parsed) || parsed < 1) {
        throw new Error("Page must be a positive integer");
      }
      return parsed;
    }),
  limit: z
    .string()
    .optional()
    .default("10")
    .transform((val) => {
      const parsed = parseInt(val, 10);
      if (isNaN(parsed) || parsed < 1 || parsed > 100) {
        throw new Error("Limit must be a positive integer between 1 and 100");
      }
      return parsed;
    }),
});

/**
 * GET /api/batches
 *
 * Retrieves a paginated list of batches for the authenticated user.
 * Note: Requires authentication.
 *
 * Query Parameters:
 * - page (optional): Page number (default: 1)
 * - limit (optional): Items per page (default: 10, max: 100)
 *
 * Returns:
 * - 200: ListBatchesResponseDto with paginated batch data
 * - 400: Bad Request - Invalid query parameters
 * - 500: Internal Server Error - Database or server errors
 */
export const GET: APIRoute = async ({ request, cookies, locals }) => {
  try {
    // Validate query parameters
    const url = new URL(request.url);
    const queryValidation = querySchema.safeParse({
      page: url.searchParams.get("page") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
    });

    if (!queryValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid query parameters",
          details: queryValidation.error.issues,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { page, limit } = queryValidation.data;

    // Create supabase instance and service
    const supabase = createSupabaseServerInstance({ headers: request.headers, cookies });
    const batchService = new BatchService(supabase);
    const result = await batchService.listBatches(locals.user?.id ?? "", page, limit);

    // Return successful response
    return new Response(JSON.stringify(result), {
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
