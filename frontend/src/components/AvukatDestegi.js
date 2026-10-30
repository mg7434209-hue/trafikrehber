import React from 'react';
import { avukatlar } from '../avukat';

/**
 * "Avukat desteği" kutusu. Kayıtlı avukat varsa (src/avukat.js) iletişim
 * kartı gösterir; yoksa avukatın ne zaman gerektiğini ve nasıl bulunacağını
 * anlatır. Uydurma avukat ya da iletişim bilgisi basılmaz.
 */
export default function AvukatDestegi({ kompakt = false }) {
  const liste = avukatlar();

  return (
    <div className="av-kutu">
      <h3 className="av-baslik">⚖️ Avukat desteği ister misiniz?</h3>
      {!kompakt && (
        <p className="av-metin">
          İtirazı kendiniz yapabilirsiniz; avukat zorunlu değildir. Şu durumlarda bir avukattan destek almanız önerilir:
        </p>
      )}
      {!kompakt && (
        <ul className="av-liste">
          <li>Ceza yüksek tutarlı ya da kademeli (tekrar eden kırmızı ışık, telefon, alkol)</li>
          <li>Sürücü belgeniz geri alındı veya iptal edilebilir</li>
          <li>Olayda kaza, yaralanma ya da ceza davası ihtimali var</li>
          <li>İtirazınız reddedildi ve karara itiraz edeceksiniz</li>
        </ul>
      )}

      {liste.length > 0 ? (
        <>
          <div className="av-kartlar">
            {liste.map(a => (
              <div key={a.sicil} className="av-kart">
                <strong>{a.ad}</strong>
                <span className="av-kart-alt">{a.baro} · Sicil no: {a.sicil}{a.il ? ` · ${a.il}` : ''}</span>
                {a.alan && <span className="av-kart-alt">{a.alan}</span>}
                <div className="av-kart-btn">
                  {a.whatsapp && (
                    <a href={`https://wa.me/${a.whatsapp}?text=${encodeURIComponent('Merhaba, trafik cezası itirazı hakkında bilgi almak istiyorum.')}`}
                      target="_blank" rel="noopener noreferrer nofollow" className="hm-btn hm-btn-tur">WhatsApp</a>
                  )}
                  {a.telefon && <a href={`tel:${a.telefon.replace(/\s/g, '')}`} className="hm-btn hm-btn-lac">Ara</a>}
                  {a.eposta && <a href={`mailto:${a.eposta}`} className="hm-btn hm-btn-lac">E-posta</a>}
                </div>
              </div>
            ))}
          </div>
          <p className="av-not">
            Avukat CezaRehberi'nden bağımsızdır. Görüşme, ücret ve vekâlet doğrudan avukatla kararlaştırılır;
            CezaRehberi hukuki hizmet vermez. Paylaştığınız bilgiler doğrudan avukata gider.
          </p>
        </>
      ) : (
        <p className="av-not">
          Bulunduğunuz ilin barosunun internet sitesinden ya da Türkiye Barolar Birliği'nden (barobirlik.org.tr) avukat bilgisine ulaşabilirsiniz.
          Maddi durumunuz avukat ücretine yetmiyorsa barosunun <strong>adli yardım bürosuna</strong> başvurabilirsiniz.
        </p>
      )}
    </div>
  );
}
