import React, { useEffect, useState } from 'react';
import { statsApi } from '../services/api';
import { ziyaretciDinle, ziyaretciSon } from '../ziyaretci';

const nf = new Intl.NumberFormat('tr-TR');

/**
 * Ana sayfa hero'sundaki ziyaretçi şeridi: "Bugün X kişi · Toplam Y ziyaretçi".
 *
 * Veri footer'daki VisitCounter'dan YAYINLA gelir (ziyaretci.js) — ziyaret
 * orada sunucuya bildirildiği için sayı bu ziyareti de içerir. Yayın henüz
 * gelmediyse salt okunur GET ile bir kez doldurulur (sayım yapmaz).
 * API yanıt vermezse şerit HİÇ görünmez: tahmini/uydurma sayı basılmaz.
 */
export default function ZiyaretciSeridi() {
  const [v, setV] = useState(ziyaretciSon());

  useEffect(() => {
    const birak = ziyaretciDinle(setV);
    if (!ziyaretciSon()) {
      statsApi.getVisitors().then(d => setV(o => o || d)).catch(() => {});
    }
    return birak;
  }, []);

  if (!v || !v.toplam) return null;

  return (
    <div className="hz-visit" role="status" aria-live="polite">
      <span className="hz-visit-item">
        <span aria-hidden="true">👥</span> Bugün <b>{nf.format(v.bugun || 0)}</b> kişi
      </span>
      <span className="hz-visit-sep" aria-hidden="true" />
      <span className="hz-visit-item">
        Toplam <b>{nf.format(v.toplam)}</b> ziyaretçi
      </span>
      {v.online > 0 && (
        <>
          <span className="hz-visit-sep" aria-hidden="true" />
          <span className="hz-visit-item hz-visit-live">
            <span className="visit-dot" aria-hidden="true" /> <b>{nf.format(v.online)}</b> kişi şu an sitede
          </span>
        </>
      )}
    </div>
  );
}
