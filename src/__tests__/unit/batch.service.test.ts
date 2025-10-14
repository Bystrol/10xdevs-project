import Papa from "papaparse";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { BatchService } from "../../../src/lib/services/batch.service";

// Mock dependencies
vi.mock("papaparse");

// Mock supabase client with factory function to prevent initialization
vi.mock("../../../src/db/supabase.client", () => ({
  supabaseClient: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

import { supabaseClient } from "../../../src/db/supabase.client";

describe("BatchService", () => {
  let batchService: BatchService;
  const mockSupabaseClient = vi.mocked(supabaseClient);
  const mockPapa = vi.mocked(Papa);

  beforeEach(() => {
    vi.clearAllMocks();
    batchService = new BatchService();
  });

  describe("importBatch", () => {
    const mockUserId = "test-user-id";
    const mockFileName = "test.csv";

    // Helper function to create mock File
    const createMockFile = (content: string, name: string = mockFileName): File => {
      const file = new File([content], name, { type: "text/csv" });
      // Mock the text() method for test environment
      Object.defineProperty(file, "text", {
        value: vi.fn().mockResolvedValue(content),
        writable: true,
      });
      return file;
    };

    // Mock successful parsing
    const mockParseSuccess = (data: Record<string, string>[]) => {
      mockPapa.parse.mockReturnValue({
        data,
        errors: [],
        meta: {
          delimiter: ",",
          linebreak: "\n",
          aborted: false,
          truncated: false,
          cursor: 0,
        },
      } as unknown as ReturnType<typeof Papa.parse>);
    };

    // Mock parsing errors
    const mockParseError = (errorMessage: string) => {
      mockPapa.parse.mockReturnValue({
        data: [],
        errors: [{ message: errorMessage }],
        meta: {
          delimiter: ",",
          linebreak: "\n",
          aborted: false,
          truncated: false,
          cursor: 0,
        },
      } as unknown as ReturnType<typeof Papa.parse>);
    };

    describe("Happy Path", () => {
      it("should process a valid CSV file and call the database function with correct data", async () => {
        // Arrange
        const validCsvContent = `date,waste_type,location,quantity
2023-01-01,plastic,warsaw,100
2023-01-02,paper,krakow,200`;

        const mockFile = createMockFile(validCsvContent);

        // Mock successful parsing
        mockParseSuccess([
          { date: "2023-01-01", waste_type: "plastic", location: "warsaw", quantity: "100" },
          { date: "2023-01-02", waste_type: "paper", location: "krakow", quantity: "200" },
        ]);

        // Mock waste types fetch
        mockSupabaseClient.from.mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: [
              { id: 1, name: "plastic" },
              { id: 2, name: "paper" },
            ],
            error: null,
          }),
        } as unknown as ReturnType<typeof supabaseClient.from>);

        // Mock RPC call
        const mockRpcResult = {
          batch_id: 123,
          filename: mockFileName,
          record_count: 2,
          created_at: "2023-01-01T10:00:00Z",
        };

        mockSupabaseClient.rpc.mockResolvedValue({
          data: mockRpcResult,
          error: null,
        });

        // Act
        const result = await batchService.importBatch(mockFile, mockUserId);

        // Assert
        expect(result).toEqual({
          message: "Import successful",
          batch: {
            id: 123,
            filename: mockFileName,
            status: "active",
            recordCount: 2,
            createdAt: "2023-01-01T10:00:00Z",
          },
        });

        expect(mockPapa.parse).toHaveBeenCalledWith(validCsvContent, {
          header: true,
          skipEmptyLines: true,
          transformHeader: expect.any(Function),
        });

        expect(mockSupabaseClient.rpc).toHaveBeenCalledWith("import_batch_data", {
          p_user_id: mockUserId,
          p_filename: mockFileName,
          p_waste_data: [
            {
              date: "2023-01-01",
              waste_type: "plastic",
              location: "warsaw",
              quantity: 100,
            },
            {
              date: "2023-01-02",
              waste_type: "paper",
              location: "krakow",
              quantity: 200,
            },
          ],
        });
      });
    });

    describe("File Structure and Limits Validation", () => {
      it("should throw an error if the file contains no data records", async () => {
        // Arrange
        const emptyCsvContent = "date,waste_type,location,quantity\n";
        const mockFile = createMockFile(emptyCsvContent);

        mockParseSuccess([]);

        // Act & Assert
        await expect(batchService.importBatch(mockFile, mockUserId)).rejects.toThrow("File contains no valid records.");
      });

      it("should throw an error if the file exceeds the 1000 record limit", async () => {
        // Arrange
        const csvContent =
          "date,waste_type,location,quantity\n" +
          Array.from({ length: 1001 }, (_, i) => `2023-01-${String(i + 1).padStart(2, "0")},plastic,warsaw,100`).join(
            "\n"
          );

        const mockFile = createMockFile(csvContent);

        const rows = Array.from({ length: 1001 }, (_, i) => ({
          date: `2023-01-${String(i + 1).padStart(2, "0")}`,
          waste_type: "plastic",
          location: "warsaw",
          quantity: "100",
        }));

        mockParseSuccess(rows);

        // Act & Assert
        await expect(batchService.importBatch(mockFile, mockUserId)).rejects.toThrow(
          "File exceeds the 1000 record limit."
        );
      });

      it("should throw an error if required headers are missing", async () => {
        // Arrange
        const csvContent = "date,waste_type,quantity\n2023-01-01,plastic,100\n";
        const mockFile = createMockFile(csvContent);

        mockParseSuccess([{ date: "2023-01-01", waste_type: "plastic", quantity: "100" }]);

        // Act & Assert
        await expect(batchService.importBatch(mockFile, mockUserId)).rejects.toThrow(
          "Missing required columns: location."
        );
      });

      it("should throw an error if Papa.parse returns parsing errors", async () => {
        // Arrange
        const invalidCsvContent = "invalid,csv,content";
        const mockFile = createMockFile(invalidCsvContent);

        mockParseError("Invalid CSV format");

        // Act & Assert
        await expect(batchService.importBatch(mockFile, mockUserId)).rejects.toThrow(
          "CSV parsing failed: Invalid CSV format"
        );
      });
    });

    describe("Row-level Data Validation", () => {
      beforeEach(() => {
        // Mock waste types fetch for all row validation tests
        mockSupabaseClient.from.mockReturnValue({
          select: vi.fn().mockResolvedValue({
            data: [
              { id: 1, name: "plastic" },
              { id: 2, name: "paper" },
            ],
            error: null,
          }),
        } as unknown as ReturnType<typeof supabaseClient.from>);
      });

      it("should throw an error for rows with an invalid date format", async () => {
        // Arrange
        const csvContent = "date,waste_type,location,quantity\ninvalid-date,plastic,warsaw,100\n";
        const mockFile = createMockFile(csvContent);

        mockParseSuccess([{ date: "invalid-date", waste_type: "plastic", location: "warsaw", quantity: "100" }]);

        // Act & Assert
        await expect(batchService.importBatch(mockFile, mockUserId)).rejects.toThrow(
          "Invalid data format in row 2: invalid date format. Use YYYY-MM-DD."
        );
      });

      it("should throw an error for rows with a future date", async () => {
        // Arrange
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 1);
        const futureDateStr = futureDate.toISOString().split("T")[0];

        const csvContent = `date,waste_type,location,quantity\n${futureDateStr},plastic,warsaw,100\n`;
        const mockFile = createMockFile(csvContent);

        mockParseSuccess([{ date: futureDateStr, waste_type: "plastic", location: "warsaw", quantity: "100" }]);

        // Act & Assert
        await expect(batchService.importBatch(mockFile, mockUserId)).rejects.toThrow(
          "Invalid data format in row 2: date cannot be in the future."
        );
      });

      it("should throw an error for rows with a negative quantity", async () => {
        // Arrange
        const csvContent = "date,waste_type,location,quantity\n2023-01-01,plastic,warsaw,-100\n";
        const mockFile = createMockFile(csvContent);

        mockParseSuccess([{ date: "2023-01-01", waste_type: "plastic", location: "warsaw", quantity: "-100" }]);

        // Act & Assert
        await expect(batchService.importBatch(mockFile, mockUserId)).rejects.toThrow(
          "Invalid data format in row 2: quantity must be a positive integer."
        );
      });

      it("should throw an error for rows with a non-numeric quantity", async () => {
        // Arrange
        const csvContent = "date,waste_type,location,quantity\n2023-01-01,plastic,warsaw,abc\n";
        const mockFile = createMockFile(csvContent);

        mockParseSuccess([{ date: "2023-01-01", waste_type: "plastic", location: "warsaw", quantity: "abc" }]);

        // Act & Assert
        await expect(batchService.importBatch(mockFile, mockUserId)).rejects.toThrow(
          "Invalid data format in row 2: quantity must be a positive integer."
        );
      });

      it("should throw an error for rows with an unknown waste_type", async () => {
        // Arrange
        const csvContent = "date,waste_type,location,quantity\n2023-01-01,unknown,warsaw,100\n";
        const mockFile = createMockFile(csvContent);

        mockParseSuccess([{ date: "2023-01-01", waste_type: "unknown", location: "warsaw", quantity: "100" }]);

        // Act & Assert
        await expect(batchService.importBatch(mockFile, mockUserId)).rejects.toThrow(
          'Invalid value in row 2: unknown waste type "unknown". Valid types: plastic, paper.'
        );
      });
    });
  });
});
