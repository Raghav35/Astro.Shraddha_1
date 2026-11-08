from fastapi import FastAPI, APIRouter, Depends, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import asyncio
import os
import re
import hmac
import hashlib
import logging
import uuid
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone, timedelta
import razorpay

from horoscope import SIGNS, SIGNS_BY_ID, horoscope_for, all_horoscopes
from admin_auth import create_admin_token, require_admin, verify_admin_password
from notifications import (
    notify_new_booking,
    notify_30min_reminder,
    notify_rudraksha_lead,
    build_wa_click_url,
    format_customer_invite_whatsapp,
    format_30min_reminder_whatsapp,
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

mongo_url = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get("DB_NAME", "astro_shraddha")]

RZP_KEY_ID = os.environ.get("RAZORPAY_KEY_ID", "").strip()
RZP_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "").strip()
RZP_ENABLED = bool(RZP_KEY_ID and RZP_KEY_SECRET)
rzp_client = razorpay.Client(auth=(RZP_KEY_ID, RZP_KEY_SECRET)) if RZP_ENABLED else None

DEFAULT_MEETING_LINK = os.environ.get(
    "DEFAULT_MEETING_LINK", "https://meet.google.com/qtr-tjyz-sqg"
)

IST = timezone(timedelta(hours=5, minutes=30))
logger = logging.getLogger(__name__)


def now_iso() -> str:
    return datetime.now(IST).isoformat()


def compute_reminder_iso(consultation_date: str, consultation_time: str) -> Optional[str]:
    """Calculates the ISO timestamp 30 minutes prior to the session in IST."""
    try:
        raw = f"{consultation_date.strip()} {consultation_time.strip()}"
        for fmt in ("%Y-%m-%d %I:%M %p", "%Y-%m-%d %H:%M"):
            try:
                dt = datetime.strptime(raw, fmt).replace(tzinfo=IST)
                reminder_dt = dt - timedelta(minutes=30)
                return reminder_dt.isoformat()
            except ValueError:
                continue
    except Exception:
        pass
    return None


# ---------------- STATIC CATALOG DATA (From Repo) ----------------
SERVICES = [
    {
        "id": "free-consultation",
        "name": "1-on-1 Vedic Consultation (Zero Upfront Fee)",
        "tagline": "Direct birth chart & remedy consultation with Astrologer Shraddha",
        "description": (
            "Book your slot without any upfront payment. Receive an instant WhatsApp "
            "session invite and automated 30-minute reminder before your consultation."
        ),
        "duration": "30 minutes",
        "price_inr": 0,
        "price_paise": 0,
        "highlights": [
            "Zero upfront payment required",
            "Instant WhatsApp meeting invite",
            "Automated 30-minute prior WhatsApp reminder",
            "Ethical remedies & Rudraksha guidance",
        ],
    },
    {
        "id": "kundli-reading",
        "name": "Kundli Reading",
        "tagline": "A complete decoding of your birth chart",
        "description": (
            "An in-depth 60-minute Vedic analysis of your janma kundli covering "
            "career, finance, relationships, health, and dosha remedies."
        ),
        "duration": "60 minutes",
        "price_inr": 500,
        "price_paise": 50000,
        "highlights": [
            "Lagna, Rashi and Navamsa chart study",
            "Mahadasha & Antardasha forecast",
            "Personalised remedy & gemstone guidance",
            "Recorded session shared on WhatsApp",
        ],
    },
    {
        "id": "marriage-match",
        "name": "Marriage Match (Kundli Milan)",
        "tagline": "Guna milan with deep compatibility insight",
        "description": (
            "Traditional Ashtakoot Guna Milan along with Mangal dosha, "
            "Nadi & emotional compatibility analysis for both partners."
        ),
        "duration": "75 minutes",
        "price_inr": 500,
        "price_paise": 50000,
        "highlights": [
            "36 guna match with detailed scoring",
            "Mangal & Nadi dosha review with remedies",
            "Best wedding muhurat suggestions",
            "Joint session for both families",
        ],
    },
]

