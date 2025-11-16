import React, { useCallback, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PDFUploadProps {
  onFileUpload: (file: File) => void;
}

export const PDFUpload: React.FC<PDFUploadProps> = ({ onFileUpload }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setError(null);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      handleFileUpload(file);
    }
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      handleFileUpload(file);
    }
  }, []);

  const handleFileUpload = async (file: File) => {
    // Validate file type
    if (file.type !== 'application/pdf') {
      const errorMsg = 'Please upload a PDF file only.';
      setError(errorMsg);
      toast({
        title: "Invalid file type",
        description: errorMsg,
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      const errorMsg = 'File size must be less than 10MB.';
      setError(errorMsg);
      toast({
        title: "File too large",
        description: errorMsg,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      onFileUpload(file);
      toast({
        title: "File uploaded successfully",
        description: `${file.name} is being processed.`,
      });
    } catch (error: any) {
      const errorMsg = error.message || 'Failed to upload file.';
      setError(errorMsg);
      toast({
        title: "Upload failed",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card 
      className={`
        relative border-2 border-dashed transition-all duration-200 cursor-pointer
        ${dragActive 
          ? 'border-electric bg-electric/5' 
          : error 
          ? 'border-destructive bg-destructive/5'
          : 'border-border hover:border-electric/50 hover:bg-electric/5'
        }
        ${isUploading ? 'pointer-events-none' : ''}
      `}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept=".pdf"
        onChange={handleFileInput}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={isUploading}
      />
      
      <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
        {isUploading ? (
          <>
            <Loader2 className="w-12 h-12 text-electric animate-spin" />
            <div>
              <p className="text-lg font-medium text-foreground">Uploading PDF...</p>
              <p className="text-sm text-muted-foreground">Please wait while we process your file</p>
            </div>
          </>
        ) : error ? (
          <>
            <AlertCircle className="w-12 h-12 text-destructive" />
            <div>
              <p className="text-lg font-medium text-destructive">Upload Error</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setError(null)}
            >
              Try Again
            </Button>
          </>
        ) : dragActive ? (
          <>
            <Upload className="w-12 h-12 text-electric" />
            <div>
              <p className="text-lg font-medium text-electric">Drop your PDF here</p>
              <p className="text-sm text-muted-foreground">Release to upload</p>
            </div>
          </>
        ) : (
          <>
            <FileText className="w-12 h-12 text-muted-foreground" />
            <div>
              <p className="text-lg font-medium text-foreground">Upload PDF Document</p>
              <p className="text-sm text-muted-foreground">Drag and drop or click to select</p>
              <p className="text-xs text-muted-foreground mt-2">Max file size: 10MB</p>
            </div>
            <Button variant="electric-ghost" size="sm">
              Choose File
            </Button>
          </>
        )}
      </div>
    </Card>
  );
};