"""
IndexNow — yeni/güncellenen içeriği arama motorlarına ANINDA bildirir.

Sitemap'i botun kendi gelip okumasını beklemek yerine, makale yayımlandığında
Bing/Yandex/Seznam (ve IndexNow'u paylaşan diğer motorlar) tek bir HTTP isteğiyle
haberdar edilir. Google IndexNow'a katılmıyor; onun için sitemap'teki `lastmod`
tazeliği çalışır (bkz. routers/sitemap.py).

Kurulum (Railway → Variables):
  INDEXNOW_KEY = 8-128 karakter arası rastgele bir dizi (ör. uuid4().hex)
Aynı anahtar FRONTEND servisine de verilir; frontend `server.js` onu
`https://site/<anahtar>.txt` adresinde yayımlar — motorlar sahipliği böyle doğrular.

Anahtar tanımlı değilse bu modül sessizce devre dışıdır (hata üretmez).
"""

import json
import os
import threading
import urllib.request

INDEXNOW_KEY = (os.getenv("INDEXNOW_KEY") or "").strip()
SITE_URL = (os.getenv("SITE_URL") or "https://www.cezarehberi.com").rstrip("/")
UC_NOKTA = "https://api.indexnow.org/IndexNow"
ZAMAN_ASIMI = 8


def etkin() -> bool:
    return bool(INDEXNOW_KEY)


def _gonder(urls: list) -> None:
    govde = json.dumps({
        "host": SITE_URL.replace("https://", "").replace("http://", ""),
        "key": INDEXNOW_KEY,
        "keyLocation": f"{SITE_URL}/{INDEXNOW_KEY}.txt",
        "urlList": urls,
    }).encode("utf-8")
    istek = urllib.request.Request(
        UC_NOKTA, data=govde,
        headers={"Content-Type": "application/json; charset=utf-8"},
    )
    try:
        with urllib.request.urlopen(istek, timeout=ZAMAN_ASIMI) as yanit:
            print(f"[indexnow] {len(urls)} URL bildirildi → HTTP {yanit.status}")
    except Exception as e:
        # Bildirim başarısız olsa da uygulama akışı ASLA bozulmaz
        print(f"[indexnow] bildirim başarısız: {e}")


def bildir(yollar) -> int:
    """Verilen site içi yolları (ör. ['/blog/slug']) arka planda bildirir.

    Döndürdüğü sayı gönderilmek üzere sıraya alınan URL adedidir; istek
    ayrı bir iş parçacığında gider, çağıran bekletilmez.
    """
    if not etkin():
        return 0
    if isinstance(yollar, str):
        yollar = [yollar]
    urls = []
    for y in yollar:
        if not y:
            continue
        urls.append(y if y.startswith("http") else SITE_URL + (y if y.startswith("/") else "/" + y))
    if not urls:
        return 0
    urls = urls[:10000]  # IndexNow tek istekte en fazla 10.000 URL kabul eder
    threading.Thread(target=_gonder, args=(urls,), daemon=True).start()
    return len(urls)
