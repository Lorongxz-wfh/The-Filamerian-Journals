import React, { useState } from 'react';
import { Upload, FileText, ImageIcon, CheckCircle2, X } from 'lucide-react';
import { toast } from 'sonner';
import { useSettings } from '@/contexts/SettingsContext';

interface FileUploadZoneProps {
  id?: string;
  label?: string;
  hint?: string;
  accept?: string;
  selectedFile: File | null;
  existingUrl?: string | null;
  onFileSelect: (file: File | null) => void;
  iconType?: 'pdf' | 'image' | 'generic';
  disabled?: boolean;
  className?: string;
}

const FileUploadZone: React.FC<FileUploadZoneProps> = ({
  id,
  label,
  hint,
  accept = '*',
  selectedFile,
  existingUrl,
  onFileSelect,
  iconType = 'generic',
  disabled = false,
  className = ''
}) => {
  const { settings } = useSettings();
  const isPdf = iconType === 'pdf' || accept.includes('pdf');
  const maxMb = isPdf
    ? (settings.max_pdf_upload_size ? parseInt(String(settings.max_pdf_upload_size), 10) : (settings.max_upload_size ? parseInt(String(settings.max_upload_size), 10) : 10))
    : (settings.max_image_upload_size ? parseInt(String(settings.max_image_upload_size), 10) : 5);
  const [isDragging, setIsDragging] = useState(false);
  const inputId = id || `file-upload-${Math.random().toString(36).substring(2, 9)}`;

  const validateFile = (file: File): boolean => {
    if (file.size > maxMb * 1024 * 1024) {
      toast.error(`File size exceeds maximum allowed limit of ${maxMb}MB.`);
      return false;
    }
    if (!accept || accept === '*') return true;

    const fileName = file.name.toLowerCase();
    const fileType = file.type.toLowerCase();

    // Strict cover image check (reject GIF, SVG, etc. if image upload)
    if (iconType === 'image' || (accept.includes('image') && !accept.includes('pdf'))) {
      const isRasterImage = fileName.endsWith('.jpg') || fileName.endsWith('.jpeg') || fileName.endsWith('.png') || fileType === 'image/jpeg' || fileType === 'image/png';
      if (!isRasterImage) {
        toast.error('Only JPG and PNG image files are allowed for cover images.');
        return false;
      }
      return true;
    }

    const acceptParts = accept.split(',').map(s => s.trim().toLowerCase());
    const matches = acceptParts.some(pattern => {
      if (pattern.startsWith('.')) {
        return fileName.endsWith(pattern);
      }
      if (pattern.endsWith('/*')) {
        const category = pattern.split('/')[0];
        return fileType.startsWith(`${category}/`);
      }
      return fileType === pattern;
    });

    if (!matches) {
      if (accept.includes('pdf')) {
        toast.error('Only PDF files are allowed.');
      } else if (accept.includes('image')) {
        toast.error('Only JPG and PNG image files are allowed.');
      } else {
        toast.error('Invalid file type.');
      }
      return false;
    }
    return true;
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file && validateFile(file)) {
      onFileSelect(file);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (file && validateFile(file)) {
      onFileSelect(file);
    }
  };

  const renderIcon = () => {
    if (isDragging) {
      return <Upload className="h-5 w-5 text-primary scale-110 transition-transform duration-300 ease-out shrink-0" />;
    }
    if (selectedFile) {
      return <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />;
    }
    if (existingUrl) {
      if (iconType === 'image') {
        return (
          <div className="w-9 h-9 shrink-0 bg-muted/20 border border-border overflow-hidden rounded flex items-center justify-center">
            <img 
              src={existingUrl} 
              alt="Existing cover preview" 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }} 
            />
            <ImageIcon className="h-4 w-4 text-primary/60 shrink-0" />
          </div>
        );
      }
      return (
        <div className="w-9 h-9 shrink-0 bg-red-50 border border-red-200 rounded flex items-center justify-center">
          <FileText className="h-5 w-5 text-red-600 shrink-0" />
        </div>
      );
    }
    if (iconType === 'image') return <ImageIcon className="h-5 w-5 text-muted group-hover:text-primary transition-colors shrink-0" />;
    if (iconType === 'pdf') return <FileText className="h-5 w-5 text-muted group-hover:text-primary transition-colors shrink-0" />;
    return <Upload className="h-5 w-5 text-muted group-hover:text-primary transition-colors shrink-0" />;
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-[11px] font-semibold text-primary uppercase tracking-wider">
            {label}
          </label>
          {hint && (
            <span className="text-[10px] text-muted normal-case tracking-normal">
              {hint}
            </span>
          )}
        </div>
      )}

      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`group relative flex items-center justify-center w-full border transition-all cursor-pointer py-2.5 px-3.5 rounded-sm min-h-[72px] h-[72px] ${
          isDragging
            ? 'border-primary bg-primary/5 scale-[1.005]'
            : selectedFile
            ? 'border-green-500/40 bg-green-500/[0.02]'
            : existingUrl
            ? 'border-blue-500/30 bg-blue-500/[0.02] border-solid'
            : 'border-dashed border-border hover:border-primary/50 bg-background hover:bg-primary/[0.02]'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input
          id={inputId}
          type="file"
          accept={accept}
          disabled={disabled}
          onChange={handleFileChange}
          className="sr-only"
        />

        <div className="flex items-center gap-3 w-full min-w-0">
          {renderIcon()}

          <div className="flex-1 min-w-0 text-left">
            {isDragging ? (
              <p className="text-[12px] font-semibold text-primary truncate">Drop new file here</p>
            ) : selectedFile ? (
              <div className="flex items-center justify-between gap-2 min-w-0">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-green-700 bg-green-100 border border-green-200 rounded shrink-0">
                      Selected
                    </span>
                    <p className="text-[12px] font-semibold text-primary truncate">{selectedFile.name}</p>
                  </div>
                  <p className="text-[10px] text-muted truncate mt-0.5">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB — Click or drag to replace
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onFileSelect(null);
                  }}
                  className="p-1 hover:bg-red-500/10 hover:text-red-500 text-muted transition-colors rounded cursor-pointer shrink-0"
                  title="Remove selected file"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : existingUrl ? (
              <div className="flex items-center justify-between gap-2 min-w-0">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-blue-700 bg-blue-100 border border-blue-200 rounded shrink-0">
                      Attached
                    </span>
                    <p className="text-[12px] font-semibold text-primary truncate">
                      {iconType === 'image' ? 'Existing Image' : 'Existing PDF'}
                    </p>
                  </div>
                  <p className="text-[10px] text-muted truncate mt-0.5">Click or drag to replace</p>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-[12px] font-semibold text-primary truncate">
                  Click or drag & drop file
                </p>
                <p className="text-[10px] text-muted truncate">
                  {hint || (accept.includes('pdf') ? `PDF files only (Max ${maxMb}MB)` : accept.includes('image') ? `JPG, PNG image files (Max ${maxMb}MB)` : `Select a file up to ${maxMb}MB`)}
                </p>
              </div>
            )}
          </div>
        </div>
      </label>
    </div>
  );
};

export default FileUploadZone;
