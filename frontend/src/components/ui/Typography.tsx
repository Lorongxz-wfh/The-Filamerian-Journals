import React from 'react';
import { cn } from '@/lib/utils';

interface TypographyProps extends React.HTMLAttributes<HTMLHeadingElement | HTMLParagraphElement> {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'lead' | 'large' | 'small' | 'muted';
  as?: React.ElementType;
}

export const Typography: React.FC<TypographyProps> = ({ 
  variant = 'p', 
  as, 
  className, 
  children, 
  ...props 
}) => {
  const Component = as || (
    ['h1', 'h2', 'h3', 'h4'].includes(variant) ? variant : 'p'
  ) as React.ElementType;

  const variants = {
    h1: 'font-display text-4xl lg:text-5xl font-bold tracking-tight text-primary',
    h2: 'font-display text-3xl font-bold tracking-tight text-primary',
    h3: 'font-display text-2xl font-bold tracking-tight text-primary',
    h4: 'font-display text-xl font-bold tracking-tight text-primary',
    p: 'leading-7 text-foreground',
    lead: 'text-xl text-muted',
    large: 'text-lg font-semibold text-primary',
    small: 'text-sm font-medium leading-none text-muted',
    muted: 'text-sm text-muted',
  };

  return (
    <Component className={cn(variants[variant], className)} {...props}>
      {children}
    </Component>
  );
};

export default Typography;
