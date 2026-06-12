"""Backend regression tests for Astro Shraddha ADMIN features.

Covers: admin/login, admin/me, admin-protected endpoints (auth gate),
manual booking creation, PATCH (paid/done/cancel), stats, and notifications
stub (booking does not block even when notify is mocked).
"""

import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")
if not BASE_URL:
    try:
        with open("/app/frontend/.env") as f:
            for line in f:
                if line.startswith("REACT_APP_BACKEND_URL="):
                    BASE_URL = line.strip().split("=", 1)[1]
                    break
    except FileNotFoundError:
        pass
assert BASE_URL, "REACT_APP_BACKEND_URL must be set"
BASE_URL = BASE_URL.rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "Astro.Shraddha@gmail.com"
ADMIN_PASSWORD = "Likhite@89"


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def admin_token(session):
    r = session.post(
        f"{API}/admin/login",
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        timeout=20,
    )
    assert r.status_code == 200, r.text
    data = r.json()
    assert "token" in data and isinstance(data["token"], str)
    assert data["role"] == "admin"
    assert data["email"] == ADMIN_EMAIL.lower()
    return data["token"]


@pytest.fixture(scope="session")
def auth_session(session, admin_token):
    s = requests.Session()
    s.headers.update(
        {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {admin_token}",
        }
    )
    return s


# ---------- Admin login ----------
class TestAdminLogin:
    def test_login_invalid_password(self, session):
        r = session.post(
            f"{API}/admin/login",
            json={"email": ADMIN_EMAIL, "password": "wrong-pass"},
            timeout=20,
        )
        assert r.status_code == 401

    def test_login_invalid_email(self, session):
        r = session.post(
            f"{API}/admin/login",
            json={"email": "other@example.com", "password": ADMIN_PASSWORD},
            timeout=20,
        )
        assert r.status_code == 401

    def test_login_success_and_me(self, auth_session):
        r = auth_session.get(f"{API}/admin/me", timeout=20)
        assert r.status_code == 200
        data = r.json()
        assert data["role"] == "admin"
        assert data["email"] == ADMIN_EMAIL.lower()


# ---------- Auth gating ----------
class TestAuthGating:
    """Admin endpoints must return 401 without bearer token."""

    @pytest.mark.parametrize(
        "method,path",
        [
            ("GET", "/admin/me"),
            ("GET", "/admin/bookings"),
            ("GET", "/admin/contact"),
            ("GET", "/admin/stats"),
            ("POST", "/admin/bookings/manual"),
            ("PATCH", "/admin/bookings/abc"),
            ("GET", "/bookings"),   # also gated
            ("GET", "/contact"),    # also gated
        ],
    )
    def test_requires_bearer(self, session, method, path):
        r = session.request(method, f"{API}{path}", json={}, timeout=20)
        assert r.status_code == 401, f"{method} {path} -> {r.status_code}"


# ---------- Manual booking + PATCH ----------
class TestManualBookingAndPatch:
    booking_id = None

    def test_create_manual_booking(self, auth_session):
        payload = {
            "full_name": "TEST_Manual_Admin",
            "email": "test_manual@example.com",
            "phone": "+91 9123456789",
            "service_id": "kundli-reading",
            "date_of_birth": "1990-01-01",
            "time_of_birth": "08:30",
            "place_of_birth": "Pune",
            "consultation_date": "2026-06-20",
            "consultation_time": "11:30 AM",
            "notes": "TEST manual via admin",
            "payment_status": "manual_pending",
        }
        r = auth_session.post(f"{API}/admin/bookings/manual", json=payload, timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "id" in data and data["source"] == "manual_admin"
        TestManualBookingAndPatch.booking_id = data["id"]

    def test_manual_booking_persisted_with_source_and_status(self, auth_session):
        bid = TestManualBookingAndPatch.booking_id
        assert bid, "Booking not created"
        r = auth_session.get(f"{API}/admin/bookings", timeout=20)
        assert r.status_code == 200
        items = r.json()
        match = next((b for b in items if b.get("id") == bid), None)
        assert match, "Manual booking not found in admin list"
        assert match.get("source") == "manual_admin"
        assert match.get("status") == "upcoming"
        assert match.get("payment_status") == "manual_pending"
        assert "_id" not in match

    def test_manual_invalid_service(self, auth_session):
        r = auth_session.post(
            f"{API}/admin/bookings/manual",
            json={
                "full_name": "TEST_x",
                "email": "x@example.com",
                "phone": "+91 9000000000",
                "service_id": "does-not-exist",
                "consultation_date": "2026-06-20",
                "consultation_time": "11:30 AM",
            },
            timeout=20,
        )
        assert r.status_code == 400

    def test_patch_payment_status_to_paid(self, auth_session):
        bid = TestManualBookingAndPatch.booking_id
        r = auth_session.patch(
            f"{API}/admin/bookings/{bid}",
            json={"payment_status": "paid"},
            timeout=20,
        )
        assert r.status_code == 200
        data = r.json()
        assert data["payment_status"] == "paid"
        assert data["id"] == bid

    def test_patch_status_to_completed(self, auth_session):
        bid = TestManualBookingAndPatch.booking_id
        r = auth_session.patch(
            f"{API}/admin/bookings/{bid}",
            json={"status": "completed"},
            timeout=20,
        )
        assert r.status_code == 200
        assert r.json()["status"] == "completed"

    def test_patch_status_to_cancelled(self, auth_session):
        bid = TestManualBookingAndPatch.booking_id
        r = auth_session.patch(
            f"{API}/admin/bookings/{bid}",
            json={"status": "cancelled"},
            timeout=20,
        )
        assert r.status_code == 200
        assert r.json()["status"] == "cancelled"

    def test_patch_unknown_id(self, auth_session):
        r = auth_session.patch(
            f"{API}/admin/bookings/nonexistent-xyz",
            json={"status": "completed"},
            timeout=20,
        )
        assert r.status_code == 404

    def test_patch_empty_body(self, auth_session):
        bid = TestManualBookingAndPatch.booking_id
        r = auth_session.patch(
            f"{API}/admin/bookings/{bid}", json={}, timeout=20
        )
        assert r.status_code == 400


# ---------- Stats ----------
class TestAdminStats:
    def test_stats_shape(self, auth_session):
        r = auth_session.get(f"{API}/admin/stats", timeout=20)
        assert r.status_code == 200
        data = r.json()
        for key in [
            "total_bookings",
            "upcoming_bookings",
            "paid_bookings",
            "pending_bookings",
            "contact_messages",
            "revenue_paise",
        ]:
            assert key in data, f"missing {key}"
            assert isinstance(data[key], int)
        assert data["total_bookings"] >= 1
        # revenue is in paise; should be >= 0; after marking paid above it's >0
        assert data["revenue_paise"] >= 0


# ---------- Public booking should NOT block when notifications are MOCKED ----------
class TestPublicBookingWithStubbedNotify:
    def test_public_booking_still_succeeds(self, session):
        payload = {
            "full_name": "TEST_PublicNotify",
            "email": "test_publicnotify@example.com",
            "phone": "+91 9876500000",
            "service_id": "marriage-match",
            "consultation_date": "2026-07-12",
            "consultation_time": "01:00 PM",
            "notes": "TEST notify mocked path",
        }
        r = session.post(f"{API}/bookings", json=payload, timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "booking_id" in data
        assert data["is_live"] is False
