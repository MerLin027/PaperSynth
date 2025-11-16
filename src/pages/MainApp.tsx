import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { PDFUpload } from '@/components/PDFUpload';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Volume2, Presentation, Play, Pause, Square, Download, ExternalLink, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { processPaper, downloadFile, validatePDFFile } from '@/services/paperSynthBackend';
import { adaptBackendResponse, hasAudio, hasPresentation, type AdaptedFileData } from '@/services/backendAdapter';

export const MainApp: React.FC = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [uploadedFile, setUploadedFile] = useState<AdaptedFileData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  /**
   * Handle PDF file upload and processing with Python FastAPI backend
   * 
   * Backend Integration:
   * -------------------
   * - Connects to: Python FastAPI backend (main.py) running on port 8000
   * - Endpoint: POST /process-paper/
   * - Authentication: Uses API_AUTH_TOKEN (from .env), NOT user JWT
   * - Processing time: 2-5 minutes (AI summarization, TTS, PPT generation)
   * - Timeout: 5 minutes (300 seconds) configured in api.ts
   * 
   * Requirements:
   * ------------
   * 1. Backend must be running: uvicorn main:app --reload --port 8000
   * 2. Environment variables set:
   *    - Frontend (.env): VITE_API_BASE_URL, VITE_API_AUTH_TOKEN
   *    - Backend (backend.env): GEMINI_API_KEY, ELEVENLABS_API_KEY, etc.
   * 3. CORS configured in backend to allow frontend origin
   * 
   * Processing Flow:
   * ---------------
   * 1. Validate PDF (client-side: type, size)
   * 2. Call processPaper() → sends to backend
   * 3. Backend processes (AI, TTS, image generation, PPT)
   * 4. Adapt response (backend format → frontend format)
   * 5. Update UI with results
   * 6. Display any warnings from backend
   * 
   * Error Handling:
   * --------------
   * - Invalid file → Client-side validation error
   * - Timeout (>5 min) → Specific timeout message
   * - Rate limit (429) → Retry-after message
   * - Backend errors → Extracted from FastAPI {"detail": "..."} format
   * - Network errors → Connection failure message
   */
  const handleFileUpload = async (file: File) => {
    // Validate file before processing
    const validation = validatePDFFile(file, 10); // 10MB max
    if (!validation.valid) {
      toast({
        title: "Invalid File",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    // Show initial processing message
    toast({
      title: "Processing PDF...",
      description: "This may take 2-5 minutes. Please be patient.",
    });
    
    try {
      // Call Python backend to process the PDF
      const backendResponse = await processPaper({
        file: file,
        summary_length: 'medium',
        generate_audio: true,
        generate_visual: false, // Set to true if you want graphical abstracts
      });
      
      // Adapt backend response to frontend format
      const adaptedData = adaptBackendResponse(backendResponse, file);
      
      // Set the uploaded file data
      setUploadedFile(adaptedData);
      setActiveTab('summary');
      
      // Show success message
      toast({
        title: "Processing complete!",
        description: `${file.name} has been successfully analyzed.`,
      });
      
      // Show warnings if any exist
      if (adaptedData.warnings && adaptedData.warnings.length > 0) {
        const warningCount = adaptedData.warnings.length;
        const warningPreview = adaptedData.warnings[0];
        
        toast({
          title: `Processing completed with ${warningCount} warning${warningCount > 1 ? 's' : ''}`,
          description: warningCount === 1 ? warningPreview : `${warningPreview} (and ${warningCount - 1} more)`,
          variant: "default",
        });
        
        // Log all warnings to console for debugging
        console.warn('Backend processing warnings:', adaptedData.warnings);
      }
      
    } catch (error: any) {
      console.error('PDF processing error:', error);
      
      // Handle specific error types
      let errorDescription = error.message || "Failed to process the PDF file.";
      
      // Check for timeout
      if (error.code === 'ECONNABORTED' || errorDescription.includes('timeout')) {
        errorDescription = "Processing took too long (>5 minutes). Please try with a smaller PDF or contact support.";
      }
      
      // Check for rate limiting
      if (error.response?.status === 429) {
        errorDescription = "Too many requests. Please wait a moment and try again.";
      }
      
      // Check for file too large
      if (error.response?.status === 413) {
        errorDescription = "File is too large. Maximum file size is 10MB.";
      }
      
      toast({
        title: "Processing failed",
        description: errorDescription,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleAudioPlay = () => {
    if (!uploadedFile || !hasAudio(uploadedFile)) {
      toast({
        title: "Audio not available",
        description: "No audio file is available for this document.",
        variant: "destructive",
      });
      return;
    }
    
    // Create new audio element if it doesn't exist
    if (!audioElement) {
      try {
        const audio = new Audio(uploadedFile.audio_url);
        
        // Set up event listeners
        audio.onended = () => {
          setIsPlaying(false);
          toast({
            title: "Playback complete",
            description: "Audio playback has finished.",
          });
        };
        
        audio.onerror = () => {
          setIsPlaying(false);
          toast({
            title: "Playback error",
            description: "Failed to load or play the audio file.",
            variant: "destructive",
          });
        };
        
        // Save audio element and start playing
        setAudioElement(audio);
        audio.play();
        setIsPlaying(true);
        
        toast({
          title: "Playing audio",
          description: "Audio playback started.",
        });
      } catch (error) {
        console.error('Audio playback error:', error);
        toast({
          title: "Playback error",
          description: "Failed to initialize audio player.",
          variant: "destructive",
        });
      }
    } else {
      // Toggle play/pause for existing audio element
      if (isPlaying) {
        audioElement.pause();
        setIsPlaying(false);
        toast({
          title: "Audio paused",
          description: "Playback has been paused.",
        });
      } else {
        audioElement.play().catch((error) => {
          console.error('Audio play error:', error);
          toast({
            title: "Playback error",
            description: "Failed to resume audio playback.",
            variant: "destructive",
          });
        });
        setIsPlaying(true);
        toast({
          title: "Resuming audio",
          description: "Playback has been resumed.",
        });
      }
    }
  };

  const handleDownload = async (type: 'presentation' | 'audio' | 'pdf') => {
    if (!uploadedFile) return;
    
    try {
      let fileUrl: string | undefined;
      let fileName: string;
      
      switch (type) {
        case 'presentation':
          if (!hasPresentation(uploadedFile)) {
            toast({
              title: "Not Available",
              description: "Presentation file is not available for this document.",
              variant: "destructive",
            });
            return;
          }
          fileUrl = uploadedFile.presentation_url;
          fileName = `${uploadedFile.name.replace('.pdf', '')}_presentation.pptx`;
          break;
          
        case 'audio':
          if (!hasAudio(uploadedFile)) {
            toast({
              title: "Not Available",
              description: "Audio file is not available for this document.",
              variant: "destructive",
            });
            return;
          }
          fileUrl = uploadedFile.audio_url;
          fileName = `${uploadedFile.name.replace('.pdf', '')}_audio.mp3`;
          break;
          
        case 'pdf':
          fileUrl = uploadedFile.summary_pdf_url;
          fileName = `${uploadedFile.name.replace('.pdf', '')}_summary.pdf`;
          break;
      }
      
      if (!fileUrl) {
        toast({
          title: "Not Available",
          description: `${type} file is not available for this document.`,
          variant: "destructive",
        });
        return;
      }
      
      // Download the file
      await downloadFile(fileUrl, fileName);
      
      toast({
        title: "Download Started",
        description: `Downloading ${fileName}...`,
      });
      
    } catch (error: any) {
      console.error('Download error:', error);
      toast({
        title: "Download Failed",
        description: error.message || "Failed to download the file.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-deep-black">
      {/* Header */}
      <header className="bg-deep-black p-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Logo size="lg" />
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <span className="text-muted-foreground text-sm hidden sm:block">
              {user?.name || user?.email || 'User'}
            </span>
            <Button variant="electric-ghost" onClick={logout} size="sm">
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-8">
        {/* About PaperSynth */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-electric flex items-center gap-2">
              <FileText className="w-5 h-5" />
              About PaperSynth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Transform research papers into comprehensive summaries, audio content, and presentations using advanced AI. 
              Upload PDFs to get instant analysis, audio synthesis, and presentation generation.
            </p>
            <Button variant="outline" size="sm" className="gap-2">
              <ExternalLink className="w-4 h-4" />
              Learn more
            </Button>
          </CardContent>
        </Card>

        {/* PDF Upload */}
        {!uploadedFile && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white text-center">
              Upload Your Research Paper
            </h2>
            <PDFUpload onFileUpload={handleFileUpload} />
            {isProcessing && (
              <div className="text-center">
                <p className="text-muted-foreground">Processing your PDF... This may take a few moments.</p>
              </div>
            )}
          </div>
        )}

        {/* Results Panel */}
        {uploadedFile && (
          <div className="space-y-6">
            {/* File Info */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  {uploadedFile.name}
                </CardTitle>
                <CardDescription>
                  {formatFileSize(uploadedFile.size)} • {uploadedFile.pages} pages
                </CardDescription>
              </CardHeader>
            </Card>

            {/* Three-column tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-soft-black">
                <TabsTrigger value="summary" className="gap-2">
                  <FileText className="w-4 h-4" />
                  Summary
                </TabsTrigger>
                <TabsTrigger value="audio" className="gap-2">
                  <Volume2 className="w-4 h-4" />
                  Audio
                </TabsTrigger>
                <TabsTrigger value="presentation" className="gap-2">
                  <Presentation className="w-4 h-4" />
                  PowerPoint
                </TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="mt-4">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-electric">Research Summary</CardTitle>
                    <CardDescription>
                      AI-generated summary of the key findings and methodologies
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-invert max-w-none">
                      <p className="text-muted-foreground leading-relaxed">
                        {uploadedFile.summary}
                      </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-border">
                      <h4 className="font-semibold text-white mb-2">Document Metadata</h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">File size:</span>
                          <span className="ml-2 text-white">{formatFileSize(uploadedFile.size)}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Pages:</span>
                          <span className="ml-2 text-white">{uploadedFile.pages}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="audio" className="mt-4">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-electric">Audio Synthesis</CardTitle>
                    <CardDescription>
                      Listen to the research summary with natural text-to-speech
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {/* Audio Controls */}
                      <div className="flex items-center justify-center space-x-4 p-6 bg-soft-black rounded-lg">
                        <Button
                          variant="electric"
                          size="lg"
                          onClick={handleAudioPlay}
                          className="gap-2"
                        >
                          {isPlaying ? (
                            <>
                              <Pause className="w-5 h-5" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play className="w-5 h-5" />
                              Play
                            </>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="lg"
                          onClick={() => setIsPlaying(false)}
                          className="gap-2"
                        >
                          <Square className="w-4 h-4" />
                          Stop
                        </Button>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-muted-foreground">
                          Audio duration: ~{Math.ceil((uploadedFile.summary?.length || 0) / 20)} minutes
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="presentation" className="mt-4">
                <Card className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-electric">PowerPoint Generation</CardTitle>
                    <CardDescription>
                      Download a structured presentation based on the research content
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="text-center p-6 bg-soft-black rounded-lg">
                        <Presentation className="w-16 h-16 mx-auto text-electric mb-4" />
                        <h3 className="text-lg font-semibold text-white mb-2">
                          Presentation Ready
                        </h3>
                        <p className="text-muted-foreground mb-4">
                          Your PowerPoint presentation has been generated with key findings, 
                          methodology, and conclusions structured into slides.
                        </p>
                        <Button
                          variant="electric"
                          size="lg"
                          onClick={() => handleDownload('PowerPoint')}
                          className="gap-2"
                        >
                          <Download className="w-5 h-5" />
                          Download PPTX
                        </Button>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground">
                          If download fails, a text fallback will be provided automatically.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Reset Button */}
            <div className="text-center">
              <Button
                variant="outline"
                onClick={() => {
                  setUploadedFile(null);
                  setActiveTab('summary');
                  setIsPlaying(false);
                }}
              >
                Upload Another Document
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};