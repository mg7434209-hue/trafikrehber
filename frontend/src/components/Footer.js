import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer style={{ background: '#1a2744', color: '#cdd5e0', marginTop: 80 }}>
      <div className="container" style={{ padding: '48px 20px 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 40, marginBottom: 40 }}>
          
          <div>
            <div style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 12 }}>TrafikRehber</div>
            <p style={{ fontSize: 14, lineHeight: 1.7 }}>
              Trafik cezaları, sigorta, ehliyet ve araç işlemleri hakkında güvenilir Türkçe rehber.
            </p>
          </div>

          <div>
            <div style={{ fontWeight: 600, color: '#fff', marginBottom: 12 }}>Kategoriler</div>
            {[
              ['Trafik Cezaları', '/trafik-cezalari'],
              ['Sigorta Rehberi', '/sigorta'],
              ['Ehliyet İşlemleri', '/ehliyet'],
              ['Araç İşlemleri', '/arac-islemleri'],
            ].map(([label, path]) => (
              <div key={path} style={{ marginBottom: 8 }}>
                <Link to={path} style={{ color: '#cdd5e0', textDecoration: 'none', fontSize: 14 }}
                  onMouseOver={e => e.target.style.color = '#fff'}
                  onMouseOut={e => e.target.style.color = '#cdd5e0'}
                >{label}</Link>
              </div>
            ))}
          </div>

          <div>
            <div style={{ fontWeight: 600, color: '#fff', marginBottom: 12 }}>Araçlar</div>
            {[
              ['Ceza Hesapla', '/araclar/ceza-hesapla'],
              ['Dilekçe Örnekleri', '/dilekce-ornekleri'],
              ['Blog & Makaleler', '/blog'],
            ].map(([label, path]) => (
              <div key={path} style={{ marginBottom: 8 }}>
                <Link to={path} style={{ color: '#cdd5e0', textDecoration: 'none', fontSize: 14 }}
                  onMouseOver={e => e.target.style.color = '#fff'}
                  onMouseOut={e => e.target.style.color = '#cdd5e0'}
                >{label}</Link>
              </div>
            ))}
          </div>

          <div>
            <div style={{ fontWeight: 600, color: '#fff', marginBottom: 12 }}>Kurumsal</div>
            {[
              ['Hakkımızda', '/hakkimizda'],
              ['İletişim', '/iletisim'],
              ['Gizlilik Politikası', '/gizlilik-politikasi'],
            ].map(([label, path]) => (
              <div key={path} style={{ marginBottom: 8 }}>
                <Link to={path} style={{ color: '#cdd5e0', textDecoration: 'none', fontSize: 14 }}
                  onMouseOver={e => e.target.style.color = '#fff'}
                  onMouseOut={e => e.target.style.color = '#cdd5e0'}
                >{label}</Link>
              </div>
            ))}
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ fontSize: 13 }}>© 2025 TrafikRehber. Tüm hakları saklıdır.</p>
          <p style={{ fontSize: 13 }}>
            ⚖️ Bu site genel bilgilendirme amaçlıdır. Hukuki danışmanlık yerine geçmez.
          </p>
        </div>
      </div>
    </footer>
  );
}