RUDRAKSHA = [
    {
        "id": "3-mukhi",
        "name": "3 Mukhi Rudraksha",
        "mukhi": 3,
        "price_inr": 999,
        "price_paise": 99900,
        "deity": "Lord Agni",
        "ruling_planet": "Mars",
        "in_stock": True,
        "image_url": "https://images.unsplash.com/photo-1650809652935-2e5002ba40bf?w=900&auto=format&fit=crop",
        "description": (
            "Worn to dissolve guilt, past karmic burden and self-doubt. The three-faced "
            "bead is governed by Agni – sacred fire – and is said to gently burn away "
            "what no longer serves the wearer. Excellent for those carrying chronic stress or low confidence."
        ),
        "benefits": [
            "Releases past trauma and self-doubt",
            "Boosts confidence and willpower",
            "Strengthens the solar plexus and digestion",
        ],
    },
    {
        "id": "4-mukhi",
        "name": "4 Mukhi Rudraksha",
        "mukhi": 4,
        "price_inr": 999,
        "price_paise": 99900,
        "deity": "Lord Brahma",
        "ruling_planet": "Mercury",
        "in_stock": True,
        "image_url": "https://images.unsplash.com/photo-1650809652995-85581c240f19?w=900&auto=format&fit=crop",
        "description": (
            "The bead of clarity and intelligent expression. Ruled by Brahma and Budh (Mercury), "
            "it is traditionally worn by students, researchers, writers and speakers to sharpen "
            "memory, articulation and creative thought."
        ),
        "benefits": [
            "Improves memory, focus and learning",
            "Enhances communication and creativity",
            "Supports the throat chakra",
        ],
    },
    {
        "id": "5-mukhi",
        "name": "5 Mukhi Rudraksha",
        "mukhi": 5,
        "price_inr": 999,
        "price_paise": 99900,
        "deity": "Kalagni Rudra",
        "ruling_planet": "Jupiter",
        "in_stock": True,
        "image_url": "https://images.unsplash.com/photo-1685419368164-eb624c946062?w=900&auto=format&fit=crop",
        "description": (
            "The most universally worn Rudraksha – safe for every chart. Five Mukhi is "
            "associated with Guru (Jupiter) and Kalagni Rudra, and is celebrated for calming "
            "the nervous system, lowering blood pressure and supporting wisdom in everyday life."
        ),
        "benefits": [
            "Reduces stress and blood pressure",
            "Boosts wisdom, ethics and patience",
            "Universal – suitable for everyone",
        ],
    },
    {
        "id": "6-mukhi",
        "name": "6 Mukhi Rudraksha",
        "mukhi": 6,
        "price_inr": 999,
        "price_paise": 99900,
        "deity": "Lord Kartikeya",
        "ruling_planet": "Venus",
        "in_stock": True,
        "image_url": "https://images.unsplash.com/photo-1604357209793-fca5dca89f97?w=900",
        "description": (
            "The bead of charm, beauty and emotional balance. Governed by Shukra (Venus) "
            "and Kartikeya, it gently lifts the heart, supports relationships, artistic "
            "expression and reproductive health. Loved by creative professionals."
        ),
        "benefits": [
            "Harmonises love and relationships",
            "Awakens creativity and artistic flow",
            "Supports reproductive and emotional health",
        ],
    },
    {
        "id": "7-mukhi",
        "name": "7 Mukhi Rudraksha",
        "mukhi": 7,
        "price_inr": 1499,
        "price_paise": 149900,
        "deity": "Maa Mahalakshmi",
        "ruling_planet": "Saturn",
        "in_stock": True,
        "image_url": "https://images.unsplash.com/photo-1622993361118-b6365d859ab6?w=900&auto=format&fit=crop",
        "description": (
            "The Lakshmi bead – sought after for abundance, business growth and protection "
            "against Shani dosha. Seven Mukhi is revered for removing financial stagnation "
            "and inviting steady, ethical prosperity into the wearer's life."
        ),
        "benefits": [
            "Attracts wealth and steady prosperity",
            "Removes Shani (Saturn) dosha effects",
            "Supports business and career growth",
        ],
    },
]

