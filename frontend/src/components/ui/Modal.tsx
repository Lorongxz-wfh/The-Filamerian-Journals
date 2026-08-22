import React, { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  isDirty?: boolean;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, className, bodyClassName, isDirty }) => {
  const [showConfirmClose, setShowConfirmClose] = useState(false);

  const handleAttemptClose = () => {
    if (isDirty) {
      setShowConfirmClose(true);
    } else {
      onClose();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showConfirmClose) {
          setShowConfirmClose(false);
        } else {
          handleAttemptClose();
        }
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, isDirty, showConfirmClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop — no blur to avoid GPU jank */}
      <div 
        className="fixed inset-0 bg-black/60 cursor-pointer" 
        onClick={handleAttemptClose}
      />
      
      {/* Panel */}
      <div
        style={{ willChange: 'transform' }}
        className={cn(
          "relative bg-surface border border-border/60 w-full max-w-lg shadow-xl flex flex-col max-h-[90vh] font-sans",
          className
        )}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-border shrink-0">
          <h2 className="text-[12px] sm:text-[13px] font-bold uppercase tracking-[0.1em] text-primary font-sans">{title}</h2>
          <button 
            onClick={handleAttemptClose}
            className="w-7 h-7 flex items-center justify-center text-muted hover:text-primary hover:bg-black/5 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        {/* Body */}
        <div className={cn("px-4 sm:px-6 py-3.5 sm:py-5 overflow-y-auto flex-grow flex flex-col custom-scrollbar", bodyClassName)}>
          {children}
        </div>
      </div>

      {/* Custom Unsaved Changes Confirmation Dialog */}
      {showConfirmClose && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/75 animate-in fade-in duration-200">
          <div className="font-sans bg-surface border border-border w-full max-w-md shadow-2xl p-7 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="w-11 h-11 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
              <div className="space-y-1.5 min-w-0 flex-1">
                <h3 className="font-sans text-base font-bold text-primary tracking-wide uppercase">
                  Discard Unsaved Changes?
                </h3>
                <p className="font-sans text-[13px] text-muted leading-relaxed">
                  You have entered data in this form. Closing will discard your changes.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
              <button
                type="button"
                onClick={() => setShowConfirmClose(false)}
                className="font-sans px-4 py-2.5 text-[13px] font-medium text-muted hover:text-primary border border-border hover:bg-background transition-colors cursor-pointer"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmClose(false);
                  onClose();
                }}
                className="font-sans px-4 py-2.5 text-[13px] font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors uppercase tracking-wider cursor-pointer"
              >
                Discard & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Modal;
