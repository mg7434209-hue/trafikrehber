import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { cezaApi } from '../services/api';
import SSS from '../data/hiz.json';
import { YIL } from '../yil';

/*
 * /araclar/hiz-cezasi-hesapla — "kaç km aşarsam ne kadar ceza?"
 * Kademeler backend routers/admin.py HIZ_KADEMELERI'nden gelir (tek kaynak);
 * bu dosyaya tutar YAZILMAZ. SSS server.js tarafından FAQPage olarak basılır
 * (src/data/hiz.json).
 */

const tl = (v) => Number(v || 0).toLocaleString('tr-TR', { maximumFractionDigits: 2 }) + ' ₺';
const SINIRLAR = { ici: [30, 50, 70, 82], disi: [70, 90, 110, 120, 140] };
const aralik = (k) => (k.ust ? `${k.alt}–${k.ust} km/s` : `${k.alt} km/s ve üzeri`);

export default function HizCezasiPage() {
  const [veri, setVeri] = useState(null);
  const [hata, setHata] = useState(false);
  const [yol, setYol] = useState('ici');
  const [sinir, setSinir] = useState('50');
  const [hiz, setHiz] = useState('');
  const [acikSss, setAcikSss] = useState(null);

  useEffect(() => {
    cezaApi.hizKademeleri().then(setVeri).catch(() => setHata(true));
  }, []);

  const y = veri?.yollar?.[yol];
  const indirim = veri ? veri.indirim_orani : 0.25;

  const sonuc = useMemo(() => {
    const s = parseInt(sinir, 10), h = parseInt(hiz, 10);
    if (!y || !s || !h) return null;
    const asim = h - s;
    const kademe = y.kademeler.find(k => asim >= k.alt && (k.ust == null || asim <= k.ust)) || null;
    return { asim, kademe, tolerans: y.kademeler[0].alt - 1 };
  }, [y, sinir, hiz]);

  const yolSec = (k) => { setYol(k); setSinir(k === 'ici' ? '50' : '110'); };

  return (
    <>
      <Helmet>
        <title>{`Hız Cezası Hesaplama ${YIL}: Kaç km Aşarsam Ne Kadar Ceza? | CezaRehberi`}</title>
        <meta name="description" content="Hız sınırını ve hızınızı girin; aşım kademesini, ceza tutarını, 1 ay içinde %25 indirimli tutarı ve ehliyete el koyma süresini hemen görün. Şehir içi ve şehirlerarası tablo." />
      </Helmet>

      <section className="it-hero">
        <div className="hm-wrap it-hero-in">
          <nav className="it-yol" aria-label="Sayfa yolu"><Link to="/">Ana Sayfa</Link> <span>/</span> Hız Cezası Hesaplama</nav>
          <h1>Hız cezası hesaplama: kaç km aşarsam ne kadar ceza?</h1>
          <p className="it-lead">7574 sayılı Kanun'la hız cezaları aşılan kilometreye göre 9 kademeye ayrıldı. Sınırı ve hızınızı girin, cezanızı hemen görün.</p>
        </div>
      </section>

      <div className="hm-wrap it-govde">
        <div className="hz-arac">
          <div className="hz-sekme" role="tablist" aria-label="Yol türü">
            {[['ici', 'Şehir içi'], ['disi', 'Şehirlerarası / otoyol']].map(([k, ad]) => (
              <button key={k} type="button" role="tab" aria-selected={yol === k} className={`hz-sekme-btn ${yol === k ? 'is-sec' : ''}`} onClick={() => yolSec(k)}>{ad}</button>
            ))}
          </div>

          <div className="hz-girdi">
            <div className="do-alan">
              <span>Hız sınırı (km/s)</span>
              <div className="hz-hazir">
                {SINIRLAR[yol].map(v => (
                  <button key={v} type="button" className={`hz-hazir-btn ${String(v) === sinir ? 'is-sec' : ''}`} onClick={() => setSinir(String(v))}>{v}</button>
                ))}
                <input aria-label="Hız sınırı" inputMode="numeric" value={sinir} onChange={e => setSinir(e.target.value.replace(/\D/g, '').slice(0, 3))} />
              </div>
            </div>
            <label className="do-alan">
              <span>Tespit edilen hızınız (km/s)</span>
              <input inputMode="numeric" placeholder="ör. 72" value={hiz} onChange={e => setHiz(e.target.value.replace(/\D/g, '').slice(0, 3))} />
            </label>
          </div>

          {hata && <p className="it-uyari">Kademe tablosu şu an yüklenemedi. Lütfen sayfayı yenileyin.</p>}

          {sonuc && (
            <div className={`hz-sonuc ${sonuc.kademe ? (sonuc.kademe.belge_gun ? 'is-agir' : 'is-ceza') : 'is-yok'}`} role="status">
              {sonuc.asim <= 0 ? (
                <><b>Hız sınırını aşmamışsınız.</b><span>Ceza yok.</span></>
              ) : !sonuc.kademe ? (
                <><b>{sonuc.asim} km/s aşım — ceza yok</b><span>{y.ad} için {sonuc.tolerans} km/s'ye kadar aşım cezalandırılmaz. Yine de sınıra uyun.</span></>
              ) : (
                <>
                  <span className="hz-sonuc-ust">{sonuc.asim} km/s aşım · {aralik(sonuc.kademe)} kademesi</span>
                  <b className="hz-sonuc-tutar">{tl(sonuc.kademe.ceza_tl)}</b>
                  <span>1 ay içinde öderseniz <strong>{tl(sonuc.kademe.ceza_tl * (1 - indirim))}</strong></span>
                  {sonuc.kademe.belge_gun > 0 && <span className="hz-belge">🚫 Sürücü belgesi {sonuc.kademe.belge_gun} gün geri alınır</span>}
                </>
              )}
            </div>
          )}
          <p className="it-not">Ölçüm cihazı farkı, tekrar eden ihlal ya da araç türüne özel sınırlar sonucu değiştirebilir. Kesin tutar tutanakta ve e-Devlet'tedir.</p>
        </div>

        {y && (
          <section className="hz-tablolar" aria-labelledby="hz-tablo-b">
            <h2 id="hz-tablo-b">{YIL} hız cezası kademeleri</h2>
            {Object.entries(veri.yollar).map(([k, v]) => (
              <div key={k} className="hz-tablo-kutu">
                <h3>{v.ad}</h3>
                <div className="table-wrap">
                  <table className="data-table">
                    <thead><tr><th>Aşım</th><th>Ceza</th><th>1 ayda ödenirse</th><th>Ehliyet</th></tr></thead>
                    <tbody>
                      {v.kademeler.map(kd => {
                        const aktif = k === yol && sonuc && sonuc.kademe === kd;
                        return (
                          <tr key={kd.alt} className={aktif ? 'hz-aktif' : ''}>
                            <td>{aralik(kd)}</td>
                            <td><strong>{tl(kd.ceza_tl)}</strong></td>
                            <td>{tl(kd.ceza_tl * (1 - indirim))}</td>
                            <td>{kd.belge_gun ? `${kd.belge_gun} gün geri alınır` : '—'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {v.slug && <Link className="hz-detay" to={`/ceza/${v.slug}`}>{v.ad} hız cezası hakkında ayrıntılar →</Link>}
              </div>
            ))}
            {veri.son_dogrulama && <p className="it-not">Kaynak: 2918 sayılı KTK m.51 (7574 sayılı Kanun ile değişik, RG 27.02.2026). Son doğrulama: {new Date(veri.son_dogrulama).toLocaleDateString('tr-TR')}.</p>}
          </section>
        )}

        <div className="it-cta">
          <div>
            <strong>Radar cezası haksız mı?</strong>
            <span>Ölçüm görüntüsü ve cihazın kalibrasyon belgesi istenebilir. Tebliğden itibaren 15 gün içinde itiraz edin.</span>
          </div>
          <Link to="/itiraz?ceza=hiz-cezasi-sehir-ici" className="hm-btn hm-btn-tur">İtiraz yol haritası →</Link>
        </div>

        <section className="it-sss" aria-labelledby="hz-sss-b">
          <h2 id="hz-sss-b">Hız cezası hakkında sık sorulanlar</h2>
          {SSS.sss.map((x, i) => (
            <div key={x.s} className="hm-sss">
              <button type="button" className="hm-sss-s" aria-expanded={acikSss === i} aria-controls={`hz-sss-${i}`} onClick={() => setAcikSss(acikSss === i ? null : i)}>
                <span>{x.s}</span><span className="hm-sss-ikon" aria-hidden="true">{acikSss === i ? '−' : '+'}</span>
              </button>
              {acikSss === i && <div id={`hz-sss-${i}`} className="hm-sss-c">{x.c}</div>}
            </div>
          ))}
        </section>

        <p className="it-yasal">⚖️ Bu araç genel bilgilendirme amaçlıdır; kesin tutar için tutanağı ve e-Devlet kaydınızı esas alın.</p>
      </div>
    </>
  );
}
