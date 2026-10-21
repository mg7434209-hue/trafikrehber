import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { articlesApi, cezaApi, dilekceApi } from '../services/api';

/**
 * Ana sayfa akıllı araması — yazarken sonuç gösterir.
 *
 * NEDEN: eski arama kutusu YALNIZ blog yazılarında arıyordu. "kırmızı ışık"
 * yazan ziyaretçi cezanın sayfasını, "itiraz" yazan dilekçeyi bulamıyordu.
 * Bu bileşen dört kaynağı birlikte tarar: ceza sayfaları (tutarıyla),
 * dilekçe şablonları, araçlar/sayfalar ve rehber yazıları.
 *
 * Türkçe karakter duyarsızdır: "kirmizi isik" → "Kırmızı ışık".
 * Klavye: ↑/↓ seçer, Enter açar, Esc kapatır. Seçim yokken Enter tüm
 * rehberlerde arar (/blog?q=).
 */

const norm = (s) => (s || '')
  .toLocaleLowerCase('tr')
  .replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g')
  .replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c').replace(/â/g, 'a')
  .replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

// Sabit sayfalar: halkın kullandığı kelimelerle (anahtar) eşleşir
const SAYFALAR = [
  { baslik: '2026 trafik cezaları listesi', alt: 'Tüm tutarlar tek tabloda', href: '/trafik-cezalari-2026', anahtar: 'liste tum cezalar tutar 2026 ne kadar' },
  { baslik: 'Ceza hesaplama aracı', alt: 'Erken ödeme indirimi ve taksit', href: '/araclar/ceza-hesapla', anahtar: 'hesapla hesaplama indirim erken odeme taksit ne kadar oderim yuzde 25' },
  { baslik: 'İtiraz dilekçesi örnekleri', alt: 'Hazır şablonlar', href: '/dilekce-ornekleri', anahtar: 'itiraz dilekce sablon ornek mahkeme sulh ceza' },
  { baslik: 'Sigorta rehberi', alt: 'Trafik sigortası, kasko, hasar', href: '/sigorta', anahtar: 'sigorta kasko hasar kaza tazminat zmss' },
  { baslik: 'Ehliyet işlemleri', alt: 'Puan, sınav, yenileme', href: '/ehliyet', anahtar: 'ehliyet surucu belgesi puan sinav yenileme iptal' },
  { baslik: 'Araç işlemleri', alt: 'Muayene, tescil, devir', href: '/arac-islemleri', anahtar: 'arac muayene tescil devir noter plaka tuvturk' },
];

// Halk ağzı → resmî terim (ceza adlarında geçmeyen kelimeler)
const ES = {
  radar: 'hiz', telefon: 'cep telefonu', promil: 'alkol', ickili: 'alkol',
  kemer: 'emniyet kemeri', isik: 'kirmizi isik', sigortasiz: 'sigorta',
  ehliyetsiz: 'ehliyetsiz', drift: 'drift makas', makas: 'drift makas',
};

const tl = (v) => Number(v).toLocaleString('tr-TR', { maximumFractionDigits: 0 }) + ' ₺';

function eslesir(sorgu, metin) {
  const kel = sorgu.split(' ').filter(Boolean);
  return kel.every(k => metin.includes(k) || (ES[k] && metin.includes(ES[k])));
}

