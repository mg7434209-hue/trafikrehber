import React, { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { statsApi } from '../services/api';

/**
 * Footer ziyaretçi sayacı.
 *
 * MANTIK (gespaenerji.com sayacıyla aynı):
 *   • Tekillik sunucuda, GÜNDE 1 KEZ, sha256(IP+UA+gün+tuz) karmasıyla belirlenir;
 *     tarayıcıya kimlik yazılmaz, ham IP saklanmaz.
 *   • Sayfa değişiminde (SPA rota) görüntülenme pingi atılır.
 *   • 60 sn'de bir "şu an sitede" tazeleme pingi (sekme görünürken) — sayfa
 *     görüntülenmesi olarak sayılmaz.
 *   • API yanıt vermezse rozet gösterilmez (uydurma sayı basılmaz).
 */

const nf = new Intl.NumberFormat('tr-TR');
const HEARTBEAT_MS = 60000;

export default function VisitCounter() {
  const [veri, setVeri] = useState(null);
  const location = useLocation();
  const sonPing = useRef(0);

  // Rota değişiminde: sayfa görüntülenmesi bildir
  useEffect(() => {
    let iptal = false;
    statsApi.visit(location.pathname)
      .then(d => { if (!iptal) { setVeri(d); sonPing.current = Date.now(); } })
      .catch(() => {});
    return () => { iptal = true; };
  }, [location.pathname]);

  // Sekme açıkken "şu an sitede" sayısını taze tut
  useEffect(() => {
    const tik = () => {
      if (document.hidden) return;
      if (Date.now() - sonPing.current < HEARTBEAT_MS - 1000) return;
      sonPing.current = Date.now();
      statsApi.visit(null).then(setVeri).catch(() => {});
    };
    const id = setInterval(tik, HEARTBEAT_MS);
    document.addEventListener('visibilitychange', tik);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', tik); };
  }, []);

  if (!veri || !veri.toplam) return null;

  return (
    <p className="visit-counter" title={`Bugün ${nf.format(veri.bugun || 0)} tekil ziyaretçi`}>
      <span aria-hidden="true">👥</span> <b>{nf.format(veri.toplam)}</b> ziyaretçi
      {veri.online > 0 && (
        <span className="visit-online">
          {' · '}<span className="visit-dot" aria-hidden="true" />
          {nf.format(veri.online)} kişi şu an sitede
        </span>
      )}
    </p>
  );
}
