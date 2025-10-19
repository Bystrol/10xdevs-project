import type { Enums, Tables } from "./db/database.types";

// #region Batches
/**
 * Represents a single batch item in a list.
 * Derived from `batches` table and `active_batches_summary` view.
 */
export interface BatchDto {
  id: Tables<"batches">["id"];
  filename: Tables<"batches">["filename"];
  status: Enums<"batch_status">;
  /**
   * `recordCount` is derived from `active_batches_summary.record_count`.
   * The `NonNullable` utility is used to ensure the value is always a number,
   * as defined in the API plan.
   */
  recordCount: NonNullable<Tables<"active_batches_summary">["record_count"]>;
  /**
   * `createdAt` is a transformation of `created_at` from the `batches` table.
   */
  createdAt: string;
}

/**
 * Defines the structure for pagination information.
 */
export interface PaginationDto {
  page: number;
  limit: number;
  total: number;
}

/**
 * Response structure for the `GET /batches` endpoint.
 */
export interface ListBatchesResponseDto {
  data: BatchDto[];
  pagination: PaginationDto;
}

/**
 * Response structure for the successful import of a CSV file (`POST /batches/import`).
 */
export interface ImportCsvBatchResponseDto {
  message: string;
  batch: BatchDto;
}
// #endregion

// #region Waste Data
/**
 * Represents a single item in an aggregated waste data summary.
 * Used for dashboard visualizations.
 */
export interface WasteDataSummaryItemDto {
  label: string;
  value: number;
}

/**
 * Response structure for the `GET /waste-data` endpoint.
 */
export interface WasteDataSummaryResponseDto {
  data: WasteDataSummaryItemDto[];
}

/**
 * Allowed values for the `groupBy` query parameter in `GET /waste-data`.
 */
export type GroupByOption = "month" | "type" | "location";

/**
 * Defines the query parameters for the `GET /waste-data` endpoint.
 */
export interface GetWasteDataSummaryQueryDto {
  groupBy: GroupByOption;
  startDate?: string;
  endDate?: string;
  wasteTypeIds?: string;
  locationIds?: string;
}

/**
 * Command model for the `POST /waste-data/report` request body.
 */
export interface GenerateAiReportCommand {
  groupBy: GroupByOption;
  startDate?: string;
  endDate?: string;
  wasteTypeIds?: number[];
  locationIds?: number[];
}

/**
 * Response structure for the AI report generation endpoint.
 */
export interface GenerateAiReportResponseDto {
  report: string;
}
// #endregion

// #region Dictionaries
/**
 * Represents a waste type dictionary item.
 * Derived from the `waste_types` table.
 */
export type WasteTypeDto = Pick<Tables<"waste_types">, "id" | "name">;

/**
 * Response structure for `GET /waste-types`.
 */
export type GetWasteTypesResponseDto = WasteTypeDto[];

/**
 * Represents a location dictionary item.
 * Derived from the `locations` table.
 */
export type LocationDto = Pick<Tables<"locations">, "id" | "name">;

/**
 * Response structure for `GET /locations`.
 */
export type GetLocationsResponseDto = LocationDto[];
// #endregion

// #region Dashboard ViewModels
/**
 * ViewModel for filters in the dashboard.
 */
export interface FilterViewModel {
  dateRange: {
    from: Date | undefined;
    to: Date | undefined;
  };
  wasteTypeIds: number[];
  locationIds: number[];
}

/**
 * ViewModel for chart data in the dashboard.
 */
export interface ChartDataViewModel {
  id: string; // e.g., 'by-month', 'by-type'
  title: string;
  groupBy: "month" | "type" | "location";
  data: WasteDataSummaryItemDto[];
  isLoading: boolean;
  error: string | null;
}
// #endregion
