import { Toaster as Sonner } from 'sonner';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-surface group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg font-sans',
          description: 'group-[.toast]:text-muted text-[13px]',
          actionButton:
            'group-[.toast]:bg-primary group-[.toast]:text-white',
          cancelButton:
            'group-[.toast]:bg-muted/10 group-[.toast]:text-muted',
        },
      }}
      {...props}
    />
  );
};

export default Toaster;
