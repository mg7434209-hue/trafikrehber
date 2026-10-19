import React, { useEffect, useRef } from 'react';

/**
 * Google AdSense reklam birimi.
 *
 * NEDEN VAR: index.html'de YALNIZ yükleyici betik vardı; sitede tek bir
 * <ins class="adsbygoogle"> yoktu. Reklam birimi olmadan gösterim de gelir de
 * olmaz — site aylardır boşuna trafik alıyordu.
 *
 * SLOT KİMLİĞİ: AdSense panelinde birim oluşturulunca verilen 10 haneli sayı.
 * src/adsense.js içinde tanımlıdır. Kimlik BOŞSA bileşen HİÇBİR ŞEY basmaz —
 * boş gri kutu, yer kayması (CLS) ve "boş reklam alanı" politika riski olmaz.
 *
 * POLİTİKA: reklam içerikten görsel olarak ayrılır ("Reklam" etiketi), içeriğe
 * tıklanacak kadar yakın konmaz, sayfa başına üçten fazla birim kullanılmaz.
 */
export default function AdSlot({ slot, format = 'auto', responsive = true, style, etiket = true }) {
  const ref = useRef(null);
  const basildi = useRef(false);

  useEffect(() => {
    if (!slot || basildi.current) return;
    // Aynı <ins> ikinci kez push edilirse AdSense "already have ads" hatası verir
    if (ref.current && ref.current.getAttribute('data-adsbygoogle-status')) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      basildi.current = true;
    } catch (e) { /* reklam engelleyici: sayfa normal çalışmaya devam eder */ }
  }, [slot]);

  if (!slot) return null;

  return (
    <div style={{ margin: '28px 0', textAlign: 'center', ...style }}>
      {etiket && (
        <div style={{ fontSize: 10, color: '#b6bec9', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
          Reklam
        </div>
      )}
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: 'block', minHeight: 100 }}
        data-ad-client="ca-pub-9741235138417122"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
}
