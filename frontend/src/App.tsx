import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router';
import Home from '@/pages/Home';
import Journals from '@/pages/Journals';
import Archives from '@/pages/Archives';
import JournalDetail from '@/pages/JournalDetail';
import Announcements from '@/pages/Announcements';
import Login from '@/pages/Login';
import PendingVerification from '@/pages/PendingVerification';
import Overview from '@/pages/dashboard/Overview';
import MyJournals from '@/pages/dashboard/MyJournals';
import ManageJournal from '@/pages/dashboard/ManageJournal';
import Articles from '@/pages/dashboard/Articles';
import ManageAnnouncements from '@/pages/dashboard/ManageAnnouncements';
import Notifications from '@/pages/dashboard/Notifications';
import ManageResources from '@/pages/dashboard/ManageResources';
import Feedback from '@/pages/dashboard/Feedback';
import UserManager from '@/pages/dashboard/UserManager';
import SystemSettings from '@/pages/dashboard/SystemSettings';
import SystemHealth from '@/pages/dashboard/SystemHealth';
import PublicLayout from '@/components/layout/PublicLayout';
import DashboardLayout from '@/components/layout/DashboardLayout';

import Contact from '@/pages/Contact';
import About from '@/pages/About';

import Search from '@/pages/Search';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Website Routes */}
        <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
        <Route path="/search" element={<PublicLayout><Search /></PublicLayout>} />
        <Route path="/journals" element={<PublicLayout><Journals /></PublicLayout>} />
        <Route path="/journals/:slug" element={<PublicLayout><JournalDetail /></PublicLayout>} />
        <Route path="/archives" element={<PublicLayout><Archives /></PublicLayout>} />
        <Route path="/announcements" element={<PublicLayout><Announcements /></PublicLayout>} />
        <Route path="/about" element={<PublicLayout><About /></PublicLayout>} />
        <Route path="/contact" element={<PublicLayout><Contact /></PublicLayout>} />
        <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />
        <Route path="/pending-verification" element={<PublicLayout><PendingVerification /></PublicLayout>} />

        {/* Dashboard System Routes */}
        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Routes>
                  <Route index element={<Overview />} />
                  <Route path="health" element={<SystemHealth />} />
                  <Route path="journals" element={<MyJournals />} />
                  <Route path="journals/:slug" element={<ManageJournal />} />
                  <Route path="articles" element={<Articles />} />
                  <Route path="announcements" element={<ManageAnnouncements />} />
                  <Route path="notifications" element={<Notifications />} />
                  <Route path="resources" element={<ManageResources />} />
                  <Route path="feedback" element={<Feedback />} />
                  <Route path="users" element={<UserManager />} />
                  <Route path="settings" element={<SystemSettings />} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
