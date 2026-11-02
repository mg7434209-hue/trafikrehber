import React, { useRef, useState } from 'react';
import { iletisimApi } from '../services/api';

const KONULAR = [
  ['duzeltme', 'Hata / düzeltme bildirimi'],
  ['oneri', 'Öneri / görüş'],
  ['kvkk', 'KVKK başvurusu'],
  ['isbirligi', 'İş birliği (avukat, kurum)'],
  ['diger', 'Diğer'],
];

/**
 * İletişim formu → /api/iletisim → veritabanı → yönetici paneli "Mesajlar".
 * Gizli alan `web` (honeypot) ve açılış zamanı spam'i eler; kişisel veri yalnız
 * kullanıcının yazdığı alanlardır (ham IP gönderilmez/saklanmaz).
 */
export default function IletisimFormu({ konu: ilkKonu = 'duzeltme' }) {
  const [f, setF] = useState({ konu: ilkKonu, ad: '', eposta: '', mesaj: '', web: '' });
  const [durum, setDurum] = useState('');   // '' | 'gonderiliyor' | 'tamam' | 'hata'
  const [hata, setHata] = useState('');
  const acildi = useRef(Date.now());
  const yaz = (k) => (e) => { setHata(''); setF((o) => ({ ...o, [k]: e.target.value })); };

  const gonder = async (e) => {
    e.preventDefault();
    setHata('');
    if (f.mesaj.trim().length < 10) return setHata('Mesajınız en az 10 karakter olmalı.');
    if (f.eposta.trim() && !/^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(f.eposta.trim())) return setHata('E-posta adresi geçersiz görünüyor.');
    setDurum('gonderiliyor');
    try {
      await iletisimApi.gonder({ ...f, gecen_ms: Date.now() - acildi.current });
      setDurum('tamam');
    } catch (err) {
      setDurum('hata');
      setHata(/429/.test(err.message) ? 'Bugün çok fazla mesaj gönderdiniz; yarın tekrar deneyin.' : 'Mesaj gönderilemedi. Lütfen biraz sonra tekrar deneyin.');
    }
  };

  if (durum === 'tamam') {
    return (
      <div className="if-tamam" role="status">
        <strong>✓ Mesajınız alındı.</strong> Teşekkür ederiz.
        {f.eposta.trim() ? ' E-posta adresinize dönüş yapacağız.' : ' E-posta adresi yazmadığınız için size dönüş yapamayacağız; düzeltme bildirimleri incelenip içeriğe yansıtılır.'}
      </div>
    );
  }

  return (
    <form className="if" onSubmit={gonder} noValidate>
      <label className="do-alan">
        <span>Konu</span>
        <select value={f.konu} onChange={yaz('konu')}>{KONULAR.map(([k, a]) => <option key={k} value={k}>{a}</option>)}</select>
      </label>
      <div className="do-grid">
        <label className="do-alan"><span>Adınız (isteğe bağlı)</span><input value={f.ad} onChange={yaz('ad')} maxLength={80} autoComplete="name" /></label>
        <label className="do-alan"><span>E-posta (yanıt istiyorsanız)</span><input type="email" value={f.eposta} onChange={yaz('eposta')} maxLength={120} autoComplete="email" /></label>
      </div>
      <label className="do-alan">
        <span>Mesajınız *</span>
        <textarea rows={6} value={f.mesaj} onChange={yaz('mesaj')} maxLength={2000} required
          placeholder="Hata bildiriyorsanız hangi sayfa ve hangi bilgi yanlış, doğrusu nedir (varsa kaynağıyla) yazın." />
      </label>
      {/* Honeypot: gerçek kullanıcı görmez */}
      <div className="if-bal" aria-hidden="true"><label>Web sitesi<input tabIndex={-1} autoComplete="off" value={f.web} onChange={yaz('web')} /></label></div>
      {hata && <p className="do-uyari" role="alert">{hata}</p>}
      <button type="submit" className="hm-btn hm-btn-tur" disabled={durum === 'gonderiliyor'}>
        {durum === 'gonderiliyor' ? 'Gönderiliyor…' : 'Mesajı gönder'}
      </button>
      <p className="do-not">Mesajınız yalnızca size dönüş yapmak ve içeriği düzeltmek için kullanılır. T.C. kimlik numarası, adres gibi bilgi yazmayın.</p>
    </form>
  );
}
