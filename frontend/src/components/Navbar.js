import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import Icon from './Icon';
const ITEMS = [['Trafik Cezaları', '/trafik-cezalari'], ['Sigorta', '/sigorta'], ['Ehliyet', '/ehliyet'], ['Araç İşlemleri', '/arac-islemleri'], ['Dilekçeler', '/dilekce-ornekleri']];
export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const toggle = useRef(null);
  useEffect(() => setOpen(false), [location]);
  useEffect(() => { const escape = e => { if (e.key === 'Escape' && open) { setOpen(false); toggle.current?.focus(); } }; document.addEventListener('keydown', escape); return () => document.removeEventListener('keydown', escape); }, [open]);
  return <header className="site-header"><div className="container navbar"><Link to="/" className="brand" aria-label="TrafikRehber ana sayfa"><span className="brand-mark"><Icon name="road" size={25} /></span><span>Trafik<span className="brand-accent">Rehber</span><small>Sürücünün yol arkadaşı</small></span></Link><button ref={toggle} className="menu-toggle" aria-label={open ? 'Menüyü kapat' : 'Menüyü aç'} aria-expanded={open} aria-controls="site-navigation" onClick={() => setOpen(!open)}><Icon name={open ? 'close' : 'menu'} /></button><nav id="site-navigation" aria-label="Ana menü" className={`nav-links ${open ? 'is-open' : ''}`}>{ITEMS.map(([label, path]) => <NavLink key={path} to={path}>{label}</NavLink>)}<NavLink to="/araclar/ceza-hesapla" className="nav-cta"><Icon name="calculator" size={17} /> Ceza Hesapla</NavLink></nav></div></header>;
}
