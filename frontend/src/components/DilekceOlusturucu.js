import React, { useEffect, useMemo, useState } from 'react';
import { kisaTarih, tarihOku } from '../sure';

/**
 * Trafik cezasına itiraz dilekçesi oluşturucu.
 *
 * KVKK: girilen ad, T.C. kimlik no, adres ve telefon YALNIZ ziyaretçinin
 * tarayıcısında işlenir — sunucuya gönderilmez, tarayıcı deposuna yazılmaz,
 * analitiğe girmez. Bu bileşene ağ isteği EKLEME.
 *
 * Çıktı: önizleme + yazdır/PDF + Word (.doc) + kopyala. Metin, seçilen
 * gerekçelerin `metin` alanlarından (src/data/itiraz.json) kurulur.
 */

const BOS = {
  ad: '', tc: '', adres: '', telefon: '', il: '', kurum: '',
  plaka: '', seriSira: '', ihlalTarihi: '', tutar: '', olay: '', odendi: false, odemeTarihi: '',
};

const buyuk = (s) => (s || '').toLocaleUpperCase('tr');
const tl = (v) => Number(v || 0).toLocaleString('tr-TR', { maximumFractionDigits: 2 });

function metniKur(f, { ceza, teblig, gerekceler, itirazGun }) {
  const yer = (v, ornek) => (v && String(v).trim()) || `[${ornek}]`;
  const tebligYazi = teblig ? kisaTarih(teblig) : '[tebliğ tarihi]';
  const ihlal = tarihOku(f.ihlalTarihi);
  const ihlalYazi = ihlal ? kisaTarih(ihlal) : '[ihlal tarihi]';
  const cezaAd = ceza ? ceza.aciklama : '[ihlal türü]';
  const madde = ceza && ceza.kanun_maddesi
    ? `2918 sayılı Karayolları Trafik Kanunu ${ceza.kanun_maddesi.replace(/^KTK\s*/i, '')} uyarınca `
    : '';
  const tutar = f.tutar ? `${tl(f.tutar)} TL` : '[tutar] TL';

  const maddeler = [
    `${ihlalYazi} tarihinde ${yer(buyuk(f.plaka), 'plaka')} plakalı aracım hakkında ${madde}"${cezaAd}" gerekçesiyle ${tutar} idari para cezası uygulanmış, ${yer(f.seriSira, 'seri-sıra no')} seri-sıra numaralı karar tutanağı tarafıma ${tebligYazi} tarihinde tebliğ edilmiştir. İtirazım, 5326 sayılı Kabahatler Kanunu'nun 27. maddesinde öngörülen ${itirazGun || 15} günlük süre içindedir.`,
  ];
  if (f.olay.trim()) maddeler.push(f.olay.trim());
  gerekceler.forEach(g => maddeler.push(g.metin));
  if (f.odendi) {
    const od = tarihOku(f.odemeTarihi);
    maddeler.push(`İndirim hakkını kaybetmemek amacıyla ceza ${od ? `${kisaTarih(od)} tarihinde ` : ''}tarafımca ödenmiştir. Kabahatler Kanunu'nun 17/6. maddesi uyarınca peşin ödeme itiraz hakkımı ortadan kaldırmaz. Ceza kaldırıldığında ödediğim tutarın tarafıma iadesini talep ederim.`);
  }
  maddeler.push('Açıklanan nedenlerle verilen idari para cezası hukuka aykırıdır.');

  const deliller = ['Trafik idari para cezası karar tutanağı'];
  gerekceler.forEach(g => g.kanit && deliller.push(g.kanit));
  deliller.push('her türlü yasal delil');

  const ekler = ['Trafik idari para cezası karar tutanağı sureti', 'Kimlik fotokopisi'];
  gerekceler.forEach(g => g.kanit && ekler.push(g.kanit));
  if (f.odendi) ekler.push('Ödeme dekontu');

  const bugun = kisaTarih(new Date());
  const satir = (etiket, deger) => `${etiket}: ${deger}`;

  return [
    `${f.il.trim() ? buyuk(f.il.trim()) + ' ' : '[İL] '}NÖBETÇİ SULH CEZA HÂKİMLİĞİ'NE`,
    '',
    satir('İTİRAZ EDEN', `${yer(f.ad, 'ad soyad')} (T.C. Kimlik No: ${yer(f.tc, 'T.C. kimlik no')})`),
    satir('ADRES', yer(f.adres, 'adres')),
    satir('TELEFON', yer(f.telefon, 'telefon')),
    satir('KARŞI TARAF', yer(f.kurum, 'cezayı yazan birim')),
    satir('KONU', `${ihlalYazi} tarihli, ${yer(f.seriSira, 'seri-sıra no')} seri-sıra numaralı trafik idari para cezası kararına itirazımdır.`),
    satir('TEBLİĞ TARİHİ', tebligYazi),
    '',
    'AÇIKLAMALAR:',
    '',
    ...maddeler.map((m, i) => `${i + 1}. ${m}`).join('\n\n').split('\n'),
    '',
    satir('HUKUKİ NEDENLER', '5326 sayılı Kabahatler Kanunu, 2918 sayılı Karayolları Trafik Kanunu ve ilgili mevzuat.'),
    satir('DELİLLER', deliller.join(', ') + '.'),
    '',
    'SONUÇ VE İSTEM: Yukarıda açıklanan nedenlerle, hakkımda verilen idari para cezası kararının kaldırılmasına karar verilmesini saygıyla arz ve talep ederim.',
    '',
    `${' '.repeat(50)}${bugun}`,
    `${' '.repeat(50)}İtiraz Eden`,
    `${' '.repeat(50)}${f.ad.trim() || '[ad soyad]'}`,
    `${' '.repeat(50)}İmza`,
    '',
    'EKLER:',
    ...[...new Set(ekler)].map((e, i) => `${i + 1}- ${e}`),
  ].join('\n');
}

