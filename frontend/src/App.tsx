import { BrowserRouter as Router, Routes, Route } from 'react-router';
import Home from '@/pages/Home';
import Navbar from '@/components/layout/Navbar';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background text-foreground font-sans antialiased">
        <Navbar />
        <main className="container-custom py-12">
          <Routes>
            <Route path="/" element={<Home />} />
            {/* Add more routes as we build them */}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
