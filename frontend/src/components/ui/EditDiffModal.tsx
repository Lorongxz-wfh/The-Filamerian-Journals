import React from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
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
      <div className="space-y-5">
        <div className="flex items-start gap-3 bg-secondary/10 border border-secondary/20 p-3 rounded text-[12px] text-primary">
          <AlertTriangle className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
          <p>
            Please review the modifications below for <strong>{entityName}</strong> before committing changes to the system.
          </p>
        </div>

        <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
          {diffs.length === 0 ? (
            <p className="text-[13px] text-muted text-center py-4">No changes detected.</p>
          ) : (
            diffs.map((diff, idx) => (
              <div key={idx} className="border border-border bg-surface p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
                    {diff.label}
                  </span>
                  {diff.isReassigned && (
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-secondary/20 text-secondary border border-secondary/30 rounded">
                      Reassigned
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px]">
                  <div className="bg-red-500/10 border border-red-500/20 p-2.5 rounded text-red-700 dark:text-red-300">
                    <span className="text-[10px] font-bold uppercase block text-red-500 mb-1">Previous</span>
                    <span className="break-words font-medium">{diff.oldValue || '(Empty)'}</span>
                  </div>

                  <div className="bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded text-emerald-700 dark:text-emerald-300">
                    <span className="text-[10px] font-bold uppercase block text-emerald-500 mb-1">Updated</span>
                    <span className="break-words font-medium">{diff.newValue || '(Empty)'}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={onConfirm}
            isLoading={loading}
          >
            <CheckCircle2 className="h-4 w-4 mr-1.5 inline" />
            Confirm & Save Changes
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default EditDiffModal;
