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
  site_title: 'The Filamerian Journals',
  tagline: 'Scholarly Excellence In Every Discipline',
  contact_email: 'journals@filamer.edu.ph',
  contact_phone: '(036) 6210-471',
  journal_categories: 'Science, Education, Arts, Multidisciplinary',
  show_tagline: 'false',
  home_about_us: '<div class="text-center max-w-4xl mx-auto space-y-4 pb-4 border-b border-border mb-4">\n  <h2 class="text-lg font-bold uppercase tracking-wider text-primary">The Filamerian Journals</h2>\n  <p class="text-[14px] text-muted leading-relaxed">\n    <strong>The Filamerian Journals</strong> is the official online database of published journals by the faculty and students of Filamer Christian University, Inc. This database is composed of theses, case studies, capstone projects, and research papers in various disciplines.\n  </p>\n</div>',
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
