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
  const location = useLocation();

  useEffect(() => setMenuOpen(false), [location]);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 100,
      background: '#1a3a6b',
      boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
    }}>
      <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>

        {/* Logo */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 800, color: '#1a3a6b',
            flexShrink: 0,
          }}>T</div>
          <span style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>TrafikRehber</span>
        </Link>

        {/* Desktop nav */}
        <div style={{ display: 'flex', gap: 2, alignItems: 'center' }} className="desktop-nav">
          {NAV_ITEMS.map(item => (
            <Link key={item.path} to={item.path} style={{
              padding: '8px 12px', borderRadius: 6, textDecoration: 'none',
              fontSize: 14, fontWeight: 500,
              color: isActive(item.path) ? '#ffd700' : '#e2e8f0',
              background: isActive(item.path) ? 'rgba(255,255,255,0.12)' : 'transparent',
              transition: 'background 0.15s, color 0.15s',
            }}
              onMouseEnter={e => { if (!isActive(item.path)) { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff'; }}}
              onMouseLeave={e => { if (!isActive(item.path)) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#e2e8f0'; }}}
            >{item.label}</Link>
          ))}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          style={{ display: 'none', background: 'none', border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer', padding: 4 }}
          className="hamburger"
        >
          {menuOpen ? '✕' : '☰'}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div style={{ background: '#0f2347', padding: '8px 20px 16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          {NAV_ITEMS.map(item => (
            <Link key={item.path} to={item.path} style={{
              display: 'block', padding: '12px 4px',
              color: isActive(item.path) ? '#ffd700' : '#e2e8f0',
              textDecoration: 'none', fontWeight: 500, fontSize: 15,
              borderBottom: '1px solid rgba(255,255,255,0.08)',
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
