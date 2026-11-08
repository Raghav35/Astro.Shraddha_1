"""Notification handlers – Resend (email) + Twilio / WhatsApp Cloud / Interakt (WhatsApp).

Supports:
1. Instant booking confirmation + meeting invite on WhatsApp & Email
2. 30-minute prior session reminder on WhatsApp & Email
3. Pre-payment Rudraksha lead alert to Astrologer Shraddha's sales team (7499778268)
"""
from __future__ import annotations

import asyncio
import logging
import os
from urllib.parse import quote
import aiohttp

logger = logging.getLogger(__name__)

ASTROLOGER_WHATSAPP = "917499778268"
ASTROLOGER_EMAIL = "astro.shraddhamohole@gmail.com"


def _env(name: str) -> str:
    return os.environ.get(name, "").strip()


def email_enabled() -> bool:
    return bool(_env("RESEND_API_KEY"))


def whatsapp_enabled() -> bool:
    return bool(
        (_env("TWILIO_ACCOUNT_SID") and _env("TWILIO_AUTH_TOKEN"))
        or _env("WHATSAPP_WEBHOOK_URL")
    )


def format_indian_phone(phone: str) -> str:
    digits = "".join(ch for ch in (phone or "") if ch.isdigit())
    if len(digits) == 10:
        return f"91{digits}"
    if digits.startswith("91") and len(digits) == 12:
        return digits
    return digits or ASTROLOGER_WHATSAPP


def build_wa_click_url(phone: str, message: str) -> str:
    clean_phone = format_indian_phone(phone)
    return f"https://wa.me/{clean_phone}?text={quote(message)}"


# ---------- Resend Email ----------
async def send_email(subject: str, html: str, to: str | None = None) -> dict:
    recipient = to or _env("NOTIFY_EMAIL") or ASTROLOGER_EMAIL
    if not recipient:
        logger.info("Email: no recipient configured, skipping")
        return {"sent": False, "reason": "no_recipient"}

    if not email_enabled():
        logger.info("[MOCK EMAIL] to=%s subject=%s", recipient, subject)
        return {"sent": False, "mocked": True, "to": recipient}

    try:
        import resend  # type: ignore

        resend.api_key = _env("RESEND_API_KEY")
        params = {
            "from": _env("SENDER_EMAIL") or "onboarding@resend.dev",
            "to": [recipient],
            "subject": subject,
            "html": html,
        }
        res = await asyncio.to_thread(resend.Emails.send, params)
        logger.info("Email sent id=%s", res.get("id"))
        return {"sent": True, "id": res.get("id")}
    except Exception as e:  # noqa: BLE001
        logger.exception("Email send failed: %s", e)
        return {"sent": False, "error": str(e)}


# ---------- WhatsApp (Twilio or Indian Provider Webhook like Interakt/AiSensy/Wati) ----------
async def send_whatsapp(body: str, to: str | None = None) -> dict:
    raw_target = to or _env("NOTIFY_WHATSAPP") or ASTROLOGER_WHATSAPP
    clean_phone = format_indian_phone(raw_target)

    # Option A: Custom Indian WhatsApp Provider Webhook (Interakt / AiSensy / Wati)
    webhook_url = _env("WHATSAPP_WEBHOOK_URL")
    if webhook_url:
        try:
            async with aiohttp.ClientSession() as session:
                payload = {"phone": f"+{clean_phone}", "message": body}
                headers = {}
                if _env("WHATSAPP_API_KEY"):
                    headers["Authorization"] = f"Bearer {_env('WHATSAPP_API_KEY')}"
                async with session.post(webhook_url, json=payload, headers=headers, timeout=10) as resp:
                    return {"sent": resp.status < 300, "status": resp.status, "provider": "webhook"}
        except Exception as e:  # noqa: BLE001
            logger.exception("WhatsApp webhook failed: %s", e)
            return {"sent": False, "error": str(e)}

    # Option B: Twilio WhatsApp API
    if _env("TWILIO_ACCOUNT_SID") and _env("TWILIO_AUTH_TOKEN"):
        try:
            from twilio.rest import Client  # type: ignore

            twilio_to = f"whatsapp:+{clean_phone}" if not raw_target.startswith("whatsapp:") else raw_target
            client = Client(_env("TWILIO_ACCOUNT_SID"), _env("TWILIO_AUTH_TOKEN"))
            msg = await asyncio.to_thread(
                client.messages.create,
                from_=_env("TWILIO_WHATSAPP_FROM") or "whatsapp:+14155238886",
                to=twilio_to,
                body=body,
            )
            logger.info("WhatsApp sent sid=%s", msg.sid)
            return {"sent": True, "sid": msg.sid, "provider": "twilio"}
        except Exception as e:  # noqa: BLE001
            logger.exception("WhatsApp send failed: %s", e)
            return {"sent": False, "error": str(e)}

    logger.info("[MOCK WHATSAPP] to=+%s body=%s", clean_phone, body[:100])
    return {
        "sent": False,
        "mocked": True,
        "to": f"+{clean_phone}",
        "wa_link": build_wa_click_url(clean_phone, body),
    }


