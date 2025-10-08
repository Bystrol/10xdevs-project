import { supabaseClient } from "../../db/supabase.client";
import type { BatchDto, ListBatchesResponseDto, PaginationDto } from "../../types";

/**
 * Service for managing batch operations.
 * Handles business logic related to batch data retrieval and manipulation.
 */
export class BatchService {
  /**
   * Retrieves a paginated list of batches for a specific user.
   *
   * @param userId - The authenticated user's ID
   * @param page - Page number (1-based)
   * @param limit - Number of items per page
   * @returns Promise containing the list of batches with pagination info
   * @throws Error if database query fails
   */
  async listBatches(userId: string, page: number, limit: number): Promise<ListBatchesResponseDto> {
    // Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Query total count of active batches for the user from the view
    const { count: totalCount, error: countError } = await supabaseClient
      .from("active_batches_summary")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (countError) {
      throw new Error(`Failed to get batch count: ${countError.message}`);
    }

    // Query paginated data from the view
    const { data: batchData, error: batchError } = await supabaseClient
      .from("active_batches_summary")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (batchError) {
      throw new Error(`Failed to fetch batches: ${batchError.message}`);
    }

    // Transform data to DTO format
    const data: BatchDto[] = (batchData || []).map((batch) => ({
      id: batch.batch_id as number,
      filename: batch.filename as string,
      status: "active" as const, // View only contains active batches
      recordCount: batch.record_count || 0,
      createdAt: batch.created_at as string,
    }));

    const pagination: PaginationDto = {
      page,
      limit,
      total: totalCount || 0,
    };

    return {
      data,
      pagination,
    };
  }
}
