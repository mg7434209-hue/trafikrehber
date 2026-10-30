import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { cezaApi } from '../services/api';
import DilekceOlusturucu from '../components/DilekceOlusturucu';
import AvukatDestegi from '../components/AvukatDestegi';
import DilekceSayaci from '../components/DilekceSayaci';
import VERI from '../data/itiraz.json';
import { YIL } from '../yil';
import { birAySonra, gunSuresi, kalanGun, tarihOku, trTarih } from '../sure';

/*
 * /itiraz — "Haksız ceza aldım" yolculuğu: süre → gerekçe → öde mi? →
 * dilekçe → nereye başvurulur → sonra ne olur → avukat → SSS.
 * Kurallar: docs/itiraz.md. Süre/oran API'den gelir; gerekçeler ve SSS
 * src/data/itiraz.json'dadır (server.js aynı dosyadan FAQPage basar).
 * ?ceza=<slug> ceza sayfalarından gelen ziyaretçide cezayı seçili açar.
 */

const GUC = {
  guclu: { ad: 'Güçlü gerekçe', sinif: 'it-guc-y' },
  orta: { ad: 'Kanıtla güçlenir', sinif: 'it-guc-s' },
  zayif: { ad: 'Tek başına zayıf', sinif: 'it-guc-g' },
};

const tl = (v) => Number(v || 0).toLocaleString('tr-TR', { maximumFractionDigits: 2 }) + ' ₺';

function Adim({ no, id, baslik, children }) {
  return (
    <section id={id} className="it-adim" aria-labelledby={`${id}-b`}>
      <div className="it-adim-no" aria-hidden="true">{no}</div>
      <div className="it-adim-ic">
        <h2 id={`${id}-b`}>{baslik}</h2>
        {children}
      </div>
    </section>
  );
}

