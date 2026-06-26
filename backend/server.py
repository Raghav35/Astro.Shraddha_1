from fastapi import FastAPI, APIRouter, Depends, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import re
import hmac
import hashlib
import logging
import uuid
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone

import razorpay

from horoscope import SIGNS, SIGNS_BY_ID, horoscope_for, all_horoscopes
from admin_auth import (
    create_admin_token,
    require_admin,
    verify_admin_password,
)
from notifications import notify_new_booking


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

RZP_KEY_ID = os.environ.get("RAZORPAY_KEY_ID", "").strip()
RZP_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "").strip()
RZP_ENABLED = bool(RZP_KEY_ID and RZP_KEY_SECRET)
rzp_client = razorpay.Client(auth=(RZP_KEY_ID, RZP_KEY_SECRET)) if RZP_ENABLED else None

app = FastAPI(title="Astro Shraddha API")
api_router = APIRouter(prefix="/api")


# ---------- Models ----------
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class Booking(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    full_name: str
    email: EmailStr
    phone: str
    service_id: str
    service_name: str
    amount: int  # in paise
    date_of_birth: Optional[str] = None
    time_of_birth: Optional[str] = None
    place_of_birth: Optional[str] = None
    consultation_date: str  # ISO date string
    consultation_time: str
    notes: Optional[str] = None
    payment_status: str = "pending"  # pending | paid | failed
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    created_at: str = Field(default_factory=now_iso)


class BookingCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    service_id: str
    date_of_birth: Optional[str] = None
    time_of_birth: Optional[str] = None
    place_of_birth: Optional[str] = None
    consultation_date: str
    consultation_time: str
    notes: Optional[str] = None


class OrderResponse(BaseModel):
    booking_id: str
    razorpay_order_id: Optional[str]
    razorpay_key_id: Optional[str]
    amount: int
    currency: str = "INR"
    is_live: bool


class PaymentVerify(BaseModel):
    booking_id: str
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


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


# ---------- Rudraksha orders ----------
class RudrakshaOrder(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    rudraksha_id: str
    rudraksha_name: str
    quantity: int = 1
    unit_price_paise: int
    amount: int  # total in paise
    full_name: str
    email: EmailStr
    phone: str
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    state: str
    pincode: str
    notes: Optional[str] = None
    payment_status: str = "pending"
    status: str = "new"  # new | shipped | delivered | cancelled
    razorpay_order_id: Optional[str] = None
    razorpay_payment_id: Optional[str] = None
    created_at: str = Field(default_factory=now_iso)


class RudrakshaOrderCreate(BaseModel):
    rudraksha_id: str
    quantity: int = 1
    full_name: str
    email: EmailStr
    phone: str
    address_line1: str
    address_line2: Optional[str] = None
    city: str
    state: str
    pincode: str
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
    status: str = "new"  # new | replied | closed


class RudrakshaInquiryCreate(BaseModel):
    name: str
    phone: str
    date_of_birth: Optional[str] = None
    time_of_birth: Optional[str] = None
    place_of_birth: Optional[str] = None
    question: Optional[str] = None


# ---------- Static catalog ----------
SERVICES = [
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


RUDRAKSHA = [
    {
        "id": "3-mukhi",
        "mukhi": 3,
        "name": "3 Mukhi Rudraksha",
        "deity": "Lord Agni",
        "planet": "Mars",
        "image": "https://images.unsplash.com/photo-1650809652935-2e5002ba40bf?w=900&auto=format&fit=crop",
        "price_inr": 999,
        "price_paise": 99900,
        "in_stock": True,
        "description": (
            "Worn to dissolve guilt, past karmic burden and self-doubt. The "
            "three-faced bead is governed by Agni — sacred fire — and is said "
            "to gently burn away what no longer serves the wearer. Excellent "
            "for those carrying chronic stress or low confidence."
        ),
        "benefits": [
            "Releases past trauma and self-doubt",
            "Boosts confidence and willpower",
            "Strengthens the solar plexus and digestion",
        ],
    },
    {
        "id": "4-mukhi",
        "mukhi": 4,
        "name": "4 Mukhi Rudraksha",
        "deity": "Lord Brahma",
        "planet": "Mercury",
        "image": "https://images.unsplash.com/photo-1650809652995-85581c240f19?w=900&auto=format&fit=crop",
        "price_inr": 999,
        "price_paise": 99900,
        "in_stock": True,
        "description": (
            "The bead of clarity and intelligent expression. Ruled by Brahma "
            "and Budh (Mercury), it is traditionally worn by students, "
            "researchers, writers and speakers to sharpen memory, articulation "
            "and creative thought."
        ),
        "benefits": [
            "Improves memory, focus and learning",
            "Enhances communication and creativity",
            "Supports the throat chakra",
        ],
    },
    {
        "id": "5-mukhi",
        "mukhi": 5,
        "name": "5 Mukhi Rudraksha",
        "deity": "Kalagni Rudra",
        "planet": "Jupiter",
        "image": "https://images.unsplash.com/photo-1685419368164-eb624c946062?w=900&auto=format&fit=crop",
        "price_inr": 999,
        "price_paise": 99900,
        "in_stock": True,
        "description": (
            "The most universally worn Rudraksha — safe for every chart. Five "
            "Mukhi is associated with Guru (Jupiter) and Kalagni Rudra, and is "
            "celebrated for calming the nervous system, lowering blood "
            "pressure and supporting wisdom in everyday life."
        ),
        "benefits": [
            "Reduces stress and blood pressure",
            "Boosts wisdom, ethics and patience",
            "Universal — suitable for everyone",
        ],
    },
    {
        "id": "6-mukhi",
        "mukhi": 6,
        "name": "6 Mukhi Rudraksha",
        "deity": "Lord Kartikeya",
        "planet": "Venus",
        "image": "https://images.unsplash.com/photo-1604357209793-fca5dca89f97?w=900",
        "price_inr": 999,
        "price_paise": 99900,
        "in_stock": True,
        "description": (
            "The bead of charm, beauty and emotional balance. Governed by "
            "Shukra (Venus) and Kartikeya, it gently lifts the heart, "
            "supports relationships, artistic expression and reproductive "
            "health. Loved by creative professionals."
        ),
        "benefits": [
            "Harmonises love and relationships",
            "Awakens creativity and artistic flow",
            "Supports reproductive and emotional health",
        ],
    },
    {
        "id": "7-mukhi",
        "mukhi": 7,
        "name": "7 Mukhi Rudraksha",
        "deity": "Maa Mahalakshmi",
        "planet": "Saturn",
        "image": "https://images.unsplash.com/photo-1622993361118-b6365d859ab6?w=900&auto=format&fit=crop",
        "price_inr": 1499,
        "price_paise": 149900,
        "in_stock": True,
        "description": (
            "The Lakshmi bead — sought after for abundance, business growth "
            "and protection against Shani dosha. Seven Mukhi is revered for "
            "removing financial stagnation and inviting steady, ethical "
            "prosperity into the wearer's life."
        ),
        "benefits": [
            "Attracts wealth and steady prosperity",
            "Removes Shani (Saturn) dosha effects",
            "Supports business and career growth",
        ],
    },
]


PIN_RE = re.compile(r"^\d{6}$")



# ---------- Routes ----------
@api_router.get("/")
async def root():
    return {"message": "Astro Shraddha API is running"}


@api_router.get("/services")
async def list_services():
    return SERVICES


@api_router.get("/testimonials")
async def list_testimonials():
    return TESTIMONIALS


@api_router.get("/rudraksha")
async def list_rudraksha():
    return RUDRAKSHA


def _find_rudraksha(rid: str):
    return next((r for r in RUDRAKSHA if r["id"] == rid), None)


@api_router.get("/rudraksha/{rudraksha_id}")
async def get_rudraksha(rudraksha_id: str):
    r = _find_rudraksha(rudraksha_id)
    if not r:
        raise HTTPException(status_code=404, detail="Unknown rudraksha")
    return r


@api_router.post("/rudraksha-orders", response_model=OrderResponse)
async def create_rudraksha_order(payload: RudrakshaOrderCreate):
    item = _find_rudraksha(payload.rudraksha_id)
    if not item:
        raise HTTPException(status_code=400, detail="Invalid rudraksha_id")
    if not item.get("in_stock", True):
        raise HTTPException(status_code=400, detail="Item out of stock")
    qty = max(1, min(int(payload.quantity or 1), 10))
    if not PIN_RE.match(payload.pincode):
        raise HTTPException(status_code=400, detail="Pincode must be 6 digits")

    unit = int(item["price_paise"])
    total = unit * qty

    order = RudrakshaOrder(
        rudraksha_id=item["id"],
        rudraksha_name=item["name"],
        quantity=qty,
        unit_price_paise=unit,
        amount=total,
        full_name=payload.full_name,
        email=payload.email,
        phone=payload.phone,
        address_line1=payload.address_line1,
        address_line2=payload.address_line2,
        city=payload.city,
        state=payload.state,
        pincode=payload.pincode,
        notes=payload.notes,
    )

    razorpay_order_id = None
    if RZP_ENABLED:
        try:
            rzp = rzp_client.order.create(
                {
                    "amount": total,
                    "currency": "INR",
                    "payment_capture": 1,
                    "receipt": order.id[:40],
                    "notes": {
                        "order_id": order.id,
                        "rudraksha": item["name"],
                        "qty": str(qty),
                    },
                }
            )
            razorpay_order_id = rzp["id"]
            order.razorpay_order_id = razorpay_order_id
        except Exception as e:
            logger.exception("Razorpay (rudraksha) order failed: %s", e)
            raise HTTPException(status_code=502, detail="Payment provider error")

    await db.rudraksha_orders.insert_one(order.model_dump())

    return OrderResponse(
        booking_id=order.id,
        razorpay_order_id=razorpay_order_id,
        razorpay_key_id=RZP_KEY_ID if RZP_ENABLED else None,
        amount=total,
        currency="INR",
        is_live=RZP_ENABLED,
    )


@api_router.post("/rudraksha-orders/{order_id}/mark-manual")
async def mark_rudraksha_manual(order_id: str):
    res = await db.rudraksha_orders.update_one(
        {"id": order_id},
        {"$set": {"payment_status": "manual_pending"}},
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"status": "manual_pending", "order_id": order_id}


@api_router.post("/rudraksha-orders/verify-payment")
async def verify_rudraksha_payment(payload: RudrakshaPaymentVerify):
    if not RZP_ENABLED:
        raise HTTPException(status_code=400, detail="Payments are not configured")

    body = f"{payload.razorpay_order_id}|{payload.razorpay_payment_id}".encode()
    expected = hmac.new(RZP_KEY_SECRET.encode(), body, hashlib.sha256).hexdigest()

    if not hmac.compare_digest(expected, payload.razorpay_signature):
        await db.rudraksha_orders.update_one(
            {"id": payload.order_id},
            {"$set": {"payment_status": "failed"}},
        )
        raise HTTPException(status_code=400, detail="Invalid payment signature")

    await db.rudraksha_orders.update_one(
        {"id": payload.order_id},
        {
            "$set": {
                "payment_status": "paid",
                "razorpay_payment_id": payload.razorpay_payment_id,
            }
        },
    )
    return {"status": "paid", "order_id": payload.order_id}


@api_router.post("/rudraksha-inquiry")
async def submit_rudraksha_inquiry(payload: RudrakshaInquiryCreate):
    inquiry = RudrakshaInquiry(**payload.model_dump())
    await db.rudraksha_inquiries.insert_one(inquiry.model_dump())
    return {"status": "received", "id": inquiry.id}


@api_router.get("/horoscope")
async def list_horoscope():
    return {"signs": SIGNS, "today": all_horoscopes()}


@api_router.get("/horoscope/{sign_id}")
async def get_horoscope(sign_id: str):
    if sign_id not in SIGNS_BY_ID:
        raise HTTPException(status_code=404, detail="Unknown zodiac sign")
    return horoscope_for(sign_id)



def _find_service(service_id: str):
    return next((s for s in SERVICES if s["id"] == service_id), None)


@api_router.post("/bookings", response_model=OrderResponse)
async def create_booking(payload: BookingCreate):
    service = _find_service(payload.service_id)
    if not service:
        raise HTTPException(status_code=400, detail="Invalid service_id")

    booking = Booking(
        full_name=payload.full_name,
        email=payload.email,
        phone=payload.phone,
        service_id=service["id"],
        service_name=service["name"],
        amount=service["price_paise"],
        date_of_birth=payload.date_of_birth,
        time_of_birth=payload.time_of_birth,
        place_of_birth=payload.place_of_birth,
        consultation_date=payload.consultation_date,
        consultation_time=payload.consultation_time,
        notes=payload.notes,
    )

    razorpay_order_id = None
    if RZP_ENABLED:
        try:
            order = rzp_client.order.create(
                {
                    "amount": booking.amount,
                    "currency": "INR",
                    "payment_capture": 1,
                    "receipt": booking.id[:40],
                    "notes": {
                        "booking_id": booking.id,
                        "service": booking.service_name,
                    },
                }
            )
            razorpay_order_id = order["id"]
            booking.razorpay_order_id = razorpay_order_id
        except Exception as e:
            logger.exception("Razorpay order creation failed: %s", e)
            raise HTTPException(status_code=502, detail="Payment provider error")

    await db.bookings.insert_one(booking.model_dump())

    # Fire notifications (email + WhatsApp); never block booking on failure
    try:
        await notify_new_booking(booking.model_dump())
    except Exception as e:  # noqa: BLE001
        logger.warning("notify_new_booking failed: %s", e)

    return OrderResponse(
        booking_id=booking.id,
        razorpay_order_id=razorpay_order_id,
        razorpay_key_id=RZP_KEY_ID if RZP_ENABLED else None,
        amount=booking.amount,
        currency="INR",
        is_live=RZP_ENABLED,
    )


@api_router.post("/payments/verify")
async def verify_payment(payload: PaymentVerify):
    if not RZP_ENABLED:
        raise HTTPException(status_code=400, detail="Payments are not configured")

    body = f"{payload.razorpay_order_id}|{payload.razorpay_payment_id}".encode()
    expected = hmac.new(
        RZP_KEY_SECRET.encode(), body, hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(expected, payload.razorpay_signature):
        await db.bookings.update_one(
            {"id": payload.booking_id},
            {"$set": {"payment_status": "failed"}},
        )
        raise HTTPException(status_code=400, detail="Invalid payment signature")

    await db.bookings.update_one(
        {"id": payload.booking_id},
        {
            "$set": {
                "payment_status": "paid",
                "razorpay_payment_id": payload.razorpay_payment_id,
            }
        },
    )
    return {"status": "paid", "booking_id": payload.booking_id}


@api_router.post("/bookings/{booking_id}/mark-manual")
async def mark_manual(booking_id: str):
    """For demo/dev when Razorpay keys aren't configured."""
    res = await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {"payment_status": "manual_pending"}},
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    return {"status": "manual_pending", "booking_id": booking_id}


@api_router.get("/bookings")
async def list_bookings(admin: dict = Depends(require_admin)):
    docs = await db.bookings.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return docs


@api_router.post("/contact")
async def submit_contact(payload: ContactCreate):
    msg = ContactMessage(**payload.model_dump())
    await db.contact_messages.insert_one(msg.model_dump())
    return {"status": "received", "id": msg.id}


@api_router.get("/contact")
async def list_contact(admin: dict = Depends(require_admin)):
    return await db.contact_messages.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)


# ---------- Admin ----------
class AdminLogin(BaseModel):
    email: EmailStr
    password: str


class BookingUpdate(BaseModel):
    payment_status: Optional[str] = None  # paid | failed | manual_pending | refunded
    status: Optional[str] = None  # upcoming | completed | cancelled


class ManualBooking(BaseModel):
    full_name: str
    email: EmailStr
    phone: str
    service_id: str
    date_of_birth: Optional[str] = None
    time_of_birth: Optional[str] = None
    place_of_birth: Optional[str] = None
    consultation_date: str
    consultation_time: str
    notes: Optional[str] = None
    payment_status: str = "manual_pending"


@api_router.post("/admin/login")
async def admin_login(payload: AdminLogin):
    if not verify_admin_password(payload.email, payload.password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_admin_token()
    return {
        "token": token,
        "email": payload.email.lower(),
        "role": "admin",
    }


@api_router.get("/admin/me")
async def admin_me(admin: dict = Depends(require_admin)):
    return {"email": admin.get("sub"), "role": admin.get("role")}


@api_router.get("/admin/bookings")
async def admin_list_bookings(
    admin: dict = Depends(require_admin),
    status: Optional[str] = None,
    payment_status: Optional[str] = None,
):
    q: dict = {}
    if status:
        q["status"] = status
    if payment_status:
        q["payment_status"] = payment_status
    docs = await db.bookings.find(q, {"_id": 0}).sort("consultation_date", 1).to_list(500)
    return docs


@api_router.post("/admin/bookings/manual")
async def admin_create_manual_booking(
    payload: ManualBooking,
    admin: dict = Depends(require_admin),
):
    service = _find_service(payload.service_id)
    if not service:
        raise HTTPException(status_code=400, detail="Invalid service_id")
    booking = Booking(
        full_name=payload.full_name,
        email=payload.email,
        phone=payload.phone,
        service_id=service["id"],
        service_name=service["name"],
        amount=service["price_paise"],
        date_of_birth=payload.date_of_birth,
        time_of_birth=payload.time_of_birth,
        place_of_birth=payload.place_of_birth,
        consultation_date=payload.consultation_date,
        consultation_time=payload.consultation_time,
        notes=payload.notes,
        payment_status=payload.payment_status,
    )
    doc = booking.model_dump()
    doc["source"] = "manual_admin"
    doc["status"] = "upcoming"
    await db.bookings.insert_one(doc)
    return {"id": booking.id, "source": "manual_admin"}


@api_router.patch("/admin/bookings/{booking_id}")
async def admin_update_booking(
    booking_id: str,
    payload: BookingUpdate,
    admin: dict = Depends(require_admin),
):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="Nothing to update")
    res = await db.bookings.update_one({"id": booking_id}, {"$set": updates})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Booking not found")
    doc = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    return doc


@api_router.get("/admin/contact")
async def admin_list_contact(admin: dict = Depends(require_admin)):
    return await db.contact_messages.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)


@api_router.get("/admin/rudraksha-orders")
async def admin_list_rudraksha_orders(admin: dict = Depends(require_admin)):
    return await db.rudraksha_orders.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)


