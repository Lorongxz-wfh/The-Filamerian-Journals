import React, { useState } from 'react';
import { Upload, FileText, ImageIcon, CheckCircle2, X } from 'lucide-react';
import { toast } from 'sonner';

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
  const [isDragging, setIsDragging] = useState(false);
  const inputId = id || `file-upload-${Math.random().toString(36).substring(2, 9)}`;

  const validateFile = (file: File): boolean => {
    if (!accept || accept === '*') return true;

    const acceptParts = accept.split(',').map(s => s.trim().toLowerCase());
    const fileName = file.name.toLowerCase();
    const fileType = file.type.toLowerCase();

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
        toast.error('Only image files (JPG/PNG) are allowed.');
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
      return <Upload className="h-5 w-5 text-primary animate-bounce shrink-0" />;
    }
    if (selectedFile) {
      return <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />;
    }
    if (existingUrl) {
      if (iconType === 'image') return <ImageIcon className="h-5 w-5 text-primary/40 shrink-0" />;
      return <FileText className="h-5 w-5 text-primary/40 shrink-0" />;
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
        className={`group relative flex items-center justify-center w-full border border-dashed transition-all cursor-pointer py-3 px-3.5 rounded-sm min-h-[58px] ${
          isDragging
            ? 'border-primary bg-primary/5 scale-[1.005]'
            : selectedFile
            ? 'border-green-500/40 bg-green-500/[0.02]'
            : 'border-border hover:border-primary/50 bg-background hover:bg-primary/[0.02]'
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
              <p className="text-[12px] font-semibold text-primary truncate">Drop file here</p>
            ) : selectedFile ? (
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[12px] font-semibold text-primary truncate">{selectedFile.name}</p>
                  <p className="text-[10px] text-muted">
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
                  className="p-1 hover:bg-red-500/10 hover:text-red-500 text-muted transition-colors rounded"
                  title="Remove file"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : existingUrl ? (
              <div>
                <p className="text-[12px] font-semibold text-primary truncate">
                  {iconType === 'image' ? 'Cover image uploaded' : 'PDF document uploaded'}
                </p>
                <p className="text-[10px] text-muted">Click or drag a new file to replace</p>
              </div>
            ) : (
              <div>
                <p className="text-[12px] font-semibold text-primary truncate">
                  Click or drag & drop file
                </p>
                <p className="text-[10px] text-muted truncate">
                  {accept.includes('pdf') ? 'PDF files only' : accept.includes('image') ? 'JPG, PNG image files' : 'Select a file to upload'}
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
