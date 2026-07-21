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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
      <div 
        className="fixed inset-0 bg-black/60 transition-opacity cursor-pointer" 
        onClick={handleAttemptClose}
      />
      
      <div className={cn(
        "relative bg-surface border border-border w-full max-w-lg shadow-xl flex flex-col max-h-[90vh]",
        className
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-lg uppercase tracking-wider">{title}</h2>
          <button 
            onClick={handleAttemptClose}
            className="text-muted hover:text-primary transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {/* Body */}
        <div className={cn("p-6 overflow-y-auto flex-grow flex flex-col", bodyClassName)}>
          {children}
        </div>
      </div>

      {/* Custom Unsaved Changes Confirmation Dialog */}
      {showConfirmClose && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/75 animate-in fade-in duration-200">
          <div className="bg-surface border border-border w-full max-w-sm shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Discard Unsaved Changes?</h3>
                <p className="text-[12px] text-muted leading-relaxed">
                  You have entered data in this form. Closing will discard your changes.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setShowConfirmClose(false)}
                className="px-3.5 py-2 text-[12px] font-medium text-muted hover:text-primary border border-border hover:bg-background transition-colors cursor-pointer"
              >
                Keep Editing
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirmClose(false);
                  onClose();
                }}
                className="px-3.5 py-2 text-[12px] font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors uppercase tracking-wider cursor-pointer"
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
