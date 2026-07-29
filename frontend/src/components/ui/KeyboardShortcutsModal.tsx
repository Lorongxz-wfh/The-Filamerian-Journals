import React from 'react';
import Modal from '@/components/ui/Modal';
import { Command, Search, Plus, CornerDownLeft, X, HelpCircle } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  const shortcuts = [
    { key: 'Ctrl + K', description: 'Open Global Search from anywhere', icon: Search },
    { key: 'N', description: 'Create New Item (on Dashboard management pages)', icon: Plus },
    { key: '/', description: 'Focus table search bar', icon: Command },
    { key: 'Enter', description: 'Submit modal forms', icon: CornerDownLeft },
    { key: 'Esc', description: 'Close active modal or dropdown', icon: X },
    { key: '?', description: 'Open this Keyboard Shortcuts guide', icon: HelpCircle },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Keyboard Shortcuts & Helper Guide" className="max-w-md">
      <div className="space-y-4 font-sans">
        <p className="text-[13px] text-muted">
          Use these power-user keyboard shortcuts to navigate and manage <strong>The Filamerian Journals</strong> faster.
        </p>

        <div className="divide-y divide-border border border-border bg-surface">
          {shortcuts.map((s) => (
            <div key={s.key} className="flex items-center justify-between p-3.5 hover:bg-background/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-primary/5 text-primary rounded">
                  <s.icon className="h-4 w-4" />
                </div>
                <span className="text-[13px] text-primary">{s.description}</span>
              </div>
              <kbd className="px-2 py-1 text-[11px] font-mono font-semibold text-secondary bg-primary rounded border border-secondary/20 shadow-2xs shrink-0">
                {s.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="pt-2 text-right">
          <button
            onClick={onClose}
            className="text-[12px] font-semibold text-primary hover:text-secondary uppercase tracking-wider transition-colors"
          >
            Got it, Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default KeyboardShortcutsModal;
