import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/services/api';

export interface SettingsData {
  site_title?: string;
  tagline?: string;
  contact_email?: string;
  contact_phone?: string;
  journal_categories?: string;
  home_about_us?: string;
  show_tagline?: string;
  show_about_us?: string;
  [key: string]: any;
}

interface SettingsContextType {
  settings: SettingsData;
  loading: boolean;
}

const defaultSettings: SettingsData = {
  site_title: 'The FCU Journals',
  tagline: 'Scholarly Excellence In Every Discipline',
  contact_email: 'thefcujournals@gmail.com',
  contact_phone: '+63 9123456789',
  journal_categories: 'Science, Education, Arts, Multidisciplinary',
  show_tagline: 'false',
  home_about_us: '<div class="text-center max-w-4xl mx-auto space-y-4 pb-4 border-b border-border mb-4">\n  <h2 class="text-lg font-bold uppercase tracking-wider text-primary">The FCU Journals</h2>\n  <p class="text-[14px] text-muted leading-relaxed">\n    <strong>The FCU Journals</strong> is the official online database of published journals by the faculty and students of Filamer Christian University, Inc. This database is composed of theses, case studies, capstone projects, and research papers in various disciplines.\n  </p>\n</div>',
  footer_school_name: 'Filamer Christian University',
  footer_school_subtitle: 'A globally linked Christian university',
  footer_address: 'Roxas Avenue, Roxas City, Capiz, Philippines',
  footer_email: 'info@filamer.edu.ph',
  footer_phone: '(036) 621-2317',
  footer_quick_links_title: 'Quick Links',
  footer_quick_links: 'About, Academics, Admission, Organizations, Data Privacy Act, Sitemap',
  footer_journal_links_title: 'The FCU Journals',
  footer_journal_links: 'Submission Guidelines, Editorial Board, Publication Ethics, Open Access Policy, Contact Editorial Office',
  footer_copyright: '© Filamer Christian University, Inc. All rights reserved.',
  footer_facebook_url: 'https://facebook.com',
  footer_facebook_text: 'Official Facebook Page',
};

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  loading: true,
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/public/settings');
        if (res.data && res.data.data && Object.keys(res.data.data).length > 0) {
          setSettings(prev => ({ ...prev, ...res.data.data }));
        }
      } catch (error) {
        console.error('Failed to fetch public settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};
