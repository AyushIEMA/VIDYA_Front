import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Header.css';

const scrollToId = (id) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const goSection = (e, id) => {
    e.preventDefault();
    setMenuOpen(false);
    if (location.pathname !== '/') {
      navigate('/');
      window.setTimeout(() => scrollToId(id), 80);
    } else {
      scrollToId(id);
    }
  };

  return (
    <header className="header">
      <div className="container">
        <Link to="/" className="logo">Vidya</Link>

        <button type="button" className="menu-toggle" aria-label="Menu" onClick={() => setMenuOpen(!menuOpen)}>
          <span></span>
          <span></span>
          <span></span>
        </button>

        <nav className={`nav ${menuOpen ? 'active' : ''}`}>
          <Link to="/" onClick={() => setMenuOpen(false)}>Home</Link>
          <a href="/#about" onClick={(e) => goSection(e, 'about')}>About Us</a>
          <a href="/#pricing" onClick={(e) => goSection(e, 'pricing')}>Pricing</a>
          <a href="/#faq" onClick={(e) => goSection(e, 'faq')}>FAQ</a>
          <Link to="/register" className="btn-nav" onClick={() => setMenuOpen(false)}>Register</Link>
          <Link to="/login" className="btn-nav-primary" onClick={() => setMenuOpen(false)}>Login</Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
