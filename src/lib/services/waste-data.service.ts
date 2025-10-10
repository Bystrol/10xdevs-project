import { supabaseClient } from "../../db/supabase.client";
import type {
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
      const { data: rpcResult, error: rpcError } = await supabaseClient.rpc("get_waste_summary", {
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
}
