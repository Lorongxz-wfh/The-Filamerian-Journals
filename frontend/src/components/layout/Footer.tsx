import React from 'react';
import { Facebook, Mail, Phone, MapPin, ExternalLink, ShieldCheck } from 'lucide-react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-[#1A1A1A] text-white pt-16 pb-8 border-t-4 border-secondary">
      <div className="container-custom">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-12">
          {/* School Info Column */}
          <div className="lg:col-span-4 space-y-8">
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-full bg-white flex items-center justify-center p-1 shrink-0 shadow-lg">
                 {/* Placeholder for University Logo */}
                <img src="https://picsum.photos/seed/fcu-logo/200" alt="FCU Logo" className="rounded-full" />
              </div>
              <div className="flex flex-col">
                <h3 className="font-display font-bold text-xl leading-tight">Filamer Christian University</h3>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">A globally linked Christian university</p>
              </div>
            </div>

            <div className="space-y-6 text-sm text-slate-300 font-serif italic">
              <div className="flex gap-3">
                <MapPin className="h-5 w-5 text-secondary shrink-0" />
                <p>Roxas Avenue, Roxas City, Capiz, Philippines</p>
              </div>
              <div className="flex gap-3">
                <Mail className="h-5 w-5 text-secondary shrink-0" />
                <div className="flex flex-col">
                  <p>info@filamer.edu.ph</p>
                  <p className="text-[10px] text-slate-500 uppercase not-italic font-sans font-bold">Registrar: registrar@filamer.edu.ph</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Phone className="h-5 w-5 text-secondary shrink-0" />
                <p>(036) 621 - 2317</p>
              </div>
            </div>
          </div>

          {/* Map Column */}
          <div className="lg:col-span-5">
            <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl relative group">
              <div className="absolute top-4 left-4 z-10">
                <button className="flex items-center gap-2 bg-white text-black px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg hover:bg-slate-100 transition-colors">
                  Open in Maps <ExternalLink className="h-3 w-3" />
                </button>
              </div>
              <img 
                src="https://media.wired.com/photos/59269cd37034dc5f91bec0f1/master/pass/GoogleMap-660x440.jpg" 
                alt="University Map" 
                className="w-full h-48 object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500" 
              />
            </div>
          </div>

          {/* Seal Column */}
          <div className="lg:col-span-3 flex flex-col items-center lg:items-end justify-center">
            <div className="bg-white/5 p-4 rounded-3xl border border-white/10 flex flex-col items-center space-y-3">
              <ShieldCheck className="h-20 w-20 text-secondary opacity-50" />
              <div className="text-center">
                <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">DPO/DPS Registered</span>
                <span className="block text-[9px] text-slate-500">NPC-PH-2026-0001</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Nav Links */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 py-8 border-t border-b border-white/5 mb-8">
          {['About', 'Academics', 'Admission', 'Organizations', 'Data Privacy Act', 'Sitemap'].map((item) => (
            <a key={item} href="#" className="text-xs font-bold text-slate-400 hover:text-white transition-colors text-center uppercase tracking-widest">
              {item}
            </a>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <a href="#" className="flex items-center gap-2 text-sm text-slate-400 hover:text-secondary transition-colors group">
            <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-primary transition-colors">
              <Facebook className="h-4 w-4" />
            </div>
            Official Facebook Page
          </a>
          
          <p className="text-xs text-slate-500 font-serif italic">
            © {new Date().getFullYear()} Filamer Christian University, Inc.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
