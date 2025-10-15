import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { BatchDto } from "@/types";
import { useState } from "react";
import { toast } from "sonner";
import { useBatches } from "../../hooks/useBatches";
import BatchesList from "../features/BatchesList";
import CSVUploader from "../features/CSVUploader";

export default function ImportsView() {
  const { batches, pagination, isLoading, error, fetchBatches, addBatch, removeBatch } = useBatches();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState<BatchDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleUploadSuccess = (newBatch: BatchDto) => {
    addBatch(newBatch);
    toast.success("Import successful", {
      description: `File "${newBatch.filename}" has been imported successfully.`,
      testId: "upload-success",
    });
  };

  const handleUploadError = (error: Error) => {
    toast.error("Import failed", {
      description: error.message,
      testId: "upload-error",
    });
  };

  const handleDeleteBatch = (batch: BatchDto) => {
    setBatchToDelete(batch);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteBatch = async () => {
    if (!batchToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/batches/${batchToDelete.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        removeBatch(batchToDelete.id);
        toast.success("Batch deleted", {
          description: "The batch has been successfully deleted.",
        });
        setDeleteDialogOpen(false);
        setBatchToDelete(null);
      } else if (response.status === 404) {
        toast.error("Batch not found", {
          description: "This batch no longer exists.",
        });
        // Refresh the list in case the data is stale
        fetchBatches(pagination?.page || 1);
        setDeleteDialogOpen(false);
        setBatchToDelete(null);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete batch");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete batch";
      toast.error("Delete failed", {
        description: errorMessage,
      });
      console.error("Delete error:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePageChange = (page: number) => {
    fetchBatches(page);
  };

  if (error && batches.length === 0) {
    return (
      <div className="space-y-6">
        <CSVUploader onUploadSuccess={handleUploadSuccess} onUploadError={handleUploadError} />

        <div className="text-center py-8">
          <div className="text-red-600 mb-2">Failed to load batches</div>
          <div className="text-gray-600 text-sm">{error}</div>
          <button
            onClick={() => fetchBatches()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CSVUploader onUploadSuccess={handleUploadSuccess} onUploadError={handleUploadError} />

      <div className="border-t pt-6">
        <h2 className="text-lg font-semibold mb-4">Import History</h2>

        <BatchesList
          batches={batches}
          pagination={pagination || { page: 1, limit: 10, total: 0 }}
          onDelete={handleDeleteBatch}
          onPageChange={handlePageChange}
        />

        {isLoading && (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
            <span className="ml-2">Loading...</span>
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the batch {batchToDelete?.filename} and all
              associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting} onClick={() => setBatchToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction disabled={isDeleting} onClick={confirmDeleteBatch}>
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
