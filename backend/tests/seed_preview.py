"""Disposable browser-test fixture. Refuses production/Postgres databases."""
import os
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
url = os.getenv('DATABASE_URL', '')
if not url.startswith('sqlite:///') or not url.endswith('trafikrehber-e2e.db'):
    raise RuntimeError('Only an explicitly named SQLite trafikrehber-e2e.db is permitted')
from database import Base, engine, SessionLocal
from models import Article, CezaTuru, DilecceSablon
Base.metadata.drop_all(engine)
Base.metadata.create_all(engine)
with SessionLocal() as db:
    for i in range(14):
        db.add(Article(slug=f'test-rehber-{i}', title=f'Test rehber {i}', meta_description='TrafikRehber test içeriği.', category=['ceza','sigorta','ehliyet','arac-islemleri'][i % 4], tags=[], content='<h2>Test açıklaması</h2><p>Örnek içerik.</p><img src="x" onerror="window.injected=true"><script>window.injected=true</script>' if i == 0 else '<h2>Test açıklaması</h2><p>Örnek içerik.</p>', is_published=True, is_featured=i < 6))
    db.add(CezaTuru(kod='TEST1', aciklama='Kırmızı ışık ihlali (test)', taban_ceza_tl=100.02, puan=0))
    db.add(CezaTuru(kod='TEST2', aciklama='Park ihlali (test)', taban_ceza_tl=200, puan=0))
    db.add(DilecceSablon(slug='test-dilekce', baslik='Test dilekçesi', aciklama='Test amaçlı şablon.', kategori='itiraz', sablon_icerik='Başvuran: [AD SOYAD]\nAraç: [PLAKA]'))
    db.commit()