TESTIMONIALS = [
    {
        "id": "t1",
        "name": "Priya Sharma",
        "city": "Pune",
        "rating": 5,
        "type": "text",
        "quote": (
            "Her Kundli reading was incredibly accurate. The remedies she "
            "suggested brought real clarity in my career within months."
        ),
    },
    {
        "id": "t2",
        "name": "Rahul Deshmukh",
        "city": "Mumbai",
        "rating": 5,
        "type": "text",
        "quote": (
            "We did the Marriage Match before our engagement. The honesty and "
            "depth of her analysis is unmatched. Truly trustworthy."
        ),
    },
    {
        "id": "t3",
        "name": "Anita Kulkarni",
        "city": "Nashik",
        "rating": 5,
        "type": "video",
        "quote": "Recommended Rudraksha that genuinely calmed my anxiety.",
        "video_thumbnail": "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=800",
    },
    {
        "id": "t4",
        "name": "Sandeep Iyer",
        "city": "Bengaluru",
        "rating": 5,
        "type": "text",
        "quote": (
            "Calm, kind and grounded. Her readings feel like a conversation "
            "with a trusted family elder."
        ),
    },
    {
        "id": "t5",
        "name": "Meera Joshi",
        "city": "Delhi",
        "rating": 5,
        "type": "video",
        "quote": "The most accurate Mahadasha forecast I've ever received.",
        "video_thumbnail": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=800",
    },
]


