import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CookieBanner from './components/CookieBanner';
import HomePage from './pages/HomePage';
const ArticlePage = lazy(() => import('./pages/ArticlePage'));
const ArticleListPage = lazy(() => import('./pages/ArticleListPage'));
const DilekceListPage = lazy(() => import('./pages/DilekceListPage'));
const DilekceDetailPage = lazy(() => import('./pages/DilekceDetailPage'));
const CezaHesaplaPage = lazy(() => import('./pages/CezaHesaplaPage'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const HakkimizdaPage = lazy(() => import('./pages/HakkimizdaPage'));
const IletisimPage = lazy(() => import('./pages/IletisimPage'));
const GizlilikPage = lazy(() => import('./pages/GizlilikPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
import ChatWidget from './components/ChatWidget';
const AdminPage = lazy(() => import('./pages/AdminPage'));
const CezaListesiPage = lazy(() => import('./pages/CezaListesiPage'));
import './App.css';
import { SITE_URL } from './services/site';
import ErrorBoundary from './components/ErrorBoundary';

function RouteMeta() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return <Helmet><link rel="canonical" href={`${SITE_URL}${pathname}`} /><meta name="description" content="Trafik cezaları, sigorta, ehliyet ve araç işlemleri için TrafikRehber rehberlerini keşfedin." /><meta property="og:site_name" content="TrafikRehber" /><meta property="og:locale" content="tr_TR" /><meta property="og:type" content="website" /><meta property="og:url" content={`${SITE_URL}${pathname}`} /><meta name="robots" content={pathname.startsWith('/admin') ? 'noindex, nofollow' : 'index, follow'} /></Helmet>;
}
function App() {
  return (
    <HelmetProvider>
      <BrowserRouter><RouteMeta /><ErrorBoundary><Suspense fallback={<div className="loading" role="status"><span className="sr-only">Sayfa yükleniyor</span><div className="spinner" /></div>}>
        <Routes>

          {/* ── Admin (Navbar/Footer yok) ── */}
          <Route path="/admin" element={<AdminPage />} />

          {/* ── Normal site ── */}
          <Route path="*" element={
            <div className="app">
              <a className="skip-link" href="#main-content">İçeriğe geç</a><Navbar />
              <main id="main-content" tabIndex={-1}>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/blog" element={<ArticleListPage />} />
                  <Route path="/blog/:slug" element={<ArticlePage />} />
                  <Route path="/dilekce-ornekleri" element={<DilekceListPage />} />
                  <Route path="/dilekce-ornekleri/:slug" element={<DilekceDetailPage />} />
                  <Route path="/araclar/ceza-hesapla" element={<CezaHesaplaPage />} />
                  <Route path="/trafik-cezalari-2026" element={<CezaListesiPage />} />
                  <Route path="/trafik-cezalari" element={<CategoryPage category="ceza" />} />
                  <Route path="/trafik-cezalari/:sub" element={<CategoryPage category="ceza" />} />
                  <Route path="/sigorta" element={<CategoryPage category="sigorta" />} />
                  <Route path="/sigorta/:sub" element={<CategoryPage category="sigorta" />} />
                  <Route path="/ehliyet" element={<CategoryPage category="ehliyet" />} />
                  <Route path="/ehliyet/:sub" element={<CategoryPage category="ehliyet" />} />
                  <Route path="/arac-islemleri" element={<CategoryPage category="arac-islemleri" />} />
                  <Route path="/arac-islemleri/:sub" element={<CategoryPage category="arac-islemleri" />} />
                  <Route path="/hakkimizda" element={<HakkimizdaPage />} />
                  <Route path="/iletisim" element={<IletisimPage />} />
                  <Route path="/gizlilik-politikasi" element={<GizlilikPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Routes>
              </main>
              <Footer />
              <ChatWidget />
              <CookieBanner />
            </div>
          } />

        </Routes>
      </Suspense></ErrorBoundary></BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
