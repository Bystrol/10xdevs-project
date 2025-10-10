import type { BatchDto, ListBatchesResponseDto, PaginationDto } from "@/types";
import { useCallback, useEffect, useState } from "react";

interface UseBatchesReturn {
  batches: BatchDto[];
  pagination: PaginationDto | null;
  isLoading: boolean;
  error: string | null;
  fetchBatches: (page?: number) => Promise<void>;
  addBatch: (batch: BatchDto) => void;
  removeBatch: (batchId: number) => void;
}

export function useBatches(initialPage = 1, limit = 10): UseBatchesReturn {
  const [batches, setBatches] = useState<BatchDto[]>([]);
  const [pagination, setPagination] = useState<PaginationDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBatches = useCallback(
    async (page: number = initialPage) => {
      setIsLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });

        const response = await fetch(`/api/batches?${params}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to fetch batches");
        }

        const data: ListBatchesResponseDto = await response.json();
        setBatches(data.data);
        setPagination(data.pagination);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
        setError(errorMessage);
        console.error("Error fetching batches:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [initialPage, limit]
  );

  const addBatch = useCallback((batch: BatchDto) => {
    setBatches((prevBatches) => [batch, ...prevBatches]);
    // Update pagination total count
    setPagination((prev) => (prev ? { ...prev, total: prev.total + 1 } : null));
  }, []);

  const removeBatch = useCallback((batchId: number) => {
    setBatches((prevBatches) => prevBatches.filter((batch) => batch.id !== batchId));
    // Update pagination total count
    setPagination((prev) => (prev ? { ...prev, total: prev.total - 1 } : null));
  }, []);

  // Fetch initial data on mount
  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  return {
    batches,
    pagination,
    isLoading,
    error,
    fetchBatches,
    addBatch,
    removeBatch,
  };
}
