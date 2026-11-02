// StaticPages.js — Hakkımızda, İletişim, Gizlilik metni src/data/sayfalar.json'dadır
// (sunucudaki prerender.js AYNI dosyayı okur; metni burada değil orada düzenleyin).
import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import SayfaBloklari from '../components/SayfaBloklari';
import IletisimFormu from '../components/IletisimFormu';
import SAYFALAR from '../data/sayfalar.json';
import { EPOSTA } from '../iletisim';

const H1 = { color: '#1a3a6b', marginBottom: 24, fontSize: 32, fontWeight: 800 };

export function HakkimizdaPage() {
  const d = SAYFALAR.hakkimizda;
  return (
    <>
      <Helmet><title>Hakkımızda — CezaRehberi</title></Helmet>
      <div className="container-sm" style={{ padding: '60px 20px' }}>
        <h1 style={H1}>{d.baslik}</h1>
        <SayfaBloklari bloklar={d.bloklar} />
      </div>
    </>
  );
}

export function IletisimPage() {
  const d = SAYFALAR.iletisim;
  const [q] = useSearchParams();
  return (
    <>
      <Helmet><title>İletişim — CezaRehberi</title></Helmet>
      <div className="container-sm" style={{ padding: '60px 20px' }}>
        <h1 style={H1}>{d.baslik}</h1>
        <SayfaBloklari bloklar={d.ust} />
        {EPOSTA && <p className="sb-eposta"><strong>E-posta:</strong> <a href={`mailto:${EPOSTA}`}>{EPOSTA}</a></p>}
        <div className="if-kutu"><IletisimFormu konu={q.get('konu') || 'duzeltme'} /></div>
        <SayfaBloklari bloklar={d.alt} />
      </div>
    </>
  );
}

export function GizlilikPage() {
  const d = SAYFALAR.gizlilik;
  return (
    <>
      <Helmet><title>Gizlilik Politikası — CezaRehberi</title></Helmet>
      <div className="container-sm" style={{ padding: '60px 20px' }}>
        <h1 style={H1}>{d.baslik}</h1>
        <SayfaBloklari bloklar={d.bloklar} />
      </div>
    </>
  );
}

export function NotFoundPage() {
  return (
    <>
      <Helmet><title>Sayfa Bulunamadı — CezaRehberi</title></Helmet>
      <div className="container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 16 }}>🚦</div>
        <h1 style={{ color: '#1a3a6b', fontSize: 32, marginBottom: 8 }}>404 — Sayfa Bulunamadı</h1>
        <p style={{ color: '#666', marginBottom: 32 }}>Aradığınız sayfa mevcut değil veya taşınmış olabilir.</p>
        <a href="/" className="btn btn-primary">Ana Sayfaya Dön</a>
      </div>
    </>
  );
}
