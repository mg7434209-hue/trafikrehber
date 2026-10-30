import React, { useEffect, useState } from 'react';
import { statsApi } from '../services/api';

const nf = new Intl.NumberFormat('tr-TR');

/**
 * "X kişi itiraz dilekçesini burada hazırladı" — GERÇEK sayı (backend
 * routers/stats.py dilekçe sayacı). Sayı eşiğin (DILEKCE_SAYAC_ESIK) altındayken
 * ya da API yanıt vermezken bileşen HİÇBİR ŞEY göstermez; tahmini/uydurma
 * sayı basılmaz. Ziyaretçi sayacı yalnız sayfa altındadır (VisitCounter).
 */
export function dilekceSay(tur) {
  // Yalnız eylem türü gider; dilekçe içeriği/kişisel veri GÖNDERİLMEZ.
  statsApi.dilekce(tur).catch(() => {});
}

export default function DilekceSayaci({ tema = 'koyu' }) {
  const [v, setV] = useState(null);
  useEffect(() => {
    let iptal = false;
    statsApi.getDilekce().then(d => { if (!iptal) setV(d); }).catch(() => {});
    return () => { iptal = true; };
  }, []);

  if (!v || !v.goster) return null;
  return (
    <div className={`ds ds-${tema}`} role="status">
      <span><span aria-hidden="true">📄 </span><b>{nf.format(v.toplam)}</b> kişi itiraz dilekçesini CezaRehberi'nde hazırladı</span>
      {v.son_30_gun >= 10 && <span className="ds-alt">· son 30 günde {nf.format(v.son_30_gun)}</span>}
    </div>
  );
}
