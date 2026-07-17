import React from 'react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import SplashLoader from '@/components/ui/SplashLoader';

interface PublicLayoutProps {
  children: React.ReactNode;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans antialiased">
      <SplashLoader />
      <Navbar />
      <main className="w-full min-h-screen flex-grow flex flex-col px-[15vw] py-[4vh]">
        <div className="w-full flex-1 bg-white flex flex-col">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PublicLayout;
