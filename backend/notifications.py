"""Notification stubs — Resend (email) + Twilio (WhatsApp).

If the corresponding env vars are empty, notifications log only — booking still
succeeds. When keys are added later, real sends happen automatically.
"""
from __future__ import annotations

import asyncio
import logging
import os

logger = logging.getLogger(__name__)


def _env(name: str) -> str:
    return os.environ.get(name, "").strip()


def email_enabled() -> bool:
    return bool(_env("RESEND_API_KEY"))


def whatsapp_enabled() -> bool:
    return bool(_env("TWILIO_ACCOUNT_SID") and _env("TWILIO_AUTH_TOKEN"))


# ---------- Resend Email ----------
async def send_email(subject: str, html: str, to: str | None = None) -> dict:
    recipient = to or _env("NOTIFY_EMAIL")
    if not recipient:
        logger.info("Email: no recipient configured, skipping")
        return {"sent": False, "reason": "no_recipient"}

    if not email_enabled():
        logger.info("[MOCK EMAIL] to=%s subject=%s", recipient, subject)
        return {"sent": False, "mocked": True}

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


# ---------- Twilio WhatsApp ----------
async def send_whatsapp(body: str, to: str | None = None) -> dict:
    recipient = to or _env("NOTIFY_WHATSAPP")
    if not recipient:
        logger.info("WhatsApp: no recipient configured, skipping")
        return {"sent": False, "reason": "no_recipient"}

    if not whatsapp_enabled():
        logger.info("[MOCK WHATSAPP] to=%s body=%s", recipient, body[:80])
        return {"sent": False, "mocked": True}

    try:
        from twilio.rest import Client  # type: ignore

        client = Client(_env("TWILIO_ACCOUNT_SID"), _env("TWILIO_AUTH_TOKEN"))
        msg = await asyncio.to_thread(
            client.messages.create,
            from_=_env("TWILIO_WHATSAPP_FROM") or "whatsapp:+14155238886",
            to=recipient,
            body=body,
        )
        logger.info("WhatsApp sent sid=%s", msg.sid)
        return {"sent": True, "sid": msg.sid}
    except Exception as e:  # noqa: BLE001
        logger.exception("WhatsApp send failed: %s", e)
        return {"sent": False, "error": str(e)}


# ---------- Booking notification ----------
def _format_booking_html(b: dict) -> str:
    rows = [
        ("Service", b.get("service_name")),
        ("Customer", b.get("full_name")),
        ("Phone (WhatsApp)", b.get("phone")),
        ("Email", b.get("email")),
        ("Appointment date", b.get("consultation_date")),
        ("Appointment time", b.get("consultation_time")),
        ("Date of birth", b.get("date_of_birth") or "—"),
        ("Time of birth", b.get("time_of_birth") or "—"),
        ("Place of birth", b.get("place_of_birth") or "—"),
        ("Notes", b.get("notes") or "—"),
        ("Payment status", b.get("payment_status")),
        ("Reference", b.get("id")),
    ]
    body = "".join(
        f'<tr><td style="padding:6px 12px;color:#6E6864;border-bottom:1px solid #EEE">{k}</td>'
        f'<td style="padding:6px 12px;color:#2D2825;border-bottom:1px solid #EEE">{v}</td></tr>'
        for k, v in rows
    )
    return f"""
    <div style="font-family:Georgia,serif;background:#FAF8F5;padding:24px;color:#2D2825">
      <h2 style="color:#BC472A;margin:0 0 8px">New booking received</h2>
      <p style="color:#6E6864;margin:0 0 18px">A consultation has been booked on AstroShraddha.</p>
      <table style="background:#fff;border-collapse:collapse;width:100%;border-radius:8px;overflow:hidden">
        {body}
      </table>
      <p style="color:#6E6864;margin-top:18px;font-size:12px">Astro Shraddha · automated notification</p>
    </div>
    """


def _format_booking_whatsapp(b: dict) -> str:
    return (
        f"🌼 *New Booking — Astro Shraddha*\n\n"
        f"*{b.get('service_name')}*\n"
        f"📅 {b.get('consultation_date')} at {b.get('consultation_time')}\n\n"
        f"👤 {b.get('full_name')}\n"
        f"📞 {b.get('phone')}\n"
        f"✉ {b.get('email')}\n"
        f"DOB: {b.get('date_of_birth') or '—'} {b.get('time_of_birth') or ''}\n"
        f"POB: {b.get('place_of_birth') or '—'}\n"
        f"Payment: {b.get('payment_status')}\n"
        f"Ref: {b.get('id')}"
    )


async def notify_new_booking(booking: dict) -> dict:
    subject = (
        f"New booking — {booking.get('service_name')} on "
        f"{booking.get('consultation_date')} {booking.get('consultation_time')}"
    )
    email_res, wa_res = await asyncio.gather(
        send_email(subject, _format_booking_html(booking)),
        send_whatsapp(_format_booking_whatsapp(booking)),
    )
    return {"email": email_res, "whatsapp": wa_res}
