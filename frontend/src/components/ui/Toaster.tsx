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
      icons={{
        success: <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />,
        error: <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />,
        warning: <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />,
        info: <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />,
        loading: <Loader2 className="h-5 w-5 text-primary animate-spin shrink-0 mt-0.5" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-surface group-[.toaster]:text-primary group-[.toaster]:border group-[.toaster]:border-border group-[.toaster]:shadow-xl group-[.toaster]:shadow-black/10 group-[.toaster]:rounded-lg font-sans p-4 sm:min-w-[360px] max-w-md gap-3.5 items-start',
          title: 'text-[13px] font-medium text-foreground leading-relaxed tracking-normal normal-case flex-1',
          description: 'group-[.toast]:text-muted text-[12px] leading-relaxed tracking-normal normal-case mt-1',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-white group-[.toast]:rounded-md group-[.toast]:text-[12px] group-[.toast]:font-semibold px-3 py-1.5 transition-colors hover:bg-primary/90 cursor-pointer',
          cancelButton:
            'group-[.toast]:bg-muted/10 group-[.toast]:text-muted group-[.toast]:rounded-md group-[.toast]:text-[12px] px-3 py-1.5 hover:bg-muted/20 cursor-pointer',
          error: 'group-[.toaster]:border-l-4 group-[.toaster]:border-l-red-600 group-[.toaster]:bg-surface',
          success: 'group-[.toaster]:border-l-4 group-[.toaster]:border-l-emerald-600 group-[.toaster]:bg-surface',
          warning: 'group-[.toaster]:border-l-4 group-[.toaster]:border-l-amber-500 group-[.toaster]:bg-surface',
          info: 'group-[.toaster]:border-l-4 group-[.toaster]:border-l-primary group-[.toaster]:bg-surface',
        },
      }}
      {...props}
    />
  );
};

export default Toaster;

