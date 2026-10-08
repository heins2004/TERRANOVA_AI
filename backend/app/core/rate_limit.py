"""
In-memory rate limiting module for TERRANOVA AI.

ARCHITECTURE AND DEPLOYMENT NOTES:
- Rate limiting is maintained in-memory per worker process.
- When running multiple worker processes or deploying behind a reverse proxy / load balancer,
  the proxy must forward the actual client IP (e.g. in 'X-Forwarded-For' or 'X-Real-IP'),
  and the environment variable RATE_LIMIT_REAL_IP_HEADER must be configured accordingly.
- Configurable defaults via environment variables:
    * RATE_LIMIT_PUBLIC_MAX_REQUESTS: default 120 requests
    * RATE_LIMIT_PUBLIC_WINDOW_SECONDS: default 60 seconds (1 minute)
    * RATE_LIMIT_LOGIN_MAX_FAILURES: default 10 failures
    * RATE_LIMIT_LOGIN_WINDOW_SECONDS: default 900 seconds (15 minutes)
    * RATE_LIMIT_REAL_IP_HEADER: default None (uses request.client.host)
"""

import math
import threading
import time
from fastapi import HTTPException, Request, status

from app.core.config import get_settings

_lock = threading.Lock()
_public_ip_history: dict[str, list[float]] = {}
_login_fail_ip_history: dict[str, list[float]] = {}
_login_fail_email_history: dict[str, list[float]] = {}


def get_client_ip(request: Request) -> str:
    """Resolve the client IP address, supporting configurable proxy headers."""
    settings = get_settings()
    header_name = settings.rate_limit_real_ip_header
    if header_name:
        header_val = request.headers.get(header_name)
        if header_val:
            return header_val.split(",")[0].strip()
    if request.client and request.client.host:
        return request.client.host
    return "127.0.0.1"


def check_public_rate_limit(request: Request) -> None:
    """Enforce rate limits on public API endpoints (default 120 requests/minute per client IP)."""
    settings = get_settings()
    limit = settings.rate_limit_public_max_requests
    window = settings.rate_limit_public_window_seconds
    ip = get_client_ip(request)
    now = time.time()

    with _lock:
        timestamps = _public_ip_history.get(ip, [])
        cutoff = now - window
        valid = [t for t in timestamps if t > cutoff]

        if len(valid) >= limit:
            oldest = valid[0]
            retry_after = max(1, int(math.ceil(oldest + window - now)))
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many requests. Please try again later.",
                headers={"Retry-After": str(retry_after)},
            )

        valid.append(now)
        _public_ip_history[ip] = valid


def check_login_rate_limit(ip: str, email: str) -> None:
    """Check whether the client IP or email has exceeded the failed login threshold."""
    settings = get_settings()
    max_fails = settings.rate_limit_login_max_failures
    window = settings.rate_limit_login_window_seconds
    now = time.time()
    norm_email = email.strip().lower()

    with _lock:
        ip_fails = [t for t in _login_fail_ip_history.get(ip, []) if t > now - window]
        _login_fail_ip_history[ip] = ip_fails
        if len(ip_fails) >= max_fails:
            retry_after = max(1, int(math.ceil(ip_fails[0] + window - now)))
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many failed login attempts. Please try again later.",
                headers={"Retry-After": str(retry_after)},
            )

        email_fails = [t for t in _login_fail_email_history.get(norm_email, []) if t > now - window]
        _login_fail_email_history[norm_email] = email_fails
        if len(email_fails) >= max_fails:
            retry_after = max(1, int(math.ceil(email_fails[0] + window - now)))
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Too many failed login attempts. Please try again later.",
                headers={"Retry-After": str(retry_after)},
            )


def record_login_failure(ip: str, email: str) -> None:
    """Record a failed login timestamp for both IP and email."""
    now = time.time()
    norm_email = email.strip().lower()
    with _lock:
        _login_fail_ip_history.setdefault(ip, []).append(now)
        _login_fail_email_history.setdefault(norm_email, []).append(now)


def clear_login_failures(email: str) -> None:
    """Clear failed login history for an email after successful login."""
    norm_email = email.strip().lower()
    with _lock:
        _login_fail_email_history.pop(norm_email, None)


def reset_rate_limiters() -> None:
    """Reset all in-memory rate limiters (used in testing)."""
    with _lock:
        _public_ip_history.clear()
        _login_fail_ip_history.clear()
        _login_fail_email_history.clear()
