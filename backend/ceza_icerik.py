"""
Ceza türü başına SAYFA İÇERİĞİ (slug + SEO başlığı + özgün özet + SSS).

NEDEN AYRI DOSYA: tutarlar `routers/admin.py` → CEZALAR_2026'dadır (tek doğru
kaynak, üretici/mevzuat verisi). Burası o cezanın KENDİ SAYFASININ metnidir.
Her ceza ayrı bir arama sorgusudur ("kırmızı ışık cezası ne kadar", "hız cezası
2026") — tek liste sayfası bu sorguların hiçbirinde iyi sıralanmaz.

KURAL: tutar/puan BURAYA YAZILMAZ. Sayfa onları veritabanından (CEZALAR_2026)
okur; buraya kopyalanırsa iki yerde ayrı ayrı güncellenmesi gerekir ve biri
mutlaka unutulur. Buradaki metin tutardan BAĞIMSIZ kalacak şekilde yazılır.

Yeni ceza eklerken: CEZALAR_2026'ya satır + buraya aynı `kod` ile kayıt.
Kodu burada olmayan ceza sayfası üretilmez (listede kalır, zarar vermez).
"""

ICERIK = {
    "H1": {
        "slug": "kirmizi-isik-cezasi",
        "baslik": "Kırmızı Işık Cezası {{yil}}: Tutar, Ceza Puanı ve İtiraz",
        "ozet": (
            "Kırmızı ışıkta geçmek, 7574 sayılı Kanun'la birlikte tek tutarlı olmaktan çıkıp "
            "<strong>kademeli cezaya</strong> dönüştü: aynı yıl içinde tekrarlayan her ihlalde tutar katlanıyor, "
            "üçüncü ihlalden sonra sürücü belgesine süreli olarak el konuluyor. İhlal kameralardan tespit "
            "edildiği için ceza çoğunlukla plakaya yazılır ve posta yoluyla tebliğ edilir."
        ),
        "sss": [
            ("Kırmızı ışık cezası kaç puan?",
             "Kırmızı ışık ihlali sürücü belgesine 20 ceza puanı işlenmesine yol açar. Bir yıl içinde 100 ceza puanına ulaşan sürücünün belgesine geçici olarak el konulur."),
            ("Kırmızı ışıkta geçtiğimi nasıl öğrenirim?",
             "e-Devlet üzerinden \"Trafik İdari Para Cezası Sorgulama\" hizmetiyle TC kimlik numaranızla tüm cezalarınızı görebilirsiniz. Plakaya yazılan cezalar tebliğ edilmeden önce de burada görünebilir."),
            ("Sarı ışıkta geçmek ceza mı?",
             "Sarı ışık \"dur\" anlamındadır; ancak durmanın güvenli olmadığı kadar yakınsanız geçiş yapabilirsiniz. Ceza, aracın kırmızı yandıktan sonra çizgiyi geçtiği an tespit edilirse yazılır."),
        ],
    },
    "H2": {
        "slug": "hiz-cezasi-sehir-ici",
        "baslik": "Şehir İçi Hız Cezası {{yil}}: Yeni Kademeler ve Tolerans",
        "ozet": (
            "7574 sayılı Kanun, yıllardır alışılan <strong>yüzde bazlı hız kademelerini (%10-30 / %30-50 / %50+) "
            "tamamen kaldırdı</strong>. Yerine aşılan kilometreye göre işleyen dokuz kademeli bir yapı geldi; "
            "yerleşim yeri içinde tolerans 5 km/saate indi, yani 6 km/saatlik aşım bile cezaya giriyor. "
            "Ceza tutarı aşım büyüdükçe kademe kademe yükselir."
        ),
        "sss": [
            ("Şehir içi hız sınırı kaç km?",
             "Yerleşim yeri içinde otomobil için genel hız sınırı 50 km/saattir. Levhayla farklı bir sınır belirtilen yollarda levha esastır."),
            ("Radar toleransı kaldırıldı mı?",
             "Yüzde bazlı tolerans kaldırıldı. Yerleşim yeri içinde 5 km/saatlik sabit bir pay uygulanır; bunun üzerindeki aşım cezalandırılır."),
            ("Hız cezasına itiraz edebilir miyim?",
             "Evet. Tebliğden itibaren 15 gün içinde Sulh Ceza Hâkimliği'ne itiraz edebilirsiniz. Radar kalibrasyon belgesi ve ölçüm tutanağındaki eksiklikler sık kullanılan itiraz gerekçeleridir."),
        ],
    },
    "H3": {
        "slug": "hiz-cezasi-sehir-disi",
        "baslik": "Şehirlerarası ve Otoyol Hız Cezası {{yil}} (Kademeli Tablo)",
        "ozet": (
            "Yerleşim yeri dışında ve otoyollarda hız cezası, aşılan kilometreye göre kademelenir; "
            "tolerans 10 km/saattir. Aşım büyüdükçe tutar hızla yükselir ve üst kademelerde para cezasına "
            "<strong>sürücü belgesine el koyma</strong> da eklenir. Otoyoldaki yüksek hız sınırı, aşımın da "
            "yüksek kademelere denk gelmesi anlamına gelir."
        ),
        "sss": [
            ("Otoyolda hız sınırı kaç?",
             "Otoyolda otomobil için genel hız sınırı 140 km/saattir; bölünmüş kara yollarında 120, şehirlerarası tek yönlü yollarda 110 km/saat uygulanır. Levha varsa levha esastır."),
            ("Kademeler arasındaki fark ne kadar?",
             "Her kademe bir öncekinin üzerine belirgin bir artış getirir; en alt kademeden en üst kademeye tutar birkaç katına çıkar. Güncel kademe tutarları sayfadaki tabloda yer alır."),
            ("Aynı yolculukta iki kez radara girersem?",
             "Her tespit ayrı bir ihlaldir ve ayrı ceza yazılır. Aynı gün içindeki tekrarlar birleştirilmez."),
        ],
    },
    "H5": {
        "slug": "cep-telefonu-cezasi",
        "baslik": "Araç Kullanırken Telefon Cezası {{yil}}: Tutar ve Ehliyete El Koyma",
        "ozet": (
            "Seyir hâlinde elde telefon kullanmak 7574 sayılı Kanun'la birlikte <strong>kademeli cezaya</strong> "
            "bağlandı ve her ihlalde sürücü belgesine 30 gün el konulması yaptırımı eklendi. Tekrarlayan "
            "ihlallerde tutar iki, sonra dört katına çıkar. Eller serbest (bluetooth, araç içi sistem) kullanım "
            "bu kapsamda değildir."
        ),
        "sss": [
            ("Kırmızı ışıkta beklerken telefona bakmak ceza mı?",
             "Araç trafikte ve motor çalışır hâldeyken seyir hâli sayılır; kırmızı ışıkta beklerken elde telefon kullanmak da ihlal kapsamında değerlendirilebilir."),
            ("Navigasyon kullanmak serbest mi?",
             "Telefon bir tutucuya sabitlenmişse ve elle kullanılmıyorsa ihlal oluşmaz. Telefonu elde tutmak, yazı yazmak veya ekranla uğraşmak cezaya girer."),
            ("Eller serbest konuşma cezalı mı?",
             "Hayır. Bluetooth kulaklık veya aracın kendi sistemiyle yapılan görüşmeler bu maddenin kapsamı dışındadır."),
        ],
    },
    "H7": {
        "slug": "alkollu-arac-kullanma-cezasi",
        "baslik": "Alkollü Araç Kullanma Cezası {{yil}}: Promil Sınırı ve Ehliyet",
        "ozet": (
            "Alkollü araç kullanma, 7574 sayılı Kanun'la en sert artırılan ihlallerden biri oldu. Ceza "
            "<strong>tekrara göre katlanır</strong> ve para cezasının yanında sürücü belgesine el koyma süresi de "
            "uzar: ilk ihlalde 6 ay, ikincide 2 yıl, üçüncü ve sonraki ihlallerde belge iptal edilir. "
            "Ölçümü reddetmek de ayrıca cezalandırılır."
        ),
        "sss": [
            ("Alkol sınırı kaç promil?",
             "Özel otomobil sürücüleri için sınır 0,50 promildir. Ticari araç, otobüs, kamyon ve çekici sürücüleri ile yeni sürücülerde sınır 0,00 promildir."),
            ("Alkol ölçümünü reddedersem ne olur?",
             "Ölçüme direnmek başlı başına bir ihlaldir; para cezası uygulanır ve sürücü belgesine el konulur. Ayrıca hakkınızda adli işlem başlatılabilir."),
            ("Alkollü araç kullanmak hapis cezası gerektirir mi?",
             "Trafik güvenliğini tehlikeye sokmak suçu oluştuğunda (örneğin kaza veya belirgin tehlike) Türk Ceza Kanunu kapsamında adli süreç de işletilebilir."),
        ],
    },
    "H12": {
        "slug": "trafikte-saldirgan-davranis-cezasi",
        "baslik": "Trafikte Saldırgan Davranış Cezası {{yil}} (Yol Kesme, Araçtan İnme)",
        "ozet": (
            "7574 sayılı Kanun'un en yüksek tutarlı maddelerinden biridir. Aracı kasten yavaşlatıp yol kesmek, "
            "taciz amacıyla ısrarla takip etmek, araçtan inerek diğer sürücünün üzerine yürümek gibi davranışlar "
            "bu kapsamdadır. Para cezasına <strong>sürücü belgesine el koyma</strong> da eşlik eder; olayda "
            "yaralama veya hasar varsa ayrıca adli süreç işler."
        ),
        "sss": [
            ("Makas atmak bu kapsamda mı?",
             "Makas ve drift ayrı bir maddeyle cezalandırılır. Saldırgan davranış maddesi daha çok yol kesme, taciz amaçlı takip ve araçtan inip tehdit gibi eylemleri kapsar."),
            ("Kamera kaydı delil olur mu?",
             "Evet. Araç içi kamera, cep telefonu kaydı ve güvenlik kamerası görüntüleri kolluğa yapılan başvuruda delil olarak sunulabilir."),
            ("Ceza plakaya mı sürücüye mi yazılır?",
             "Bu ihlalde sürücünün kimliği tespit edildiği için ceza doğrudan sürücüye yazılır ve belgesine işlenir."),
        ],
    },
    "H13": {
        "slug": "drift-makas-cezasi",
        "baslik": "Drift ve Makas Cezası {{yil}}: Tutar, Ehliyet ve Araç Men",
        "ozet": (
            "Trafikte yarış, drift ve makas atmak doğrudan can güvenliğini tehdit eden eylemler sayılır. "
            "Para cezasının yanında <strong>sürücü belgesi geri alınır</strong> ve araç trafikten men edilebilir. "
            "İhlal çoğunlukla sosyal medya paylaşımları veya kamera kayıtları üzerinden de tespit edilir."
        ),
        "sss": [
            ("Sosyal medyada paylaşılan drift videosu ceza getirir mi?",
             "Evet. Plakası görünen paylaşımlar üzerinden tespit yapılabilir ve ihlal gerçekleştikten sonra da ceza yazılabilir."),
            ("Araç ne kadar süre men edilir?",
             "Men süresi ihlalin ağırlığına ve tekrarına göre değişir; aracın çekilmesi hâlinde çekme ve otopark ücretleri de araç sahibine aittir."),
            ("Yarış izinli pistte yapılırsa?",
             "Kapalı ve izinli pistlerde yapılan etkinlikler trafik kurallarının kapsamı dışındadır; madde kara yolunda yapılan eylemleri hedefler."),
        ],
    },
    "H11": {
        "slug": "ehliyetsiz-arac-kullanma-cezasi",
        "baslik": "Ehliyetsiz Araç Kullanma Cezası {{yil}}: Tutar ve Araç Men",
        "ozet": (
            "Sürücü belgesi olmadan araç kullanmak yüksek tutarlı cezalardandır ve <strong>araç trafikten men "
            "edilir</strong>. Ceza yalnız sürücüye değil, aracı ehliyetsiz kişiye verdiği tespit edilen araç "
            "sahibine de yazılır. Tekrarı hâlinde tutar katlanır ve adli süreç gündeme gelebilir."
        ),
        "sss": [
            ("Ehliyetim yanımda değilse aynı ceza mı?",
             "Hayır. Belgesi olup yanında bulundurmamak çok daha düşük tutarlı ayrı bir ihlaldir. Bu madde hiç belgesi olmayan veya belgesi iptal edilmiş sürücüler içindir.") ,
            ("Araç sahibi de ceza alır mı?",
             "Aracını sürücü belgesi olmayan birine verdiği tespit edilen araç sahibine de ayrıca ceza uygulanır."),
            ("Sınıfı uygun olmayan araç kullanmak?",
             "Örneğin B sınıfı belgeyle kamyon kullanmak da bu madde kapsamında değerlendirilir ve araç men edilir."),
        ],
    },
    "H8": {
        "slug": "hatali-sollama-cezasi",
        "baslik": "Hatalı Sollama Cezası {{yil}}: Nerelerde Sollama Yasak?",
        "ozet": (
            "Sollama; kesik çizgi bulunmayan yerlerde, dönemeç ve tepe üstlerinde, yaya geçitlerinde ve "
            "görüşün yetersiz olduğu her noktada yasaktır. Karşı şeride geçerek yapılan hatalı sollama, "
            "ölümlü kazaların en sık sebeplerinden biri olduğu için denetimlerde öncelikli ihlallerdendir."
        ),
        "sss": [
            ("Sağdan sollama ceza mı?",
             "Kural olarak sollama soldan yapılır. Sağdan geçmek, şerit ihlali ve hatalı sollama olarak değerlendirilir."),
            ("Devamlı çizgide sollama yaptım, itiraz edebilir miyim?",
             "Tutanakta ihlalin yeri ve şekli açıkça belirtilmemişse ya da yol çizgileri silikse itiraz dilekçenizde bunu gerekçe gösterebilirsiniz."),
            ("Sollama cezası ehliyete puan yazar mı?",
             "Sollama ihlalleri ceza puanı uygulanan ihlaller arasındadır; puan sürücü belgenize işlenir."),
        ],
    },
    "H10": {
        "slug": "muayenesiz-arac-cezasi",
        "baslik": "Muayenesiz Araç Cezası {{yil}}: Tutar, Gecikme Zammı ve Men",
        "ozet": (
            "Muayene süresi geçmiş araçla trafiğe çıkmak hem para cezası hem de aracın <strong>trafikten men "
            "edilmesi</strong> sonucunu doğurur. Ayrıca muayenenin geciktiği her ay için TÜVTÜRK tarafından "
            "gecikme zammı alınır; yani ceza ödenmiş olsa bile muayene bedeli artmaya devam eder."
        ),
        "sss": [
            ("Araç muayenesi kaç yılda bir yapılır?",
             "Otomobillerde ilk muayene 3 yaşında, sonrasında 2 yılda birdir. Ticari araçlarda ve taksilerde süre 1 yıldır."),
            ("Muayene randevusu nasıl alınır?",
             "TÜVTÜRK'ün internet sitesinden veya 444 0 886 numaralı çağrı merkezinden randevu alınabilir. Randevusuz girişlerde bekleme süresi uzayabilir."),
            ("Muayenesi geçmiş araç sigortasız sayılır mı?",
             "Muayene ile zorunlu trafik sigortası ayrı yükümlülüklerdir; ancak kaza hâlinde muayenesizlik kusur değerlendirmesinde aleyhinize sonuç doğurabilir."),
        ],
    },
    "H4": {
        "slug": "emniyet-kemeri-cezasi",
        "baslik": "Emniyet Kemeri Cezası {{yil}}: Sürücü, Yolcu ve Arka Koltuk",
        "ozet": (
            "Emniyet kemeri yükümlülüğü yalnız ön koltukları değil, <strong>arka koltuktaki yolcuları da</strong> "
            "kapsar. Kemer takmamak ceza puanı uygulanan ihlallerdendir. Kemersiz yolcu için ceza kural olarak "
            "yolcuya yazılır; çocuklarda sorumluluk sürücüdedir."
        ),
        "sss": [
            ("Arka koltukta kemer zorunlu mu?",
             "Evet. Araçta kemer donanımı bulunan tüm koltuklarda, arka koltuk dâhil, kemer takmak zorunludur."),
            ("Çocuk koltuğu zorunluluğu nedir?",
             "Boyu 150 cm'nin altındaki çocuklar yaşa ve kiloya uygun çocuk güvenlik sisteminde taşınır; 3 yaşın altındaki çocuklar uygun sistem olmadan araçta taşınamaz."),
            ("Kemer cezası kime yazılır?",
             "Kemersiz seyahat eden yetişkin yolcuya kendi adına ceza yazılır. Çocuk yolcularda sorumluluk sürücüye aittir."),
        ],
    },
    "H14": {
        "slug": "kask-takmama-cezasi",
        "baslik": "Motosiklette Kask Cezası {{yil}}: Sürücü ve Yolcu",
        "ozet": (
            "Motosiklet ve motorlu bisiklet kullanırken koruma başlığı (kask) takmak sürücü için de "
            "<strong>arkadaki yolcu için de</strong> zorunludur. Kask, motosiklet kazalarında ölüm riskini "
            "belirgin biçimde düşürdüğü için denetimlerde öncelikli kontrol konularındandır."
        ),
        "sss": [
            ("Yolcunun kaskı yoksa ceza kime yazılır?",
             "Kasksız yolcu için ceza yolcuya yazılır; sürücü ayrıca kendi kaskı yoksa kendi adına ceza alır."),
            ("Elektrikli scooter'da kask zorunlu mu?",
             "Elektrikli skuterlar ayrı bir yönetmelikle düzenlenir; kask kullanımı önerilir ve belirli hız/ehliyet koşullarında zorunlu tutulur."),
            ("Kask standardı önemli mi?",
             "Evet. Onaysız veya standart dışı başlıklar koruma sağlamadığı gibi denetimde kask takılmamış sayılabilir."),
        ],
    },
    "H6": {
        "slug": "hatali-park-cezasi",
        "baslik": "Hatalı Park Cezası {{yil}}: Tutar, Araç Çekme ve İtiraz",
        "ozet": (
            "Yasak yere park, en sık yazılan trafik cezalarından biridir. Para cezasının yanında araç "
            "<strong>çekilebilir</strong>; bu durumda çekme ve otopark ücretleri ayrıca araç sahibinden tahsil "
            "edilir. Engelli park yeri, yaya geçidi, kaldırım ve yangın musluğu önü gibi yerlerde çekme olasılığı "
            "yüksektir."
        ),
        "sss": [
            ("Aracım çekildi, nereden öğrenirim?",
             "Aracın çekildiği yerdeki trafik şube müdürlüğü veya belediye zabıtasından öğrenebilirsiniz. Çekme kararına da 15 gün içinde itiraz edilebilir."),
            ("Engelli park yerine park etmenin cezası farklı mı?",
             "Engelliler için ayrılmış park yerine park etmek daha ağır yaptırıma tabidir ve araç genellikle doğrudan çekilir."),
            ("Park cezası ehliyete puan yazar mı?",
             "Park ihlalleri kural olarak ceza puanı uygulanmayan ihlallerdendir; yalnız para cezası doğurur."),
        ],
    },
    "H9": {
        "slug": "zorunlu-trafik-sigortasi-cezasi",
        "baslik": "Sigortasız Araç Cezası {{yil}}: Zorunlu Trafik Sigortası",
        "ozet": (
            "Zorunlu trafik sigortası (ZMSS) olmadan trafiğe çıkmak hem para cezası hem de aracın "
            "<strong>trafikten men edilmesi</strong> sonucunu doğurur. Araç, poliçe yapılana kadar trafiğe "
            "çıkarılamaz. Sigortasız araçla kazaya karışmak ise karşı tarafın zararını cebinizden ödemek "
            "anlamına gelir."
        ),
        "sss": [
            ("Zorunlu trafik sigortası neyi karşılar?",
             "Kazada karşı tarafın uğradığı maddi zararı ve bedenî zararları poliçe limitleri dâhilinde karşılar. Kendi aracınızın hasarı kasko kapsamındadır."),
            ("Sigortam bitti, kaç gün süre var?",
             "Yasal bir ek süre yoktur; poliçe bittiği an araç sigortasız sayılır ve denetimde ceza yazılır."),
            ("Sigortasız araçla kaza yaparsam ne olur?",
             "Karşı tarafın zararı sizden tahsil edilir. Ayrıca Güvence Hesabı tarafından ödenen tutarlar size rücu edilir."),
        ],
    },
}
