import { AlertCircleIcon, BotIcon } from "lucide-react";
import * as React from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AIReportGeneratorProps {
  onGenerateReport: () => void;
  report: string;
  isLoading: boolean;
  error: string | null;
}

export function AIReportGenerator({ onGenerateReport, report, isLoading, error }: AIReportGeneratorProps) {
  const [dialogOpen, setDialogOpen] = React.useState(false);

  const handleGenerate = async () => {
    onGenerateReport();
    // Open dialog when generation starts
    setDialogOpen(true);
  };

  // Auto-open dialog when report is generated
  React.useEffect(() => {
    if (report && !isLoading) {
      setDialogOpen(true);
    }
  }, [report, isLoading]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
        <div className="flex items-center gap-3">
          <BotIcon className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-semibold">AI Report</h3>
            <p className="text-sm text-muted-foreground">Generate intelligent insights about your waste data</p>
          </div>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleGenerate} disabled={isLoading} className="shrink-0">
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <BotIcon className="h-4 w-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>AI Waste Analysis Report</DialogTitle>
              <DialogDescription>Intelligent insights generated from your waste data patterns</DialogDescription>
            </DialogHeader>

            <div className="mt-4">
              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent" />
                  <span className="ml-3 text-muted-foreground">Generating report...</span>
                </div>
              )}

              {error && (
                <Alert variant="destructive">
                  <AlertCircleIcon className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {report && !isLoading && (
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed">{report}</div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
