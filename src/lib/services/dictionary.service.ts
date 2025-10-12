import { supabaseClient } from "../../db/supabase.client";
import type { LocationDto, WasteTypeDto } from "../../types";

/**
 * Service for managing dictionary operations.
 * Handles business logic related to retrieving dictionary data like waste types and locations.
 */
export class DictionaryService {
  /**
   * Retrieves all available waste types from the database.
   * This function queries the waste_types table and returns all records.
   *
   * @returns Promise containing an array of waste type DTOs
   * @throws Error if database query fails
   */
  async getWasteTypes(): Promise<WasteTypeDto[]> {
    try {
      // Query all waste types from the database
      const { data: wasteTypesData, error } = await supabaseClient.from("waste_types").select("id, name").order("id");

      if (error) {
        throw new Error(`Failed to fetch waste types: ${error.message}`);
      }

      // Return the data directly as it matches our WasteTypeDto structure
      return wasteTypesData || [];
    } catch (error) {
      // Re-throw with context
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Unexpected error occurred while fetching waste types");
    }
  }

  /**
   * Retrieves all available locations from the database.
   * This function queries the locations table and returns all records.
   *
   * @returns Promise containing an array of location DTOs
   * @throws Error if database query fails
   */
  async getLocations(): Promise<LocationDto[]> {
    try {
      // Query all locations from the database
      const { data: locationsData, error } = await supabaseClient.from("locations").select("id, name").order("id");

      if (error) {
        throw new Error(`Failed to fetch locations: ${error.message}`);
      }

      // Return the data directly as it matches our LocationDto structure
      return locationsData || [];
    } catch (error) {
      // Re-throw with context
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Unexpected error occurred while fetching locations");
    }
  }
}
