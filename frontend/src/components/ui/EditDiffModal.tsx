import React from 'react';
import { Check } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

export interface DiffItem {
  label: string;
  oldValue: string;
  newValue: string;
  isReassigned?: boolean;
}

interface EditDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  entityName?: string;
  diffs: DiffItem[];
  loading?: boolean;
}

const EditDiffModal: React.FC<EditDiffModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Review Changes Before Saving',
  entityName = 'item',
  diffs,
  loading = false,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      className="max-w-xl"
    >
      <div className="space-y-4 pt-1 font-sans">
        <p className="text-[12px] text-muted leading-relaxed">
          Please verify the modified fields below for <span className="font-semibold text-foreground">{entityName}</span> before committing updates to the system.
        </p>

        <div className="border border-border divide-y divide-border bg-background max-h-[380px] overflow-y-auto">
          {diffs.length === 0 ? (
            <p className="text-[12px] text-muted text-center py-6 font-mono">No field changes detected.</p>
          ) : (
            diffs.map((diff, idx) => (
              <div key={idx} className="p-3.5 space-y-2 bg-surface/40">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-muted">
                    {diff.label}
                  </span>
                  {diff.isReassigned && (
                    <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider border border-border bg-background text-primary">
                      Reassigned
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px]">
                  {/* Previous Value */}
                  <div className="border border-border/80 bg-background p-2.5 space-y-1">
                    <span className="text-[9px] font-mono font-semibold uppercase tracking-wider text-muted/70 block">
                      Previous
                    </span>
                    <div className="font-sans text-muted text-[12px] line-through break-words">
                      {diff.oldValue || <span className="italic text-muted/50 font-mono no-underline">None</span>}
                    </div>
                  </div>

                  {/* Updated Value */}
                  <div className="border border-primary/30 bg-primary/[0.02] p-2.5 space-y-1">
                    <span className="text-[9px] font-mono font-semibold uppercase tracking-wider text-primary block">
                      Updated
                    </span>
                    <div className="font-sans font-semibold text-primary text-[12px] break-words">
                      {diff.newValue || <span className="italic text-muted/50 font-mono font-normal">None</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="text-xs px-4 cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={onConfirm}
            isLoading={loading}
            className="text-xs px-4 font-semibold cursor-pointer"
          >
            <Check className="h-3.5 w-3.5 mr-1.5 inline" />
            Confirm & Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default EditDiffModal;
