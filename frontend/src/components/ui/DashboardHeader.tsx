import React, { useState } from 'react';
import { HelpCircle, Info } from 'lucide-react';
import Modal from '@/components/ui/Modal';

interface DashboardHeaderProps {
  title: React.ReactNode;
  preTitle?: React.ReactNode;
  description?: React.ReactNode;
  helpText?: string;
  children?: React.ReactNode;
  className?: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ 
  title, 
  preTitle, 
  description, 
  helpText, 
  children, 
  className = '' 
}) => {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  return (
    <>
      <div className={`flex flex-row items-center justify-between gap-3 border-b border-border pb-3 sm:pb-4 min-h-[48px] sm:min-h-[64px] ${className}`}>
        <div className="min-w-0">
          {preTitle}
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-lg sm:text-2xl font-bold font-sans uppercase tracking-[0.12em] sm:tracking-[0.15em] text-primary truncate">
              {title}
            </h1>
            {helpText && (
              <div className="relative group inline-flex items-center">
                <button
                  type="button"
                  onClick={() => setIsHelpOpen(true)}
                  className="h-5 w-5 rounded-full flex items-center justify-center text-muted/60 hover:text-primary hover:bg-muted/10 transition-colors cursor-pointer"
                  title="Click for page guide & help"
                  aria-label="Page Information"
                >
                  <HelpCircle className="h-3.5 w-3.5" />
                </button>
                {/* Desktop hover preview */}
                <div className="absolute left-0 top-full mt-1.5 hidden group-hover:block w-64 p-2.5 bg-primary text-white text-[11px] font-normal normal-case tracking-normal shadow-lg z-50 pointer-events-none leading-relaxed border border-white/10">
                  <p className="line-clamp-3">{helpText}</p>
                  <span className="text-[9px] text-white/50 block mt-1">Click icon for full guide</span>
                </div>
              </div>
            )}
          </div>
          {description && <p className="text-[12px] sm:text-[14px] text-muted leading-relaxed mt-1 sm:mt-1.5">{description}</p>}
        </div>
        {children && <div className="shrink-0">{children}</div>}
      </div>

      {helpText && (
        <Modal
          isOpen={isHelpOpen}
          onClose={() => setIsHelpOpen(false)}
          title={typeof title === 'string' ? `${title} — Page Guide` : 'Page Information'}
        >
          <div className="space-y-4 font-sans">
            <div className="flex items-start gap-3 p-3.5 bg-primary/5 border border-primary/15 text-primary text-[13px] leading-relaxed">
              <Info className="h-4 w-4 shrink-0 text-primary mt-0.5" />
              <p>{helpText}</p>
            </div>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsHelpOpen(false)}
                className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary border border-border hover:bg-background transition-colors cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};

export default DashboardHeader;
