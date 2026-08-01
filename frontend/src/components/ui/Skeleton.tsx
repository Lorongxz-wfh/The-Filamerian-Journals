import React from 'react';
import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Skeleton: React.FC<SkeletonProps> = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        "relative overflow-hidden bg-muted/10 before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_1.5s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
        className
      )}
      {...props}
    />
  );
};

// ─── Generic fallback — kept for backward compatibility ───────────────────────
// Renders a single flat bar per cell. Only use when a page-specific skeleton
// hasn't been written yet.
export const TableRowSkeleton: React.FC<{ columns: number; rows?: number }> = ({
  columns,
  rows = 5,
}) => {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="border-b border-border last:border-b-0">
          {Array.from({ length: columns }).map((_, j) => (
            <td key={j} className="p-5 align-middle">
              <Skeleton className="h-4 w-full max-w-[80%]" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
};

// ─── Articles table skeleton ──────────────────────────────────────────────────
// Mirrors: icon + title text + badge (col 1), plain text ×4, icon-buttons (col 6)
export const ArticlesTableSkeleton: React.FC<{ rows?: number }> = ({ rows = 10 }) => (
  <>
    {Array.from({ length: rows }).map((_, i) => (
      <tr key={i} className="border-b border-border last:border-b-0">
        {/* Title: icon + text + badge */}
        <td className="p-5 align-middle">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 shrink-0" />
              <Skeleton className="h-[13px] w-48" />
            </div>
            <div className="pl-6">
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        </td>
        {/* Journal */}
        <td className="p-5 align-middle">
          <Skeleton className="h-[13px] w-32" />
        </td>
        {/* Authors */}
        <td className="p-5 align-middle">
          <Skeleton className="h-[13px] w-36" />
        </td>
        {/* Submitted */}
        <td className="p-5 align-middle">
          <Skeleton className="h-[13px] w-24" />
        </td>
        {/* Updated */}
        <td className="p-5 align-middle">
          <Skeleton className="h-[13px] w-24" />
        </td>
        {/* Actions: 3 icon buttons */}
        <td className="p-5 align-middle">
          <div className="flex items-center justify-end gap-1">
            <Skeleton className="h-7 w-7" />
            <Skeleton className="h-7 w-7" />
            <Skeleton className="h-7 w-7" />
          </div>
        </td>
      </tr>
    ))}
  </>
);

// ─── Journals (MyJournals) table skeleton ─────────────────────────────────────
// Mirrors: icon + title text + badge (col 1), text ×3, 3 icon-buttons (col 5)
export const JournalsTableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <>
    {Array.from({ length: rows }).map((_, i) => (
      <tr key={i} className="border-b border-border last:border-b-0">
        {/* Title: icon + text + badge */}
        <td className="p-5 align-middle">
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-4 shrink-0" />
            <div className="flex flex-col gap-1.5 min-w-0">
              <Skeleton className="h-[13px] w-44" />
              <Skeleton className="h-4 w-14" />
            </div>
          </div>
        </td>
        {/* Category */}
        <td className="p-5 align-middle">
          <Skeleton className="h-[13px] w-28" />
        </td>
        {/* Updated */}
        <td className="p-5 align-middle">
          <Skeleton className="h-[13px] w-24" />
        </td>
        {/* Editor */}
        <td className="p-5 align-middle">
          <Skeleton className="h-[13px] w-32" />
        </td>
        {/* Actions: 3 icon buttons */}
        <td className="p-5 align-middle">
          <div className="flex items-center justify-end gap-1">
            <Skeleton className="h-7 w-7" />
            <Skeleton className="h-7 w-7" />
            <Skeleton className="h-7 w-7" />
          </div>
        </td>
      </tr>
    ))}
  </>
);

// ─── Authors table skeleton ───────────────────────────────────────────────────
// Mirrors: last name, first name, middle, suffix, email, 2 icon-buttons
export const AuthorsTableSkeleton: React.FC<{ rows?: number }> = ({ rows = 10 }) => (
  <>
    {Array.from({ length: rows }).map((_, i) => (
      <tr key={i} className="border-b border-border last:border-b-0">
        <td className="p-5 align-middle">
          <Skeleton className="h-[13px] w-28" />
        </td>
        <td className="p-5 align-middle">
          <Skeleton className="h-[13px] w-24" />
        </td>
        <td className="p-5 align-middle">
          <Skeleton className="h-[13px] w-16" />
        </td>
        <td className="p-5 align-middle">
          <Skeleton className="h-[13px] w-10" />
        </td>
        <td className="p-5 align-middle">
          <Skeleton className="h-[12px] w-40" />
        </td>
        {/* Actions: 2 icon buttons */}
        <td className="p-5 align-middle">
          <div className="flex items-center justify-end gap-1">
            <Skeleton className="h-7 w-7" />
            <Skeleton className="h-7 w-7" />
          </div>
        </td>
      </tr>
    ))}
  </>
);

// ─── Users table skeleton ─────────────────────────────────────────────────────
// Mirrors: avatar square + name (col 1), email, role+status badges (col 3), icon-buttons
export const UsersTableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <>
    {Array.from({ length: rows }).map((_, i) => (
      <tr key={i} className="border-b border-border last:border-b-0">
        {/* Name: avatar + text */}
        <td className="p-5 align-middle">
          <div className="flex items-center gap-3">
            <Skeleton className="h-7 w-7 shrink-0" />
            <Skeleton className="h-[13px] w-32" />
          </div>
        </td>
        {/* Email */}
        <td className="p-5 align-middle">
          <Skeleton className="h-[13px] w-44" />
        </td>
        {/* Role & Status: two badge-sized pills */}
        <td className="p-5 align-middle">
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-14" />
          </div>
        </td>
        {/* Actions: 1–2 icon buttons */}
        <td className="p-5 align-middle">
          <div className="flex items-center justify-end gap-1">
            <Skeleton className="h-7 w-7" />
            <Skeleton className="h-7 w-7" />
          </div>
        </td>
      </tr>
    ))}
  </>
);

// ─── Categories table skeleton ────────────────────────────────────────────────
// Uses native px-5 py-3 padding to match the categories plain <table> (not Table component)
// Mirrors: name, slug, description (hidden md), journals count, actions
export const CategoriesTableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <>
    {Array.from({ length: rows }).map((_, i) => (
      <tr key={i} className="border-b border-border last:border-b-0">
        {/* Name */}
        <td className="px-5 py-[14px] align-middle">
          <Skeleton className="h-[13px] w-36" />
        </td>
        {/* Slug */}
        <td className="px-5 py-[14px] align-middle">
          <Skeleton className="h-[12px] w-28 font-mono" />
        </td>
        {/* Description */}
        <td className="px-5 py-[14px] align-middle hidden md:table-cell">
          <Skeleton className="h-[12px] w-48" />
        </td>
        {/* Journals count */}
        <td className="px-5 py-[14px] align-middle text-center">
          <Skeleton className="h-[13px] w-6 mx-auto" />
        </td>
        {/* Actions */}
        <td className="px-5 py-[14px] align-middle">
          <div className="flex items-center justify-end gap-1">
            <Skeleton className="h-7 w-7" />
            <Skeleton className="h-7 w-7" />
          </div>
        </td>
      </tr>
    ))}
  </>
);

