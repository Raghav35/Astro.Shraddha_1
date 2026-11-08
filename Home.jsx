import React, { useState } from 'react';
import { Calendar, Phone, Award, Shield, Star, Sparkles, MessageCircle, ArrowRight } from 'lucide-react';
import ConsultationBookingModal from './ConsultationBookingModal';
import RudrakshaStoreSection from './RudrakshaStoreSection';
import AdminLeadDashboard from './AdminLeadDashboard';

const ASTROLOGER_IMG = "https://customer-assets.emergentagent.com/job_stellar-astrology-1/artifacts/1mzbgttv_1000511996.jpg";

export default function Home() {
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-gray-800 antialiased font-sans">
      {/* Top Notice Banner */}
      <div className="bg-[#3D000C] text-[#E5B85A] text-xs sm:text-sm py-2 px-4 text-center font-medium border-b border-[#9E7B1A]/30">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
          <span>🕉️ 100% Lab-Certified Nepalese & Indonesian Rudraksha | Certified by Jyotish Parishad, Pune</span>
          <span className="hidden md:inline text-gold-500/60">|</span>
          <span className="hidden md:inline">Helpline: +91 74997 78268</span>
        </div>
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden py-12 md:py-20 bg-gradient-to-b from-[#F7F2E9]/60 via-[#FDFBF7] to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Conversion Pitch */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E5B85A]/15 border border-[#C59B27]/30 text-[#3D000C] text-xs sm:text-sm font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Slots Open for Today • Zero Upfront Fees</span>
              </div>

              <h1 className="font-serif text-3xl sm:text-5xl font-extrabold text-[#3D000C] leading-tight">
                Discover the Quiet Wisdom of Your Stars
              </h1>

              <p className="text-base sm:text-lg text-gray-700 max-w-2xl leading-relaxed mx-auto lg:mx-0">
                Authentic Kundli readings, Marriage Match (Guna Milan), and Career guidance rooted in traditional Vedic astrology. Calm guidance, real remedies, no fear-selling — only clarity.
              </p>

              {/* Key Highlights */}
              <div className="grid grid-cols-3 gap-3 max-w-lg mx-auto lg:mx-0 pt-2">
                <div className="bg-white p-3.5 rounded-xl border border-[#EEE3CD] shadow-sm text-center">
                  <div className="font-serif font-bold text-xl sm:text-2xl text-[#720B22]">5+ Yrs</div>
                  <div className="text-[11px] text-gray-500 uppercase font-semibold">Active Practice</div>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-[#EEE3CD] shadow-sm text-center">
                  <div className="font-serif font-bold text-xl sm:text-2xl text-[#720B22]">10,000+</div>
                  <div className="text-[11px] text-gray-500 uppercase font-semibold">Consultations</div>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-[#EEE3CD] shadow-sm text-center">
                  <div className="font-serif font-bold text-xl sm:text-2xl text-[#720B22] flex items-center justify-center gap-1">
                    <span>4.9</span>
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  </div>
                  <div className="text-[11px] text-gray-500 uppercase font-semibold">Client Rating</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                <button 
                  onClick={() => setIsBookingOpen(true)}
                  className="bg-[#720B22] hover:bg-[#560014] text-white font-bold px-7 py-4 rounded-xl shadow-lg hover:shadow-xl transition flex items-center justify-center gap-3"
                >
                  <Calendar className="w-5 h-5 text-[#E5B85A]" />
                  <span>Book 1-on-1 Consultation</span>
                  <span className="text-xs bg-[#E5B85A] text-[#3D000C] px-2 py-0.5 rounded font-black uppercase">Free</span>
                </button>
                <a 
                  href="#rudraksha" 
                  className="bg-white hover:bg-[#F7F2E9] text-[#3D000C] font-bold px-7 py-4 rounded-xl border-2 border-[#C59B27]/40 shadow-sm transition flex items-center justify-center gap-2"
                >
                  <Sparkles className="w-5 h-5 text-[#C59B27]" />
                  <span>Explore Energized Rudrakshas</span>
                </a>
              </div>

              <div className="flex items-center justify-center lg:justify-start gap-4 text-xs text-gray-600 pt-2">
                <span className="flex items-center gap-1.5"><MessageCircle className="w-4 h-4 text-emerald-600" /> Instant WhatsApp Invite</span>
                <span>•</span>
                <span>🔔 30-min WhatsApp Session Reminder</span>
              </div>
            </div>

            {/* Right Column: Astrologer Portrait */}
            <div className="lg:col-span-5 flex justify-center">
              <div className="relative w-full max-w-sm sm:max-w-md">
                <div className="relative bg-white p-3 rounded-3xl shadow-2xl border border-[#E5B85A]/30">
                  <div className="overflow-hidden rounded-2xl relative aspect-[4/5] bg-[#F7F2E9]">
                    <img 
                      src={ASTROLOGER_IMG} 
                      alt="Astrologer Shraddha Mohole" 
                      className="w-full h-full object-cover object-top"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#3D000C]/80 via-transparent to-transparent"></div>
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <div className="inline-flex items-center gap-1.5 bg-[#3D000C]/90 px-3 py-1 rounded-full text-xs font-semibold text-[#E5B85A] mb-2 border border-[#E5B85A]/30">
                        <Award className="w-3.5 h-3.5" /> Jyotish Pandit (Pune)
                      </div>
                      <h3 className="font-serif text-xl font-bold">Shraddha Mohole</h3>
                      <p className="text-xs text-amber-100">Vedic Astrologer • Jyotish Parishad Certified</p>
                    </div>
                  </div>
                  <div className="p-4 bg-[#FDFBF7] rounded-xl mt-3 border border-[#EEE3CD] text-center">
                    <p className="text-xs italic text-gray-600">
                      "Every chart carries a question and a gift. My work is to help you hear both clearly."
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Rudraksha Catalog Section with Pre-Payment Lead Capture */}
      <RudrakshaStoreSection />

      {/* Floating Buttons */}
      <a 
        href="https://wa.me/917499778268?text=Namaste%20Astrologer%20Shraddha"
        target="_blank" 
        rel="noreferrer"
        className="fixed bottom-6 right-6 z-40 bg-emerald-600 hover:bg-emerald-500 text-white p-3.5 sm:px-4 sm:py-3 rounded-full shadow-2xl flex items-center gap-2.5 transition"
      >
        <MessageCircle className="w-5 h-5" />
        <span className="hidden sm:inline text-xs font-bold">Chat on WhatsApp</span>
      </a>

      {/* Modals */}
      {isBookingOpen && (
        <ConsultationBookingModal onClose={() => setIsBookingOpen(false)} />
      )}

      {isAdminOpen && (
        <AdminLeadDashboard onClose={() => setIsAdminOpen(false)} />
      )}
    </div>
  );
}
