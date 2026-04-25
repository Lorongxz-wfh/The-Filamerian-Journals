import { BrowserRouter as Router, Routes, Route } from 'react-router';
import Home from '@/pages/Home';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col bg-background text-foreground font-sans antialiased">
        <Navbar />
        <main className="container-custom py-12 flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            {/* Add more routes as we build them */}
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
