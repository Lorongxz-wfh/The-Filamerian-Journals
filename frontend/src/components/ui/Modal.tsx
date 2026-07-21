import React, { useEffect } from 'react';
import { X } from 'lucide-react';
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
  const handleAttemptClose = () => {
    if (isDirty) {
      if (window.confirm("You have unsaved changes. Are you sure you want to cancel and close?")) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleAttemptClose();
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
  }, [isOpen, onClose, isDirty]);

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
    </div>
  );
};

export default Modal;