const htmlKacis = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const sayfaHtml = (metin) => `<!doctype html><html lang="tr"><head><meta charset="utf-8"><title>Trafik cezası itiraz dilekçesi</title>
<style>body{font-family:'Times New Roman',serif;font-size:12pt;line-height:1.55;margin:2.2cm 2cm;color:#000}
pre{white-space:pre-wrap;font-family:inherit;margin:0}@page{size:A4;margin:2cm}</style></head>
<body><pre>${htmlKacis(metin)}</pre></body></html>`;

export default function DilekceOlusturucu({ ceza, teblig, gerekceler = [], itirazGun, odendiVarsayilan = false }) {
  const [f, setF] = useState({ ...BOS, odendi: odendiVarsayilan });
  const [kopya, setKopya] = useState(false);
  const yaz = (k) => (e) => setF(o => ({ ...o, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  // Ceza değişince tutarı ilk ihlal tutarıyla ön doldur (kademeli cezada
  // tutanaktaki tutar farklı olabilir; kullanıcı düzeltir)
  const cezaKod = ceza && ceza.kod;
  const cezaTutar = ceza && ceza.taban_ceza_tl;
  useEffect(() => {
    if (cezaKod) setF(o => ({ ...o, tutar: String(cezaTutar || '') }));
  }, [cezaKod, cezaTutar]);
  // 3. adımdaki "öde + itiraz" seçimi formu sıfırlamadan yansısın
  useEffect(() => { setF(o => ({ ...o, odendi: odendiVarsayilan })); }, [odendiVarsayilan]);

  const metin = useMemo(() => metniKur(f, { ceza, teblig, gerekceler, itirazGun }), [f, ceza, teblig, gerekceler, itirazGun]);
  const eksik = ['ad', 'tc', 'adres', 'il', 'plaka', 'seriSira', 'ihlalTarihi'].filter(k => !String(f[k]).trim());
  const tcHatali = f.tc && !/^\d{11}$/.test(f.tc.trim());

  const yazdir = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(sayfaHtml(metin) + '<script>window.onload=function(){setTimeout(function(){window.print()},300)}<\/script>');
    w.document.close();
  };
  const word = () => {
    const blob = new Blob(['﻿' + sayfaHtml(metin)], { type: 'application/msword' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'trafik-cezasi-itiraz-dilekcesi.doc';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };
  const kopyala = async () => {
    try { await navigator.clipboard.writeText(metin); setKopya(true); setTimeout(() => setKopya(false), 2000); } catch { /* izin yok */ }
  };

  const alan = (k, etiket, props = {}) => (
    <label className="do-alan">
      <span>{etiket}</span>
      <input value={f[k]} onChange={yaz(k)} {...props} />
    </label>
  );

  return (
    <div className="do">
      <div className="do-form">
        <p className="do-kvkk">🔒 Bilgileriniz yalnız bu cihazda işlenir; sunucumuza gönderilmez ve kaydedilmez.</p>
        <div className="do-grid">
          {alan('ad', 'Ad Soyad *', { autoComplete: 'name' })}
          {alan('tc', 'T.C. Kimlik No *', { inputMode: 'numeric', maxLength: 11 })}
          {alan('telefon', 'Telefon', { inputMode: 'tel', autoComplete: 'tel' })}
          {alan('il', 'Cezanın yazıldığı il *', { placeholder: 'ör. Antalya' })}
        </div>
        {tcHatali && <p className="do-uyari">T.C. kimlik numarası 11 haneli olmalıdır.</p>}
        {alan('adres', 'Adres *', { autoComplete: 'street-address' })}
        <div className="do-grid">
          {alan('plaka', 'Araç plakası *', { placeholder: '07 ABC 123' })}
          {alan('seriSira', 'Tutanak seri-sıra no *', { placeholder: 'Tutanağın üstünde yazar' })}
          {alan('ihlalTarihi', 'İhlal tarihi *', { type: 'date' })}
          {alan('tutar', 'Ceza tutarı (TL)', { inputMode: 'decimal' })}
        </div>
        {alan('kurum', 'Cezayı yazan birim', { placeholder: 'ör. İl Emniyet Müdürlüğü Trafik Denetleme Şube Müdürlüğü' })}
        <label className="do-alan">
          <span>Olayı kendi cümlelerinizle anlatın</span>
          <textarea rows={4} value={f.olay} onChange={yaz('olay')}
            placeholder="Ne oldu, nerede, hangi saatte? Kısa ve somut yazın. Ör. 'Belirtilen saatte aracım iş yerimin otoparkındaydı; otopark fişi ektedir.'" />
        </label>
        <label className="do-cb">
          <input type="checkbox" checked={f.odendi} onChange={yaz('odendi')} />
          <span>Cezayı ödedim / ödeyeceğim (dilekçeye iade talebi eklenir)</span>
        </label>
        {f.odendi && alan('odemeTarihi', 'Ödeme tarihi', { type: 'date' })}
        {gerekceler.length === 0 && <p className="do-uyari">Yukarıdan en az bir itiraz gerekçesi seçmeniz dilekçenizi güçlendirir.</p>}
      </div>

      <div className="do-onizleme">
        <div className="do-onizleme-bas">
          <strong>Dilekçe önizlemesi</strong>
          {eksik.length > 0 && <span className="do-eksik">{eksik.length} zorunlu alan eksik</span>}
        </div>
        <pre className="do-kagit">{metin}</pre>
        <div className="do-btnlar">
          <button type="button" className="hm-btn hm-btn-tur" onClick={yazdir}>🖨️ Yazdır / PDF</button>
          <button type="button" className="hm-btn hm-btn-lac" onClick={word}>📄 Word indir</button>
          <button type="button" className="hm-btn hm-btn-acik" onClick={kopyala}>{kopya ? '✓ Kopyalandı' : '📋 Kopyala'}</button>
        </div>
        <p className="do-not">Köşeli parantezli [alanlar] doldurulmadıysa çıktıda öyle görünür. Dilekçeyi imzalayıp eklerle birlikte verin.</p>
      </div>
    </div>
  );
}
