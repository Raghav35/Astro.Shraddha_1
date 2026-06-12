# Astro Shraddha — Astrology Website PRD

## Original Problem Statement
A clean astrology website for the user's wife, the astrologer.
Key features: About page (photo, education, experience, specialties),
Testimonials (text + video), Services & Booking with Razorpay payments,
Rudraksha info page, Contact page (form + WhatsApp + email),
fully mobile-responsive, traditional Indian elegant design.

## User Choices
- Astrologer name: **Astro Shraddha**
- Email: `Astro.Shraddha@gmail.com`
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
- ✅ Home page — hero, editorial layout, CTA strip, feature grid, quote section
- ✅ About page — portrait, education, experience, specialties, biography
- ✅ Services page — 2 service cards + integrated booking form (shadcn Calendar popover + time-slot Select + DOB/TOB/POB)
- ✅ Rudraksha page — bento grid of 6 rudraksha types with images, deity, planet, benefits
- ✅ Testimonials page — text marquee + video review cards
- ✅ Contact page — form (persisted to MongoDB) + WhatsApp + Email + Phone cards
- ✅ Sticky navbar with mobile drawer + dark footer with WhatsApp CTA
- ✅ Backend routes: `/api/services`, `/api/testimonials`, `/api/rudraksha`, `/api/bookings`, `/api/bookings/{id}/mark-manual`, `/api/payments/verify`, `/api/contact`
- ✅ Razorpay flow wired (frontend Razorpay checkout, backend HMAC SHA256 signature verify); when keys are empty → graceful manual booking fallback
- ✅ 9/9 backend pytest passing, all E2E UI flows verified

## Pending / Backlog
- **P0 — User action**: Add real `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` to `/app/backend/.env` and `REACT_APP_RAZORPAY_KEY_ID` to `/app/frontend/.env` to enable live payments (currently MOCKED via manual fallback)
- **P1**: Replace stock photo with Shraddha's actual portrait (currently a placeholder Unsplash image)
- **P1**: Replace generic testimonial copy with real client quotes; upload real video reviews (hosted file or YouTube embed)
- **P1**: Add admin auth on `GET /api/bookings` and `GET /api/contact` (currently open — PII exposure)
- **P2**: Email/WhatsApp auto-notification on new booking (Resend / Twilio)
- **P2**: SEO meta tags + OpenGraph + sitemap
- **P2**: Add more services (Vastu, Numerology, Palmistry) if/when needed

## Test Credentials
No authentication in app. None required.