@api_router.get("/admin/rudraksha-inquiries")
async def admin_list_rudraksha_inquiries(admin: dict = Depends(require_admin)):
    return await db.rudraksha_inquiries.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)


class RudrakshaInquiryUpdate(BaseModel):
    status: Optional[str] = None  # new | replied | closed


@api_router.patch("/admin/rudraksha-inquiries/{inquiry_id}")
async def admin_update_inquiry(
    inquiry_id: str,
    payload: RudrakshaInquiryUpdate,
    admin: dict = Depends(require_admin),
):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="Nothing to update")
    res = await db.rudraksha_inquiries.update_one({"id": inquiry_id}, {"$set": updates})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Inquiry not found")
    return await db.rudraksha_inquiries.find_one({"id": inquiry_id}, {"_id": 0})


class RudrakshaOrderUpdate(BaseModel):
    payment_status: Optional[str] = None
    status: Optional[str] = None  # new | shipped | delivered | cancelled


@api_router.patch("/admin/rudraksha-orders/{order_id}")
async def admin_update_rudraksha_order(
    order_id: str,
    payload: RudrakshaOrderUpdate,
    admin: dict = Depends(require_admin),
):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="Nothing to update")
    res = await db.rudraksha_orders.update_one({"id": order_id}, {"$set": updates})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return await db.rudraksha_orders.find_one({"id": order_id}, {"_id": 0})


