import React, { useState, useRef, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Maximize, Minimize, ZoomIn, ZoomOut, Loader2, RotateCw, PanelLeft, LayoutList, LayoutTemplate } from 'lucide-react';
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
  const [rotation, setRotation] = useState(0);
  const [showSidebar, setShowSidebar] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const documentContainerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Wheel zoom logic
  useEffect(() => {
    const container = documentContainerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
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

  // Fullscreen logic
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

  // Scroll tracking for current page
  useEffect(() => {
    if (!numPages) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const pageNum = Number(entry.target.getAttribute('data-page-number'));
            if (pageNum) setCurrentPage(pageNum);
          }
        });
      },
      { root: documentContainerRef.current, threshold: 0.4 }
    );

    pageRefs.current.forEach(ref => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [numPages, rotation]); // Re-run if rotation changes the layout sizes

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    pageRefs.current = new Array(numPages).fill(null);
  };
  
  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3.0));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
  const rotate = () => setRotation(prev => (prev + 90) % 360);
  
  const fitWidth = () => {
    if (documentContainerRef.current) {
      const containerWidth = documentContainerRef.current.clientWidth - 40; // minus padding
      // Approximate base width of A4 is 595px
      const isLandscape = rotation === 90 || rotation === 270;
      const baseWidth = isLandscape ? 842 : 595;
      setScale(containerWidth / baseWidth);
    }
  };

  const fitPage = () => {
    if (documentContainerRef.current) {
      const containerHeight = documentContainerRef.current.clientHeight - 40;
      const isLandscape = rotation === 90 || rotation === 270;
      const baseHeight = isLandscape ? 595 : 842;
      setScale(containerHeight / baseHeight);
    }
  };

  const scrollToPage = (pageNum: number) => {
    pageRefs.current[pageNum - 1]?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div ref={containerRef} className={`flex flex-col w-full h-full bg-surface border border-border ${isFullscreen ? 'p-0' : 'sm:rounded'}`}>
      
      {/* Custom Toolbar */}
      <div className="flex flex-wrap items-center justify-between p-2 bg-background border-b border-border shrink-0 z-20 shadow-sm gap-2 relative">
        
        {/* Left Side: Sidebar Toggle & Page Indicator */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowSidebar(!showSidebar)}
            className={`p-1.5 rounded transition-colors ${showSidebar ? 'bg-primary/10 text-primary' : 'text-muted hover:text-primary hover:bg-surface'}`}
            title="Toggle Thumbnails"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
          
          {numPages && (
            <span className="text-[12px] font-medium text-primary tabular-nums">
              Page {currentPage} <span className="text-muted font-normal">of {numPages}</span>
            </span>
          )}
        </div>

        {/* Center: View Controls */}
        <div className="flex items-center gap-3">
          {/* Fit Controls */}
          <div className="flex items-center gap-1 bg-surface border border-border rounded p-0.5">
            <button 
              onClick={fitWidth}
              className="p-1 text-muted hover:text-primary transition-colors"
              title="Fit to Width"
            >
              <LayoutList className="h-4 w-4" />
            </button>
            <button 
              onClick={fitPage}
              className="p-1 text-muted hover:text-primary transition-colors"
              title="Fit to Page"
            >
              <LayoutTemplate className="h-4 w-4" />
            </button>
          </div>
          
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
        </div>

        {/* Right Side: Utilities */}
        <div className="flex items-center gap-1">
          <button 
            onClick={rotate}
            className="p-1.5 text-muted hover:text-primary hover:bg-surface rounded transition-colors"
            title="Rotate Document"
          >
            <RotateCw className="h-4 w-4" />
          </button>
          <button 
            onClick={toggleFullscreen}
            className="p-1.5 text-muted hover:text-primary hover:bg-surface rounded transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Thumbnails Sidebar */}
        {showSidebar && (
          <div className="w-48 bg-surface border-r border-border shrink-0 overflow-y-auto py-4 z-10 shadow-sm">
            <Document file={fileUrl}>
              <div className="flex flex-col items-center gap-6">
                {numPages && Array.from(new Array(numPages), (_, index) => (
                  <div 
                    key={`thumb_${index + 1}`}
                    onClick={() => scrollToPage(index + 1)}
                    className={`cursor-pointer transition-all border-2 p-1 ${currentPage === index + 1 ? 'border-primary shadow-md scale-105 bg-primary/5' : 'border-transparent hover:border-border shadow-sm bg-white'}`}
                  >
                    <Page 
                      pageNumber={index + 1} 
                      width={120} 
                      rotate={rotation}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                    />
                    <div className="text-center text-[10px] text-muted mt-2 font-medium">{index + 1}</div>
                  </div>
                ))}
              </div>
            </Document>
          </div>
        )}

        {/* PDF Document Container */}
        <div ref={documentContainerRef} className="flex-1 overflow-auto bg-muted/10 p-2 flex justify-center items-start">
          <Document
            file={fileUrl}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={
              <div className="flex flex-col items-center justify-center h-64 text-muted gap-3 w-full">
                <Loader2 className="h-6 w-6 animate-spin" />
                <p className="text-[12px] uppercase tracking-wider">Loading Document...</p>
              </div>
            }
            error={
              <div className="flex items-center justify-center h-64 text-red-400 w-full">
                <p className="text-[13px] bg-red-500/10 border border-red-500/20 px-4 py-2 rounded">
                  Failed to load PDF.
                </p>
              </div>
            }
          >
            {numPages && (
              <div className="flex flex-col gap-4 pb-4 items-center">
                {Array.from(new Array(numPages), (_, index) => (
                  <div 
                    key={`page_${index + 1}`} 
                    ref={el => { pageRefs.current[index] = el; }}
                    data-page-number={index + 1}
                    className="shadow-lg border border-border/50 bg-white transition-all origin-top"
                  >
                    <Page 
                      pageNumber={index + 1} 
                      scale={scale} 
                      rotate={rotation}
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
    </div>
  );
};

export default PdfViewer;
