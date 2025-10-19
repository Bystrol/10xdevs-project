import type { SupabaseClient } from "@supabase/supabase-js";
import { OPENAI_API_KEY } from "astro:env/server";
import OpenAI from "openai";
import type { Database } from "../../db/database.types";
import type {
  GenerateAiReportCommand,
  GenerateAiReportResponseDto,
  GetWasteDataSummaryQueryDto,
  GroupByOption,
  WasteDataSummaryItemDto,
  WasteDataSummaryResponseDto,
} from "../../types";

/**
 * Service for managing waste data summary operations.
 * Handles business logic related to waste data aggregation and dashboard queries.
 */
export class WasteDataService {
  private supabase: SupabaseClient<Database>;

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }
  /**
   * Retrieves aggregated waste data summary for dashboard visualizations.
   *
   * @param params - Query parameters for filtering and grouping
   * @param userId - The authenticated user's ID for data isolation
   * @returns Promise containing aggregated waste data summary
   * @throws Error if database query fails or parameters are invalid
   */
  async getSummary(params: GetWasteDataSummaryQueryDto, userId: string): Promise<WasteDataSummaryResponseDto> {
    try {
      // Validate groupBy parameter
      const validGroupByValues: GroupByOption[] = ["month", "type", "location"];
      if (!validGroupByValues.includes(params.groupBy)) {
        throw new Error(`Invalid groupBy parameter. Must be one of: ${validGroupByValues.join(", ")}`);
      }

      // Parse optional parameters
      const startDate = params.startDate ? new Date(params.startDate) : undefined;
      const endDate = params.endDate ? new Date(params.endDate) : undefined;

      // Parse comma-separated IDs into arrays
      const wasteTypeIds = params.wasteTypeIds
        ? params.wasteTypeIds.split(",").map((id) => {
            const parsed = parseInt(id.trim(), 10);
            if (isNaN(parsed) || parsed <= 0) {
              throw new Error(`Invalid waste type ID: ${id}`);
            }
            return parsed;
          })
        : undefined;

      const locationIds = params.locationIds
        ? params.locationIds.split(",").map((id) => {
            const parsed = parseInt(id.trim(), 10);
            if (isNaN(parsed) || parsed <= 0) {
              throw new Error(`Invalid location ID: ${id}`);
            }
            return parsed;
          })
        : undefined;

      // Validate date range if both dates are provided
      if (startDate && endDate && startDate > endDate) {
        throw new Error("Start date cannot be after end date");
      }

      // Call the RPC function
      const { data: rpcResult, error: rpcError } = await this.supabase.rpc("get_waste_summary", {
        p_user_id: userId,
        p_group_by: params.groupBy,
        p_start_date: startDate ? startDate.toISOString().split("T")[0] : undefined,
        p_end_date: endDate ? endDate.toISOString().split("T")[0] : undefined,
        p_waste_type_ids: wasteTypeIds,
        p_location_ids: locationIds,
      });

      if (rpcError) {
        throw new Error(`Failed to fetch waste data summary: ${rpcError.message}`);
      }

      // Transform the result to match our DTO structure
      // The RPC function returns an array of objects with 'label' and 'value' keys
      const data: WasteDataSummaryItemDto[] = (rpcResult as { label: string; value: number }[]) || [];

      return {
        data,
      };
    } catch (error) {
      // Re-throw with context
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Unexpected error occurred while fetching waste data summary");
    }
  }

  /**
   * Generates an AI-powered text summary report based on waste data filtering criteria.
   * Uses aggregated waste data to create concise insights and trends analysis.
   *
   * @param command - Report generation parameters including filters and grouping
   * @param userId - The authenticated user's ID for data isolation
   * @returns Promise containing AI-generated report text
   * @throws Error if database query fails, AI service is unavailable, or parameters are invalid
   */
  async generateAiReport(command: GenerateAiReportCommand, userId: string): Promise<GenerateAiReportResponseDto> {
    try {
      // First, get the aggregated data using existing getSummary method
      const summaryData = await this.getSummary(
        {
          groupBy: command.groupBy,
          startDate: command.startDate,
          endDate: command.endDate,
          wasteTypeIds: command.wasteTypeIds?.join(","),
          locationIds: command.locationIds?.join(","),
        },
        userId
      );

      // Format data for the AI prompt
      const dataString = summaryData.data.map((item) => `${item.label}: ${item.value} units`).join("\n");

      // Create dynamic prompt based on groupBy parameter
      const groupByDescriptions = {
        month: "monthly distribution over time",
        type: "waste type categories",
        location: "different locations/facilities",
      };

      const prompt = `Analyze the following waste management data showing ${groupByDescriptions[command.groupBy]}:

${dataString}

Please provide a concise, professional summary report that includes:
1. Key trends and patterns observed
2. Notable highs and lows

Please be concise and to the point. Use markdown formatting for the report. Don't include any other text than the report. The report should be maximum 3 sentences.

Keep the report focused and actionable, suitable for management review.`;

      // Initialize OpenAI client
      const openai = new OpenAI({
        apiKey: OPENAI_API_KEY,
      });

      // Generate AI report
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "developer",
            content:
              "You are a professional waste management analyst providing concise, data-driven insights. Focus on key trends, actionable recommendations, and clear analysis.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        max_completion_tokens: 1000,
        temperature: 0.7,
      });

      const report = completion.choices[0]?.message?.content;

      if (!report) {
        throw new Error("AI service failed to generate report content");
      }

      return {
        report: report.trim(),
      };
    } catch (error) {
      // Handle OpenAI API errors specifically
      if (error instanceof OpenAI.APIError) {
        console.error("OpenAI API Error:", {
          status: error.status,
          message: error.message,
          requestId: error.requestID,
        });
        throw new Error("AI service error: Unable to generate report. Please try again later.");
      }

      // Handle other errors (database, validation, etc.)
      if (error instanceof Error) {
        throw error;
      }

      // Handle unexpected errors
      console.error("Unexpected error in generateAiReport:", error);
      throw new Error("Unexpected error occurred while generating AI report");
    }
  }
}
