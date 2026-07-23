import React from 'react';
import { Link } from 'react-router';
import { cn } from '@/lib/utils';
import { ChevronRight, MoreHorizontal } from 'lucide-react';

interface BreadcrumbsProps extends React.HTMLAttributes<HTMLElement> {
  separator?: React.ReactNode;
}

const Breadcrumbs = React.forwardRef<HTMLElement, BreadcrumbsProps>(
  ({ className, separator = <ChevronRight className="h-4 w-4" />, ...props }, ref) => (
    <nav
      ref={ref}
      aria-label="breadcrumb"
      className={cn('flex items-center text-sm text-muted', className)}
      {...props}
    />
  )
);
Breadcrumbs.displayName = 'Breadcrumbs';

const BreadcrumbList = React.forwardRef<HTMLOListElement, React.OlHTMLAttributes<HTMLOListElement>>(
  ({ className, ...props }, ref) => (
    <ol
      ref={ref}
      className={cn('flex flex-wrap items-center gap-1.5 break-words sm:gap-2.5', className)}
      {...props}
    />
  )
);
BreadcrumbList.displayName = 'BreadcrumbList';

const BreadcrumbItem = React.forwardRef<HTMLLIElement, React.LiHTMLAttributes<HTMLLIElement>>(
  ({ className, ...props }, ref) => (
    <li
      ref={ref}
      className={cn('inline-flex items-center gap-1.5', className)}
      {...props}
    />
  )
);
BreadcrumbItem.displayName = 'BreadcrumbItem';

export type BreadcrumbLinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
  to?: string;
  href?: string;
};

const BreadcrumbLink = React.forwardRef<HTMLAnchorElement, BreadcrumbLinkProps>(
  ({ className, to, href, ...props }, ref) => (
    <Link
      ref={ref}
      to={to || href || '#'}
      className={cn('transition-colors hover:text-primary cursor-pointer', className)}
      {...props}
    />
  )
);
BreadcrumbLink.displayName = 'BreadcrumbLink';

const BreadcrumbPage = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      role="link"
      aria-disabled="true"
      aria-current="page"
      className={cn('font-normal text-foreground', className)}
      {...props}
    />
  )
);
BreadcrumbPage.displayName = 'BreadcrumbPage';

const BreadcrumbSeparator = ({ children, className, ...props }: React.ComponentProps<'li'>) => (
  <li
    role="presentation"
    aria-hidden="true"
    className={cn('[&>svg]:w-3.5 [&>svg]:h-3.5', className)}
    {...props}
  >
    {children ?? <ChevronRight />}
  </li>
);
BreadcrumbSeparator.displayName = 'BreadcrumbSeparator';

const BreadcrumbEllipsis = ({ className, ...props }: React.ComponentProps<'span'>) => (
  <span
    role="presentation"
    aria-hidden="true"
    className={cn('flex h-9 w-9 items-center justify-center', className)}
    {...props}
  >
    <MoreHorizontal className="h-4 w-4" />
    <span className="sr-only">More</span>
  </span>
);
BreadcrumbEllipsis.displayName = 'BreadcrumbEllipsis';

export {
  Breadcrumbs,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
};
