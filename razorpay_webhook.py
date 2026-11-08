"""Phase 4: Server-to-Server Razorpay Webhook Handler.

Captures `payment.captured` and `payment.failed` events directly from Razorpay
so even if a customer closes their browser after UPI payment or fails payment,
MongoDB and WhatsApp team alerts stay 100% in sync.
"""
from __future__ import annotations

import hashlib
import hmac
import json
import logging
import os
from fastapi import APIRouter, HTTPException, Request

logger = logging.getLogger(__name__)
webhook_router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])


@webhook_router.post("/razorpay")
async def handle_razorpay_webhook(request: Request):
    webhook_secret = os.environ.get("RAZORPAY_WEBHOOK_SECRET", "").strip()
    raw_body = await request.body()
    signature = request.headers.get("X-Razorpay-Signature", "")

    if webhook_secret:
        expected = hmac.new(webhook_secret.encode(), raw_body, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, signature):
            raise HTTPException(status_code=400, detail="Invalid webhook signature")

    payload = json.loads(raw_body.decode("utf-8"))
    event = payload.get("event", "")
    entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
    rzp_order_id = entity.get("order_id")
    rzp_payment_id = entity.get("id")

    db = request.app.state.db
    if not rzp_order_id or db is None:
        return {"status": "ignored"}

    if event == "payment.captured":
        await db.rudraksha_orders.update_one(
            {"razorpay_order_id": rzp_order_id},
            {
                "$set": {
                    "payment_status": "paid",
                    "lead_stage": "paid_confirmed",
                    "razorpay_payment_id": rzp_payment_id,
                }
            },
        )
        return {"status": "order_marked_paid", "razorpay_order_id": rzp_order_id}

    if event == "payment.failed":
        await db.rudraksha_orders.update_one(
            {"razorpay_order_id": rzp_order_id, "payment_status": {"$ne": "paid"}},
            {
                "$set": {
                    "payment_status": "abandoned_checkout",
                    "lead_stage": "follow_up_needed",
                }
            },
        )
        return {"status": "lead_marked_for_followup", "razorpay_order_id": rzp_order_id}

    return {"status": "processed", "event": event}
