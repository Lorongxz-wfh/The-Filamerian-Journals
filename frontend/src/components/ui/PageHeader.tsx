import React from 'react';

interface PageHeaderProps {
  title: React.ReactNode;
  preTitle?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, preTitle, children, className = '' }) => {
  return (
    <div className={`relative flex flex-col md:block border-b border-border pb-4 mb-8 ${className}`}>
      {preTitle}
      <h1 className="text-2xl uppercase tracking-wider font-bold">{title}</h1>
      {children}
    </div>
  );
};

export default PageHeader;
