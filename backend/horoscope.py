"""Deterministic daily horoscope generator.

Given a (sign, date) pair, returns a stable, sensible horoscope. The same
sign+date will always return the same content, but the content changes every
day. Uses a seeded RNG over curated phrase pools — no LLM calls required.
"""
from __future__ import annotations

import hashlib
import random
from datetime import date


SIGNS = [
    {"id": "aries",       "name": "Aries",       "symbol": "♈", "dates": "Mar 21 – Apr 19", "element": "Fire"},
    {"id": "taurus",      "name": "Taurus",      "symbol": "♉", "dates": "Apr 20 – May 20", "element": "Earth"},
    {"id": "gemini",      "name": "Gemini",      "symbol": "♊", "dates": "May 21 – Jun 20", "element": "Air"},
    {"id": "cancer",      "name": "Cancer",      "symbol": "♋", "dates": "Jun 21 – Jul 22", "element": "Water"},
    {"id": "leo",         "name": "Leo",         "symbol": "♌", "dates": "Jul 23 – Aug 22", "element": "Fire"},
    {"id": "virgo",       "name": "Virgo",       "symbol": "♍", "dates": "Aug 23 – Sep 22", "element": "Earth"},
    {"id": "libra",       "name": "Libra",       "symbol": "♎", "dates": "Sep 23 – Oct 22", "element": "Air"},
    {"id": "scorpio",     "name": "Scorpio",     "symbol": "♏", "dates": "Oct 23 – Nov 21", "element": "Water"},
    {"id": "sagittarius", "name": "Sagittarius", "symbol": "♐", "dates": "Nov 22 – Dec 21", "element": "Fire"},
    {"id": "capricorn",   "name": "Capricorn",   "symbol": "♑", "dates": "Dec 22 – Jan 19", "element": "Earth"},
    {"id": "aquarius",    "name": "Aquarius",    "symbol": "♒", "dates": "Jan 20 – Feb 18", "element": "Air"},
    {"id": "pisces",      "name": "Pisces",      "symbol": "♓", "dates": "Feb 19 – Mar 20", "element": "Water"},
]

SIGNS_BY_ID = {s["id"]: s for s in SIGNS}


OVERVIEW = [
    "A quietly powerful day to reset your priorities and choose what truly matters.",
    "The cosmos favours patient, deliberate steps over dramatic decisions today.",
    "Today asks for honest conversations — both with yourself and with the people you love.",
    "Energy flows toward whatever you give your steady attention to. Choose well.",
    "A small act of courage early in the day will ripple into something meaningful by evening.",
    "Old patterns may surface — meet them gently, then keep walking forward.",
    "The Moon's placement softens your edges. Lead with warmth, not pressure.",
    "Clarity arrives in stillness. Build a quiet pocket of time before deciding anything big.",
    "An overlooked detail today holds the key to a problem you've been turning over.",
    "Today rewards groundedness more than ambition. Slow is sacred.",
]

LOVE = [
    "Speak the kind word you've been holding back — it will be received well.",
    "A simple gesture means more than grand promises today. Keep it real.",
    "If single, an unexpected conversation could shift something gently in your heart.",
    "Listen twice before you respond. Your partner is asking for presence, not solutions.",
    "Healing in a relationship begins where blame ends. Choose ease.",
    "Family bonds feel warmer today. Reach out, even briefly.",
    "An old friend may come to mind — it's a nudge worth honouring.",
]

CAREER = [
    "Stick to the unglamorous task — it's the one that will pay off.",
    "Avoid making big commitments before noon. Wait for clarity.",
    "A senior colleague may quietly notice your steadiness today.",
    "Money matters benefit from a careful second look — not a quick decision.",
    "Today favours building, not broadcasting. Work in private.",
    "Trust the slow, accumulating work — it is preparing you for something specific.",
    "Avoid lending or borrowing today. Keep your boundaries clean.",
]

HEALTH = [
    "Hydrate generously and step outside for at least fifteen unhurried minutes.",
    "Sleep tonight will be more restorative if you put screens away an hour earlier.",
    "Pranayama or even three deep breaths can settle a restless mind today.",
    "Honour your body's signals — push less, listen more.",
    "A short walk after meals will support both digestion and mental clarity.",
    "Warm, simple, home-cooked food agrees with your constitution today.",
]

LUCKY_COLORS = [
    "Saffron", "Maroon", "Ivory", "Forest Green", "Indigo", "Gold",
    "Soft Pink", "Brick Red", "Sky Blue", "Cream", "Plum", "Sandalwood",
]

MOODS = [
    "Reflective", "Grateful", "Steady", "Curious", "Open-hearted",
    "Determined", "Tender", "Hopeful", "Clear-headed", "Devotional",
]


def _seed(sign_id: str, d: date) -> random.Random:
    key = f"{sign_id}|{d.isoformat()}".encode()
    h = hashlib.sha256(key).hexdigest()
    return random.Random(int(h[:16], 16))


def horoscope_for(sign_id: str, d: date | None = None) -> dict:
    sign = SIGNS_BY_ID[sign_id]
    d = d or date.today()
    rng = _seed(sign_id, d)

    overall_score = rng.randint(60, 95)

    return {
        "id": sign["id"],
        "name": sign["name"],
        "symbol": sign["symbol"],
        "dates": sign["dates"],
        "element": sign["element"],
        "date": d.isoformat(),
        "overall_score": overall_score,
        "love_score": rng.randint(55, 95),
        "career_score": rng.randint(55, 95),
        "health_score": rng.randint(60, 95),
        "overview": rng.choice(OVERVIEW),
        "love": rng.choice(LOVE),
        "career": rng.choice(CAREER),
        "health": rng.choice(HEALTH),
        "lucky_number": rng.randint(1, 99),
        "lucky_color": rng.choice(LUCKY_COLORS),
        "mood": rng.choice(MOODS),
    }


def all_horoscopes(d: date | None = None) -> list[dict]:
    d = d or date.today()
    return [horoscope_for(s["id"], d) for s in SIGNS]