@api_router.get("/admin/stats")
async def admin_stats(admin: dict = Depends(require_admin)):
    today = datetime.now(timezone.utc).date().isoformat()
    total = await db.bookings.count_documents({})
    upcoming = await db.bookings.count_documents({"consultation_date": {"$gte": today}})
    paid = await db.bookings.count_documents({"payment_status": "paid"})
    pending = await db.bookings.count_documents({"payment_status": {"$in": ["pending", "manual_pending"]}})
    contacts = await db.contact_messages.count_documents({})
    pipeline = [{"$match": {"payment_status": "paid"}}, {"$group": {"_id": None, "total": {"$sum": "$amount"}}}]
    rev_cur = db.bookings.aggregate(pipeline)
    rev_doc = await rev_cur.to_list(1)
    revenue_paise = rev_doc[0]["total"] if rev_doc else 0

    rudraksha_total = await db.rudraksha_orders.count_documents({})
    rudraksha_paid = await db.rudraksha_orders.count_documents({"payment_status": "paid"})
    rudraksha_pending = await db.rudraksha_orders.count_documents(
        {"payment_status": {"$in": ["pending", "manual_pending"]}}
    )
    rud_rev_cur = db.rudraksha_orders.aggregate(pipeline)
    rud_rev_doc = await rud_rev_cur.to_list(1)
    rudraksha_revenue_paise = rud_rev_doc[0]["total"] if rud_rev_doc else 0

    inquiries_total = await db.rudraksha_inquiries.count_documents({})
    inquiries_new = await db.rudraksha_inquiries.count_documents({"status": "new"})

    return {
        "total_bookings": total,
        "upcoming_bookings": upcoming,
        "paid_bookings": paid,
        "pending_bookings": pending,
        "contact_messages": contacts,
        "revenue_paise": revenue_paise,
        "rudraksha_orders_total": rudraksha_total,
        "rudraksha_orders_paid": rudraksha_paid,
        "rudraksha_orders_pending": rudraksha_pending,
        "rudraksha_revenue_paise": rudraksha_revenue_paise,
        "rudraksha_inquiries_total": inquiries_total,
        "rudraksha_inquiries_new": inquiries_new,
    }


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
