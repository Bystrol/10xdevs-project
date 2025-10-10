import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { BatchDto, PaginationDto } from "@/types";

interface BatchesListProps {
  batches: BatchDto[];
  pagination: PaginationDto;
  onDelete: (batch: BatchDto) => void;
  onPageChange: (page: number) => void;
}

export default function BatchesList({ batches, pagination, onDelete, onPageChange }: BatchesListProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "text-green-600";
      case "processing":
        return "text-yellow-600";
      case "deleted":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  if (batches.length === 0) {
    return <div className="text-center py-8 text-gray-500">No batches have been imported yet.</div>;
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Filename</TableHead>
            <TableHead>Import Date</TableHead>
            <TableHead>Record Count</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {batches.map((batch) => (
            <TableRow key={batch.id}>
              <TableCell className="font-medium">{batch.filename}</TableCell>
              <TableCell>{formatDate(batch.createdAt)}</TableCell>
              <TableCell>{batch.recordCount.toLocaleString()}</TableCell>
              <TableCell>
                <span className={`capitalize ${getStatusColor(batch.status)}`}>{batch.status}</span>
              </TableCell>
              <TableCell>
                {batch.status === "active" && (
                  <Button variant="destructive" size="sm" onClick={() => onDelete(batch)}>
                    Delete
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Enhanced pagination */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="text-sm text-gray-500 text-center sm:text-left">
          Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
          {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} results
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page <= 1}
            onClick={() => onPageChange(pagination.page - 1)}
          >
            Previous
          </Button>

          {/* Page numbers */}
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, Math.ceil(pagination.total / pagination.limit)) }, (_, i) => {
              const pageNumber =
                Math.max(1, Math.min(Math.ceil(pagination.total / pagination.limit) - 4, pagination.page - 2)) + i;

              if (pageNumber > Math.ceil(pagination.total / pagination.limit)) return null;

              return (
                <Button
                  key={pageNumber}
                  variant={pageNumber === pagination.page ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(pageNumber)}
                  className="w-8 h-8 p-0"
                >
                  {pageNumber}
                </Button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
            onClick={() => onPageChange(pagination.page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
