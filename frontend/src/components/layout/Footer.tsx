import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-primary text-white">
      {/* Main footer content */}
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* School Info */}
          <div className="space-y-4">
            <h3 className="font-display font-normal text-secondary text-lg tracking-wider uppercase">
              Filamer Christian University
            </h3>
            <p className="text-[11px] text-white/40 uppercase tracking-wider">
              A globally linked Christian university
            </p>
            <div className="space-y-2 text-[13px] text-white/60 pt-2">
              <p>Roxas Avenue, Roxas City, Capiz, Philippines</p>
              <p>info@filamer.edu.ph</p>
              <p>(036) 621-2317</p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-[12px] font-semibold text-white/80 uppercase tracking-wider">
              Quick Links
            </h4>
            <ul className="space-y-2">
              {['About', 'Academics', 'Admission', 'Organizations', 'Data Privacy Act', 'Sitemap'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-[13px] text-white/50 hover:text-white transition-colors">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Journal Info */}
          <div className="space-y-4">
            <h4 className="text-[12px] font-semibold text-white/80 uppercase tracking-wider">
              The Filamerian Journals
            </h4>
            <ul className="space-y-2">
              {['Submission Guidelines', 'Editorial Board', 'Publication Ethics', 'Open Access Policy', 'Contact Editorial Office'].map((item) => (
                <li key={item}>
                  <a href="#" className="text-[13px] text-white/50 hover:text-white transition-colors">
                    {item}
                  </a>
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
            © {new Date().getFullYear()} Filamer Christian University, Inc. All rights reserved.
          </p>
          <a href="#" className="text-[12px] text-white/40 hover:text-white transition-colors">
            Official Facebook Page
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
