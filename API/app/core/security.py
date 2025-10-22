from datetime import datetime, timedelta
from typing import Any, Union

from jose import jwt
import bcrypt

from app.core.config import settings

ALGORITHM = "HS256"
MAX_BCRYPT_BYTES = 72  # bcrypt truncates passwords to 72 bytes internally


def create_access_token(
    subject: Union[str, Any], expires_delta: timedelta = None
) -> str:
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    to_encode = {"exp": expire, "sub": str(subject)}
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def _normalize_password(password: str) -> bytes:
    if not isinstance(password, str):
        password = str(password)

    password_bytes = password.encode("utf-8")
    if len(password_bytes) <= MAX_BCRYPT_BYTES:
        return password_bytes

    return password_bytes[:MAX_BCRYPT_BYTES]


def verify_password(plain_password: str, hashed_password: str) -> bool:
    password_bytes = _normalize_password(plain_password)
    if isinstance(hashed_password, str):
        hashed_password_bytes = hashed_password.encode("utf-8")
    else:
        hashed_password_bytes = hashed_password
    return bcrypt.checkpw(password_bytes, hashed_password_bytes)


def get_password_hash(password: str) -> str:
    password_bytes = _normalize_password(password)
    hashed = bcrypt.hashpw(password_bytes, bcrypt.gensalt())
    return hashed.decode("utf-8")
