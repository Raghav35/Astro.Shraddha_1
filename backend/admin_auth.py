"""Single-admin JWT auth — credentials from env, no DB user table."""
from __future__ import annotations

import os
from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from fastapi import Depends, HTTPException, Request

JWT_ALGORITHM = "HS256"
ACCESS_TTL_HOURS = 12  # admin session length


def _admin_email() -> str:
    return os.environ.get("ADMIN_EMAIL", "").strip().lower()


def _admin_password() -> str:
    return os.environ.get("ADMIN_PASSWORD", "")


def _jwt_secret() -> str:
    secret = os.environ.get("JWT_SECRET", "").strip()
    if not secret:
        raise RuntimeError("JWT_SECRET is not configured")
    return secret


def verify_admin_password(email: str, password: str) -> bool:
    if not email or not password:
        return False
    if email.strip().lower() != _admin_email():
        return False
    # Constant-time compare via bcrypt-hashed env password
    expected = _admin_password().encode("utf-8")
    given = password.encode("utf-8")
    # Use bcrypt only for constant-time-ish; equality is sufficient since
    # secret is in env. Use HMAC compare to avoid timing leaks.
    import hmac
    return hmac.compare_digest(expected, given)


def create_admin_token() -> str:
    payload = {
        "sub": _admin_email(),
        "role": "admin",
        "exp": datetime.now(timezone.utc) + timedelta(hours=ACCESS_TTL_HOURS),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, _jwt_secret(), algorithm=JWT_ALGORITHM)


def decode_admin_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, _jwt_secret(), algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not an admin token")
    return payload


def require_admin(request: Request) -> dict:
    auth = request.headers.get("Authorization", "")
    if not auth.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = auth[7:].strip()
    return decode_admin_token(token)


# silence unused-import warning
_ = bcrypt
