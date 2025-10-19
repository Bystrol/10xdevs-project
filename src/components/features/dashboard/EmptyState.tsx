import { FileXIcon, UploadIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

export function EmptyState() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-6 p-8">
        <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center">
          <FileXIcon className="w-12 h-12 text-muted-foreground" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold tracking-tight">No Data Available</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            It looks like you haven&apos;t imported any waste data yet. Start by uploading your first CSV file to begin
            analyzing your waste patterns.
          </p>
        </div>

        <Button asChild size="lg" className="gap-2">
          <a href="/imports">
            <UploadIcon className="w-5 h-5" />
            Import Your First File
          </a>
        </Button>
      </div>
    </div>
  );
}
