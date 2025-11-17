import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { PDFUpload } from '@/components/PDFUpload';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Volume2, Presentation, Play, Pause, Square, Download, ExternalLink, AlertCircle, Loader2, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { processPaper, downloadFile, validatePDFFile } from '@/services/paperSynthBackend';
import { adaptBackendResponse, hasAudio, hasPresentation, hasSummaryPDF, type AdaptedFileData } from '@/services/backendAdapter';

export const MainApp: React.FC = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const [uploadedFile, setUploadedFile] = useState<AdaptedFileData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [downloadingType, setDownloadingType] = useState<'presentation' | 'audio' | 'pdf' | null>(null);

  // Helper function to clean markdown syntax from text
  const cleanMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.+?)\*\*/g, '$1')  // Remove ** from bold text
      .replace(/\*(.+?)\*/g, '$1')      // Remove * from italic text
      .replace(/#{1,6}\s/g, '')         // Remove # from headings
      .trim();
  };

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
    
    setDownloadingType(type);
    
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
    } finally {
      setDownloadingType(null);
    }
  };

  const parseCleanSummary = (text: string) => {
    // Remove all --- markers first
    const cleanedText = text.replace(/^---+$/gm, '').trim();
    
    // Split into sections by double line breaks
    const sections = cleanedText.split('\n\n').filter(s => s.trim());
    
    return sections.map(section => {
      const lines = section.split('\n').filter(l => l.trim());
      if (lines.length === 0) return null;
      
      const firstLine = lines[0].trim();
      
      // Detect heading (short line, uppercase, or has markers, or ends with colon)
      const isHeading = 
        (firstLine.length < 100 && firstLine === firstLine.toUpperCase()) ||
        firstLine.match(/^\*\*[^*]+\*\*/) ||
        firstLine.startsWith('#') ||
        (firstLine.length < 80 && !firstLine.includes('.') && !firstLine.includes(','));
      
      if (isHeading) {
        return {
          type: 'heading',
          content: firstLine
            .replace(/\*\*/g, '')
            .replace(/#+/g, '')
            .replace(/:+$/g, '')
            .trim()
        };
      }
      
      // Check if ALL lines are bullet points
      const allBullets = lines.every(l => 
        l.trim().match(/^[\*\-\•·]/) || 
        l.trim().match(/^\d+\./)
      );
      
      if (allBullets) {
        return {
          type: 'list',
          items: lines.map(l => 
            l.trim()
              .replace(/^[\*\-\•·]\s*/g, '')
              .replace(/^\d+\.\s*/g, '')
              .replace(/\*\*/g, '')
              .replace(/\*/g, '')
              .trim()
          )
        };
      }
      
      // Regular paragraph - join all lines
      return {
        type: 'paragraph',
        content: lines
          .join(' ')
          .replace(/\*\*/g, '')
          .replace(/\*/g, '')
          .trim()
      };
    }).filter(Boolean);
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
        {/* About PaperSynth - Theme Adaptive */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:via-gray-800/50 dark:to-gray-900/50 backdrop-blur-sm rounded-2xl border border-blue-200 dark:border-blue-500/20 overflow-hidden shadow-lg">
          {/* Decorative Top Bar */}
          <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500" />
          
          <div className="p-8">
            {/* Header with Icon */}
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 dark:bg-blue-500/10 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                About PaperSynth
              </h2>
            </div>
            
            {/* Description */}
            <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed mb-4">
              PaperSynth is an AI-powered research paper summarization tool that transforms dense academic PDFs into accessible, multi-format outputs. Designed for researchers, students, and professionals who need to quickly grasp complex research, PaperSynth leverages advanced AI models to generate concise summaries, visual abstracts, audio narrations, and presentation slides—all from a single upload.
            </p>
            <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed mb-6">
              Built with a Python FastAPI backend powered by Google's Gemini AI and a modern React TypeScript frontend, PaperSynth streamlines the literature review process by converting hours of reading into minutes of insight. Whether you're preparing for a conference presentation, conducting a meta-analysis, or staying current with your field, PaperSynth helps you synthesize knowledge faster without sacrificing depth or accuracy.
            </p>
            
            {/* Feature Pills */}
            <div className="flex flex-wrap gap-2">
              <div className="px-4 py-2 bg-blue-100 dark:bg-blue-500/10 border border-blue-300 dark:border-blue-500/30 rounded-full text-blue-700 dark:text-blue-300 text-sm font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 dark:bg-blue-400" />
                AI-Powered Summaries
              </div>
              <div className="px-4 py-2 bg-purple-100 dark:bg-purple-500/10 border border-purple-300 dark:border-purple-500/30 rounded-full text-purple-700 dark:text-purple-300 text-sm font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 dark:bg-purple-400" />
                Audio Narration
              </div>
              <div className="px-4 py-2 bg-indigo-100 dark:bg-indigo-500/10 border border-indigo-300 dark:border-indigo-500/30 rounded-full text-indigo-700 dark:text-indigo-300 text-sm font-medium flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 dark:bg-indigo-400" />
                Instant Presentations
              </div>
            </div>
          </div>
        </div>

        {/* PDF Upload */}
        {!uploadedFile && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground text-center">
              Upload Your Research Paper
            </h2>
            <PDFUpload onFileUpload={handleFileUpload} isProcessing={isProcessing} />
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
                <div className="max-w-4xl mx-auto">
                  <div className="bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-8">
                    <div className="space-y-6">
                      {parseCleanSummary(uploadedFile.summary).map((section, index) => {
                        if (section.type === 'heading') {
                          return (
                            <div key={index} className="border-b border-gray-700/50 pb-3">
                              <h2 className="text-xl font-semibold text-white">
                                {section.content}
                              </h2>
                            </div>
                          );
                        }
                        
                        if (section.type === 'list') {
                          return (
                            <div key={index} className="space-y-3">
                              {section.items.map((item, i) => (
                                <div key={i} className="flex items-start gap-3 group">
                                  <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" />
                                  <p className="text-gray-300 leading-relaxed text-[15px]">
                                    {item}
                                  </p>
                                </div>
                              ))}
                            </div>
                          );
                        }
                        
                        return (
                          <p key={index} className="text-gray-300 leading-relaxed text-[15px]">
                            {section.content}
                          </p>
                        );
                      })}
                    </div>
                  </div>
                </div>
                
                {/* Upload New PDF & Download PDF Buttons */}
                <div className="mt-6 flex justify-center items-center gap-4">
                  {/* Upload New PDF Button - LEFT */}
                  <label htmlFor="file-upload-summary">
                    <button
                      type="button"
                      onClick={() => document.getElementById('file-upload-summary')?.click()}
                      className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white border-2 border-gray-300 dark:border-gray-600 rounded-lg font-medium transition-all shadow-lg hover:shadow-xl"
                    >
                      <Upload className="w-5 h-5" />
                      Upload New PDF
                    </button>
                  </label>
                  
                  <input
                    id="file-upload-summary"
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                    className="hidden"
                  />

                  {/* Download Summary PDF Button - RIGHT */}
                  {hasSummaryPDF(uploadedFile) && (
                    <button
                      onClick={() => handleDownload('pdf')}
                      disabled={downloadingType === 'pdf'}
                      className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {downloadingType === 'pdf' ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Downloading...
                        </>
                      ) : (
                        <>
                          <Download className="w-5 h-5" />
                          Download Summary PDF
                        </>
                      )}
                    </button>
                  )}
                </div>
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
                          onClick={() => handleDownload('presentation')}
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