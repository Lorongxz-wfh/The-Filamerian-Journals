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
    <div className={`flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-border pb-4 ${className}`}>
      <div>
        {preTitle}
        <h1 className="text-2xl font-bold uppercase tracking-[0.15em] text-primary">{title}</h1>
        {description && <p className="text-[14px] text-muted leading-relaxed mt-2">{description}</p>}
      </div>
      {children}
    </div>
  );
};

export default DashboardHeader;
