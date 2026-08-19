import React from 'react';
import { Toaster as Sonner } from 'sonner';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group font-sans"
      position="bottom-right"
      richColors={false}
      closeButton
      icons={{
        success: (
          <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shrink-0">
            <CheckCircle2 className="h-4 w-4 stroke-[2.2]" />
          </div>
        ),
        error: (
          <div className="p-1 rounded-md bg-red-500/10 text-red-600 border border-red-500/20 shrink-0">
            <AlertCircle className="h-4 w-4 stroke-[2.2]" />
          </div>
        ),
        warning: (
          <div className="p-1 rounded-md bg-amber-500/10 text-amber-600 border border-amber-500/20 shrink-0">
            <AlertTriangle className="h-4 w-4 stroke-[2.2]" />
          </div>
        ),
        info: (
          <div className="p-1 rounded-md bg-primary/10 text-primary border border-primary/20 shrink-0">
            <Info className="h-4 w-4 stroke-[2.2]" />
          </div>
        ),
        loading: (
          <div className="p-1 rounded-md bg-primary/10 text-primary border border-primary/20 shrink-0">
            <Loader2 className="h-4 w-4 animate-spin stroke-[2.2]" />
          </div>
        ),
      }}
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-surface group-[.toaster]:text-primary group-[.toaster]:border group-[.toaster]:border-border group-[.toaster]:shadow-lg group-[.toaster]:shadow-black/6 group-[.toaster]:rounded-lg font-sans px-4 py-3 gap-3 items-center',
          title: 'text-[13px] font-medium text-foreground leading-snug tracking-normal normal-case',
          description: 'group-[.toast]:text-muted text-[12px] leading-relaxed tracking-normal normal-case',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-white group-[.toast]:rounded-md group-[.toast]:text-[12px] group-[.toast]:font-semibold px-3 py-1.5 transition-colors hover:bg-primary/90 cursor-pointer',
          cancelButton:
            'group-[.toast]:bg-muted/10 group-[.toast]:text-muted group-[.toast]:rounded-md group-[.toast]:text-[12px] px-3 py-1.5 hover:bg-muted/20 cursor-pointer',
          closeButton:
            'group-[.toast]:border-border group-[.toast]:bg-surface group-[.toast]:text-muted hover:group-[.toast]:text-primary group-[.toast]:rounded-md group-[.toast]:transition-colors',
          error: 'group-[.toaster]:border-red-500/30 group-[.toaster]:bg-surface',
          success: 'group-[.toaster]:border-emerald-500/30 group-[.toaster]:bg-surface',
          warning: 'group-[.toaster]:border-amber-500/30 group-[.toaster]:bg-surface',
          info: 'group-[.toaster]:border-primary/30 group-[.toaster]:bg-surface',
        },
      }}
      {...props}
    />
  );
};

export default Toaster;

