import { Link } from "react-router-dom";
import { Mail, Phone, MessageCircle, MapPin } from "lucide-react";
import { WHATSAPP_NUMBER, EMAIL_ADDRESS } from "@/lib/api";

export default function Footer() {
  return (
    <footer
      data-testid="site-footer"
      className="bg-[#2D2825] text-[#FAF8F5] mt-16"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-20 lg:py-28 grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-6">
          <p className="overline text-[#D4AF37] mb-6" style={{ color: "#D4AF37" }}>
            Connect with us
          </p>
          <h2 className="serif text-4xl md:text-5xl lg:text-6xl leading-[1.05] mb-6">
            Begin a calmer,
            <br />
            clearer chapter of life.
          </h2>
          <p className="text-[#FAF8F5]/70 max-w-md font-light leading-relaxed">
            Personal Vedic guidance, rooted in tradition. Reach out on WhatsApp
            for the fastest response — usually within an hour.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <a
              data-testid="footer-whatsapp"
              href={`https://wa.me/91${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noreferrer"
              className="btn-pill bg-[#BC472A] hover:bg-[#A03C23] transition-colors px-6 py-3 text-sm tracking-wide flex items-center gap-2 w-fit"
            >
              <MessageCircle size={16} strokeWidth={1.5} /> WhatsApp on +91 {WHATSAPP_NUMBER}
            </a>
            <a
              data-testid="footer-email"
              href={`mailto:${EMAIL_ADDRESS}`}
              className="btn-pill border border-[#FAF8F5]/30 hover:border-[#D4AF37] hover:text-[#D4AF37] transition-colors px-6 py-3 text-sm tracking-wide flex items-center gap-2 w-fit"
            >
              <Mail size={16} strokeWidth={1.5} /> {EMAIL_ADDRESS}
            </a>
          </div>
        </div>

        <div className="lg:col-span-3">
          <p className="overline mb-5" style={{ color: "#D4AF37" }}>Navigate</p>
          <ul className="space-y-3 text-[#FAF8F5]/80">
            <li><Link to="/about" className="hover:text-[#D4AF37]">About</Link></li>
            <li><Link to="/services" className="hover:text-[#D4AF37]">Services</Link></li>
            <li><Link to="/rudraksha" className="hover:text-[#D4AF37]">Rudraksha</Link></li>
            <li><Link to="/testimonials" className="hover:text-[#D4AF37]">Testimonials</Link></li>
            <li><Link to="/contact" className="hover:text-[#D4AF37]">Contact</Link></li>
          </ul>
        </div>

        <div className="lg:col-span-3">
          <p className="overline mb-5" style={{ color: "#D4AF37" }}>Studio</p>
          <ul className="space-y-3 text-[#FAF8F5]/80 text-sm font-light">
            <li className="flex items-start gap-2"><MapPin size={16} strokeWidth={1.5} className="mt-1" /> Pune, Maharashtra, India</li>
            <li className="flex items-center gap-2"><Phone size={16} strokeWidth={1.5} /> +91 {WHATSAPP_NUMBER}</li>
            <li className="flex items-center gap-2"><Mail size={16} strokeWidth={1.5} /> {EMAIL_ADDRESS}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[#FAF8F5]/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 py-6 flex flex-col sm:flex-row items-center justify-between text-xs text-[#FAF8F5]/50">
          <p>© {new Date().getFullYear()} Astro Shraddha · All rights reserved</p>
          <p className="mt-2 sm:mt-0">Crafted with reverence · Pune, India</p>
        </div>
      </div>
    </footer>
  );
}