export default function AkilliArama({ placeholder }) {
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const [acik, setAcik] = useState(false);
  const [secili, setSecili] = useState(-1);
  const [cezalar, setCezalar] = useState([]);
  const [dilekceler, setDilekceler] = useState([]);
  const [yazilar, setYazilar] = useState([]);
  const kutu = useRef(null);

  useEffect(() => {
    cezaApi.sayfalar().then(d => setCezalar(d.sayfalar || [])).catch(() => {});
    dilekceApi.getAll().then(d => setDilekceler(d.sablonlar || [])).catch(() => {});
  }, []);

  // Rehber yazıları sunucuda aranır (gecikmeli; her tuşta istek atılmaz)
  useEffect(() => {
    const t = q.trim();
    if (t.length < 2) { setYazilar([]); return undefined; }
    const id = setTimeout(() => {
      articlesApi.search(t).then(d => setYazilar(d.results || [])).catch(() => setYazilar([]));
    }, 250);
    return () => clearTimeout(id);
  }, [q]);

  // Dışarı tıklayınca kapan
  useEffect(() => {
    const kapat = (e) => { if (kutu.current && !kutu.current.contains(e.target)) setAcik(false); };
    document.addEventListener('mousedown', kapat);
    return () => document.removeEventListener('mousedown', kapat);
  }, []);

  const gruplar = useMemo(() => {
    const s = norm(q);
    if (s.length < 2) return [];
    const g = [];
    const c = cezalar.filter(x => eslesir(s, norm(`${x.aciklama} ${x.baslik}`))).slice(0, 4)
      .map(x => ({ baslik: x.aciklama, alt: tl(x.taban_ceza_tl), href: `/ceza/${x.slug}` }));
    if (c.length) g.push({ ad: 'Cezalar', ikon: '🚦', ogeler: c });
    const d = dilekceler.filter(x => eslesir(s, norm(`${x.baslik} ${x.aciklama} ${x.kategori} dilekce`))).slice(0, 3)
      .map(x => ({ baslik: x.baslik, alt: 'Dilekçe örneği', href: `/dilekce-ornekleri/${x.slug}` }));
    if (d.length) g.push({ ad: 'Dilekçeler', ikon: '📄', ogeler: d });
    const p = SAYFALAR.filter(x => eslesir(s, norm(`${x.baslik} ${x.anahtar}`))).slice(0, 3);
    if (p.length) g.push({ ad: 'Araçlar ve sayfalar', ikon: '🧭', ogeler: p });
    const y = yazilar.slice(0, 3).map(x => ({ baslik: x.title, alt: 'Rehber', href: `/blog/${x.slug}` }));
    if (y.length) g.push({ ad: 'Rehberler', ikon: '📰', ogeler: y });
    return g;
  }, [q, cezalar, dilekceler, yazilar]);

  const duz = useMemo(() => gruplar.flatMap(g => g.ogeler), [gruplar]);

  const git = (href) => { setAcik(false); setQ(''); setSecili(-1); navigate(href); };

  const gonder = (e) => {
    e.preventDefault();
    if (secili >= 0 && duz[secili]) return git(duz[secili].href);
    const t = q.trim();
    if (t) { setAcik(false); navigate(`/blog?q=${encodeURIComponent(t)}`); }
    return undefined;
  };

  const tus = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setAcik(true); setSecili(i => Math.min(i + 1, duz.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSecili(i => Math.max(i - 1, -1)); }
    else if (e.key === 'Escape') { setAcik(false); setSecili(-1); }
  };

  const goster = acik && q.trim().length >= 2;
  let sira = -1;

  return (
    <form ref={kutu} onSubmit={gonder} className="ak-form" role="search">
      <div className="ak-bar">
        <span className="ak-ikon" aria-hidden="true">🔍</span>
        <input
          type="search"
          className="ak-input"
          role="combobox"
          aria-expanded={goster}
          aria-controls="ak-liste"
          aria-autocomplete="list"
          aria-label="Ceza, dilekçe veya rehber ara"
          aria-activedescendant={secili >= 0 ? `ak-o-${secili}` : undefined}
          value={q}
          placeholder={placeholder}
          autoComplete="off"
          onChange={e => { setQ(e.target.value); setAcik(true); setSecili(-1); }}
          onFocus={() => setAcik(true)}
          onKeyDown={tus}
        />
        <button type="submit" className="ak-btn">Ara</button>
      </div>

      {goster && (
        <div id="ak-liste" className="ak-liste" role="listbox">
          {gruplar.length === 0 ? (
            <div className="ak-bos">
              Sonuç bulunamadı. <button type="submit" className="ak-bos-btn">Tüm rehberlerde “{q.trim()}” ara →</button>
            </div>
          ) : gruplar.map(g => (
            <div key={g.ad} className="ak-grup">
              <div className="ak-grup-ad"><span aria-hidden="true">{g.ikon}</span> {g.ad}</div>
              {g.ogeler.map(o => {
                sira += 1;
                const i = sira;
                return (
                  <button type="button" key={o.href} id={`ak-o-${i}`} role="option" aria-selected={i === secili}
                    className={`ak-oge${i === secili ? ' is-sel' : ''}`}
                    onMouseEnter={() => setSecili(i)} onClick={() => git(o.href)}>
                    <span className="ak-oge-b">{o.baslik}</span>
                    <span className="ak-oge-a">{o.alt}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </form>
  );
}
