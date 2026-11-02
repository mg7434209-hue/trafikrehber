import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { YIL } from '../yil';

/**
 * src/data/sayfalar.json bloklarını çizer (Hakkımızda, İletişim, Gizlilik).
 * Aynı dosyayı sunucu (prerender.js) da okur — metin tek yerde, iki çıktı.
 * Blok: {t:'h2'|'p'|'ul'|'uyari', x|items, id?}. Satır içi: **kalın**, [metin](/yol).
 */
function Satir({ x }) {
  const s = String(x).replace(/\{YIL\}/g, YIL);
  const re = /\*\*([^*]+)\*\*|\[([^\]]+)\]\(((?:\/|https?:)[^)\s]*)\)/g;
  const parca = [];
  let son = 0, m, i = 0;
  while ((m = re.exec(s))) {
    if (m.index > son) parca.push(s.slice(son, m.index));
    if (m[1]) parca.push(<strong key={i++}>{m[1]}</strong>);
    else if (m[3].startsWith('/')) parca.push(<Link key={i++} to={m[3]}>{m[2]}</Link>);
    else parca.push(<a key={i++} href={m[3]} target="_blank" rel="noopener noreferrer">{m[2]}</a>);
    son = re.lastIndex;
  }
  if (son < s.length) parca.push(s.slice(son));
  return <>{parca}</>;
}

export default function SayfaBloklari({ bloklar }) {
  const { hash } = useLocation();
  // #editoryal gibi çapalar: sayfa JS ile çizildiği için tarayıcı kendiliğinden kaydırmaz
  useEffect(() => {
    if (!hash) return;
    const el = document.getElementById(decodeURIComponent(hash.slice(1)));
    if (el) el.scrollIntoView();
  }, [hash]);

  return (
    <div className="sb">
      {bloklar.map((b, i) => {
        if (b.t === 'h2') return <h2 key={i} id={b.id}><Satir x={b.x} /></h2>;
        if (b.t === 'ul') return <ul key={i}>{b.items.map((it, j) => <li key={j}><Satir x={it} /></li>)}</ul>;
        if (b.t === 'uyari') return <div key={i} className="warning-box"><Satir x={b.x} /></div>;
        return <p key={i}><Satir x={b.x} /></p>;
      })}
    </div>
  );
}