# ---------- Formatting Helpers ----------
def format_customer_invite_whatsapp(b: dict) -> str:
    meet_link = b.get("meeting_link") or "https://meet.google.com/qtr-tjyz-sqg"
    return (
        f"🙏 *Namaste {b.get('full_name')} Ji,*

"
        f"Your 1-on-1 Vedic Astrology Consultation with *Astrologer Shraddha Mohole* "
        f"(Jyotish Pandit, Pune) is *CONFIRMED*.

"
        f"🔮 *Topic:* {b.get('service_name')}
"
        f"📅 *Date:* {b.get('consultation_date')}
"
        f"⏰ *Time:* {b.get('consultation_time')} (IST)
"
        f"🔗 *Session Link:* {meet_link}
"
        f"💳 *Fee:* Zero Upfront Payment

"
        f"📌 *Birth Details Recorded:*
"
        f"DOB: {b.get('date_of_birth') or '-'} | Time: {b.get('time_of_birth') or '-'} | Place: {b.get('place_of_birth') or '-'}

"
        f"🔔 You will receive an automated reminder 30 minutes before your session starts.
"
        f"For any assistance, reply here on WhatsApp (+91 74997 78268)."
    )


def format_30min_reminder_whatsapp(b: dict) -> str:
    meet_link = b.get("meeting_link") or "https://meet.google.com/qtr-tjyz-sqg"
    return (
        f"⏰ *30-Minute Session Reminder – Astro Shraddha*

"
        f"Namaste *{b.get('full_name')} Ji*, your Vedic consultation with "
        f"*Astrologer Shraddha Mohole* starts in *30 minutes* ({b.get('consultation_time')} IST).

"
        f"🔗 *Join Session Here:* {meet_link}
"
        f"📞 *Direct WhatsApp Call Backup:* +91 74997 78268

"
        f"Please keep your birth details handy. Hari Om!"
    )


def _format_booking_html(b: dict) -> str:
    rows = [
        ("Service", b.get("service_name")),
        ("Customer", b.get("full_name")),
        ("Phone (WhatsApp)", b.get("phone")),
        ("Email", b.get("email") or "-"),
        ("Appointment date", b.get("consultation_date")),
        ("Appointment time", b.get("consultation_time")),
        ("Date of birth", b.get("date_of_birth") or "-"),
        ("Time of birth", b.get("time_of_birth") or "-"),
        ("Place of birth", b.get("place_of_birth") or "-"),
        ("Notes", b.get("notes") or "-"),
        ("Payment status", b.get("payment_status")),
        ("Meeting link", b.get("meeting_link") or "-"),
        ("Reference", b.get("id")),
    ]
    body = "".join(
        f'<tr><td style="padding:6px 12px;color:#6E6864;border-bottom:1px solid #EEE">{k}</td>'
        f'<td style="padding:6px 12px;color:#2D2825;border-bottom:1px solid #EEE">{v}</td></tr>'
        for k, v in rows
    )
    return f"""
<div style="font-family:Georgia,serif;background:#FAF8F5;padding:24px;color:#2D2825">
  <h2 style="color:#BC472A;margin:0 0 8px">New Consultation Booking Received</h2>
  <p style="color:#6E6864;margin:0 0 18px">A consultation has been booked on AstroShraddha.</p>
  <table style="background:#fff;border-collapse:collapse;width:100%;border-radius:8px;overflow:hidden">
    {body}
  </table>
</div>
"""