export default function ItirazPage() {
  const [params] = useSearchParams();
  const [veri, setVeri] = useState(null);
  const [cezaKod, setCezaKod] = useState('');
  const [teblig, setTeblig] = useState('');
  const [secili, setSecili] = useState([]);
  const [odeyecek, setOdeyecek] = useState(true);
  const [acikSss, setAcikSss] = useState(null);

  useEffect(() => {
    cezaApi.getAll().then(d => {
      setVeri(d);
      const slug = params.get('ceza');
      const c = slug && (d.cezalar || []).find(x => x.slug === slug);
      if (c) setCezaKod(c.kod);
    }).catch(() => {});
  }, [params]);

  const cezalar = veri?.cezalar || [];
  const ceza = cezalar.find(c => c.kod === cezaKod) || null;
  const itirazGun = veri?.itiraz_suresi_gun || 15;
  const indirim = veri?.indirim_orani ? Math.round(veri.indirim_orani * 100) : 25;

  const sure = useMemo(() => {
    const t = tarihOku(teblig);
    if (!t) return null;
    const it = gunSuresi(t, itirazGun);
    const od = birAySonra(t);
    return { t, itirazSon: it.son, kaydi: it.kaydi, itirazKalan: kalanGun(it.son), odemeSon: od, odemeKalan: kalanGun(od) };
  }, [teblig, itirazGun]);

  const gerekceler = VERI.gerekceler.filter(g => secili.includes(g.id));
  const degistir = (id) => setSecili(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  return (
    <>
      <Helmet>
        <title>{`Haksız Ceza İtirazı ${YIL}: Yol Haritası ve Dilekçe | CezaRehberi`}</title>
        <meta name="description" content={`Haksız trafik cezasına nasıl itiraz edilir? ${itirazGun} günlük süreyi hesaplayın, gerekçenizi seçin, dilekçenizi ücretsiz oluşturun. Sulh Ceza Hâkimliği ve UYAP adımları.`} />
      </Helmet>

      {/* ─── HERO ─── */}
      <section className="it-hero">
        <div className="hm-wrap it-hero-in">
          <nav className="it-yol" aria-label="Sayfa yolu"><Link to="/">Ana Sayfa</Link> <span>/</span> İtiraz Yol Haritası</nav>
          <h1>Haksız trafik cezasına itiraz: adım adım yol haritası</h1>
          <p className="it-lead">
            Cezanın haksız olduğunu düşünüyorsanız 6 adımda ilerleyin: sürenizi hesaplayın, gerekçenizi seçin,
            dilekçenizi burada ücretsiz oluşturun ve nereye vereceğinizi öğrenin.
          </p>
          <div className="it-gercekler">
            <div><b>{itirazGun} gün</b><span>tebliğden itibaren itiraz süresi</span></div>
            <div><b>Harç yok</b><span>itiraz için başvuru harcı alınmaz</span></div>
            <div><b>Avukat şart değil</b><span>dilekçeyi kendiniz verebilirsiniz</span></div>
          </div>
          <div className="it-ds"><DilekceSayaci /></div>
          <div className="it-hero-btn">
            <a href="#sure" className="hm-btn hm-btn-tur">Süremi hesapla →</a>
            <a href="#dilekce" className="hm-btn hm-btn-cam">Doğrudan dilekçe yaz</a>
          </div>
        </div>
      </section>

      <div className="hm-wrap it-govde">
        {/* İçindekiler */}
        <ol className="it-icindekiler" aria-label="Adımlar">
          <li><a href="#sure">Süre</a></li>
          <li><a href="#gerekce">Gerekçe</a></li>
          <li><a href="#odeme">Öde mi?</a></li>
          <li><a href="#dilekce">Dilekçe</a></li>
          <li><a href="#basvuru">Başvuru</a></li>
          <li><a href="#sonra">Sonrası</a></li>
        </ol>

        <Adim no="1" id="sure" baslik="Cezanızı ve tebliğ tarihini girin">
          <p>Süre, cezanın size <strong>tebliğ edildiği</strong> günden başlar. Polis tutanağı elinize verdiyse o gün, posta ile geldiyse zarfı teslim aldığınız gün, e-Tebligat ile geldiyse tebliğ sayılan gündür.</p>
          <div className="it-sure-form">
            <label className="do-alan">
              <span>Ceza türü</span>
              <select value={cezaKod} onChange={e => setCezaKod(e.target.value)}>
                <option value="">Seçin (isteğe bağlı)</option>
                {cezalar.map(c => <option key={c.kod} value={c.kod}>{c.aciklama} — {tl(c.taban_ceza_tl)}</option>)}
              </select>
            </label>
            <label className="do-alan">
              <span>Tebliğ tarihi</span>
              <input type="date" value={teblig} onChange={e => setTeblig(e.target.value)} max={new Date().toISOString().slice(0, 10)} />
            </label>
          </div>

          {sure ? (
            <div className="it-sure-sonuc">
              <div className={`it-sure-kart ${sure.itirazKalan < 0 ? 'is-gecti' : sure.itirazKalan <= 3 ? 'is-acil' : ''}`}>
                <span className="it-sure-ad">İtiraz için son gün</span>
                <b>{trTarih(sure.itirazSon)}</b>
                <span className="it-sure-kalan">
                  {sure.itirazKalan < 0 ? 'Süre geçmiş görünüyor' : sure.itirazKalan === 0 ? 'Bugün son gün!' : `${sure.itirazKalan} gün kaldı`}
                </span>
                {sure.kaydi && <small>Son gün hafta sonu ya da resmî tatile denk geldiği için ilk iş gününe kaydı.</small>}
              </div>
              <div className={`it-sure-kart it-sure-ode ${sure.odemeKalan < 0 ? 'is-gecti' : ''}`}>
                <span className="it-sure-ad">%{indirim} indirimli ödeme için son gün</span>
                <b>{trTarih(sure.odemeSon)}</b>
                <span className="it-sure-kalan">
                  {sure.odemeKalan < 0 ? 'İndirim süresi geçmiş' : `${sure.odemeKalan} gün kaldı`}
                  {ceza && sure.odemeKalan >= 0 && <> · {tl(ceza.taban_ceza_tl * (1 - indirim / 100))} ödersiniz</>}
                </span>
              </div>
              {sure.itirazKalan < 0 && (
                <p className="it-uyari">
                  Süre kaçtıysa ceza kesinleşmiş olabilir. Tebligat usulsüz yapıldıysa (başkasına verildiyse, eski adresinize gittiyse) süre başlamamış sayılabilir —
                  bu durumda 2. adımda "Tebligat usulsüz yapıldı" gerekçesini seçin ve bir avukata danışın.
                </p>
              )}
              <p className="it-not">Dinî bayram tatilleri hesaba katılmaz; son gün bayrama denk geliyorsa süreyi adliyeden teyit edin. Son güne bırakmayın.</p>
            </div>
          ) : (
            <p className="it-not">Tarihi girdiğinizde itiraz ve indirimli ödeme için son günleri burada göreceksiniz.</p>
          )}
          {ceza && ceza.kademe_notu && <p className="it-bilgi"><strong>{ceza.aciklama}:</strong> {ceza.kademe_notu}</p>}
        </Adim>

        <Adim no="2" id="gerekce" baslik="Neden haksız? Gerekçenizi seçin">
          <p>İtirazın sonucu, gerekçenin somutluğuna ve kanıta bağlıdır. Size uyanları işaretleyin; seçtikleriniz dilekçeye hukuki dille eklenir.</p>
          <div className="it-gerekceler">
            {VERI.gerekceler.map(g => {
              const sec = secili.includes(g.id);
              return (
                <label key={g.id} className={`it-gerekce ${sec ? 'is-sec' : ''}`}>
                  <input type="checkbox" checked={sec} onChange={() => degistir(g.id)} />
                  <span className="it-gerekce-ic">
                    <span className="it-gerekce-bas">
                      <strong>{g.baslik}</strong>
                      <span className={`it-guc ${GUC[g.guc].sinif}`}>{GUC[g.guc].ad}</span>
                    </span>
                    <span className="it-gerekce-ack">{g.aciklama}</span>
                    <span className="it-gerekce-kanit">📎 Kanıt: {g.kanit}</span>
                  </span>
                </label>
              );
            })}
          </div>
          <div className="it-zayif">
            <strong>Bunlar işe yaramaz:</strong>
            <ul>{VERI.zayif.map(z => <li key={z}>{z}</li>)}</ul>
          </div>
        </Adim>

        <Adim no="3" id="odeme" baslik="Ödeyeyim mi, itirazı mı bekleyeyim?">
          <p>
            <strong>İkisini birlikte yapabilirsiniz.</strong> Peşin ödeme itiraz hakkınızı ortadan kaldırmaz (Kabahatler Kanunu m.17/6).
            İtirazın sonucu çoğu zaman indirim süresinden sonra çıktığı için, pek çok kişi cezayı <strong>1 ay içinde %{indirim} indirimle öder</strong> ve
            itirazını ayrıca yapar. İtiraz kabul edilirse ödenen tutarın iadesi istenir.
          </p>
          <div className="it-secim">
            <button type="button" className={`it-secim-btn ${odeyecek ? 'is-sec' : ''}`} onClick={() => setOdeyecek(true)}>
              <b>Öde + itiraz et</b><span>İndirimi kaçırmazsınız; kazanırsanız iade istenir.</span>
            </button>
            <button type="button" className={`it-secim-btn ${!odeyecek ? 'is-sec' : ''}`} onClick={() => setOdeyecek(false)}>
              <b>Yalnız itiraz et</b><span>Ret hâlinde indirim süresi geçmişse cezanın tamamı ödenir.</span>
            </button>
          </div>
          <p className="it-not">Ödeme: e-Devlet, Gelir İdaresi'nin dijital vergi dairesi, internet bankacılığı veya vergi daireleri. Tutarları <Link to="/araclar/ceza-hesapla">ceza hesaplama aracında</Link> görebilirsiniz.</p>
        </Adim>

        <Adim no="4" id="dilekce" baslik="İtiraz dilekçenizi oluşturun">
          <p>Formu doldurun; dilekçe sağda (telefonda altta) anında oluşur. Yazdırıp imzalayın ya da Word olarak indirin.</p>
          <DilekceOlusturucu
            ceza={ceza}
            teblig={sure ? sure.t : null}
            gerekceler={gerekceler}
            itirazGun={itirazGun}
            odendiVarsayilan={odeyecek}
          />
        </Adim>

        <Adim no="5" id="basvuru" baslik="Dilekçeyi nereye ve nasıl verirsiniz?">
          <p>Dilekçe, cezanın yazıldığı yerdeki <strong>Sulh Ceza Hâkimliği</strong>'ne hitaben yazılır. İki yol var:</p>
          <div className="it-basvuru">
            <div className="it-basvuru-kart">
              <h3>🏛️ Adliyeye elden</h3>
              <ol>
                <li>Dilekçeyi imzalayın; tutanak sureti, kimlik fotokopisi ve kanıtları ekleyin.</li>
                <li>Adliyenin <strong>ön bürosuna (tevzi bürosu)</strong> verin.</li>
                <li>Size verilen dosya numarasını / alındı belgesini saklayın.</li>
              </ol>
              <small>Başka bir şehirdeyseniz bulunduğunuz yer adliyesinden göndermenin mümkün olup olmadığını ön bürodan sorun. Tebligat için posta gideri istenebilir.</small>
            </div>
            <div className="it-basvuru-kart">
              <h3>💻 İnternetten (UYAP)</h3>
              <ol>
                <li><strong>vatandas.uyap.gov.tr</strong> adresine e-Devlet ile girin.</li>
                <li>Dava/başvuru açılış menüsünden trafik idari para cezasına itirazı seçin.</li>
                <li>Dilekçeyi ve ekleri yükleyip <strong>e-imza veya mobil imza</strong> ile gönderin.</li>
              </ol>
              <small>Yalnız e-Devlet şifresi evrak göndermeye yetmeyebilir; e-imza ya da mobil imza gerekir. Menü adları değişebilir.</small>
            </div>
          </div>
        </Adim>

        <Adim no="6" id="sonra" baslik="Sonra ne olur?">
          <ul className="it-zaman">
            <li><b>Karar</b><span>Hâkimlik genellikle duruşma yapmadan dosya üzerinden karar verir; karar size tebliğ edilir, UYAP'tan da izlenebilir.</span></li>
            <li><b>Kabul</b><span>Ceza kaldırılır. Ödediyseniz iade için ilgili vergi dairesine başvurursunuz; ceza puanı da işlenmez.</span></li>
            <li><b>Ret</b><span>Kararın tebliğinden itibaren <strong>7 gün</strong> içinde karara itiraz edebilirsiniz (Kabahatler K. m.29, CMK m.268). Merci ve süre kararda yazar.</span></li>
          </ul>
        </Adim>

        <AvukatDestegi />

        {/* ─── SSS ─── */}
        <section className="it-sss" aria-labelledby="it-sss-b">
          <h2 id="it-sss-b">Trafik cezasına itiraz: sık sorulan sorular</h2>
          {VERI.sss.map((x, i) => (
            <div key={x.s} className="hm-sss">
              <button type="button" className="hm-sss-s" aria-expanded={acikSss === i} aria-controls={`it-sss-${i}`} onClick={() => setAcikSss(acikSss === i ? null : i)}>
                <span>{x.s}</span><span className="hm-sss-ikon" aria-hidden="true">{acikSss === i ? '−' : '+'}</span>
              </button>
              {acikSss === i && <div id={`it-sss-${i}`} className="hm-sss-c">{x.c}</div>}
            </div>
          ))}
        </section>

        <div className="it-ilgili">
          <Link to="/trafik-cezalari-2026">📋 {YIL} ceza tutarları</Link>
          <Link to="/araclar/hiz-cezasi-hesapla">🚗 Hız cezası hesaplama</Link>
          <Link to="/blog/trafik-cezasi-e-devlet-sorgulama">🔎 e-Devlet'ten ceza sorgulama</Link>
          <Link to="/dilekce-ornekleri">📄 Diğer dilekçe örnekleri</Link>
        </div>

        <p className="it-yasal">
          ⚖️ Bu sayfa genel bilgilendirme amaçlıdır, hukuki danışmanlık yerine geçmez. CezaRehberi resmî kurum veya hukuk bürosu değildir;
          oluşturulan dilekçe genel bir şablondur. Süreleri ve usulü güncel mevzuattan ve adliyeden doğrulayın.
        </p>
      </div>
    </>
  );
}
