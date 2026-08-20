import React, { useState } from 'react';
import { Upload, FileText, ImageIcon, X } from 'lucide-react';
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

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  React.useEffect(() => {
    if (selectedFile && (selectedFile.type.startsWith('image/') || iconType === 'image')) {
      const url = URL.createObjectURL(selectedFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
    setPreviewUrl(null);
  }, [selectedFile, iconType]);

  const renderIcon = () => {
    if (isDragging) {
      return (
        <div className="w-9 h-9 shrink-0 bg-primary/10 border border-primary/30 flex items-center justify-center text-primary transition-transform duration-200 scale-105">
          <Upload className="h-4 w-4" />
        </div>
      );
    }
    if (selectedFile) {
      if (previewUrl) {
        return (
          <div className="w-9 h-9 shrink-0 bg-surface border border-border/80 overflow-hidden flex items-center justify-center">
            <img src={previewUrl} alt="Selected file preview" className="w-full h-full object-cover" />
          </div>
        );
      }
      return (
        <div className="w-9 h-9 shrink-0 bg-primary/5 border border-primary/20 flex items-center justify-center text-primary">
          <FileText className="h-4 w-4" />
        </div>
      );
    }
    if (existingUrl) {
      if (iconType === 'image') {
        return (
          <div className="w-9 h-9 shrink-0 bg-muted/10 border border-border/80 overflow-hidden flex items-center justify-center">
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
        <div className="w-9 h-9 shrink-0 bg-primary/5 border border-primary/20 flex items-center justify-center text-primary">
          <FileText className="h-4 w-4" />
        </div>
      );
    }
    if (iconType === 'image') {
      return (
        <div className="w-9 h-9 shrink-0 bg-muted/10 border border-border flex items-center justify-center text-muted group-hover:text-primary group-hover:border-primary/40 transition-colors">
          <ImageIcon className="h-4 w-4" />
        </div>
      );
    }
    if (iconType === 'pdf') {
      return (
        <div className="w-9 h-9 shrink-0 bg-muted/10 border border-border flex items-center justify-center text-muted group-hover:text-primary group-hover:border-primary/40 transition-colors">
          <FileText className="h-4 w-4" />
        </div>
      );
    }
    return (
      <div className="w-9 h-9 shrink-0 bg-muted/10 border border-border flex items-center justify-center text-muted group-hover:text-primary group-hover:border-primary/40 transition-colors">
        <Upload className="h-4 w-4" />
      </div>
    );
  };

  const dynamicHint = hint !== undefined ? hint : (isPdf ? `PDF (Max: ${maxMb}MB)` : `JPG/PNG (Max: ${maxMb}MB)`);

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-[11px] font-semibold text-primary uppercase tracking-wider">
            {label}
          </label>
          {dynamicHint && (
            <span className="text-[10px] text-muted normal-case tracking-normal font-mono">
              {dynamicHint}
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
        className={`group relative flex items-center justify-center w-full border transition-all cursor-pointer py-2.5 px-3 min-h-[64px] h-[64px] ${
          isDragging
            ? 'border-primary bg-primary/5'
            : selectedFile
            ? 'border-primary/40 bg-surface hover:border-primary/60'
            : existingUrl
            ? 'border-border/80 bg-surface/50 hover:border-primary/40'
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
              <p className="text-[12px] font-semibold text-primary truncate">Drop file to upload</p>
            ) : selectedFile ? (
              <div className="flex items-center justify-between gap-2 min-w-0">
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium text-foreground truncate font-sans">{selectedFile.name}</p>
                  <p className="text-[10px] text-muted truncate mt-0.5 font-mono">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB · Click or drag to replace
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onFileSelect(null);
                  }}
                  className="p-1 hover:bg-destructive/10 hover:text-destructive text-muted transition-colors cursor-pointer shrink-0"
                  title="Remove selected file"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : existingUrl ? (
              <div className="flex items-center justify-between gap-2 min-w-0">
                <div className="min-w-0 flex-1">
                  <p className="text-[12px] font-medium text-foreground truncate">
                    {iconType === 'image' ? 'Current Cover Image' : 'Current PDF Document'}
                  </p>
                  <p className="text-[10px] text-muted truncate mt-0.5 font-mono">Attached · Click or drag to replace</p>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-[12px] font-medium text-foreground group-hover:text-primary transition-colors truncate">
                  Click or drag file to upload
                </p>
                <p className="text-[10px] text-muted truncate font-mono mt-0.5">
                  {hint || (accept.includes('pdf') ? `PDF only (Max ${maxMb}MB)` : accept.includes('image') ? `JPG, PNG (Max ${maxMb}MB)` : `Max size ${maxMb}MB`)}
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
