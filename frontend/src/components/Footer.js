import React from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon';
import VisitorCounter from './VisitorCounter';
const GROUPS = [
  ['Trafik & işlemler', [['2026 Ceza Listesi', '/trafik-cezalari-2026'], ['Ceza Hesapla', '/araclar/ceza-hesapla'], ['Dilekçe Örnekleri', '/dilekce-ornekleri']]],
  ['Rehberler', [['Sigorta', '/sigorta'], ['Ehliyet', '/ehliyet'], ['Araç İşlemleri', '/arac-islemleri'], ['Tüm Makaleler', '/blog']]],
  ['TrafikRehber', [['Hakkımızda', '/hakkimizda'], ['İletişim', '/iletisim'], ['Gizlilik Politikası', '/gizlilik-politikasi']]],
];
export default function Footer() {
  return <footer className="site-footer"><div className="container"><div className="footer-grid"><div className="footer-about"><Link className="brand" to="/"><span className="brand-mark"><Icon name="road" /></span><span>TrafikRehber</span></Link><p>Trafik cezaları, sigorta ve araç işlemleri için anlaşılır rehberler. Yola daha bilinçli devam edin.</p><span className="footer-note">Bilgiye ulaşmak için doğru bir başlangıç.</span></div>{GROUPS.map(([title, links]) => <div key={title}><h2>{title}</h2><ul>{links.map(([label, path]) => <li key={path}><Link to={path}>{label}</Link></li>)}</ul></div>)}</div><div className="footer-bottom"><div><p>© {new Date().getFullYear()} TrafikRehber. Tüm hakları saklıdır.</p><p>İçerikler genel bilgilendirme amaçlıdır; hukuki danışmanlık yerine geçmez.</p></div><VisitorCounter /></div></div></footer>;
}
