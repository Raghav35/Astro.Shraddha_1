# Astro Shraddha — Astrology Website PRD

## Original Problem Statement
A clean astrology website for the user's wife, the astrologer.
Key features: About page (photo, education, experience, specialties),
Testimonials (text + video), Services & Booking with Razorpay payments,
Rudraksha info page, Contact page (form + WhatsApp + email),
fully mobile-responsive, traditional Indian elegant design.

## User Choices
- Astrologer name: **Astro Shraddha**
- Email: `astro.shraddhamohole@gmail.com`
- WhatsApp: `+91 7499778268`
- Payment gateway: **Razorpay**
- Services: **Kundli Reading**, **Marriage Match (Kundli Milan)**
- Education: Jyotish Pandit (2026), Jyotish Visharad (2024) — Jyotish Parishad, Pune
- Experience: 5+ years, 10,000+ consultations
- Design vibe: Traditional Indian (refined / luxury / not kitschy)

## Architecture
- **Backend**: FastAPI (`/app/backend/server.py`) + MongoDB (`motor`) + Razorpay SDK
- **Frontend**: React 19 + React Router 7 + Tailwind + shadcn/ui + lucide-react + react-fast-marquee + Sonner toasts
- **Fonts**: Cormorant Garamond (serif headings) + Outfit (body)
- **Palette**: Ivory Sand (#FAF8F5), Terracotta (#BC472A), Gold (#D4AF37), Charcoal (#2D2825)

## What's Implemented (Feb 12, 2026)
- ✅ Home page — hero, editorial layout, CTA strip, feature grid, quote section, **Daily Horoscope widget (12 signs)**
- ✅ About page — portrait, education, experience, specialties, biography
- ✅ Services page — 2 service cards + integrated booking form (shadcn Calendar popover + time-slot Select + DOB/TOB/POB)
- ✅ **Rudraksha e-commerce page** — 5 products (3 Mukhi to 7 Mukhi) with photos, descriptions, dynamic pricing (3/4/5/6 = ₹999, 7 = ₹1499), Buy Now → checkout dialog (qty selector + shipping form + Razorpay/manual flow)
- ✅ Testimonials page — text marquee + video review cards
- ✅ Contact page — form (persisted to MongoDB) + WhatsApp + Email + Phone cards
- ✅ Sticky navbar with mobile drawer + dark footer with WhatsApp CTA
- ✅ Daily horoscope generator (date-seeded, no LLM) — `/api/horoscope`, `/api/horoscope/{sign_id}`
- ✅ **Admin login + dashboard at `/admin`** — JWT-based env-credential auth (astro.shraddhamohole@gmail.com / Likhite@89)
  - 8 stat cards (booking + Rudraksha shop metrics)
  - Upcoming / Past / **Orders** / Messages tabs
  - Per-booking quick actions: Paid, Done, Cancel
  - Per-order quick actions: Paid, Shipped, Delivered, Cancel
  - WhatsApp / Email / Phone one-tap links per row
  - Manual booking dialog for clients who book via WhatsApp/phone
- ✅ Backend routes: services, testimonials, rudraksha (list + by id), bookings (+ manual + verify), contact, horoscope, **rudraksha-orders (create + mark-manual + verify-payment)**, admin/* (login, me, bookings, contact, stats, rudraksha-orders list+patch)
- ✅ Razorpay flow wired for both consultations + product orders; graceful manual fallback when keys empty
- ✅ Notification stubs for Resend (email) + Twilio (WhatsApp) — log only until keys are configured
- ✅ 47/47 backend pytest passing + all E2E UI flows verified (iterations 1, 2, 3)

## Pending / Backlog
- **P0 — User action**: Add real `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` to `/app/backend/.env` and `REACT_APP_RAZORPAY_KEY_ID` to `/app/frontend/.env` to enable live payments (currently MOCKED via manual fallback)
- **P0 — User action**: Add `RESEND_API_KEY` (and verified `SENDER_EMAIL`) + `TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN` to `/app/backend/.env` to enable email + WhatsApp booking notifications (currently MOCKED — logs only)
- **P1**: Replace stock photo with Shraddha's actual portrait (currently a placeholder Unsplash image)
- **P1**: Replace generic testimonial copy with real client quotes; upload real video reviews (hosted file or YouTube embed)
- **P2**: Add admin password change UI (currently set via `.env`)
- **P2**: Booking calendar view (month grid) in admin
- **P2**: SEO meta tags + OpenGraph + sitemap
- **P2**: Add more services (Vastu, Numerology, Palmistry) if/when needed

## Test Credentials
No authentication in app. None required.
