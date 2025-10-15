import type { APIRoute } from "astro";
import { z } from "zod";
import { createSupabaseServerInstance } from "../../../db/supabase.client";
import { BatchService } from "../../../lib/services/batch.service";

// Disable prerendering for API routes
export const prerender = false;

/**
 * Path parameter validation schema for batch ID
 */
const paramsSchema = z.object({
  id: z.string().transform((val) => {
    const parsed = parseInt(val, 10);
    if (isNaN(parsed) || parsed < 1) {
      throw new Error("ID must be a positive integer");
    }
    return parsed;
  }),
});

/**
 * DELETE /api/batches/[id]
 *
 * Performs soft-delete on a batch by setting its status to 'deleted'.
 * Only the batch owner can delete their own batches.
 *
 * Path Parameters:
 * - id: Batch ID to delete (must be positive integer)
 *
 * Returns:
 * - 204: No Content - Batch successfully deleted
 * - 400: Bad Request - Invalid batch ID parameter
 * - 404: Not Found - Batch not found or doesn't belong to user
 * - 500: Internal Server Error - Database or server errors
 */
export const DELETE: APIRoute = async ({ params, cookies, locals, request }) => {
  try {
    // Validate path parameters
    const paramsValidation = paramsSchema.safeParse(params);

    if (!paramsValidation.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid path parameters",
          details: paramsValidation.error.issues,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const { id } = paramsValidation.data;

    // Create supabase instance and service
    const supabase = createSupabaseServerInstance({ headers: request.headers, cookies });
    const batchService = new BatchService(supabase);
    const deleted = await batchService.deleteBatch(id, locals.user?.id ?? "");

    if (!deleted) {
      return new Response(
        JSON.stringify({
          error: "Batch not found or access denied",
        }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Return success response with no content
    return new Response(null, {
      status: 204,
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