def _format_booking_whatsapp(b: dict) -> str:
    return (
        f"🌼 *New Booking – Astro Shraddha*

"
        f"*{b.get('service_name')}*
"
        f"📅 {b.get('consultation_date')} at {b.get('consultation_time')}
"
        f"👤 {b.get('full_name')}
"
        f"📞 {b.get('phone')}
"
        f"DOB: {b.get('date_of_birth') or '-'} {b.get('time_of_birth') or ''}
"
        f"POB: {b.get('place_of_birth') or '-'}
"
        f"Payment: {b.get('payment_status')}
"
        f"Ref: {b.get('id')}"
    )


def format_rudraksha_lead_whatsapp(order: dict) -> str:
    inr = int(order.get("amount", 0)) // 100
    return (
        f"📿 *Rudraksha Lead Captured – Astro Shraddha*

"
        f"*Bead:* {order.get('rudraksha_name')} (Qty: {order.get('quantity', 1)})
"
        f"*Amount:* ₹{inr}
"
        f"*Stage:* {order.get('payment_status')} ({order.get('lead_stage', 'checkout_opened')})
"
        f"👤 *Customer:* {order.get('full_name')}
"
        f"📞 *WhatsApp:* {order.get('phone')}
"
        f"📍 *Address:* {order.get('address_line1')}, {order.get('city')}, {order.get('state')} - {order.get('pincode')}
"
        f"📝 *Notes/Gotra:* {order.get('notes') or '-'}
"
        f"Ref: {order.get('id')}"
    )


async def notify_new_booking(booking: dict) -> dict:
    subject = (
        f"New booking – {booking.get('service_name')} on "
        f"{booking.get('consultation_date')} {booking.get('consultation_time')}"
    )
    customer_invite_text = format_customer_invite_whatsapp(booking)
    admin_alert_text = _format_booking_whatsapp(booking)

    email_res, admin_wa_res, cust_wa_res = await asyncio.gather(
        send_email(subject, _format_booking_html(booking)),
        send_whatsapp(admin_alert_text, to=ASTROLOGER_WHATSAPP),
        send_whatsapp(customer_invite_text, to=booking.get("phone")),
    )
    return {
        "email": email_res,
        "admin_whatsapp": admin_wa_res,
        "customer_whatsapp": cust_wa_res,
        "customer_wa_click_url": build_wa_click_url(booking.get("phone", ""), customer_invite_text),
    }


async def notify_30min_reminder(booking: dict) -> dict:
    reminder_text = format_30min_reminder_whatsapp(booking)
    admin_reminder = (
        f"🔔 *Upcoming Session in 30 Mins*
"
        f"Client: {booking.get('full_name')} ({booking.get('phone')})
"
        f"Slot: {booking.get('consultation_date')} at {booking.get('consultation_time')}
"
        f"Service: {booking.get('service_name')}"
    )
    cust_wa, admin_wa = await asyncio.gather(
        send_whatsapp(reminder_text, to=booking.get("phone")),
        send_whatsapp(admin_reminder, to=ASTROLOGER_WHATSAPP),
    )
    return {
        "customer_whatsapp": cust_wa,
        "admin_whatsapp": admin_wa,
        "customer_wa_click_url": build_wa_click_url(booking.get("phone", ""), reminder_text),
    }


async def notify_rudraksha_lead(order: dict) -> dict:
    lead_msg = format_rudraksha_lead_whatsapp(order)
    admin_wa = await send_whatsapp(lead_msg, to=ASTROLOGER_WHATSAPP)
    customer_followup_msg = (
        f"Namaste {order.get('full_name')} Ji, thank you for choosing the Lab-Certified "
        f"*{order.get('rudraksha_name')}* from Astro Shraddha (Pune). "
        f"Our team is here to guide you with Vedic Pran-Pratishtha (Gotra & Name energization) and dispatch."
    )
    return {
        "admin_whatsapp": admin_wa,
        "team_followup_wa_url": build_wa_click_url(order.get("phone", ""), customer_followup_msg),
    }
