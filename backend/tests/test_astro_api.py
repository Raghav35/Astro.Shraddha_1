"""Backend regression tests for Astro Shraddha API.

Covers: services, testimonials, rudraksha, bookings (manual fallback),
payments/verify (disabled path), contact, and listing endpoints.
"""

import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")
if not BASE_URL:
    # Fallback to read from frontend/.env when env not exported
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


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


# ---------- Catalogue ----------
class TestCatalogue:
    def test_services(self, session):
        r = session.get(f"{API}/services", timeout=20)
        assert r.status_code == 200
        data = r.json()
        assert isinstance(data, list) and len(data) == 2
        ids = {s["id"] for s in data}
        assert ids == {"kundli-reading", "marriage-match"}
        prices = {s["id"]: s["price_paise"] for s in data}
        assert prices["kundli-reading"] == 149900
        assert prices["marriage-match"] == 199900

    def test_testimonials(self, session):
        r = session.get(f"{API}/testimonials", timeout=20)
        assert r.status_code == 200
        data = r.json()
        types = {t["type"] for t in data}
        assert "text" in types and "video" in types
        assert len(data) >= 4

    def test_rudraksha(self, session):
        r = session.get(f"{API}/rudraksha", timeout=20)
        assert r.status_code == 200
        data = r.json()
        assert len(data) == 5  # 3 Mukhi through 7 Mukhi
        ids = {d["id"] for d in data}
        assert {"3-mukhi", "4-mukhi", "5-mukhi", "6-mukhi", "7-mukhi"} == ids
        prices = {d["id"]: d["price_paise"] for d in data}
        assert prices["3-mukhi"] == 99900
        assert prices["4-mukhi"] == 99900
        assert prices["5-mukhi"] == 99900
        assert prices["6-mukhi"] == 99900
        assert prices["7-mukhi"] == 149900
        assert all({"benefits", "name", "description", "image"} <= d.keys() for d in data)


# ---------- Bookings + manual fallback ----------
class TestBookings:
    booking_id = None

    def test_create_booking_manual_fallback(self, session):
        payload = {
            "full_name": "TEST_Booker",
            "email": "test_booker@example.com",
            "phone": "+91 9876543210",
            "service_id": "kundli-reading",
            "date_of_birth": "1995-06-12",
            "time_of_birth": "10:30",
            "place_of_birth": "Pune, MH",
            "consultation_date": "2026-03-15",
            "consultation_time": "10:00 AM",
            "notes": "TEST booking",
        }
        r = session.post(f"{API}/bookings", json=payload, timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "booking_id" in data
        assert data["is_live"] is False
        assert data["amount"] == 149900
        assert data["razorpay_order_id"] is None
        assert data["razorpay_key_id"] is None
        TestBookings.booking_id = data["booking_id"]

    def test_create_booking_invalid_service(self, session):
        payload = {
            "full_name": "TEST_X",
            "email": "x@example.com",
            "phone": "+91 9000000000",
            "service_id": "does-not-exist",
            "consultation_date": "2026-03-15",
            "consultation_time": "10:00 AM",
        }
        r = session.post(f"{API}/bookings", json=payload, timeout=20)
        assert r.status_code == 400

    def test_mark_manual_persists(self, session):
        assert TestBookings.booking_id, "Need prior booking"
        r = session.post(
            f"{API}/bookings/{TestBookings.booking_id}/mark-manual", timeout=20
        )
        assert r.status_code == 200
        body = r.json()
        assert body["status"] == "manual_pending"
        assert body["booking_id"] == TestBookings.booking_id

        # GET to verify persistence + no _id leakage (admin-gated)
        admin = session.post(
            f"{API}/admin/login",
            json={"email": "Astro.Shraddha@gmail.com", "password": "Likhite@89"},
            timeout=20,
        )
        token = admin.json()["token"]
        r = session.get(
            f"{API}/bookings",
            headers={"Authorization": f"Bearer {token}"},
            timeout=20,
        )
        assert r.status_code == 200
        items = r.json()
        match = next(
            (b for b in items if b.get("id") == TestBookings.booking_id), None
        )
        assert match, "Booking not persisted"
        assert match["payment_status"] == "manual_pending"
        assert "_id" not in match

    def test_mark_manual_unknown_id(self, session):
        r = session.post(f"{API}/bookings/nonexistent-id-xyz/mark-manual", timeout=20)
        assert r.status_code == 404

    def test_payments_verify_disabled(self, session):
        r = session.post(
            f"{API}/payments/verify",
            json={
                "booking_id": "x",
                "razorpay_order_id": "o",
                "razorpay_payment_id": "p",
                "razorpay_signature": "s",
            },
            timeout=20,
        )
        assert r.status_code == 400


# ---------- Contact ----------
class TestContact:
    def test_submit_and_list(self, session):
        payload = {
            "name": "TEST_Contact",
            "email": "test_contact@example.com",
            "phone": "+91 9123456780",
            "subject": "Question",
            "message": "TEST message please ignore",
        }
        r = session.post(f"{API}/contact", json=payload, timeout=20)
        assert r.status_code == 200
        data = r.json()
        assert data["status"] == "received"
        assert "id" in data
        cid = data["id"]

        admin = session.post(
            f"{API}/admin/login",
            json={"email": "Astro.Shraddha@gmail.com", "password": "Likhite@89"},
            timeout=20,
        )
        token = admin.json()["token"]
        r = session.get(
            f"{API}/contact",
            headers={"Authorization": f"Bearer {token}"},
            timeout=20,
        )
        assert r.status_code == 200
        items = r.json()
        assert any(c.get("id") == cid for c in items)
        # No mongo _id leakage
        assert all("_id" not in c for c in items)
