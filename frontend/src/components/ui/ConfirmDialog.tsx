import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { AlertTriangle, Info } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText = 'Cancel',
  isDestructive = true,
  isLoading = false,
}) => {
  // Sanitize cliché AI text if passed in
  const cleanMessage = message.replace(/\s*This action cannot be undone\.?/gi, '');
  const finalConfirmText = confirmText || (isDestructive ? 'Confirm Deletion' : 'Confirm');

  return (
    <Modal isOpen={isOpen} onClose={() => !isLoading && onClose()} title={title} className="max-w-md">
      <div className="py-2">
        <div className="flex items-start gap-3.5">
          <div className={`p-2 rounded shrink-0 ${
            isDestructive 
              ? 'bg-red-500/10 text-red-600' 
              : 'bg-primary/10 text-primary'
          }`}>
            {isDestructive ? (
              <AlertTriangle className="h-5 w-5" />
            ) : (
              <Info className="h-5 w-5" />
            )}
          </div>
          <p className="text-[13px] text-foreground/80 leading-relaxed font-normal pt-0.5">
            {cleanMessage}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border mt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onClose} 
          disabled={isLoading}
          className="text-xs px-4 cursor-pointer"
        >
          {cancelText}
        </Button>
        <Button 
          type="button" 
          variant={isDestructive ? 'danger' : 'primary'} 
          onClick={onConfirm} 
          isLoading={isLoading}
          disabled={isLoading}
          className="text-xs px-4 font-semibold cursor-pointer"
        >
          {isLoading ? (isDestructive ? 'Deleting...' : 'Processing...') : finalConfirmText}
        </Button>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;
