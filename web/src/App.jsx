import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import Annuaire from './pages/Annuaire.jsx';
import Association from './pages/Association.jsx';
import Espace from './pages/Espace.jsx';
import Admin from './pages/Admin.jsx';

export default function App() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {!isAdmin && <Header />}
      <div style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/annuaire" element={<Annuaire />} />
          <Route path="/association" element={<Association />} />
          <Route path="/espace-membre" element={<Espace />} />
          <Route path="/admin/*" element={<Admin />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </div>
      {!isAdmin && <Footer />}
    </div>
  );
}
