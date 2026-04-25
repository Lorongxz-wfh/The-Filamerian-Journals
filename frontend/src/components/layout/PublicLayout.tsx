import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

interface PublicLayoutProps {
  children: React.ReactNode;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans antialiased">
      <Navbar />
      <main className="container-custom py-12 flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default PublicLayout;
