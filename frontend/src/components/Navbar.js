import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

const NAV_ITEMS = [
  { label: 'Trafik Cezaları', path: '/trafik-cezalari' },
  { label: 'Sigorta', path: '/sigorta' },
  { label: 'Ehliyet', path: '/ehliyet' },
  { label: 'Araç İşlemleri', path: '/arac-islemleri' },
  { label: 'Dilekçeler', path: '/dilekce-ornekleri' },
  { label: 'Ceza Hesapla', path: '/araclar/ceza-hesapla' },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setMenuOpen(false), [location]);

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: scrolled ? '#fff' : '#1a3a6b',
      boxShadow: scrolled ? '0 2px 16px rgba(0,0,0,0.1)' : 'none',
      transition: 'all 0.3s'
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: scrolled ? '#1a3a6b' : '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 800, color: scrolled ? '#fff' : '#1a3a6b'
          }}>T</div>
          <span style={{
            fontSize: 18, fontWeight: 700,
            color: scrolled ? '#1a3a6b' : '#fff'
          }}>TrafikRehber</span>
        </Link>

        {/* Desktop nav */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }} className="desktop-nav">
          {NAV_ITEMS.map(item => (
            <Link key={item.path} to={item.path} style={{
              padding: '8px 12px', borderRadius: 6, textDecoration: 'none',
              fontSize: 14, fontWeight: 500,
              color: location.pathname.startsWith(item.path)
                ? (scrolled ? '#e65c00' : '#ffd700')
                : (scrolled ? '#1a3a6b' : '#fff'),
              background: location.pathname.startsWith(item.path)
                ? (scrolled ? '#fff0e6' : 'rgba(255,255,255,0.15)')
                : 'transparent',
            }}>{item.label}</Link>
          ))}
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMenuOpen(!menuOpen)} style={{
          display: 'none', background: 'none', border: 'none',
          color: scrolled ? '#1a3a6b' : '#fff', fontSize: 24, cursor: 'pointer'
        }} className="hamburger">☰</button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{
          background: '#1a3a6b', padding: '12px 20px 20px',
          borderTop: '1px solid rgba(255,255,255,0.1)'
        }}>
          {NAV_ITEMS.map(item => (
            <Link key={item.path} to={item.path} style={{
              display: 'block', padding: '12px 0',
              color: '#fff', textDecoration: 'none', fontWeight: 500,
              borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}>{item.label}</Link>
          ))}
        </div>
      )}

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .hamburger { display: block !important; }
        }
      `}</style>
    </nav>
  );
}
