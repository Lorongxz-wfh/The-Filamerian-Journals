import React from 'react';
import { Link } from 'react-router';
import { useSettings } from '@/contexts/SettingsContext';

const Footer: React.FC = () => {
  const { settings } = useSettings();

  const siteTitle = settings.site_title || 'The Filamerian Journals';
  const schoolName = settings.footer_school_name || 'Filamer Christian University';
  const copyrightText = settings.footer_copyright || `© ${new Date().getFullYear()} ${schoolName}, Inc. All rights reserved.`;

  return (
    <footer className="bg-primary text-white border-t border-white/10">
      <div className="container-custom py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-6 border-b border-white/10">
          {/* Brand & Identity */}
          <div className="text-center md:text-left space-y-1">
            <h3 className="font-display font-semibold text-secondary text-base tracking-wider uppercase">
              {siteTitle}
            </h3>
            <p className="text-xs text-white/50 tracking-wide font-sans">
              Official Academic Repository of {schoolName}
            </p>
          </div>

          {/* Clean Navigation Links */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-medium uppercase tracking-wider text-white/70">
            <Link to="/" className="hover:text-secondary transition-colors">Home</Link>
            <Link to="/journals" className="hover:text-secondary transition-colors">Journals</Link>
            <Link to="/archives" className="hover:text-secondary transition-colors">Archives</Link>
            <Link to="/about" className="hover:text-secondary transition-colors">About</Link>
            <Link to="/contact" className="hover:text-secondary transition-colors">Contact</Link>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-white/40">
          <p>{copyrightText}</p>
          <p className="font-mono">Roxas City, Capiz, Philippines</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
