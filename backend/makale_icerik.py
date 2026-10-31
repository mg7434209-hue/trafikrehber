"""
Rehber yazılarının KAYNAK METNİ — açılışta veritabanına eşitlenir.

NEDEN: canlıdaki rehberlerin çoğu bir-iki cümlelik tohum metinleriydi, başlıkta
"2025" yazıyordu ve muayene yazısı eski tutarı (1.318 TL) gösteriyordu. İnce
içerik hem aramada sıralanmaz hem AdSense onayını zorlaştırır.

KURALLAR
- Metne TUTAR ve YIL YAZILMAZ: `{{ceza:H10}}`, `{{indirimli:H1}}`, `{{yil}}`,
  `{{tablo}}` … yer tutucuları kullanılır (liste: utils/icerik.py). Ceza listesi
  güncellenince yazılar kendiliğinden güncellenir.
- Yasal tarih ve sabit olgular ("27.02.2026 tarihli 7574 sayılı Kanun") yer
  tutucu DEĞİLDİR, olduğu gibi yazılır.
- Doğrulanamayan rakam (harç, poliçe limiti, telefon numarası) yazılmaz;
  okur resmî kaynağa yönlendirilir. Her yazı "⚖️ genel bilgilendirme" ile biter.

EŞİTLEME (`esitle()`, main.py açılışta çağırır)
- Yazı yoksa eklenir. Varsa ve `icerik_surumu` buradaki `SURUM`'dan farklıysa
  başlık/açıklama/metin buradan yazılır ve `updated_at` ilerler (sitemap
  lastmod + IndexNow bildirimi).
- Sürüm aynıysa DOKUNULMAZ: admin panelinden yapılan düzeltmeler korunur.
  Metni değiştirdiğinde `SURUM`'u ilerlet; o zaman burası esas alınır.
- `ESKI` eşlemesi: eski slug'lı kayıt yayından kaldırılır, adres yenisine
  301 ile gider (articles.ESKI_SLUG + frontend server.js).
"""

SURUM = "2026-10-30"

_UYARI = ('<p><em>⚖️ Bu yazı genel bilgilendirme amaçlıdır, hukuki danışmanlık '
          'yerine geçmez. İşlem yapmadan önce güncel bilgiyi resmî kaynaktan '
          'doğrulayın.</em></p>')

