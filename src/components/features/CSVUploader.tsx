import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import type { ImportCsvBatchResponseDto } from "@/types";
import { useRef, useState } from "react";

interface CSVUploaderProps {
  onUploadSuccess: (newBatch: ImportCsvBatchResponseDto["batch"]) => void;
  onUploadError: (error: Error) => void;
  onUploadStart?: () => void;
}

export default function CSVUploader({ onUploadSuccess, onUploadError, onUploadStart }: CSVUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setUploadProgress(0);
    onUploadStart?.();

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10;
      });
    }, 200);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("/api/batches/import", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result: ImportCsvBatchResponseDto = await response.json();
        setUploadProgress(100);
        clearInterval(progressInterval);
        onUploadSuccess(result.batch);
        // Reset file input
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        const errorData = await response.json();
        const error = new Error(errorData.error || "Upload failed");
        clearInterval(progressInterval);
        onUploadError(error);
        return;
      }
    } catch (error) {
      console.error("Upload error:", error);
      clearInterval(progressInterval);
      const errorMessage = error instanceof Error ? error : new Error("Upload failed");
      onUploadError(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  const isValidFile =
    selectedFile && (selectedFile.type === "text/csv" || selectedFile.name.toLowerCase().endsWith(".csv"));

  return (
    <div className="space-y-4" data-testid="csv-uploader">
      <div className="flex items-center space-x-4">
        <Input
          data-testid="file-input"
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileChange}
          disabled={isUploading}
          className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
        />
        <Button
          data-testid="upload-button"
          onClick={handleUpload}
          disabled={!selectedFile || !isValidFile || isUploading}
          className="min-w-[100px]"
        >
          {isUploading ? "Uploading..." : "Upload"}
        </Button>
      </div>

      {isUploading && (
        <div className="space-y-2">
          <Progress value={uploadProgress} className="w-full" data-testid="upload-progress" />
          <div className="text-sm text-gray-600 text-center">Uploading... {Math.round(uploadProgress)}%</div>
        </div>
      )}

      {selectedFile && !isUploading && (
        <div className="text-sm text-gray-600">
          Selected: <span className="font-medium">{selectedFile.name}</span>
          {!isValidFile && <span className="text-red-600 ml-2">Only CSV files are allowed</span>}
        </div>
      )}
    </div>
  );
}
