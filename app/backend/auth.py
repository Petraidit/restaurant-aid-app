import datetime as dt
import hashlib
import hmac
import os
import secrets

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from database import get_db
from models import User

SECRET_KEY = os.getenv("SECRET_KEY", "dev-only-secret-change-me")
bearer = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 200_000).hex()
    return f"{salt}${digest}"


def verify_password(password: str, stored: str) -> bool:
    salt, digest = stored.split("$")
    check = hashlib.pbkdf2_hmac("sha256", password.encode(), salt.encode(), 200_000).hex()
    return hmac.compare_digest(check, digest)


def create_token(user_id: int) -> str:
    exp = dt.datetime.now(dt.timezone.utc) + dt.timedelta(hours=8)
    return jwt.encode({"sub": str(user_id), "exp": exp}, SECRET_KEY, algorithm="HS256")


def current_user(
    creds: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    if creds is None:
        raise HTTPException(401, "Please log in")
    try:
        payload = jwt.decode(creds.credentials, SECRET_KEY, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise HTTPException(401, "Session expired, please log in again")
    user = db.get(User, int(payload["sub"]))
    if user is None:
        raise HTTPException(401, "Account not found")
    return user


def admin_user(user: User = Depends(current_user)) -> User:
    if not user.is_admin:
        raise HTTPException(403, "Admins only")
    return user
