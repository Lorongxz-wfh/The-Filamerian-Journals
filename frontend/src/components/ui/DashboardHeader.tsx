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
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4 min-h-[64px] ${className}`}>
      <div>
        {preTitle}
        <h1 className="text-2xl font-bold font-sans uppercase tracking-[0.15em] text-primary">{title}</h1>
        {description && <p className="text-[14px] text-muted leading-relaxed mt-2">{description}</p>}
      </div>
      {children}
    </div>
  );
};

export default DashboardHeader;
