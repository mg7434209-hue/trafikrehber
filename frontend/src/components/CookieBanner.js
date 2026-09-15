import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
function loadAds() { if (document.getElementById('adsense-script')) return; const script = document.createElement('script'); script.id = 'adsense-script'; script.async = true; script.crossOrigin = 'anonymous'; script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9741235138417122'; document.head.appendChild(script); }
export default function CookieBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => { try { const consent = localStorage.getItem('cookie_consent'); if (consent === 'true') loadAds(); if (consent === null) setShow(true); } catch { setShow(true); } }, []);
  function choose(accepted) { try { localStorage.setItem('cookie_consent', String(accepted)); } catch {} if (accepted) loadAds(); setShow(false); }
  if (!show) return null;
  return <div className="cookie-banner" role="region" aria-label="Çerez tercihleri"><p>İzin verirseniz Google AdSense reklam çerezleri kullanılır. <Link to="/gizlilik-politikasi">Gizlilik politikası</Link></p><div><button onClick={() => choose(false)}>Reddet</button><button className="accept-cookies" onClick={() => choose(true)}>Kabul et</button></div></div>;
}
