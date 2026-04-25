import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router';
import Home from '@/pages/Home';
import Journals from '@/pages/Journals';
import Login from '@/pages/Login';
import Overview from '@/pages/dashboard/Overview';
import PublicLayout from '@/components/layout/PublicLayout';
import DashboardLayout from '@/components/layout/DashboardLayout';

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
        <Route path="/journals" element={<PublicLayout><Journals /></PublicLayout>} />
        <Route path="/login" element={<PublicLayout><Login /></PublicLayout>} />

        {/* Dashboard System Routes */}
        <Route 
          path="/dashboard/*" 
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Routes>
                  <Route index element={<Overview />} />
                  {/* Add more dashboard routes here */}
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
