import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CookieBanner from './components/CookieBanner';
import HomePage from './pages/HomePage';
import ArticlePage from './pages/ArticlePage';
import ArticleListPage from './pages/ArticleListPage';
import DilekceListPage from './pages/DilekceListPage';
import DilekceDetailPage from './pages/DilekceDetailPage';
import CezaHesaplaPage from './pages/CezaHesaplaPage';
import CategoryPage from './pages/CategoryPage';
import HakkimizdaPage from './pages/HakkimizdaPage';
import IletisimPage from './pages/IletisimPage';
import GizlilikPage from './pages/GizlilikPage';
import NotFoundPage from './pages/NotFoundPage';
import ChatWidget from './components/ChatWidget';
import AdminPage from './pages/AdminPage';
import './App.css';

function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <Routes>

          {/* ── Admin (Navbar/Footer yok) ── */}
          <Route path="/admin" element={<AdminPage />} />

          {/* ── Normal site ── */}
          <Route path="*" element={
            <div className="app">
              <Navbar />
              <main>
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/blog" element={<ArticleListPage />} />
                  <Route path="/blog/:slug" element={<ArticlePage />} />
                  <Route path="/dilekce-ornekleri" element={<DilekceListPage />} />
                  <Route path="/dilekce-ornekleri/:slug" element={<DilekceDetailPage />} />
                  <Route path="/araclar/ceza-hesapla" element={<CezaHesaplaPage />} />
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
      </BrowserRouter>
    </HelmetProvider>
  );
}

export default App;
