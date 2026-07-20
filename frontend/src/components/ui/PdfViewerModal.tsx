import React from 'react';
import Modal from '@/components/ui/Modal';
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
      <div className="w-full h-full flex flex-col flex-grow bg-white overflow-hidden relative">
        {pdfUrl ? (
          <PdfViewer fileUrl={pdfUrl} allowDownload={allowDownload} downloadUrl={downloadUrl} />
        ) : (
          <div className="flex items-center justify-center flex-grow text-muted">Loading document...</div>
        )}
      </div>
    </Modal>
  );
};

export default PdfViewerModal;
