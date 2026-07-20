import React, { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Maximize, Minimize, ZoomIn, ZoomOut, Loader2 } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Set up the worker for pdf.js to work with Vite
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

interface PdfViewerProps {
  fileUrl: string;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ fileUrl }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [scale, setScale] = useState(1.0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const documentContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = documentContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        // zoom in on scroll up, zoom out on scroll down
        if (e.deltaY < 0) {
          setScale(prev => Math.min(prev + 0.1, 3.0));
        } else if (e.deltaY > 0) {
          setScale(prev => Math.max(prev - 0.1, 0.5));
        }
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error("Error attempting to enable fullscreen:", err);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };
  
  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3.0));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));

  return (
    <div ref={containerRef} className={`flex flex-col w-full h-full bg-surface border border-border ${isFullscreen ? 'p-0' : 'sm:rounded'}`}>
      
      {/* Custom Toolbar */}
      <div className="flex flex-wrap items-center justify-end p-3 bg-background border-b border-border shrink-0 z-10 shadow-sm gap-4">

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-surface border border-border rounded p-0.5">
          <button 
            onClick={zoomOut}
            disabled={scale <= 0.5}
            className="p-1 text-muted hover:text-primary transition-colors disabled:opacity-30"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <span className="text-[11px] font-medium text-primary tabular-nums min-w-[40px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button 
            onClick={zoomIn}
            disabled={scale >= 3.0}
            className="p-1 text-muted hover:text-primary transition-colors disabled:opacity-30"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
        </div>

        {/* Utility Controls */}
        <div className="flex items-center">
          <button 
            onClick={toggleFullscreen}
            className="p-1.5 text-muted hover:text-primary hover:bg-surface rounded transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* PDF Document Container */}
      <div ref={documentContainerRef} className="flex-1 overflow-auto bg-muted/10 relative p-4 flex justify-center items-start">
        <Document
          file={fileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex flex-col items-center justify-center h-64 text-muted gap-3">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p className="text-[12px] uppercase tracking-wider">Loading Document...</p>
            </div>
          }
          error={
            <div className="flex items-center justify-center h-64 text-red-400">
              <p className="text-[13px] bg-red-500/10 border border-red-500/20 px-4 py-2 rounded">
                Failed to load PDF.
              </p>
            </div>
          }
        >
          {numPages && (
            <div className="flex flex-col gap-6 pb-8">
              {Array.from(new Array(numPages), (_, index) => (
                <div key={`page_${index + 1}`} className="shadow-lg border border-border/50 bg-white">
                  <Page 
                    pageNumber={index + 1} 
                    scale={scale} 
                    loading={
                      <div className="w-[600px] h-[800px] flex items-center justify-center bg-white">
                         <Loader2 className="h-5 w-5 animate-spin text-muted/50" />
                      </div>
                    }
                    renderTextLayer={true}
                    renderAnnotationLayer={true}
                  />
                </div>
              ))}
            </div>
          )}
        </Document>
      </div>

    </div>
  );
};

export default PdfViewer;
