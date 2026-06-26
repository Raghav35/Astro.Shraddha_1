"""Backend regression tests for Rudraksha e-commerce flow.

Covers public catalog, order creation w/ validation, manual fallback,
verify-payment gating, admin list+patch and admin stats new fields.
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")
if not BASE_URL:
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.strip().split("=", 1)[1]
                break
assert BASE_URL, "REACT_APP_BACKEND_URL required"
API = f"{BASE_URL.rstrip('/')}/api"

ADMIN_EMAIL = "astro.shraddhamohole@gmail.com"
ADMIN_PASSWORD = "Likhite@89"


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def auth_session(session):
    r = session.post(f"{API}/admin/login",
                     json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}, timeout=20)
    assert r.status_code == 200, r.text
    token = r.json()["token"]
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json",
                      "Authorization": f"Bearer {token}"})
    return s


# ---------- Catalog ----------
class TestCatalog:
    def test_list_rudraksha(self, session):
        r = session.get(f"{API}/rudraksha", timeout=20)
        assert r.status_code == 200
        items = r.json()
        assert isinstance(items, list)
        ids = [i["id"] for i in items]
        for needed in ["3-mukhi", "4-mukhi", "5-mukhi", "6-mukhi", "7-mukhi"]:
            assert needed in ids, f"missing {needed}"
        # price assertions
        price_map = {i["id"]: i["price_paise"] for i in items}
        for low in ["3-mukhi", "4-mukhi", "5-mukhi", "6-mukhi"]:
            assert price_map[low] == 99900
        assert price_map["7-mukhi"] == 149900
        # description + image present
        for i in items:
            assert i.get("description")
            assert i.get("image", "").startswith("http")

    def test_get_single_rudraksha(self, session):
        r = session.get(f"{API}/rudraksha/5-mukhi", timeout=20)
        assert r.status_code == 200
        assert r.json()["id"] == "5-mukhi"

    def test_get_unknown_rudraksha(self, session):
        r = session.get(f"{API}/rudraksha/99-mukhi", timeout=20)
        assert r.status_code == 404


# ---------- Order create ----------
_valid_payload = {
    "rudraksha_id": "3-mukhi",
    "quantity": 2,
    "full_name": "TEST_Rudra_Buyer",
    "email": "test_rudra@example.com",
    "phone": "+91 9876543210",
    "address_line1": "TEST 12 Sample Street",
    "address_line2": "Near park",
    "city": "Pune",
    "state": "Maharashtra",
    "pincode": "411001",
    "notes": "TEST order",
}


class TestOrderCreate:
    order_id = None

    def test_create_order_success(self, session):
        r = session.post(f"{API}/rudraksha-orders", json=_valid_payload, timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["is_live"] is True  # live Razorpay keys set
        assert data["amount"] == 99900 * 2
        assert data["currency"] == "INR"
        assert "booking_id" in data
        assert data["razorpay_order_id"] is not None  # live mode
        assert data["razorpay_key_id"] is not None  # live mode
        TestOrderCreate.order_id = data["booking_id"]

    def test_invalid_rudraksha_id(self, session):
        bad = dict(_valid_payload, rudraksha_id="invalid-x")
        r = session.post(f"{API}/rudraksha-orders", json=bad, timeout=20)
        assert r.status_code == 400

    def test_invalid_pincode(self, session):
        bad = dict(_valid_payload, pincode="41100")
        r = session.post(f"{API}/rudraksha-orders", json=bad, timeout=20)
        assert r.status_code == 400

    def test_mark_manual(self, session):
        oid = TestOrderCreate.order_id
        assert oid
        r = session.post(f"{API}/rudraksha-orders/{oid}/mark-manual", timeout=20)
        assert r.status_code == 200
        assert r.json()["status"] == "manual_pending"

    def test_mark_manual_unknown(self, session):
        r = session.post(f"{API}/rudraksha-orders/non-existent-id/mark-manual", timeout=20)
        assert r.status_code == 404

    def test_verify_payment_disabled(self, session):
        r = session.post(f"{API}/rudraksha-orders/verify-payment", json={
            "order_id": "x", "razorpay_order_id": "y",
            "razorpay_payment_id": "z", "razorpay_signature": "s",
        }, timeout=20)
        assert r.status_code == 400


# ---------- Admin endpoints ----------
class TestAdminRudraksha:
    def test_list_requires_auth(self, session):
        r = session.get(f"{API}/admin/rudraksha-orders", timeout=20)
        assert r.status_code == 401

    def test_list_with_auth(self, auth_session):
        r = auth_session.get(f"{API}/admin/rudraksha-orders", timeout=20)
        assert r.status_code == 200
        docs = r.json()
        assert isinstance(docs, list)
        # Order created earlier should be present
        ids = [d["id"] for d in docs]
        assert TestOrderCreate.order_id in ids
        match = next(d for d in docs if d["id"] == TestOrderCreate.order_id)
        assert match["payment_status"] == "manual_pending"
        assert match["rudraksha_id"] == "3-mukhi"
        assert match["quantity"] == 2
        assert match["amount"] == 99900 * 2
        assert "_id" not in match

    def test_patch_paid(self, auth_session):
        oid = TestOrderCreate.order_id
        r = auth_session.patch(f"{API}/admin/rudraksha-orders/{oid}",
                               json={"payment_status": "paid"}, timeout=20)
        assert r.status_code == 200
        assert r.json()["payment_status"] == "paid"

    def test_patch_shipped(self, auth_session):
        oid = TestOrderCreate.order_id
        r = auth_session.patch(f"{API}/admin/rudraksha-orders/{oid}",
                               json={"status": "shipped"}, timeout=20)
        assert r.status_code == 200
        assert r.json()["status"] == "shipped"

    def test_patch_delivered(self, auth_session):
        oid = TestOrderCreate.order_id
        r = auth_session.patch(f"{API}/admin/rudraksha-orders/{oid}",
                               json={"status": "delivered"}, timeout=20)
        assert r.status_code == 200
        assert r.json()["status"] == "delivered"

    def test_patch_cancelled(self, auth_session):
        oid = TestOrderCreate.order_id
        r = auth_session.patch(f"{API}/admin/rudraksha-orders/{oid}",
                               json={"status": "cancelled"}, timeout=20)
        assert r.status_code == 200
        assert r.json()["status"] == "cancelled"

    def test_patch_unknown(self, auth_session):
        r = auth_session.patch(f"{API}/admin/rudraksha-orders/non-existent-xyz",
                               json={"status": "shipped"}, timeout=20)
        assert r.status_code == 404


class TestAdminStatsRudraksha:
    def test_stats_includes_rudraksha(self, auth_session):
        r = auth_session.get(f"{API}/admin/stats", timeout=20)
        assert r.status_code == 200
        data = r.json()
        for key in ["rudraksha_orders_total", "rudraksha_orders_paid",
                    "rudraksha_orders_pending", "rudraksha_revenue_paise"]:
            assert key in data, f"missing {key}"
            assert isinstance(data[key], int)
        assert data["rudraksha_orders_total"] >= 1
        # We marked one order paid earlier
        assert data["rudraksha_orders_paid"] >= 1
        assert data["rudraksha_revenue_paise"] >= 99900 * 2
