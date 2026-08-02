import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router';
import Home from '@/pages/Home';
import Journals from '@/pages/Journals';
import Archives from '@/pages/Archives';
import JournalDetail from '@/pages/JournalDetail';
import ArticleDetail from '@/pages/ArticleDetail';
import Announcements from '@/pages/Announcements';
import Login from '@/pages/Login';
import PendingVerification from '@/pages/PendingVerification';
import Overview from '@/pages/dashboard/Overview';
import MyJournals from '@/pages/dashboard/MyJournals';
import Categories from '@/pages/dashboard/Categories';
import ManageJournal from '@/pages/dashboard/ManageJournal';
import ManageVolume from '@/pages/dashboard/ManageVolume';
import Articles from '@/pages/dashboard/Articles';
import ManageAnnouncements from '@/pages/dashboard/ManageAnnouncements';
import Notifications from '@/pages/dashboard/Notifications';
import Feedback from '@/pages/dashboard/Feedback';
import UserManager from '@/pages/dashboard/UserManager';
import ActivityLogs from '@/pages/dashboard/ActivityLogs';
import SystemSettings from '@/pages/dashboard/SystemSettings';
import SystemHealth from '@/pages/dashboard/SystemHealth';
import BulkImport from '@/pages/dashboard/BulkImport';
import ManageAuthors from '@/pages/dashboard/ManageAuthors';
import DashboardHelp from '@/pages/dashboard/DashboardHelp';
import Faq from '@/pages/Faq';
import PublicLayout from '@/components/layout/PublicLayout';
import DashboardLayout from '@/components/layout/DashboardLayout';

import Contact from '@/pages/Contact';
import About from '@/pages/About';
import WebsiteSettings from '@/pages/dashboard/WebsiteSettings';
import Toaster from '@/components/ui/Toaster';
import ScrollToTop from '@/components/layout/ScrollToTop';
import Search from '@/pages/Search';
import { SettingsProvider } from '@/contexts/SettingsContext';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function App() {
  return (
    <SettingsProvider>
      <ErrorBoundary>
        <Router>
          <ScrollToTop />
          <Analytics />
          <SpeedInsights />
          <ErrorBoundary>
            <Routes>
              {/* Public Website Routes */}
              <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
              <Route path="/search" element={<PublicLayout><Search /></PublicLayout>} />
              <Route path="/journals" element={<PublicLayout><Journals /></PublicLayout>} />
              <Route path="/journals/:slug" element={<PublicLayout><JournalDetail /></PublicLayout>} />
              <Route path="/articles/:id" element={<PublicLayout><ArticleDetail /></PublicLayout>} />
              <Route path="/archives" element={<PublicLayout><Archives /></PublicLayout>} />
              <Route path="/announcements" element={<PublicLayout><Announcements /></PublicLayout>} />
              <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
              <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />
              <Route path="/faq" element={<PublicLayout><Faq /></PublicLayout>} />
              <Route path="/guide" element={<PublicLayout><Faq /></PublicLayout>} />
              <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />
              <Route path="/pending-verification" element={<PublicLayout><PendingVerification /></PublicLayout>} />

              {/* Dashboard System Routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Overview />} />
                <Route path="health" element={<SystemHealth />} />
                <Route path="journals" element={<MyJournals />} />
                <Route path="categories" element={<Categories />} />
                <Route path="journals/:slug" element={<ManageJournal />} />
                <Route path="volumes/:id" element={<ManageVolume />} />
                <Route path="articles" element={<Articles />} />
                <Route path="authors" element={<ManageAuthors />} />
                <Route path="import" element={<BulkImport />} />
                <Route path="announcements" element={<ManageAnnouncements />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="feedback" element={<Feedback />} />
                <Route path="users" element={<UserManager />} />
                <Route path="logs" element={<ActivityLogs />} />
                <Route path="website" element={<WebsiteSettings />} />
                <Route path="settings" element={<SystemSettings />} />
                <Route path="help" element={<DashboardHelp />} />
                <Route path="search" element={<Overview />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ErrorBoundary>
          <Toaster position="bottom-right" />
        </Router>
      </ErrorBoundary>
    </SettingsProvider>
  );
}

export default App;
