import React from 'react';

interface DashboardHeaderProps {
  title: React.ReactNode;
  preTitle?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ title, preTitle, description, children, className = '' }) => {
  return (
    <div className={`flex flex-row items-center justify-between gap-3 border-b border-border pb-3 sm:pb-4 min-h-[48px] sm:min-h-[64px] ${className}`}>
      <div className="min-w-0">
        {preTitle}
        <h1 className="text-lg sm:text-2xl font-bold font-sans uppercase tracking-[0.12em] sm:tracking-[0.15em] text-primary truncate">{title}</h1>
        {description && <p className="text-[12px] sm:text-[14px] text-muted leading-relaxed mt-1 sm:mt-2">{description}</p>}
      </div>
      {children && <div className="shrink-0">{children}</div>}
    </div>
  );
};

export default DashboardHeader;
