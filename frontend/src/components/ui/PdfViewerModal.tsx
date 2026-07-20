import React from 'react';
import { Download } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import PdfViewer from '@/components/ui/PdfViewer';

interface PdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string | null;
  allowDownload?: boolean;
}

const PdfViewerModal: React.FC<PdfViewerModalProps> = ({ isOpen, onClose, pdfUrl, allowDownload = false }) => {
  const downloadUrl = pdfUrl ? pdfUrl.split('#')[0] : ''; // Clean URL for download link

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Document Viewer" 
      className="max-w-[95vw] sm:max-w-6xl h-[95vh]"
      bodyClassName="p-0 flex flex-col overflow-hidden"
    >
      {allowDownload && pdfUrl && (
        <div className="flex justify-end p-2 bg-surface border-b border-border shrink-0 z-10 relative">
          <a href={downloadUrl} download target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="flex items-center gap-2">
              <Download className="h-4 w-4" /> Download PDF
            </Button>
          </a>
        </div>
      )}
      <div className="w-full h-full flex flex-col flex-grow bg-white overflow-hidden relative">
        {pdfUrl ? (
          <PdfViewer fileUrl={pdfUrl} />
        ) : (
          <div className="flex items-center justify-center flex-grow text-muted">Loading document...</div>
        )}
      </div>
    </Modal>
  );
};

export default PdfViewerModal;
