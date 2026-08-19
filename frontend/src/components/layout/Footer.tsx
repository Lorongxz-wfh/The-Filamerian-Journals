import React from 'react';
import { Link } from 'react-router';
import { Mail, Phone, MapPin, ExternalLink } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsContext';

const Footer: React.FC = () => {
  const { settings } = useSettings();

  const siteTitle = settings.site_title || 'The FCU Journals';
  const schoolName = settings.footer_school_name || 'Filamer Christian University';
  const copyrightText = settings.footer_copyright || `© ${new Date().getFullYear()} ${schoolName}, Inc. All rights reserved.`;

  // Dynamic Column Helper with Default Fallbacks
  const getColumnLinks = (colNum: number) => {
    const title = settings[`footer_col${colNum}_title`] || (colNum === 1 ? 'NAVIGATION' : colNum === 2 ? 'PUBLISHING POLICIES' : '');
    const links: { text: string; url: string }[] = [];
    
    for (let i = 1; i <= 5; i++) {
      const text = settings[`footer_col${colNum}_l${i}_text`];
      const url = settings[`footer_col${colNum}_l${i}_url`];
      if (text && text.trim()) {
        links.push({ text: text.trim(), url: (url || '#').trim() });
      }
    }

    // Default presets if database settings are unseeded
    if (links.length === 0) {
      if (colNum === 1) {
        return {
          title: title || 'NAVIGATION',
          links: [
            { text: 'Home Portal', url: '/' },
            { text: 'Browse Journals', url: '/journals' },
            { text: 'Volume Archives', url: '/archives' },
            { text: 'About Repository', url: '/about' },
            { text: 'Contact Editorial Office', url: '/contact' },
          ]
        };
      } else if (colNum === 2) {
        return {
          title: title || 'PUBLISHING POLICIES',
          links: [
            { text: 'Open Access Policy', url: '/about' },
            { text: 'Repository Guidelines', url: '/about' },
            { text: 'Publication Ethics', url: '/about' },
            { text: 'Journal Policies', url: '/about' },
            { text: 'Staff & Admin Login', url: '/login' },
          ]
        };
      }
    }

    return { title, links };
  };

  const col1 = getColumnLinks(1);
  const col2 = getColumnLinks(2);
  const col3 = getColumnLinks(3);

  const dynamicColumns = [col1, col2, col3];

  return (
    <footer className="bg-primary text-white border-t border-white/10 pt-12 pb-6">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-10 border-b border-white/10">
          {/* Column 1: Institutional Brand & Campus Location */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <img src="/TFJ-50pxOutline.svg" alt="The FCU Journals Logo" className="h-10 w-10 object-contain shrink-0" />
              <div>
                <h3 className="font-display font-bold text-secondary text-base tracking-wider uppercase leading-tight">
                  {siteTitle}
                </h3>
                <p className="text-[11px] text-white/50 tracking-wide font-sans uppercase">
                  {schoolName}
                </p>
              </div>
            </div>

            {/* Campus Location Details */}
            <div className="space-y-2.5 pt-2 text-[12px] text-white/70">
              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
                <span className="leading-snug">{settings.footer_address || 'Roxas Avenue, Roxas City, Capiz 5800, Philippines'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 text-secondary shrink-0" />
                <a href={`mailto:${settings.contact_email || 'thefcujournals@gmail.com'}`} className="hover:text-white transition-colors">
                  {settings.contact_email || 'thefcujournals@gmail.com'}
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 text-secondary shrink-0" />
                <span>{settings.contact_phone || '+63 9123456789'}</span>
              </div>
            </div>
          </div>

          {/* Dynamic Columns 2, 3, 4 */}
          {dynamicColumns.map((col, colIdx) => (
            <div key={colIdx} className="space-y-3">
              {col.title && (
                <h4 className="text-[11px] font-bold uppercase tracking-widest text-secondary">
                  {col.title}
                </h4>
              )}
              {col.links.length > 0 && (
                <ul className="space-y-2 text-[12px] text-white/70">
                  {col.links.map((link, linkIdx) => {
                    const isExternal = link.url.startsWith('http://') || link.url.startsWith('https://');
                    const isLogin = link.url === '/login' || link.text.toLowerCase().includes('login');

                    return (
                      <li key={linkIdx}>
                        {isExternal ? (
                          <a 
                            href={link.url} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className={`transition-colors ${isLogin ? 'text-secondary hover:text-white font-medium' : 'hover:text-white'}`}
                          >
                            {link.text}
                          </a>
                        ) : (
                          <Link 
                            to={link.url} 
                            className={`transition-colors ${isLogin ? 'text-secondary hover:text-white font-medium' : 'hover:text-white'}`}
                          >
                            {link.text}
                          </Link>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ))}
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
