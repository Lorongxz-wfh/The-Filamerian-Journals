import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      position="top-center"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-surface group-[.toaster]:text-primary group-[.toaster]:border-2 group-[.toaster]:border-border group-[.toaster]:shadow-none group-[.toaster]:rounded-none font-sans px-4 py-3',
          title: 'text-[13px] font-bold uppercase tracking-wider',
          description: 'group-[.toast]:text-muted text-[12px]',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-white group-[.toast]:rounded-none group-[.toast]:text-[12px] group-[.toast]:font-semibold uppercase tracking-wider',
          cancelButton:
            'group-[.toast]:bg-muted/10 group-[.toast]:text-muted group-[.toast]:rounded-none group-[.toast]:text-[12px] uppercase tracking-wider',
          error: 'group-[.toaster]:border-l-4 group-[.toaster]:border-l-red-600 group-[.toaster]:border-y-border group-[.toaster]:border-r-border group-[.toaster]:bg-surface',
          success: 'group-[.toaster]:border-l-4 group-[.toaster]:border-l-emerald-600 group-[.toaster]:border-y-border group-[.toaster]:border-r-border group-[.toaster]:bg-surface',
        },
      }}
      {...props}
    />
  );
};

export default Toaster;
