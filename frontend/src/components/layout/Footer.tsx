import React from 'react';
import { Link } from 'react-router';
import { BookOpen, Mail, Phone, MapPin, ExternalLink } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';

const Footer: React.FC = () => {
  const { settings } = useSettings();

  const siteTitle = settings.site_title || 'The Filamerian Journals';
  const schoolName = settings.footer_school_name || 'Filamer Christian University';
  const copyrightText = settings.footer_copyright || `© ${new Date().getFullYear()} ${schoolName}, Inc. All rights reserved.`;

  return (
    <footer className="bg-primary text-white border-t border-white/10 pt-12 pb-6">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-10 border-b border-white/10">
          {/* Column 1: Institutional Brand & Mission */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded bg-secondary/20 border border-secondary/40 flex items-center justify-center shrink-0">
                <BookOpen className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <h3 className="font-display font-bold text-secondary text-base tracking-wider uppercase leading-tight">
                  {siteTitle}
                </h3>
                <p className="text-[11px] text-white/50 tracking-wide font-sans uppercase">
                  {schoolName}
                </p>
              </div>
            </div>
            <p className="text-[12px] text-white/60 leading-relaxed font-sans">
              The official online database of peer-reviewed journals, capstones, and faculty research publications of Filamer Christian University.
            </p>
          </div>

          {/* Column 2: Quick Navigation */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-secondary">
              Navigation
            </h4>
            <ul className="space-y-2 text-[12px] text-white/70">
              <li>
                <Link to="/" className="hover:text-white transition-colors">Home Portal</Link>
              </li>
              <li>
                <Link to="/journals" className="hover:text-white transition-colors">Browse Journals</Link>
              </li>
              <li>
                <Link to="/archives" className="hover:text-white transition-colors">Volume Archives</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">About Repository</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">Contact Editorial Office</Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Publishing Policies */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-secondary">
              Publishing Policies
            </h4>
            <ul className="space-y-2 text-[12px] text-white/70">
              <li>
                <Link to="/about" className="hover:text-white transition-colors">Open Access Policy</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">Peer Review Process</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">Publication Ethics</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">Author Guidelines</Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-secondary transition-colors text-secondary/90">Staff & Admin Login</Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact & Campus Info */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-secondary">
              Campus Location
            </h4>
            <ul className="space-y-2 text-[12px] text-white/70">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
                <span>Roxas Avenue, Roxas City, Capiz 5800, Philippines</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-secondary shrink-0" />
                <a href="mailto:info@filamer.edu.ph" className="hover:text-white transition-colors">info@filamer.edu.ph</a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-secondary shrink-0" />
                <span>(036) 621-2317</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright & Secondary Links */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-white/40">
          <p>{copyrightText}</p>
          <div className="flex items-center gap-4">
            <a 
              href="https://facebook.com" 
              target="_blank" 
              rel="noreferrer" 
              className="hover:text-white transition-colors flex items-center gap-1"
            >
              Official FCU Facebook <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
