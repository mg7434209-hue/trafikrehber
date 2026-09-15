from concurrent.futures import ThreadPoolExecutor
from decimal import Decimal
from hashlib import sha256
from uuid import uuid4
from xml.etree import ElementTree as ET
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from main import app
from database import engine
from models import Article, CezaTuru, SiteVisitor
from routers import admin
from utils import auth


def test_persistent_counter_and_duplicate_browser(client, db):
    assert client.get('/api/stats/visitors').json()['total_visitors'] == 1000
    visitor = str(uuid4())
    for _ in range(3):
        response = client.post('/api/stats/visit', json={'visitor_id': visitor})
        assert response.status_code == 200
        assert response.headers['cache-control'] == 'no-store'
        assert response.json()['total_visitors'] == 1001
    assert db.query(SiteVisitor).one().visitor_hash == sha256(visitor.encode()).hexdigest()
    assert client.post('/api/stats/visit', json={'visitor_id': str(uuid4())}).json()['total_visitors'] == 1002
    # A new connection still sees persisted rows; no process-local counter.
    fresh_engine = create_engine(engine.url)
    with Session(fresh_engine) as fresh:
        assert fresh.query(SiteVisitor).count() == 2
    fresh_engine.dispose()
    assert client.get('/api/stats/public').json()['stats']['total_visitors'] == 1002


def test_concurrent_duplicate_and_distinct_visitors(client):
    repeated = str(uuid4())
    visitors = [repeated] * 12 + [str(uuid4()) for _ in range(12)]
    def visit(visitor):
        with TestClient(app) as concurrent_client:
            return concurrent_client.post('/api/stats/visit', json={'visitor_id': visitor}).status_code
    with ThreadPoolExecutor(max_workers=8) as pool:
        assert list(pool.map(visit, visitors)) == [200] * 24
    assert client.get('/api/stats/visitors').json()['total_visitors'] == 1013


def test_counter_rejects_invalid_ids_and_client_totals(client):
    for data in [{}, {'visitor_id': 'fake'}, {'visitor_id': str(uuid4()), 'total_visitors': 9999}]:
        assert client.post('/api/stats/visit', json=data).status_code == 422
    assert client.get('/api/stats/visitors').json()['total_visitors'] == 1000


def test_admin_and_seed_access(client, monkeypatch):
    for path in ['/api/seed', '/api/seed-rich']:
        assert client.post(path).status_code == 403
        token = auth.create_token({'is_admin': False})
        assert client.post(path, headers={'Authorization': f'Bearer {token}'}).status_code == 403
    login = client.post('/api/admin/login', json={'email': admin.ADMIN_EMAIL, 'password': 'test-only-admin-password'})
    assert login.status_code == 200
    token = login.json()['token']
    assert client.get('/api/admin/stats', headers={'Authorization': f'Bearer {token}'}).status_code == 200
    monkeypatch.setattr(admin, 'ADMIN_PASSWORD', None)
    assert client.post('/api/admin/login', json={'email': admin.ADMIN_EMAIL, 'password': 'anything'}).status_code == 503


def test_missing_signing_secret_fails_closed(client, monkeypatch):
    token = auth.create_token({'is_admin': True})
    monkeypatch.setattr(auth, 'SECRET', None)
    assert client.get('/api/admin/stats', headers={'Authorization': f'Bearer {token}'}).status_code == 503


def test_articles_pagination_validation_sitemap_and_view_date(client, db):
    for i in range(14):
        db.add(Article(slug=f'test-{i}', title=f'Rehber {i}', category='sigorta', is_published=True))
    db.add(Article(slug='private', title='Private', is_published=False))
    db.commit()
    assert len(client.get('/api/articles?page=2').json()['articles']) == 2
    assert client.get('/api/articles?limit=0').status_code == 422
    for q in ['x', '  ']:
        assert client.get('/api/articles/search', params={'q': q}).status_code == 422
    assert client.get('/api/articles/private').status_code == 404
    result = client.get('/api/articles/test-0').json()['article']
    assert result['view_count'] == 1
    assert result['updated_at'] is None
    xml = ET.fromstring(client.get('/sitemap.xml').content)
    urls = [node.text for node in xml.findall('.//{*}loc')]
    assert len(urls) == 26
    assert all(url.startswith('https://www.cezarehberi.com/') for url in urls)
    assert not any('/private' in url for url in urls)


def test_fine_decimal_rounding_and_invalid_uuid(client, db):
    fine = CezaTuru(kod='TEST', aciklama='Test fine', taban_ceza_tl=Decimal('100.02'))
    db.add(fine); db.commit()
    result = client.get(f'/api/ceza-turleri/{fine.id}/hesapla').json()
    assert result['hesaplama']['erken_odeme_indirimi'] == 75.02
    assert client.get('/api/ceza-turleri/invalid/hesapla').status_code == 422


def test_cors_and_chat_validation(client):
    response = client.get('/api/stats/visitors', headers={'Origin': 'https://www.cezarehberi.com'})
    assert response.headers['access-control-allow-origin'] == 'https://www.cezarehberi.com'
    response = client.get('/api/stats/visitors', headers={'Origin': 'https://untrusted.example'})
    assert 'access-control-allow-origin' not in response.headers
    assert client.post('/api/chat/send', json={'message': ''}).status_code == 422
    assert client.post('/api/chat/send', json={'message': 'x' * 2001}).status_code == 422
