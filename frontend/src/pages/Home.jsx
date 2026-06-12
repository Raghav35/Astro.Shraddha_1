import { Link } from "react-router-dom";
import { ArrowUpRight, Sparkles, Star, ShieldCheck, BookOpen } from "lucide-react";
import HoroscopeWidget from "@/components/HoroscopeWidget";

const ASTROLOGER_IMG =
  "https://images.unsplash.com/photo-1622207691293-5cd80466dab3?ixid=M3w3NTY2NzR8MHwxfHNlYXJjaHwyfHxpbmRpYW4lMjB3b21hbiUyMHByb2Zlc3Npb25hbCUyMHRyYWRpdGlvbmFsJTIwYXR0aXJlJTIwcG9ydHJhaXR8ZW58MHx8fHwxNzgxMjU1NTk5fDA";
const TEXTURE =
  "https://images.unsplash.com/photo-1702590447351-28395dfef0a1?ixid=M3w4NjAxODF8MHwxfHNlYXJjaHwyfHxpbmRpYW4lMjBwYXR0ZXJuJTIwdGV4dHVyZSUyMHdhcm18ZW58MHx8fHwxNzgxMjU1NTk5fDA";

export default function Home() {
  return (
    <div data-testid="home-page">
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.08] pointer-events-none"
          style={{
            backgroundImage: `url(${TEXTURE})`,
            backgroundSize: "600px",
            backgroundRepeat: "repeat",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-6 lg:px-10 pt-16 lg:pt-24 pb-24 lg:pb-32 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7">
            <p className="overline mb-6 flex items-center gap-3">
              <span className="divider-dot" /> Vedic Astrologer · Pune
            </p>
            <h1 className="serif text-5xl md:text-6xl lg:text-7xl leading-[1.02] tracking-tight">
              Discover the
              <br />
              quiet wisdom of
              <br />
              <span className="text-[#BC472A]">your stars.</span>
            </h1>
            <p className="mt-8 text-base md:text-lg font-light max-w-xl leading-relaxed text-[#6E6864]">
              Authentic Kundli readings and Marriage Match analysis rooted in
              traditional Vedic astrology. Calm guidance, real remedies, no
              fear-selling — only clarity.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-3">
              <Link
                data-testid="hero-cta-book"
                to="/services"
                className="btn-pill bg-[#BC472A] hover:bg-[#A03C23] text-[#FAF8F5] px-7 py-4 text-sm tracking-wide inline-flex items-center gap-2 transition-colors w-fit"
              >
                Book a Consultation <ArrowUpRight size={16} strokeWidth={1.5} />
              </Link>
              <Link
                data-testid="hero-cta-about"
                to="/about"
                className="btn-pill border border-[#2D2825]/20 hover:border-[#BC472A] hover:text-[#BC472A] px-7 py-4 text-sm tracking-wide transition-colors w-fit"
              >
                Meet the Astrologer
              </Link>
            </div>

            <div className="mt-14 flex items-center gap-8 text-xs text-[#6E6864]">
              <div className="flex items-center gap-2">
                <Star size={14} className="fill-[#D4AF37] text-[#D4AF37]" strokeWidth={1} />
                <span>4.9 · 10,000+ consultations</span>
              </div>
              <div className="hidden sm:flex items-center gap-2">
                <ShieldCheck size={14} strokeWidth={1.5} className="text-[#BC472A]" />
                <span>Confidential & honest</span>
              </div>
              <div className="hidden md:flex items-center gap-2">
                <BookOpen size={14} strokeWidth={1.5} className="text-[#BC472A]" />
                <span>5+ years of practice</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden">
              <div className="absolute -top-6 -left-6 w-40 h-40 rounded-3xl bg-[#BC472A]/10 hidden md:block" />
              <div className="absolute -bottom-6 -right-6 w-32 h-32 rounded-3xl bg-[#D4AF37]/30 hidden md:block" />
              <img
                src={ASTROLOGER_IMG}
                alt="Astrologer portrait"
                className="relative w-full h-full object-cover rounded-3xl shadow-[0_8px_30px_rgba(45,40,37,0.12)]"
              />
              <div className="absolute bottom-5 left-5 right-5 rounded-2xl bg-[#FAF8F5]/95 backdrop-blur px-5 py-4 flex items-center gap-4">
                <Sparkles size={20} strokeWidth={1.5} className="text-[#BC472A]" />
                <div>
                  <p className="overline text-[10px]">Today's reading slots</p>
                  <p className="text-sm font-light">3 slots available · Book now</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* QUOTE */}
      <section className="border-y border-[#E5DCD3] bg-[#F4EFE7]">
        <div className="max-w-5xl mx-auto px-6 lg:px-10 py-20 lg:py-24 text-center">
          <p className="overline mb-6">A note from the astrologer</p>
          <p className="serif text-3xl md:text-4xl lg:text-5xl leading-tight text-[#2D2825]">
            "Astrology, at its best, is a mirror — never a verdict.
            <br className="hidden md:block" /> I'm here to help you read what's already within you."
          </p>
        </div>
      </section>

      {/* DAILY HOROSCOPE WIDGET */}
      <HoroscopeWidget />

      {/* FEATURES */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-24 lg:py-32">
        <div className="grid lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4">
            <p className="overline mb-5">Why families trust us</p>
            <h2 className="serif text-4xl md:text-5xl leading-tight">
              Tradition, honesty,
              <br /> and genuine care.
            </h2>
          </div>
          <div className="lg:col-span-8 grid sm:grid-cols-2 gap-6">
            {[
              {
                title: "Authentic Vedic method",
                body: "Janma Kundli, Navamsa & Ashtakavarga read the classical way — no shortcuts.",
              },
              {
                title: "Privacy first",
                body: "Your charts and questions remain strictly between you and the astrologer.",
              },
              {
                title: "Practical remedies",
                body: "Simple mantras, charitable acts and rudraksha guidance — never expensive rituals.",
              },
              {
                title: "Recorded sessions",
                body: "Every consultation is recorded and shared so you can revisit guidance later.",
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-[#E5DCD3] bg-white p-7 hover:-translate-y-1 transition-transform shadow-[0_8px_30px_rgba(45,40,37,0.04)]"
              >
                <h3 className="serif text-2xl mb-2">{f.title}</h3>
                <p className="text-[#6E6864] font-light leading-relaxed">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA STRIP */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 pb-24">
        <div className="rounded-3xl bg-[#2D2825] text-[#FAF8F5] px-8 md:px-16 py-14 md:py-20 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <p className="overline mb-3" style={{ color: "#D4AF37" }}>
              Sankalp · Begin today
            </p>
            <h3 className="serif text-3xl md:text-4xl leading-tight">
              Your first consultation is the
              <br className="hidden md:block" /> hardest step. Take it gently.
            </h3>
          </div>
          <Link
            data-testid="home-cta-strip-book"
            to="/services"
            className="btn-pill bg-[#D4AF37] hover:bg-[#c79e2c] text-[#2D2825] px-7 py-4 text-sm tracking-wide inline-flex items-center gap-2 transition-colors"
          >
            Book Consultation <ArrowUpRight size={16} strokeWidth={1.5} />
          </Link>
        </div>
      </section>
    </div>
  );
}
