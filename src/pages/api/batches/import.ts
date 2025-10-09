import type { APIRoute } from "astro";
import { DEFAULT_USER_ID } from "../../../db/supabase.client";
import { BatchService } from "../../../lib/services/batch.service";
import type { ImportCsvBatchResponseDto } from "../../../types";

// Disable prerendering for API routes
export const prerender = false;

/**
 * POST /api/batches/import
 *
 * Imports a CSV file containing waste data and creates a new batch.
 * The endpoint processes the uploaded file, validates its contents,
 * and stores the data as a new batch in the database.
 *
 * Request Body (multipart/form-data):
 * - file: CSV file containing waste data (required)
 *
 * Returns:
 * - 201: Created - ImportCsvBatchResponseDto with batch details
 * - 400: Bad Request - Invalid file or validation errors
 * - 500: Internal Server Error - Database or processing errors
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // Validate Content-Type
    const contentType = request.headers.get("content-type");
    if (!contentType || !contentType.includes("multipart/form-data")) {
      return new Response(
        JSON.stringify({
          error: "Invalid content type. Expected multipart/form-data.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Parse form data
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : "Failed to parse form data.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Extract and validate file
    const file = formData.get("file") as File | null;
    if (!file) {
      return new Response(
        JSON.stringify({
          error: "No file uploaded.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Validate file type
    if (file.type !== "text/csv" && !file.name.toLowerCase().endsWith(".csv")) {
      return new Response(
        JSON.stringify({
          error: "Invalid file type. Only CSV files are allowed.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Call service to import the batch
    const batchService = new BatchService();
    const result: ImportCsvBatchResponseDto = await batchService.importBatch(file, DEFAULT_USER_ID);

    // Return successful response
    return new Response(JSON.stringify(result), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // Handle known service errors
    if (error instanceof Error) {
      // Check for specific validation errors
      if (
        error.message.includes("Invalid file type") ||
        error.message.includes("Missing required columns") ||
        error.message.includes("Invalid data format") ||
        error.message.includes("File exceeds")
      ) {
        return new Response(
          JSON.stringify({
            error: error.message,
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // General server error
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
