import { DEFAULT_USER_ID } from "@/db/supabase.client";
import type { APIRoute } from "astro";
import { z } from "zod";
import { WasteDataService } from "../../../lib/services/waste-data.service";
import type { GenerateAiReportCommand, GenerateAiReportResponseDto } from "../../../types";

// Disable prerendering for API routes
export const prerender = false;

/**
 * Request body validation schema for POST /api/waste-data/report
 */
const generateAiReportSchema = z.object({
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
  wasteTypeIds: z.array(z.number().int().positive()).optional(),
  locationIds: z.array(z.number().int().positive()).optional(),
});

/**
 * POST /api/waste-data/report
 *
 * Generates an AI-powered text summary report based on waste data filtering criteria.
 * Uses aggregated waste data to create concise insights and trends analysis.
 *
 * Request Body (GenerateAiReportCommand):
 * - groupBy (required): Grouping dimension - "month", "type", or "location"
 * - startDate (optional): Start date filter in YYYY-MM-DD format
 * - endDate (optional): End date filter in YYYY-MM-DD format
 * - wasteTypeIds (optional): Array of waste type IDs to filter by
 * - locationIds (optional): Array of location IDs to filter by
 *
 * Returns:
 * - 200: GenerateAiReportResponseDto with AI-generated report
 * - 400: Bad Request - Invalid request body or parameters
 * - 401: Unauthorized - User not authenticated
 * - 500: Internal Server Error - Database or server errors
 * - 503: Service Unavailable - AI service error
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validation = generateAiReportSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid request body",
          details: validation.error.issues,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const command: GenerateAiReportCommand = validation.data;

    // Validate date range if both dates are provided
    if (command.startDate && command.endDate) {
      const startDate = new Date(command.startDate);
      const endDate = new Date(command.endDate);
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

    // Call service to generate AI report
    const wasteDataService = new WasteDataService();
    const result: GenerateAiReportResponseDto = await wasteDataService.generateAiReport(command, DEFAULT_USER_ID);

    // Return successful response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle AI service errors
    if (error instanceof Error && error.message.includes("AI service")) {
      return new Response(
        JSON.stringify({
          error: "Service Unavailable",
          message: "AI report generation service is temporarily unavailable. Please try again later.",
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

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
    console.error("Unexpected error in /api/waste-data/report:", error);
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
