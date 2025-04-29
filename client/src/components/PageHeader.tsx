import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
  return (
    <div className="bg-muted/30 py-10">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold mb-2">{title}</h1>
        {description && <p className="text-xl text-muted-foreground mb-4">{description}</p>}
        {children}
      </div>
    </div>
  );
}