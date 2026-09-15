import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

/**
 * Site genelinde tek doğru adres. Railway'de REACT_APP_SITE_URL ile ezilir.
 * KURAL: Sayfalara elle alan adı yazma — canonical/paylaşım linkleri buradan.
 */
export const SITE_URL = (process.env.REACT_APP_SITE_URL || 'https://www.cezarehberi.com').replace(/\/$/, '');

export const abs = (path = '/') => SITE_URL + (path.startsWith('/') ? path : '/' + path);

/**
 * Her sayfaya canonical + Open Graph/Twitter etiketi basar (App.js'te bir kez
 * render edilir; rota değişince kendini günceller). Sayfaların kendi
 * Helmet'lerindeki title/description bunları ezebilir.
 */
export default function SeoDefaults() {
  const { pathname } = useLocation();
  const url = abs(pathname);
  return (
    <Helmet>
      <link rel="canonical" href={url} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="TrafikRehber" />
      <meta property="og:locale" content="tr_TR" />
      <meta name="twitter:card" content="summary_large_image" />
    </Helmet>
  );
}