# ---------------- PYDANTIC MODELS ----------------
class Booking(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    full_name: str
    email: Optional[str] = "client@astroshraddha.in"
    phone: str
    service_id: str = "free-consultation"
    service_name: str = "1-on-1 Vedic Consultation"
    amount: int = 0  # 0 for zero-payment consultation
    date_of_birth: Optional[str] = None
    time_of_birth: Optional[str] = None
    place_of_birth: Optional[str] = None
    consultation_date: str
    consultation_time: str
    notes: Optional[str] = None
    payment_status: str = "free_confirmed"  # free_confirmed | pending | paid | failed
    status: str = "upcoming"  # upcoming | completed | cancelled
    meeting_link: str = DEFAULT_MEETING_LINK
    whatsapp_invite_url: Optional[str] = None
    reminder_scheduled_at: Optional[str] = None
    reminder_sent: bool = False
    reminder_sent_at: Optional[str] = None
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    created_at: str = Field(default_factory=now_iso)


class BookingCreate(BaseModel):
    full_name: str
    email: Optional[str] = "client@astroshraddha.in"
    phone: str
    service_id: str = "free-consultation"
    date_of_birth: Optional[str] = None
    time_of_birth: Optional[str] = None
    place_of_birth: Optional[str] = None
    consultation_date: str
    consultation_time: str
    notes: Optional[str] = None
    is_free: bool = True


class OrderResponse(BaseModel):
    booking_id: str
    razorpay_order_id: Optional[str] = None
    razorpay_key_id: Optional[str] = None
    amount: int = 0
    currency: str = "INR"
    is_live: bool = False
    is_free: bool = True
    meeting_link: str = DEFAULT_MEETING_LINK
    whatsapp_invite_url: Optional[str] = None
    reminder_scheduled_at: Optional[str] = None


class PaymentVerify(BaseModel):
    booking_id: str
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class RudrakshaOrder(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    rudraksha_id: str
    rudraksha_name: str
    quantity: int = 1
    unit_price_paise: int
    amount: int  # total in paise
    full_name: str
    email: Optional[str] = "buyer@astroshraddha.in"
    phone: str
    address_line1: str
    address_line2: Optional[str] = None
    city: str = "Pune"
    state: str = "Maharashtra"
    pincode: str = ""
    notes: Optional[str] = None
    payment_status: str = "payment_initiated"  # payment_initiated | paid | abandoned_checkout | failed
    lead_stage: str = "checkout_opened"  # checkout_opened | paid_confirmed | follow_up_needed | contacted
    status: str = "new"  # new | contacted | shipped | delivered | cancelled
    team_whatsapp_url: Optional[str] = None
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    created_at: str = Field(default_factory=now_iso)


class RudrakshaOrderCreate(BaseModel):
    rudraksha_id: str
    quantity: int = 1
    full_name: str
    email: Optional[str] = "buyer@astroshraddha.in"
    phone: str
    address_line1: str
    address_line2: Optional[str] = None
    city: str = "Pune"
    state: str = "Maharashtra"
    pincode: str = ""
    notes: Optional[str] = None


class RudrakshaPaymentVerify(BaseModel):
    order_id: str
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


class RudrakshaInquiry(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    phone: str
    date_of_birth: Optional[str] = None
    time_of_birth: Optional[str] = None
    place_of_birth: Optional[str] = None
    question: Optional[str] = None
    created_at: str = Field(default_factory=now_iso)
    status: str = "new"


class RudrakshaInquiryCreate(BaseModel):
    name: str
    phone: str
    date_of_birth: Optional[str] = None
    time_of_birth: Optional[str] = None
    place_of_birth: Optional[str] = None
    question: Optional[str] = None


class ContactMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: EmailStr
    phone: Optional[str] = None
    subject: Optional[str] = None
    message: str
    created_at: str = Field(default_factory=now_iso)


class ContactCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    subject: Optional[str] = None
    message: str


class AdminLogin(BaseModel):
    email: str
    password: str


class BookingUpdate(BaseModel):
    status: Optional[str] = None
    payment_status: Optional[str] = None
    meeting_link: Optional[str] = None
    notes: Optional[str] = None


class RudrakshaOrderUpdate(BaseModel):
    status: Optional[str] = None
    payment_status: Optional[str] = None
    lead_stage: Optional[str] = None
    notes: Optional[str] = None


# ---------------- FASTAPI ROUTER ----------------
app = FastAPI(title="Astro Shraddha API")
api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    return {"message": "Astro Shraddha API running", "razorpay_live": RZP_ENABLED}


@api_router.get("/services")
async def get_services():
    return SERVICES


@api_router.get("/testimonials")
async def get_testimonials():
    return TESTIMONIALS


@api_router.get("/rudraksha")
async def list_rudraksha():
    return RUDRAKSHA


@api_router.get("/rudraksha/{rudraksha_id}")
async def get_rudraksha_detail(rudraksha_id: str):
    for item in RUDRAKSHA:
        if item["id"] == rudraksha_id:
            return item
    raise HTTPException(status_code=404, detail="Rudraksha not found")


@api_router.get("/horoscope")
async def get_all_horoscopes():
    return all_horoscopes()


@api_router.get("/horoscope/{sign_id}")
async def get_sign_horoscope(sign_id: str):
    if sign_id not in SIGNS_BY_ID:
        raise HTTPException(status_code=404, detail="Sign not found")
    return horoscope_for(sign_id)


# ---------------- ZERO-PAYMENT CONSULTATION BOOKING ----------------
@api_router.post("/bookings", response_model=OrderResponse)
@api_router.post("/bookings/free", response_model=OrderResponse)
async def create_booking(payload: BookingCreate):
    service = next((s for s in SERVICES if s["id"] == payload.service_id), SERVICES[0])
    is_free = payload.is_free or service["price_paise"] == 0

    reminder_iso = compute_reminder_iso(payload.consultation_date, payload.consultation_time)
    booking_obj = Booking(
        full_name=payload.full_name,
        email=payload.email or "client@astroshraddha.in",
        phone=payload.phone,
        service_id=service["id"],
        service_name=service["name"],
        amount=0 if is_free else service["price_paise"],
        date_of_birth=payload.date_of_birth,
        time_of_birth=payload.time_of_birth,
        place_of_birth=payload.place_of_birth,
        consultation_date=payload.consultation_date,
        consultation_time=payload.consultation_time,
        notes=payload.notes,
        payment_status="free_confirmed" if is_free else "pending",
        meeting_link=DEFAULT_MEETING_LINK,
        reminder_scheduled_at=reminder_iso,
    )

    booking_dict = booking_obj.model_dump()
    invite_text = format_customer_invite_whatsapp(booking_dict)
    booking_dict["whatsapp_invite_url"] = build_wa_click_url(payload.phone, invite_text)

    if not is_free and RZP_ENABLED and rzp_client:
        rzp_order = rzp_client.order.create({
            "amount": booking_dict["amount"],
            "currency": "INR",
            "payment_capture": 1,
            "notes": {"booking_id": booking_dict["id"], "phone": payload.phone},
        })
        booking_dict["razorpay_order_id"] = rzp_order["id"]

    await db.bookings.insert_one(dict(booking_dict))

    # Fire instant WhatsApp invite + Admin notification
    await notify_new_booking(booking_dict)

    return OrderResponse(
        booking_id=booking_dict["id"],
        razorpay_order_id=booking_dict.get("razorpay_order_id"),
        razorpay_key_id=RZP_KEY_ID if RZP_ENABLED else None,
        amount=booking_dict["amount"],
        is_live=RZP_ENABLED and not is_free,
        is_free=is_free,
        meeting_link=booking_dict["meeting_link"],
        whatsapp_invite_url=booking_dict["whatsapp_invite_url"],
        reminder_scheduled_at=reminder_iso,
    )


# ---------------- RUDRAKSHA PRE-PAYMENT LEAD CAPTURE & CHECKOUT ----------------
@api_router.post("/rudraksha-orders")
@api_router.post("/leads/rudraksha-intent")
async def create_rudraksha_order_and_capture_lead(payload: RudrakshaOrderCreate):
    """
    Stores customer record in MongoDB IMMEDIATELY when they click 'Proceed to Pay',
    before Razorpay checkout finishes, so the team can contact & guide every lead.
    """
    item = next((r for r in RUDRAKSHA if r["id"] == payload.rudraksha_id), RUDRAKSHA[0])
    total_paise = item["price_paise"] * max(1, payload.quantity)

    order_obj = RudrakshaOrder(
        rudraksha_id=item["id"],
        rudraksha_name=item["name"],
        quantity=payload.quantity,
        unit_price_paise=item["price_paise"],
        amount=total_paise,
        full_name=payload.full_name,
        email=payload.email or "buyer@astroshraddha.in",
        phone=payload.phone,
        address_line1=payload.address_line1,
        address_line2=payload.address_line2,
        city=payload.city,
        state=payload.state,
        pincode=payload.pincode,
        notes=payload.notes,
        payment_status="payment_initiated",
        lead_stage="checkout_opened",
        status="new",
    )

    order_dict = order_obj.model_dump()
    followup_msg = (
        f"Namaste {payload.full_name} Ji, this is Astrologer Shraddha's team from Pune "
        f"regarding your order/inquiry for {item['name']}. How can we assist you with Gotra energization & delivery?"
    )
    order_dict["team_whatsapp_url"] = build_wa_click_url(payload.phone, followup_msg)

    if RZP_ENABLED and rzp_client:
        rzp_order = rzp_client.order.create({
            "amount": total_paise,
            "currency": "INR",
            "payment_capture": 1,
            "notes": {
                "order_id": order_dict["id"],
                "rudraksha": item["name"],
                "customer_phone": payload.phone,
            },
        })
        order_dict["razorpay_order_id"] = rzp_order["id"]

    await db.rudraksha_orders.insert_one(dict(order_dict))

    # Alert Astrologer Shraddha's team immediately that a customer initiated payment
    await notify_rudraksha_lead(order_dict)

    return {
        "order_id": order_dict["id"],
        "razorpay_order_id": order_dict.get("razorpay_order_id"),
        "razorpay_key_id": RZP_KEY_ID if RZP_ENABLED else None,
        "amount": total_paise,
        "currency": "INR",
        "is_live": RZP_ENABLED,
        "lead_saved": True,
        "team_whatsapp_url": order_dict["team_whatsapp_url"],
    }


@api_router.post("/rudraksha-orders/verify")
async def verify_rudraksha_payment(payload: RudrakshaPaymentVerify):
    if RZP_ENABLED and RZP_KEY_SECRET:
        msg = f"{payload.razorpay_order_id}|{payload.razorpay_payment_id}".encode()
        expected = hmac.new(RZP_KEY_SECRET.encode(), msg, hashlib.sha256).hexdigest()
        if not hmac.compare_digest(expected, payload.razorpay_signature):
            raise HTTPException(status_code=400, detail="Invalid Razorpay signature")

    await db.rudraksha_orders.update_one(
        {"id": payload.order_id},
        {
            "$set": {
                "payment_status": "paid",
                "lead_stage": "paid_confirmed",
                "razorpay_payment_id": payload.razorpay_payment_id,
            }
        },
    )
    order_doc = await db.rudraksha_orders.find_one({"id": payload.order_id}, {"_id": 0})
    if order_doc:
        await notify_rudraksha_lead(order_doc)
    return {"verified": True, "order_id": payload.order_id, "payment_status": "paid"}


@api_router.post("/rudraksha-orders/{order_id}/abandon")
async def mark_rudraksha_checkout_abandoned(order_id: str):
    """Marks the lead as 'abandoned_checkout' when the payment modal is closed so the team can follow up."""
    await db.rudraksha_orders.update_one(
        {"id": order_id, "payment_status": {"$ne": "paid"}},
        {
            "$set": {
                "payment_status": "abandoned_checkout",
                "lead_stage": "follow_up_needed",
            }
        },
    )
    return {"order_id": order_id, "payment_status": "abandoned_checkout", "lead_stage": "follow_up_needed"}


# ---------------- ADMIN & TEAM ENDPOINTS ----------------
@api_router.post("/admin/login")
async def admin_login(payload: AdminLogin):
    if not verify_admin_password(payload.email, payload.password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return {"token": create_admin_token(), "email": payload.email}


@api_router.get("/admin/bookings")
async def admin_list_bookings(_: dict = Depends(require_admin)):
    cursor = db.bookings.find({}, {"_id": 0}).sort("created_at", -1)
    return await cursor.to_list(length=500)


@api_router.patch("/admin/bookings/{booking_id}")
async def admin_update_booking(booking_id: str, payload: BookingUpdate, _: dict = Depends(require_admin)):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    await db.bookings.update_one({"id": booking_id}, {"$set": updates})
    return await db.bookings.find_one({"id": booking_id}, {"_id": 0})


@api_router.post("/admin/bookings/{booking_id}/send-reminder")
async def admin_trigger_30min_reminder(booking_id: str, _: dict = Depends(require_admin)):
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    res = await notify_30min_reminder(booking)
    await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {"reminder_sent": True, "reminder_sent_at": now_iso()}},
    )
    return {"sent": True, "details": res}


@api_router.get("/admin/rudraksha-orders")
async def admin_list_rudraksha_orders(_: dict = Depends(require_admin)):
    cursor = db.rudraksha_orders.find({}, {"_id": 0}).sort("created_at", -1)
    return await cursor.to_list(length=500)


@api_router.patch("/admin/rudraksha-orders/{order_id}")
async def admin_update_rudraksha_order(order_id: str, payload: RudrakshaOrderUpdate, _: dict = Depends(require_admin)):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    await db.rudraksha_orders.update_one({"id": order_id}, {"$set": updates})
    return await db.rudraksha_orders.find_one({"id": order_id}, {"_id": 0})


@api_router.get("/admin/stats")
async def admin_dashboard_stats(_: dict = Depends(require_admin)):
    total_bookings = await db.bookings.count_documents({})
    reminders_sent = await db.bookings.count_documents({"reminder_sent": True})
    total_rudraksha_leads = await db.rudraksha_orders.count_documents({})
    paid_rudraksha = await db.rudraksha_orders.count_documents({"payment_status": "paid"})
    followup_leads = await db.rudraksha_orders.count_documents(
        {"payment_status": {"$in": ["payment_initiated", "abandoned_checkout"]}}
    )
    return {
        "total_bookings": total_bookings,
        "reminders_sent": reminders_sent,
        "total_rudraksha_leads": total_rudraksha_leads,
        "paid_rudraksha": paid_rudraksha,
        "followup_leads": followup_leads,
    }


# ---------------- 30-MINUTE REMINDER BACKGROUND WORKER ----------------
async def reminder_scheduler_loop():
    """Polls MongoDB every 60 seconds and fires WhatsApp reminders 30 minutes before session time."""
    while True:
        try:
            now_str = now_iso()
            due_cursor = db.bookings.find(
                {
                    "reminder_sent": False,
                    "status": "upcoming",
                    "reminder_scheduled_at": {"$ne": None, "$lte": now_str},
                },
                {"_id": 0},
            )
            due_bookings = await due_cursor.to_list(length=50)
            for b in due_bookings:
                await notify_30min_reminder(b)
                await db.bookings.update_one(
                    {"id": b["id"]},
                    {"$set": {"reminder_sent": True, "reminder_sent_at": now_iso()}},
                )
                logger.info("Sent 30-min WhatsApp reminder for booking id=%s", b["id"])
        except Exception as exc:  # noqa: BLE001
            logger.exception("Reminder scheduler error: %s", exc)
        await asyncio.sleep(60)


@app.on_event("startup")
async def start_background_tasks():
    asyncio.create_task(reminder_scheduler_loop())


app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