// ─── Activity Logs table skeleton ─────────────────────────────────────────────
// Mirrors: date/time (mono, narrow), user (narrow), action badge, description
export const ActivityLogsTableSkeleton: React.FC<{ rows?: number }> = ({ rows = 6 }) => (
  <>
    {Array.from({ length: rows }).map((_, i) => (
      <tr key={i} className="border-b border-border last:border-b-0">
        {/* Date & Time — w-[180px] col */}
        <td className="p-5 align-middle">
          <Skeleton className="h-[12px] w-36" />
        </td>
        {/* User — w-[160px] col */}
        <td className="p-5 align-middle">
          <Skeleton className="h-[12px] w-24" />
        </td>
        {/* Action badge — w-[150px] col */}
        <td className="p-5 align-middle">
          <Skeleton className="h-5 w-24" />
        </td>
        {/* Description — flexible */}
        <td className="p-5 align-middle">
          <Skeleton className="h-[12px] w-64" />
        </td>
      </tr>
    ))}
  </>
);

// ─── Reusable list-style skeleton (non-table layouts) ─────────────────────────
const spanClasses: Record<number, string> = {
  1: 'col-span-1', 2: 'col-span-2', 3: 'col-span-3', 4: 'col-span-4',
  5: 'col-span-5', 6: 'col-span-6', 7: 'col-span-7', 8: 'col-span-8',
  9: 'col-span-9', 10: 'col-span-10', 11: 'col-span-11', 12: 'col-span-12',
};

export const ListSkeleton: React.FC<{ colSpans: number[]; rows?: number }> = ({
  colSpans,
  rows = 5,
}) => {
  return (
    <div className="w-full divide-y divide-border">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="grid grid-cols-12 gap-4 px-5 py-4 items-center">
          {colSpans.map((span, j) => (
            <div key={j} className={spanClasses[span] || 'col-span-1'}>
              <Skeleton className="h-4 w-full max-w-[80%]" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

// ─── Message list skeleton (Feedback page) ────────────────────────────────────
export const MessageListSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="w-full divide-y divide-border">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-5 py-4 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-16" />
          </div>
          <Skeleton className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
};

// ─── Form skeleton ────────────────────────────────────────────────────────────
export const FormSkeleton: React.FC<{ rows?: number }> = ({ rows = 4 }) => {
  return (
    <div className="w-full space-y-5 p-5">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <div className="flex justify-end pt-4 border-t border-border mt-6">
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
};
