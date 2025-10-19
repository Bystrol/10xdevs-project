import { FileXIcon } from "lucide-react";

export function EmptyState() {
  return (
    <div className="bg-background flex items-center justify-center">
      <div className="text-center space-y-6 p-8">
        <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center">
          <FileXIcon className="w-12 h-12 text-muted-foreground" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">No Data Available</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            We couldn&apos;t find any data to display. Please try again with different filters.
          </p>
        </div>
      </div>
    </div>
  );
}
