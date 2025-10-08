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

  /**
   * Performs soft-delete on a batch by setting its status to 'deleted'.
   * Only the batch owner can delete their own batches.
   *
   * @param batchId - The ID of the batch to delete
   * @param userId - The authenticated user's ID
   * @returns Promise<boolean> - true if batch was found and deleted, false if not found or access denied
   * @throws Error if database query fails
   */
  async deleteBatch(batchId: number, userId: string): Promise<boolean> {
    // First check if the batch exists and belongs to the user
    const { error: checkError } = await supabaseClient
      .from("batches")
      .select("id")
      .eq("id", batchId)
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    if (checkError) {
      if (checkError.code === "PGRST116") {
        // No rows returned - batch not found or doesn't belong to user
        return false;
      }
      throw new Error(`Failed to check batch: ${checkError.message}`);
    }

    // If we found the batch, perform the soft-delete
    const { error: updateError } = await supabaseClient
      .from("batches")
      .update({ status: "deleted" })
      .eq("id", batchId)
      .eq("user_id", userId);

    if (updateError) {
      throw new Error(`Failed to delete batch: ${updateError.message}`);
    }

    return true;
  }
}
