import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Header from './components/Header.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import Inscription from './pages/Inscription.jsx';
import Annuaire from './pages/Annuaire.jsx';
import Association from './pages/Association.jsx';
import RencontresPassees from './pages/RencontresPassees.jsx';
import Espace from './pages/Espace.jsx';
import Admin from './pages/Admin.jsx';
import { useAuth } from './lib/AuthContext.jsx';

export default function App() {
  const location = useLocation();
  const { user } = useAuth();
  // The admin backend (shown inside /espace-membre once an admin or
  // moderator logs in) uses its own full-height sidebar layout, without the
  // public header/footer. A forced password change is still shown inside
  // the normal site layout.
  const isAdminBackend =
    location.pathname.startsWith('/admin') ||
    (location.pathname === '/espace-membre' &&
      (user?.role === 'admin' || user?.role === 'moderator') &&
      !user?.mustChangePassword);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {!isAdminBackend && <Header />}
      <div style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/inscription/:id" element={<Inscription />} />
          <Route path="/annuaire" element={<Annuaire />} />
          <Route path="/rencontres-passees" element={<RencontresPassees />} />
          <Route path="/association" element={<Association />} />
          <Route path="/espace-membre" element={<Espace />} />
          <Route path="/admin/*" element={<Admin />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </div>
      {!isAdminBackend && <Footer />}
    </div>
  );
}
