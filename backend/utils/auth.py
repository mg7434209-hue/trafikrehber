from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
import os

# JWT_SECRET YALNIZ Railway ortam değişkeninden. Eskiden koddaki yedek değer
# kullanılıyordu; repo herkese açık olduğundan herkes geçerli admin token'ı
# üretebilirdi. Tanımlı değilse (ya da 32 karakterden kısaysa) admin girişi ve
# korumalı uçlar 503 döner — site içeriği yayında kalır.
SECRET = os.getenv("JWT_SECRET", "").strip()
SECRET_OK = len(SECRET) >= 32
if not SECRET_OK:
    print("UYARI: JWT_SECRET tanımlı değil ya da 32 karakterden kısa — admin kapalı")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
EXPIRE_HOURS = int(os.getenv("JWT_EXPIRE_HOURS", "24"))

security = HTTPBearer()

def _require_secret():
    if not SECRET_OK:
        raise HTTPException(status_code=503, detail="Yönetim kapalı: sunucuda JWT_SECRET tanımlı değil")


def create_token(data: dict) -> str:
    _require_secret()
    payload = data.copy()
    payload["exp"] = datetime.utcnow() + timedelta(hours=EXPIRE_HOURS)
    return jwt.encode(payload, SECRET, algorithm=ALGORITHM)

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    _require_secret()
    try:
        payload = jwt.decode(credentials.credentials, SECRET, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token süresi doldu")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Geçersiz token")

def require_admin(payload: dict = Depends(verify_token)):
    if not payload.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin yetkisi gerekli")
    return payload
