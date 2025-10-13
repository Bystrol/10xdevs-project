import type { APIRoute } from "astro";
import { z } from "zod";
import { WasteDataService } from "../../lib/services/waste-data.service";
import type { GetWasteDataSummaryQueryDto } from "../../types";

// Disable prerendering for API routes
export const prerender = false;

/**
 * Query parameters validation schema for GET /api/waste-data
 */
const querySchema = z.object({
  groupBy: z.enum(["month", "type", "location"], {
    errorMap: () => ({ message: "groupBy must be one of: month, type, location" }),
  }),
  startDate: z
    .string()
    .optional()
    .refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), "startDate must be in YYYY-MM-DD format")
    .refine((val) => !val || !isNaN(Date.parse(val)), "startDate must be a valid date"),
  endDate: z
    .string()
    .optional()
    .refine((val) => !val || /^\d{4}-\d{2}-\d{2}$/.test(val), "endDate must be in YYYY-MM-DD format")
    .refine((val) => !val || !isNaN(Date.parse(val)), "endDate must be a valid date"),
  wasteTypeIds: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.split(",").every((id) => /^\d+$/.test(id.trim())),
      "wasteTypeIds must be comma-separated positive integers"
    ),
  locationIds: z
    .string()
    .optional()
    .refine(
      (val) => !val || val.split(",").every((id) => /^\d+$/.test(id.trim())),
      "locationIds must be comma-separated positive integers"
    ),
});

/**
 * GET /api/waste-data
 *
 * Retrieves aggregated waste data summary for dashboard visualizations.
 * Supports dynamic grouping and filtering for interactive charts.
 *
 * Query Parameters:
 * - groupBy (required): Grouping dimension - "month", "type", or "location"
 * - startDate (optional): Start date filter in YYYY-MM-DD format
 * - endDate (optional): End date filter in YYYY-MM-DD format
 * - wasteTypeIds (optional): Comma-separated waste type IDs (e.g., "1,3,5")
 * - locationIds (optional): Comma-separated location IDs (e.g., "2,4")
 *
 * Returns:
 * - 200: WasteDataSummaryResponseDto with aggregated data for charts
 * - 400: Bad Request - Invalid or missing query parameters
 * - 401: Unauthorized - User not authenticated
 * - 500: Internal Server Error - Database or server errors
 */
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Validate query parameters
    const url = new URL(request.url);
    const queryValidation = querySchema.safeParse({
      groupBy: url.searchParams.get("groupBy"),
      startDate: url.searchParams.get("startDate") || undefined,
      endDate: url.searchParams.get("endDate") || undefined,
      wasteTypeIds: url.searchParams.get("wasteTypeIds") || undefined,
      locationIds: url.searchParams.get("locationIds") || undefined,
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

    const validatedParams: GetWasteDataSummaryQueryDto = queryValidation.data;

    // Validate date range if both dates are provided
    if (validatedParams.startDate && validatedParams.endDate) {
      const startDate = new Date(validatedParams.startDate);
      const endDate = new Date(validatedParams.endDate);
      if (startDate > endDate) {
        return new Response(
          JSON.stringify({
            error: "Invalid date range",
            message: "Start date cannot be after end date",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    }

    // Call service to get waste data summary
    const wasteDataService = new WasteDataService();
    const result = await wasteDataService.getSummary(validatedParams, locals.user?.id ?? "");

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
