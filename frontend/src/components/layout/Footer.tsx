import React from 'react';
import { Link } from 'react-router';
import { useSettings } from '@/contexts/SettingsContext';

const Footer: React.FC = () => {
  const { settings } = useSettings();

  const schoolName = settings.footer_school_name || 'Filamer Christian University';
  const schoolSubtitle = settings.footer_school_subtitle || 'A globally linked Christian university';
  const address = settings.footer_address || 'Roxas Avenue, Roxas City, Capiz, Philippines';
  const email = settings.footer_email || 'info@filamer.edu.ph';
  const phone = settings.footer_phone || '(036) 621-2317';

  const quickLinksTitle = settings.footer_quick_links_title || 'Quick Links';
  const quickLinks = (settings.footer_quick_links || 'About, Academics, Admission, Organizations, Data Privacy Act, Sitemap')
    .split(',')
    .map((s: string) => s.trim())
    .filter(Boolean);

  const journalLinksTitle = settings.footer_journal_links_title || settings.site_title || 'The Filamerian Journals';
  const journalLinks = (settings.footer_journal_links || 'Submission Guidelines, Editorial Board, Publication Ethics, Open Access Policy, Contact Editorial Office')
    .split(',')
    .map((s: string) => s.trim())
    .filter(Boolean);

  const copyrightText = settings.footer_copyright || `© ${new Date().getFullYear()} Filamer Christian University, Inc. All rights reserved.`;
  const facebookUrl = settings.footer_facebook_url || '#';
  const facebookText = settings.footer_facebook_text || 'Official Facebook Page';

  const getLinkHref = (item: string) => {
    const lower = item.toLowerCase();
    if (lower === 'about') return '/about';
    if (lower === 'contact' || lower === 'contact editorial office') return '/contact';
    if (lower === 'archives' || lower === 'journals') return '/archives';
    return '/about';
  };

  return (
    <footer className="bg-primary text-white">
      {/* Main footer content */}
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* School Info */}
          <div className="space-y-4">
            <h3 className="font-display font-normal text-secondary text-lg tracking-wider uppercase">
              {schoolName}
            </h3>
            {schoolSubtitle && (
              <p className="text-[11px] text-white/40 uppercase tracking-wider">
                {schoolSubtitle}
              </p>
            )}
            <div className="space-y-2 text-[13px] text-white/60 pt-2">
              {address && <p>{address}</p>}
              {email && <p>{email}</p>}
              {phone && <p>{phone}</p>}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-[12px] font-semibold text-white/80 uppercase tracking-wider">
              {quickLinksTitle}
            </h4>
            <ul className="space-y-2">
              {quickLinks.map((item: string) => (
                <li key={item}>
                  <Link to={getLinkHref(item)} className="text-[13px] text-white/50 hover:text-white transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Journal Info */}
          <div className="space-y-4">
            <h4 className="text-[12px] font-semibold text-white/80 uppercase tracking-wider">
              {journalLinksTitle}
            </h4>
            <ul className="space-y-2">
              {journalLinks.map((item: string) => (
                <li key={item}>
                  <Link to={getLinkHref(item)} className="text-[13px] text-white/50 hover:text-white transition-colors">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10">
        <div className="container-custom py-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-[12px] text-white/40">
            {copyrightText.includes('{year}')
              ? copyrightText.replace('{year}', new Date().getFullYear().toString())
              : copyrightText}
          </p>
          {facebookText && (
            <a 
              href={facebookUrl} 
              target={facebookUrl !== '#' ? '_blank' : '_self'} 
              rel="noreferrer" 
              className="text-[12px] text-white/40 hover:text-white transition-colors"
            >
              {facebookText}
            </a>
          )}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
