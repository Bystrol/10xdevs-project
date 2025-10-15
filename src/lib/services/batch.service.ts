import type { SupabaseClient } from "@supabase/supabase-js";
import Papa from "papaparse";
import type { Database } from "../../db/database.types";
import type { BatchDto, ImportCsvBatchResponseDto, ListBatchesResponseDto, PaginationDto } from "../../types";

/**
 * Service for managing batch operations.
 * Handles business logic related to batch data retrieval and manipulation.
 */
export class BatchService {
  private supabase: SupabaseClient<Database>;

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase;
  }
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
    const { count: totalCount, error: countError } = await this.supabase
      .from("active_batches_summary")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);

    if (countError) {
      throw new Error(`Failed to get batch count: ${countError.message}`);
    }

    // Query paginated data from the view
    const { data: batchData, error: batchError } = await this.supabase
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
    const { error: checkError } = await this.supabase
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
    const { error: updateError } = await this.supabase
      .from("batches")
      .update({ status: "deleted" })
      .eq("id", batchId)
      .eq("user_id", userId);

    if (updateError) {
      throw new Error(`Failed to delete batch: ${updateError.message}`);
    }

    return true;
  }

  /**
   * Imports a CSV file containing waste data and creates a new batch.
   *
   * @param file - The CSV file to import
   * @param userId - The authenticated user's ID
   * @returns Promise containing the import result with batch details
   * @throws Error if validation fails or database operations fail
   */
  async importBatch(file: File, userId: string): Promise<ImportCsvBatchResponseDto> {
    // Read file content
    const fileContent = await file.text();

    // Parse CSV
    const parseResult = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.toLowerCase().trim(),
    });

    if (parseResult.errors.length > 0) {
      throw new Error(`CSV parsing failed: ${parseResult.errors[0].message}`);
    }

    const rows = parseResult.data as Record<string, string>[];

    // Validate record count (max 1000)
    if (rows.length > 1000) {
      throw new Error("File exceeds the 1000 record limit.");
    }

    if (rows.length === 0) {
      throw new Error("File contains no valid records.");
    }

    // Validate required headers
    const requiredHeaders = ["date", "waste_type", "location", "quantity"];
    const headers = Object.keys(rows[0]);
    const missingHeaders = requiredHeaders.filter((header) => !headers.includes(header));

    if (missingHeaders.length > 0) {
      throw new Error(`Missing required columns: ${missingHeaders.join(", ")}.`);
    }

    // Get existing waste types and locations for validation
    const wasteTypesResult = await this.supabase.from("waste_types").select("id, name");

    if (wasteTypesResult.error) {
      throw new Error(`Failed to fetch waste types: ${wasteTypesResult.error.message}`);
    }

    const wasteTypes = wasteTypesResult.data || [];

    const wasteTypeNames = new Set(wasteTypes.map((wt) => wt.name.toLowerCase()));

    // Validate each row
    const validatedRows: {
      date: string;
      waste_type: string;
      location: string;
      quantity: number;
    }[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2; // +1 for 0-based index, +1 for header row

      const dateStr = row.date?.trim();
      const wasteTypeStr = row.waste_type?.trim().toLowerCase();
      const locationStr = row.location?.trim().toLowerCase();
      const quantityStr = row.quantity?.trim();

      // Validate date format
      if (!dateStr) {
        throw new Error(`Invalid data format in row ${rowNumber}: date is required.`);
      }

      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid data format in row ${rowNumber}: invalid date format. Use YYYY-MM-DD.`);
      }

      // Check if date is not in the future
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (date > today) {
        throw new Error(`Invalid data format in row ${rowNumber}: date cannot be in the future.`);
      }

      // Validate waste type
      if (!wasteTypeStr || !wasteTypeNames.has(wasteTypeStr)) {
        throw new Error(
          `Invalid value in row ${rowNumber}: unknown waste type "${wasteTypeStr}". Valid types: ${Array.from(wasteTypeNames).join(", ")}.`
        );
      }

      // Validate quantity
      if (!quantityStr) {
        throw new Error(`Invalid data format in row ${rowNumber}: quantity is required.`);
      }

      const quantity = parseInt(quantityStr, 10);
      if (isNaN(quantity) || quantity <= 0) {
        throw new Error(`Invalid data format in row ${rowNumber}: quantity must be a positive integer.`);
      }

      validatedRows.push({
        date: date.toISOString().split("T")[0], // Format as YYYY-MM-DD
        waste_type: wasteTypeStr,
        location: locationStr,
        quantity,
      });
    }

    // Call RPC function to perform transactional insertion
    const { data: rpcResult, error: rpcError } = await this.supabase.rpc("import_batch_data", {
      p_user_id: userId,
      p_filename: file.name,
      p_waste_data: validatedRows,
    });

    if (rpcError) {
      throw new Error(`Failed to import batch: ${rpcError.message}`);
    }

    // Type assertion for RPC result (we know the structure from our function)
    const result = rpcResult as {
      batch_id: number;
      filename: string;
      record_count: number;
      created_at: string;
    };

    // Transform result to DTO
    const batch: BatchDto = {
      id: result.batch_id,
      filename: result.filename,
      status: "active",
      recordCount: result.record_count,
      createdAt: result.created_at,
    };

    return {
      message: "Import successful",
      batch,
    };
  }
}
