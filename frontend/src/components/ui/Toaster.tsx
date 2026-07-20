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
            'group toast group-[.toaster]:bg-surface group-[.toaster]:text-primary group-[.toaster]:border group-[.toaster]:border-border group-[.toaster]:shadow-sm group-[.toaster]:rounded-none font-sans px-4 py-3',
          title: 'text-[13px] font-semibold tracking-wide',
          description: 'group-[.toast]:text-muted text-[12px]',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-white group-[.toast]:rounded-none group-[.toast]:text-[12px] group-[.toast]:font-semibold',
          cancelButton:
            'group-[.toast]:bg-muted/10 group-[.toast]:text-muted group-[.toast]:rounded-none group-[.toast]:text-[12px]',
          error: 'group-[.toaster]:border-red-200 group-[.toaster]:bg-red-50 group-[.toaster]:text-red-800',
          success: 'group-[.toaster]:border-emerald-200 group-[.toaster]:bg-emerald-50 group-[.toaster]:text-emerald-800',
        },
      }}
      {...props}
    />
  );
};

export default Toaster;
