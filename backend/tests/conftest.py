"""Tests always use a disposable database, never the application's DATABASE_URL."""
import os
import sys
import tempfile
from pathlib import Path
from sqlalchemy.engine import make_url
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
_test_dir = tempfile.TemporaryDirectory(prefix="trafikrehber-tests-")
test_url = os.getenv("TEST_DATABASE_URL")
if test_url and make_url(test_url).database != "trafikrehber_test":
    raise RuntimeError("TEST_DATABASE_URL must name the dedicated trafikrehber_test database")
os.environ["DATABASE_URL"] = test_url or f"sqlite:///{_test_dir.name}/test.db"
os.environ["JWT_SECRET"] = "test-only-secret-do-not-use-in-production-abcdef"
os.environ["ADMIN_PASSWORD"] = "test-only-admin-password"
os.environ["REACT_APP_SITE_URL"] = "https://www.cezarehberi.com"
from main import app
from database import Base, engine, SessionLocal
from fastapi.testclient import TestClient

@pytest.fixture(autouse=True)
def clean_database():
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    yield

@pytest.fixture
def client():
    with TestClient(app) as client:
        yield client

@pytest.fixture
def db():
    with SessionLocal() as db:
        yield db