MAKALELER = [
    # ─────────────────────────────────────────────────────────── İTİRAZ
    {
        "slug": "trafik-cezasi-itiraz-nasil-yapilir",
        "title": "Trafik Cezasına İtiraz Nasıl Yapılır? ({{yil}} Rehberi)",
        "meta_description": "Trafik cezasına itiraz süresi {{itiraz_gun}} gündür. Sulh Ceza Hâkimliği başvurusu, dilekçede yazılacaklar, kanıtlar ve ödeme indirimini kaçırmama rehberi.",
        "category": "ceza", "tags": ["itiraz", "trafik cezası", "sulh ceza"],
        "reading_time_min": 7, "is_featured": True,
        "content": """
<p>Trafik idari para cezası haksız ya da hatalı yazıldığını düşünüyorsanız Sulh Ceza Hâkimliği'ne itiraz edebilirsiniz. Bu rehber süreyi, başvuru yerini, dilekçenin içeriğini ve en sık yapılan hataları anlatır.</p>

<h2>İtiraz süresi: {{itiraz_gun}} gün</h2>
<p>İtiraz, cezanın <strong>tebliğ tarihinden</strong> (yüze karşı yazıldıysa tutanağın size verildiği günden) itibaren <strong>{{itiraz_gun}} gün</strong> içinde yapılır (Kabahatler Kanunu m.27). Süre kaçırılırsa ceza kesinleşir ve artık itiraz edilemez.</p>
<p><strong>Karıştırılan iki süre:</strong> cezayı {{indirim}} indirimli ödemek için süreniz <strong>1 ay ({{odeme_gun}} gün)</strong>, itiraz süreniz ise <strong>{{itiraz_gun}} gün</strong>dür. İtiraz ederken ödeme süresini de takip edin.</p>

<h2>Ödersem itiraz hakkım düşer mi?</h2>
<p>Hayır. Kabahatler Kanunu m.17/6'ya göre peşin ödeme, karara karşı kanun yoluna başvurma hakkını etkilemez. Pek çok sürücü indirimi kaçırmamak için cezayı süresinde öder ve itirazını ayrıca yapar. İtiraz kabul edilip ceza kaldırılırsa ödediğiniz tutarın iadesi için tahsil eden daireye başvurulur.</p>

<h2>Adım adım itiraz</h2>
<ol>
<li><strong>Tutanağı inceleyin.</strong> Plaka, tarih, saat, yer, ihlal maddesi ve tutanağı düzenleyenin bilgileri doğru mu? Maddi hata en güçlü itiraz gerekçelerindendir.</li>
<li><strong>Tebliğ tarihini not edin.</strong> Süre bu tarihten başlar; tebligat zarfını ya da e-Devlet'teki tebliğ kaydını saklayın.</li>
<li><strong>Kanıt toplayın.</strong> Fotoğraf, araç içi kamera kaydı, tanık bilgileri, otopark fişi, aracın o saatte başka yerde olduğunu gösteren belge.</li>
<li><strong>Dilekçeyi yazın.</strong> <a href="/itiraz">Adım adım itiraz oluşturucumuzda</a> gerekçenizi seçip dilekçenizi hazır alabilir ya da <a href="/dilekce-ornekleri/trafik-cezasi-itiraz-dilekce-ornegi">dilekçe örneğini</a> kendi olayınıza göre düzenleyebilirsiniz.</li>
<li><strong>Sulh Ceza Hâkimliği'ne verin.</strong> Dilekçe, cezanın yazıldığı yerdeki Sulh Ceza Hâkimliği'ne hitaben yazılır; adliyelerin ön bürosuna verilebilir. Başka şehirdeyseniz bulunduğunuz yer adliyesi aracılığıyla göndermenin mümkün olup olmadığını ön bürodan sorun.</li>
<li><strong>Kararı bekleyin.</strong> Hâkimlik genellikle dosya üzerinden karar verir. Karar size tebliğ edilir.</li>
</ol>

<h2>Dilekçede neler olmalı?</h2>
<ul>
<li>Hitap: "… Sulh Ceza Hâkimliği'ne"</li>
<li>Ad, soyad, T.C. kimlik no, adres, telefon</li>
<li>Tutanağın tarihi ve seri/sıra numarası, araç plakası</li>
<li>Tebliğ tarihi (sürede olduğunuzu gösterir)</li>
<li>Olayın kısa anlatımı ve itiraz gerekçeleri</li>
<li>Ekler listesi (tutanak örneği, fotoğraflar, belgeler)</li>
<li>Talep: "idari para cezasının kaldırılmasına karar verilmesi"</li>
<li>Tarih ve imza</li>
</ul>

<h2>Sık görülen itiraz gerekçeleri</h2>
<ul>
<li>Tutanakta plaka, yer ya da saat hatası</li>
<li>Trafik işaretinin bulunmaması veya görünmez durumda olması</li>
<li>Zorunluluk hâli (ör. ambulansa yol vermek, acil sağlık durumu)</li>
<li>Elektronik tespitte aracın siz olmadığınızı ya da başkasının kullandığını gösteren kanıt</li>
<li>Tebligatın usule aykırı yapılması</li>
</ul>

<h2>Sık yapılan hatalar</h2>
<ul>
<li>{{itiraz_gun}} günlük süreyi, 1 aylık ödeme süresiyle karıştırmak</li>
<li>Gerekçesiz, yalnız "haksızdır" diyen dilekçe vermek</li>
<li>Kanıtı dilekçeye eklememek</li>
<li>Yanlış mercie (ör. valiliğe) başvurmak</li>
</ul>
<p>Cezanın güncel tutarını görmek için <a href="/trafik-cezalari-2026">{{yil}} trafik cezaları listesine</a>, indirimli tutarı hesaplamak için <a href="/araclar/ceza-hesapla">ceza hesaplama aracına</a> bakabilirsiniz.</p>
""" + _UYARI,
    },
    # ─────────────────────────────────────────────────────────── TUTARLAR
    {
        "slug": "trafik-cezasi-tutarlari",
        "eski": ["trafik-cezasi-tutarlari-2025"],
        "title": "{{yil}} Trafik Cezası Tutarları — Güncel Tam Liste",
        "meta_description": "{{yil}} trafik cezası tutarları: kırmızı ışık {{ceza:H1}}, telefon {{ceza:H5}}, alkol {{ceza:H7}}. Kademeli cezalar ve 1 ayda {{indirim}} indirimli tutarlar.",
        "category": "ceza", "tags": ["ceza tutarları", "trafik cezası", "7574 sayılı kanun"],
        "reading_time_min": 6, "is_featured": True,
        "content": """
<p>27 Şubat 2026 tarihli <strong>7574 sayılı Kanun</strong> ile kırmızı ışık, seyir hâlinde telefon kullanma, alkollü araç kullanma ve hız cezaları <strong>kademeli</strong> hâle geldi: aynı ihlali tekrarlayan sürücünün cezası katlanıyor, belirli tekrarlardan sonra sürücü belgesi geri alınıyor. Diğer ihlallerin tutarları her yıl yeniden değerleme oranıyla güncellenir.</p>

<h2>Güncel ceza tablosu</h2>
<p>Aşağıdaki tablo veritabanımızdaki güncel listeden otomatik oluşturulur (son doğrulama: {{son_dogrulama}}). Kademeli cezalarda gösterilen tutar <strong>ilk ihlal</strong> tutarıdır.</p>
{{tablo}}

<h2>Kademeli cezalar nasıl işler?</h2>
<ul>
<li><strong>Kırmızı ışık:</strong> {{not:H1}}</li>
<li><strong>Seyir hâlinde telefon:</strong> {{not:H5}}</li>
<li><strong>Alkollü araç kullanma:</strong> {{not:H7}}</li>
<li><strong>Hız (şehir içi):</strong> {{not:H2}}</li>
<li><strong>Hız (şehirlerarası/otoyol):</strong> {{not:H3}}</li>
</ul>
<p>Kendi hızınızla hesaplamak için: <a href="/araclar/hiz-cezasi-hesapla">hız cezası hesaplama aracı</a>. Cezanın haksız olduğunu düşünüyorsanız: <a href="/itiraz">adım adım itiraz yol haritası</a>.</p>

<h2>Erken ödeme indirimi</h2>
<p>Ceza, tebliğden itibaren <strong>1 ay ({{odeme_gun}} gün)</strong> içinde ödenirse <strong>{{indirim}}</strong> indirim uygulanır. Örneğin {{ceza:H1}} tutarındaki kırmızı ışık cezası süresinde ödenirse {{indirimli:H1}} olur. Kendi cezanızı <a href="/araclar/ceza-hesapla">ceza hesaplama aracıyla</a> hesaplayabilirsiniz.</p>

<h2>Taksitle ödeme</h2>
<p>Kabahatler Kanunu m.17/3'e göre ceza, ilk taksit ödeme süresi içinde olmak üzere toplam {{taksit}} eşit taksitte, kalan taksitler bir yıl içinde ödenebilir. Taksitli ödemede peşin ödeme indirimi uygulanmaz.</p>

<h2>İtiraz süresi ayrıdır</h2>
<p>Cezaya itiraz süresi tebliğden itibaren <strong>{{itiraz_gun}} gün</strong>dür. Ayrıntı için <a href="/blog/trafik-cezasi-itiraz-nasil-yapilir">itiraz rehberimize</a> bakın. Her cezanın ayrıntılı sayfası için <a href="/trafik-cezalari-2026">{{yil}} ceza listesi</a> sayfasını kullanabilirsiniz.</p>
<p><em>Kesin tutar için e-Devlet'teki ceza kaydınızı ve tutanağı esas alın.</em></p>
""" + _UYARI,
    },
    # ─────────────────────────────────────────────────────────── E-DEVLET
    {
        "slug": "trafik-cezasi-e-devlet-sorgulama",
        "eski": ["trafik-cezasi-sorgulama-e-devlet"],
        "title": "Trafik Cezası Sorgulama ve Ödeme: e-Devlet ({{yil}})",
        "meta_description": "Trafik cezası e-Devlet'ten kimlik no ya da plakayla nasıl sorgulanır, nereden ödenir? 1 ayda {{indirim}} indirim, taksit ve ödenmeyen cezada ne olur?",
        "category": "ceza", "tags": ["sorgulama", "e-devlet", "ödeme"],
        "reading_time_min": 5, "is_featured": True,
        "content": """
<p>Adınıza ya da aracınıza yazılmış trafik cezalarını e-Devlet Kapısı üzerinden birkaç dakikada görebilir, aynı gün ödeyebilirsiniz. Elektronik denetleme sistemleriyle (EDS) tespit edilen cezalar da burada listelenir.</p>

<h2>e-Devlet ile sorgulama</h2>
<ol>
<li><strong>turkiye.gov.tr</strong> adresine gidin ve e-Devlet şifreniz, e-imza ya da internet bankacılığıyla giriş yapın.</li>
<li>Arama kutusuna <strong>"trafik cezası sorgulama"</strong> yazın ve Emniyet Genel Müdürlüğü'nün hizmetini açın.</li>
<li>Kişi adına yazılan cezaları ya da araç plakasına göre cezaları listeleyin.</li>
<li>Her cezanın tarihini, tutarını, tebliğ durumunu ve ödenip ödenmediğini kontrol edin.</li>
</ol>

<h2>Nereden ödenir?</h2>
<ul>
<li>Gelir İdaresi Başkanlığı'nın dijital vergi dairesi (gib.gov.tr üzerinden)</li>
<li>İnternet ve mobil bankacılık ("vergi/trafik cezası ödeme" menüleri)</li>
<li>Anlaşmalı banka şubeleri ve vergi daireleri</li>
</ul>
<p>Ödeme ekranında ceza tutanağının seri/sıra numarası ya da T.C. kimlik numaranız istenir.</p>

<h2>{{indirim}} indirim için süre: 1 ay</h2>
<p>Ceza, tebliğden itibaren <strong>1 ay ({{odeme_gun}} gün)</strong> içinde ödenirse {{indirim}} indirimli ödenir. Örnek: {{ceza:H1}} kırmızı ışık cezası süresinde {{indirimli:H1}} olur. Ödeme ekranındaki tutarın indirimi zaten içerip içermediğini kontrol edin.</p>

<h2>Ödemezsem ne olur?</h2>
<p>Süresinde ödenmeyen idari para cezası, 6183 sayılı Kanun hükümlerine göre gecikme zammıyla birlikte takip edilir; vergi dairesi tahsil işlemi başlatabilir. Cezaya itiraz etmek istiyorsanız süre tebliğden itibaren <strong>{{itiraz_gun}} gün</strong>dür ve ödeme yapmanız itiraz hakkınızı düşürmez.</p>

<h2>Tebliğ edilmemiş ceza görünüyor</h2>
<p>EDS cezaları adrese tebliğ edilir. Listede görünen ama size henüz ulaşmamış bir ceza için süreler tebliğ tarihinden başlar. Adresinizin MERNİS'te güncel olduğundan emin olun; adres eskiyse tebligat sizden habersiz yapılmış sayılabilir.</p>
<p>İlgili: <a href="/blog/trafik-cezasi-itiraz-nasil-yapilir">trafik cezasına itiraz</a> · <a href="/araclar/ceza-hesapla">ceza hesaplama</a> · <a href="/trafik-cezalari-2026">{{yil}} ceza tutarları</a></p>
""" + _UYARI,
    },
    # ─────────────────────────────────────────────────────────── EHLİYET PUAN
    {
        "slug": "ehliyet-puan-sistemi-sorgulama",
        "title": "Ehliyet Ceza Puanı {{yil}}: Sorgulama, 100 Puan ve El Koyma",
        "meta_description": "Ehliyet ceza puanı nasıl sorgulanır, 100 puan dolunca ne olur, el konulan sürücü belgesi nasıl geri alınır? Puan sistemi adım adım.",
        "category": "ehliyet", "tags": ["ehliyet puan", "sorgulama", "ceza puanı"],
        "reading_time_min": 6, "is_featured": True,
        "content": """
<p>Türkiye'de sürücülerin trafik kurallarına uyumu <strong>ceza puanı</strong> sistemiyle izlenir. Bazı ihlallerde para cezasına ek olarak sürücünün siciline puan işlenir; puanlar belirli bir sınırı aşınca sürücü belgesi geri alınır.</p>

<h2>Sistem nasıl işler?</h2>
<p>Puan, ihlal başına sürücüye yazılır ve bir yıllık dönem içinde toplanır. Bir yıl içinde <strong>100 ceza puanı</strong>na ulaşan sürücünün belgesi geçici olarak geri alınır. Bu sınır sürücü belgesi "sıfırlanır" anlamına gelmez; sicildeki kayıtlar yaptırımın kaçıncı kez uygulandığını belirler.</p>
<p>Örnek puanlar: kırmızı ışık ihlali {{puan:H1}} puan, emniyet kemeri takmamak {{puan:H4}} puandır.</p>

<h2>100 puan dolunca ne olur?</h2>
<ul>
<li><strong>İlk kez:</strong> sürücü belgesi süreli olarak geri alınır ve sürücü eğitime tabi tutulur.</li>
<li><strong>Tekrarında:</strong> geri alma süresi uzar; belge, psikoteknik değerlendirme ve psikiyatri muayenesi sonucuna göre iade edilir.</li>
<li><strong>Tekrarlayan ihlallerde:</strong> sürücü belgesi iptal edilebilir.</li>
</ul>
<p>Süreler ve şartlar Karayolları Trafik Kanunu m.118 ve ilgili yönetmelikte düzenlenir; işlem yapmadan önce güncel metni kontrol edin.</p>
<p>Puandan bağımsız olarak bazı ihlaller doğrudan belge geri alma sonucu doğurur: alkollü araç kullanma ({{not:H7}}) ve kademeli kırmızı ışık cezasının ileri tekrarları bunlara örnektir.</p>

<h2>Ceza puanı nasıl sorgulanır?</h2>
<ol>
<li>turkiye.gov.tr'ye giriş yapın.</li>
<li>Arama kutusuna <strong>"sürücü belgesi ceza puanı"</strong> yazın ve Emniyet Genel Müdürlüğü hizmetini açın.</li>
<li>Puan geçmişinizi, ihlal tarihlerini ve toplam puanınızı görüntüleyin.</li>
</ol>

<h2>El konulan belge nasıl geri alınır?</h2>
<ol>
<li>Geri alma süresinin dolmasını bekleyin.</li>
<li>İstenen eğitimi tamamlayın; gerekiyorsa psikoteknik değerlendirme ve sağlık raporu alın.</li>
<li>Belgeleri belgenin teslim edildiği birime (trafik tescil/denetleme şube) sunun.</li>
</ol>
<p>Puan işlenen cezaya itiraz ederseniz ve ceza kaldırılırsa puan da silinir. İtiraz süresi tebliğden itibaren {{itiraz_gun}} gündür: <a href="/blog/trafik-cezasi-itiraz-nasil-yapilir">itiraz rehberi</a>.</p>
""" + _UYARI,
    },
    # ─────────────────────────────────────────────────────────── ZMSS
    {
        "slug": "zorunlu-trafik-sigortasi-rehberi",
        "title": "Zorunlu Trafik Sigortası (ZMSS) {{yil}}: Neyi Karşılar?",
        "meta_description": "Trafik sigortası neyi karşılar, kendi aracınızın hasarını öder mi? Sigortasız araç cezası {{ceza:H9}}, hasar başvurusu ve kaskodan farkı.",
        "category": "sigorta", "tags": ["trafik sigortası", "ZMSS", "sigortasız araç"],
        "reading_time_min": 7, "is_featured": True,
        "content": """
<p>Karayolları Motorlu Araçlar Zorunlu Mali Sorumluluk Sigortası (ZMSS), halk arasında <strong>trafik sigortası</strong>, trafiğe çıkan her motorlu araç için yasal zorunluluktur (KTK m.91). Amacı, kazada <strong>karşı tarafa</strong> verdiğiniz zararı güvence altına almaktır.</p>

<h2>Neyi karşılar?</h2>
<ul>
<li>Karşı tarafın aracında ve eşyasında oluşan maddi hasar</li>
<li>Kazada yaralanan ya da hayatını kaybeden üçüncü kişilere ilişkin tazminatlar (sakatlık, destekten yoksun kalma)</li>
<li>Karşı tarafın aracındaki değer kaybı talepleri</li>
</ul>
<p>Teminat limitleri her yıl yeniden belirlenir; poliçenizdeki limitleri kontrol edin.</p>

<h2>Neyi karşılamaz?</h2>
<ul>
<li><strong>Kendi aracınızın hasarını</strong> — bunun için kasko gerekir.</li>
<li>Limitleri aşan zararlar (bunun için İhtiyari Mali Mesuliyet / İMM teminatı alınabilir).</li>
<li>Kasıtlı olarak verilen zararlar ve poliçede sayılan diğer istisnalar.</li>
</ul>

<h2>Sigortasız araç cezası</h2>
<p>Zorunlu trafik sigortası olmayan araçla trafiğe çıkmanın cezası <strong>{{ceza:H9}}</strong>dir. {{not:H9}} Ayrıntı: <a href="/ceza/zorunlu-trafik-sigortasi-cezasi">sigortasız araç cezası</a>.</p>

<h2>Kazadan sonra hasar başvurusu</h2>
<ol>
<li>Kaza tespit tutanağını doldurun ya da polis/jandarma tutanağı alın (<a href="/blog/trafik-kazasi-sonrasi-ne-yapilir">kaza sonrası rehberi</a>).</li>
<li>Kusurlu tarafın trafik sigortası şirketine hasar dosyası açtırın.</li>
<li>Eksper incelemesinden sonra ödeme teklifini değerlendirin.</li>
<li>Uyuşmazlıkta Sigorta Tahkim Komisyonu'na ya da mahkemeye başvurabilirsiniz. Hazır dilekçe: <a href="/dilekce-ornekleri/trafik-sigortasi-hasar-ihbar-dilekce">hasar bildirim dilekçesi</a>.</li>
</ol>

<h2>Karşı taraf sigortasızsa ya da kaçtıysa</h2>
<p>Sigortasız ya da kimliği belirlenemeyen araçların neden olduğu bedensel zararlar için <strong>Güvence Hesabı</strong>'na başvurulabilir. Maddi hasarlar için kapsam sınırlıdır; güncel şartları Güvence Hesabı'nın resmî sitesinden kontrol edin.</p>

<h2>Hasarsızlık indirimi</h2>
<p>Trafik sigortası primi basamak sistemine göre belirlenir: hasarsız geçen yıllar basamağı yükseltip primi düşürür, kusurlu kazada ödeme yapılırsa basamak düşer. Küçük hasarları kendiniz ödemek bazen basamağınızı korumak için daha ekonomik olabilir.</p>

<h2>Araç satılınca poliçe ne olur?</h2>
<p>Araç devredildiğinde yeni sahibin kendi adına trafik sigortası yaptırması gerekir. Ayrıntı: <a href="/blog/arac-plaka-tescil-islemleri">araç devir ve tescil rehberi</a>. Kasko ile farkı için <a href="/blog/kasko-sigortasi-nedir-kapsamlari">kasko rehberine</a> bakın.</p>
""" + _UYARI,
    },
    # ─────────────────────────────────────────────────────────── KAZA
    {
        "slug": "trafik-kazasi-sonrasi-ne-yapilir",
        "title": "Trafik Kazası Sonrası Ne Yapılır? Tutanak ve Sigorta",
        "meta_description": "Kazadan sonra ilk dakikalarda yapılacaklar, polis ne zaman çağrılır, kaza tespit tutanağı nasıl doldurulur, sigortaya başvuru ve değer kaybı.",
        "category": "ceza", "tags": ["trafik kazası", "kaza tutanağı", "hasar"],
        "reading_time_min": 7, "is_featured": True,
        "content": """
<p>Kaza anında yapılan küçük hatalar sonradan sigorta ödemesini uzatabilir ya da kusur oranını aleyhinize çevirebilir. Aşağıdaki sırayı izleyin.</p>

<h2>İlk dakikalar</h2>
<ol>
<li><strong>Güvenliği sağlayın:</strong> dörtlü flaşörü yakın, reflektörlü yelek giyin, yeterli mesafeye reflektör (üçgen) koyun.</li>
<li><strong>Yaralı varsa 112'yi arayın.</strong> Yaralıyı, hayati tehlike yoksa yerinden oynatmayın.</li>
<li><strong>Kaza yerini fotoğraflayın:</strong> araçların konumu, plakalar, hasarlar, yol çizgileri, işaretler, fren izleri. Araçları çekmeden önce birkaç geniş açı çekin.</li>
<li><strong>Bilgileri alın:</strong> karşı sürücünün adı, telefonu, ehliyet ve ruhsat bilgileri, sigorta şirketi ve poliçe numarası; varsa tanıkların iletişim bilgileri.</li>
</ol>

<h2>Polis ne zaman çağrılır?</h2>
<p>Ölümlü ya da yaralanmalı kazalarda, kamu malına zarar verildiğinde, taraflardan birinin alkollü, ehliyetsiz ya da sigortasız olduğundan şüphelenildiğinde ve taraflar tutanakta anlaşamadığında polis veya jandarma çağrılır (112). Yalnız maddi hasarlı ve tarafların anlaştığı kazalarda tarafların kendi düzenlediği tutanak yeterlidir.</p>

<h2>Anlaşmalı kaza tespit tutanağı</h2>
<ul>
<li>Kâğıt tutanak (sigorta şirketlerinden ya da araç içi belgelerden) veya Türkiye Sigorta Birliği'nin mobil kaza tutanağı uygulaması kullanılabilir.</li>
<li>Kroki dikkatle çizilmeli, işaretlenen kutucuklar iki tarafça kontrol edilmelidir.</li>
<li>Tutanak iki tarafça imzalanır; her taraf bir nüsha alır.</li>
<li>Kabul etmediğiniz bir ifadeyi imzalamayın; anlaşamıyorsanız polis çağırın.</li>
</ul>

<h2>Sigortaya başvuru</h2>
<ul>
<li><strong>Kusurlu karşı tarafsa:</strong> onun trafik sigortasına hasar dosyası açılır (<a href="/blog/zorunlu-trafik-sigortasi-rehberi">trafik sigortası rehberi</a>).</li>
<li><strong>Kaskonuz varsa:</strong> kendi kasko şirketinize de bildirin; kusur durumuna göre kasko ödeyip karşı taraftan rücu edebilir (<a href="/blog/kasko-sigortasi-nedir-kapsamlari">kasko rehberi</a>).</li>
<li><strong>Değer kaybı:</strong> aracınız onarılsa bile piyasa değerindeki düşüş için karşı tarafın sigortasından değer kaybı talep edilebilir.</li>
</ul>
<p>Hazır dilekçeler: <a href="/dilekce-ornekleri/trafik-sigortasi-hasar-ihbar-dilekce">hasar bildirim dilekçesi</a> · <a href="/dilekce-ornekleri/kaza-tazminat-talep-dilekce">tazminat talep dilekçesi</a>.</p>

<h2>Yapılmaması gerekenler</h2>
<ul>
<li>Yaralanmalı kazada olay yerinden ayrılmak</li>
<li>Fotoğraf çekmeden araçları yoldan çekmek (trafik güvenliği gerektirmedikçe)</li>
<li>Kusuru sözlü olarak kabul edip tutanağa farklı yazmak</li>
<li>Sigorta işlemini aylarca bekletmek</li>
</ul>
<p>Ağır yaralanmalı ve ölümlü kazalarda ceza yargılaması da söz konusu olabileceğinden bir avukattan destek almanız önerilir.</p>
""" + _UYARI,
    },
    # ─────────────────────────────────────────────────────────── MUAYENE
    {
        "slug": "arac-muayene-randevu-nasil-alinir",
        "title": "Araç Muayenesi {{yil}}: TÜVTÜRK Randevu ve Ceza",
        "meta_description": "TÜVTÜRK muayene randevusu nasıl alınır, otomobil kaç yılda bir muayene olur, muayene günü ne gerekir? Muayenesiz araç cezası {{ceza:H10}}.",
        "category": "arac-islemleri", "tags": ["araç muayene", "TÜVTÜRK", "muayenesiz araç"],
        "reading_time_min": 6, "is_featured": True,
        "content": """
<p>Trafikteki araçların teknik açıdan güvenli olup olmadığı periyodik muayeneyle kontrol edilir. Muayeneler TÜVTÜRK istasyonlarında yapılır ve randevuyla gidilir.</p>

<h2>Ne zaman muayene olmalı?</h2>
<ul>
<li><strong>Hususi otomobiller:</strong> ilk tescilden itibaren 3 yıl muayeneden muaftır, sonrasında <strong>2 yılda bir</strong> muayene olur.</li>
<li><strong>Ticari araçlar</strong> (taksi, minibüs, kamyonet vb.): genellikle <strong>her yıl</strong>.</li>
</ul>
<p>Bir sonraki muayene tarihi ruhsatta (tescil belgesi) ve e-Devlet'teki araç bilgilerinde yazar. Kendi aracınızın periyodunu TÜVTÜRK'ün sitesinden doğrulayın.</p>

<h2>Randevu nasıl alınır?</h2>
<ol>
<li>TÜVTÜRK'ün resmî internet sitesine (tuvturk.com.tr) ya da mobil uygulamasına girin.</li>
<li>Plaka ve ruhsat seri numarasıyla istasyon, gün ve saat seçin.</li>
<li>Muayene ücretini randevu sırasında ya da istasyonda ödeyin.</li>
</ol>

<h2>Muayene günü yanınızda olsun</h2>
<ul>
<li>Araç tescil belgesi (ruhsat)</li>
<li>Geçerli zorunlu trafik sigortası poliçesi</li>
<li>Sürücünün kimliği</li>
<li>Reflektör, ilk yardım çantası, yangın söndürücü (araç tipine göre)</li>
</ul>
<p>Muayeneden önce farları, sinyalleri, lastik diş derinliğini, silecekleri ve fren lambalarını kendiniz kontrol etmek "kusurlu" sonucunu önlemenin en kolay yoludur.</p>

<h2>Muayeneden kalırsa</h2>
<p>Kusurlar giderildikten sonra araç yeniden muayeneye getirilir. Ağır kusurlu bulunan aracın trafiğe çıkması güvenlik açısından risklidir ve denetimde men edilebilir.</p>

<h2>Muayenesiz araç cezası</h2>
<p>Muayenesi geçmiş araçla trafiğe çıkmanın cezası <strong>{{ceza:H10}}</strong>dir; 1 ay içinde ödenirse {{indirimli:H10}} olur. {{not:H10}} Ayrıntı: <a href="/ceza/muayenesiz-arac-cezasi">muayenesiz araç cezası</a>.</p>
<p>Muayeneye geç kalan araçlar için ayrıca istasyonda <strong>gecikme ücreti</strong> alınır; gecikilen süre uzadıkça artar. Tarihi kaçırmamak için randevuyu süre dolmadan alın.</p>
""" + _UYARI,
    },
    # ─────────────────────────────────────────────────────────── KASKO
    {
        "slug": "kasko-sigortasi-nedir-kapsamlari",
        "title": "Kasko Nedir, Neleri Karşılar? Trafik Sigortasından Farkı",
        "meta_description": "Kasko neleri karşılar, trafik sigortasından farkı nedir? Teminatlar, muafiyet, hasarsızlık indirimi, kasko değer listesi ve poliçe seçimi.",
        "category": "sigorta", "tags": ["kasko", "tam kasko", "araç sigortası"],
        "reading_time_min": 6, "is_featured": False,
        "content": """
<p><strong>Kasko</strong>, kendi aracınızın uğradığı zararları güvence altına alan <strong>isteğe bağlı</strong> bir sigortadır. Zorunlu trafik sigortası yalnız karşı tarafa verdiğiniz zararı öder; kendi aracınızın hasarı için kasko gerekir.</p>

<h2>Trafik sigortası ile farkı</h2>
<table>
<thead><tr><th></th><th>Trafik sigortası (ZMSS)</th><th>Kasko</th></tr></thead>
<tbody>
<tr><td>Zorunlu mu?</td><td>Evet</td><td>Hayır, isteğe bağlı</td></tr>
<tr><td>Kimin zararını öder?</td><td>Karşı tarafın</td><td>Kendi aracınızın</td></tr>
<tr><td>Kusurlu olduğunuz kazada kendi aracınız</td><td>Karşılamaz</td><td>Kapsama göre karşılar</td></tr>
<tr><td>Çalınma, yanma, doğal afet</td><td>Karşılamaz</td><td>Kapsama göre karşılar</td></tr>
</tbody>
</table>

<h2>Kaskonun yaygın teminatları</h2>
<ul>
<li>Çarpma, çarpışma ve devrilme</li>
<li>Aracın ya da parçalarının çalınması</li>
<li>Yangın, sel, deprem gibi doğal afetler (poliçeye göre)</li>
<li>Cam kırılması, mini onarım</li>
<li>Yol yardımı, çekici, ikame araç</li>
<li>İhtiyari Mali Mesuliyet (İMM): trafik sigortası limitini aşan karşı taraf zararları</li>
</ul>
<p>"Tam kasko" ve "dar kasko" adları şirketlere göre farklı kapsamları anlatabilir; poliçedeki teminat listesini okuyun.</p>

<h2>Poliçe seçerken dikkat</h2>
<ul>
<li><strong>Muafiyet:</strong> hasarın belli bir kısmını sizin ödemeniz karşılığında prim düşer.</li>
<li><strong>Servis türü:</strong> yetkili servis mi, anlaşmalı servis mi?</li>
<li><strong>Parça:</strong> orijinal mi, eşdeğer mi?</li>
<li><strong>Araç değeri:</strong> tam hasar ve çalınmada ödeme, Türkiye Sigorta Birliği'nin kasko değer listesine ya da piyasa değerine göre yapılır.</li>
<li><strong>Hasarsızlık indirimi:</strong> hasarsız yıllar primi düşürür; küçük hasarları bildirmemek bazen daha ekonomik olabilir.</li>
</ul>

<h2>Kaza olunca</h2>
<p>Kaza tespit tutanağını düzenleyin, sigorta şirketinize bildirin, onarımı şirketin yönlendirdiği servis ve eksper süreciyle yapın. Ayrıntılı adımlar: <a href="/blog/trafik-kazasi-sonrasi-ne-yapilir">kaza sonrası ne yapılır</a>. Zorunlu sigortanın kapsamı için: <a href="/blog/zorunlu-trafik-sigortasi-rehberi">trafik sigortası rehberi</a>.</p>
""" + _UYARI,
    },
    # ─────────────────────────────────────────────────────────── EHLİYET SINAVI
    {
        "slug": "ehliyet-sinavi-nasil-girilir",
        "title": "Ehliyet Nasıl Alınır? Kurs, Sınav ve Başvuru ({{yil}})",
        "meta_description": "B sınıfı ehliyet için yaş şartı, sağlık raporu, sürücü kursuna kayıt, e-sınav (teorik) ve direksiyon sınavı ile sürücü belgesinin teslimi adım adım.",
        "category": "ehliyet", "tags": ["ehliyet sınavı", "sürücü kursu", "e-sınav"],
        "reading_time_min": 6, "is_featured": False,
        "content": """
<p>Sürücü belgesi almak için MEB onaylı bir sürücü kursunda eğitim almak, teorik ve uygulamalı sınavları geçmek gerekir. Aşağıdaki adımlar en yaygın sınıf olan <strong>B sınıfı</strong> (otomobil) içindir.</p>

<h2>Şartlar</h2>
<ul>
<li><strong>Yaş:</strong> B sınıfı için 18. Diğer sınıflarda yaş şartı farklıdır (motosiklet, kamyon, otobüs).</li>
<li><strong>Sağlık raporu:</strong> sürücü olur sağlık raporu (aile hekimliğinden alınabilir).</li>
<li><strong>Öğrenim:</strong> sınıfa göre asgari öğrenim şartı aranabilir; kurs kaydında sorulur.</li>
<li>Adli sicil açısından engel bulunmaması.</li>
</ul>

<h2>Adım adım</h2>
<ol>
<li><strong>Sağlık raporu alın.</strong></li>
<li><strong>Sürücü kursuna kaydolun.</strong> Kurs, MEB sistemine başvurunuzu yapar ve eğitim takvimini verir.</li>
<li><strong>Teorik eğitim:</strong> trafik ve çevre, ilk yardım, motor ve araç tekniği dersleri.</li>
<li><strong>Elektronik sınav (e-sınav):</strong> MEB'in sınav merkezlerinde bilgisayar üzerinden yapılır; sonuç sınavdan hemen sonra öğrenilir.</li>
<li><strong>Direksiyon eğitimi ve sınavı:</strong> e-sınavı geçtikten sonra uygulamalı sınava girilir.</li>
<li><strong>Belge teslimi:</strong> sınavları geçince sürücü belgesi için nüfus müdürlüğünden randevu alınır; harç ve belge bedeli ödenir.</li>
</ol>
<p>Sınav hakları sınırlıdır; hakkını dolduran aday yeniden kursa kaydolmak zorunda kalabilir. Güncel sınav takvimi ve hak sayısı için MEB'in resmî duyurularına bakın.</p>

<h2>Sınava hazırlık ipuçları</h2>
<ul>
<li>Trafik işaretlerini ve ilk yardım konularını ayrı çalışın; soruların önemli bölümü bunlardan gelir.</li>
<li>Çıkmış soru formatındaki deneme sınavlarını süre tutarak çözün.</li>
<li>Direksiyon sınavında ayna-sinyal-kontrol sırasına ve park manevrasına özen gösterin.</li>
</ul>

<h2>Ehliyeti aldıktan sonra</h2>
<p>Yeni sürücüler için de ceza puanı sistemi geçerlidir: <a href="/blog/ehliyet-puan-sistemi-sorgulama">ehliyet ceza puanı rehberi</a>. En sık yazılan cezalar ve güncel tutarları için <a href="/trafik-cezalari-2026">{{yil}} trafik cezaları listesine</a> bakabilirsiniz.</p>
""" + _UYARI,
    },
    # ─────────────────────────────────────────────────────────── TESCİL / DEVİR
    {
        "slug": "arac-plaka-tescil-islemleri",
        "title": "İkinci El Araç Devri ve Tescil: Noterde Satış ({{yil}})",
        "meta_description": "İkinci el araç alım satımı noterde nasıl yapılır, satıştan önce neler kontrol edilir, trafik sigortası ve muayene ne olur? Araç devri ve tescil rehberi.",
        "category": "arac-islemleri", "tags": ["araç tescil", "araç devri", "noter satış"],
        "reading_time_min": 6, "is_featured": False,
        "content": """
<p>İkinci el araçların satışı ve devri <strong>noterde</strong> yapılır. Noter, satış sözleşmesini düzenler ve tescil işlemini de aynı süreçte tamamlar; ayrıca trafik tescil şubesine gitmek çoğu durumda gerekmez.</p>

<h2>Satıştan önce alıcı ne kontrol etmeli?</h2>
<ul>
<li><strong>Borç ve kısıtlamalar:</strong> araç üzerinde haciz, rehin ya da yakalama kaydı var mı? Noter satış öncesinde sistemden sorgular, siz de satıcıdan belge isteyin.</li>
<li><strong>Trafik cezaları ve MTV:</strong> araca bağlı ödenmemiş borçlar devri engelleyebilir ya da pazarlık konusu olur.</li>
<li><strong>Hasar ve kilometre geçmişi:</strong> e-Devlet ve sigorta kayıtlarından hasar geçmişini, ekspertiz raporuyla teknik durumu kontrol edin.</li>
<li><strong>Muayene tarihi:</strong> muayenesi geçmiş araçla trafiğe çıkmak cezalıdır ({{ceza:H10}}); bkz. <a href="/blog/arac-muayene-randevu-nasil-alinir">muayene rehberi</a>.</li>
</ul>

<h2>Noterde satış adımları</h2>
<ol>
<li>Alıcı ve satıcı kimlikleriyle notere gider (vekâletle de yapılabilir).</li>
<li>Noter araç kayıtlarını sorgular ve satış sözleşmesini düzenler.</li>
<li>Noter ücreti ve ilgili harçlar ödenir; tutarlar her yıl güncellenir, noterden öğrenin.</li>
<li>Tescil işlemi tamamlanır ve yeni sahibin adına araç tescil belgesi düzenlenir.</li>
</ol>

<h2>Trafik sigortası ne olur?</h2>
<p>Araç el değiştirdiğinde yeni sahibin <strong>kendi adına zorunlu trafik sigortası</strong> yaptırması gerekir; sigortasız trafiğe çıkmanın cezası {{ceza:H9}}dir. Ayrıntı: <a href="/blog/zorunlu-trafik-sigortasi-rehberi">trafik sigortası rehberi</a>. Kasko poliçesi için sigorta şirketinize başvurun.</p>

<h2>Satıcı için öneriler</h2>
<ul>
<li>Satışı mutlaka noterde tamamlayın; "vekâletle satış" ya da yalnız sözleşmeyle aracı teslim etmek, sonradan yazılan cezaların size gelmesine yol açabilir.</li>
<li>Kendi adınıza olan kasko ve trafik poliçesinin iptali ve prim iadesi için sigorta şirketinize başvurun.</li>
<li>Ruhsatı ve anahtarları teslim ederken tarih ve saati gösteren bir teslim tutanağı imzalatın.</li>
</ul>
""" + _UYARI,
    },
]


def esitle():
    """Açılışta MAKALELER'i veritabanına eşitler (bkz. modül açıklaması)."""
    from database import SessionLocal
    from models import Article
    from sqlalchemy import func

    db = SessionLocal()
    degisen = []
    try:
        for m in MAKALELER:
            if len(m["meta_description"]) > 160:  # kolon String(160)
                print(f"[makale] {m['slug']}: meta_description 160 karakteri aşıyor, atlandı")
                continue
            alanlar = {k: v for k, v in m.items() if k not in ("eski",)}
            alanlar.update(is_published=True, schema_type="Article", icerik_surumu=SURUM)
            a = db.query(Article).filter(Article.slug == m["slug"]).first()

            # Eski slug'lı kayıt: yenisi yoksa adını değiştir (görüntülenme
            # sayısı ve yayın tarihi korunur), varsa yayından kaldır.
            for eski in m.get("eski", []):
                e = db.query(Article).filter(Article.slug == eski).first()
                if not e:
                    continue
                if a is None:
                    e.slug = m["slug"]
                    a = e
                elif e.is_published:
                    e.is_published = False

            if a is None:
                db.add(Article(**alanlar))
                degisen.append(m["slug"])
            elif getattr(a, "icerik_surumu", None) != SURUM:
                for k, v in alanlar.items():
                    setattr(a, k, v)
                a.updated_at = func.now()
                degisen.append(m["slug"])
        db.commit()
    except Exception as e:  # içerik eşitlemesi API'nin açılmasını engellemesin
        db.rollback()
        print(f"[makale] eşitleme başarısız: {e}")
        return []
    finally:
        db.close()

    if degisen:
        print(f"[makale] güncellendi: {', '.join(degisen)}")
        try:
            from utils.indexnow import bildir
            bildir([f"/blog/{s}" for s in degisen])
        except Exception as e:
            print(f"[makale] IndexNow atlandı: {e}")
    return degisen
