import { GraduationCap, Award, Sparkles, Quote } from "lucide-react";

const PORTRAIT =
  "https://customer-assets.emergentagent.com/job_stellar-astrology-1/artifacts/1mzbgttv_1000511996.jpg";

const EDUCATION = [
  { year: "2026", title: "Jyotish Pandit", body: "Jyotish Parishad, Pune" },
  { year: "2024", title: "Jyotish Visharad", body: "Jyotish Parishad, Pune" },
];

const SPECIALTIES = [
  "Janma Kundli & Lagna Analysis",
  "Marriage Match (Guna Milan)",
  "Mahadasha & Antardasha Forecast",
  "Mangal & Nadi Dosha Remedies",
  "Rudraksha & Gemstone Guidance",
  "Career & Business Muhurat",
];

export default function About() {
  return (
    <div data-testid="about-page" className="max-w-7xl mx-auto px-6 lg:px-10 py-20 lg:py-28">
      <div className="grid lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-5 relative">
          <div className="absolute -top-6 -left-6 w-40 h-40 rounded-3xl bg-[#BC472A]/10 hidden md:block" />
          <img
            src={PORTRAIT}
            alt="Shraddha - the astrologer"
            className="relative rounded-3xl w-full aspect-[4/5] object-cover shadow-[0_8px_30px_rgba(45,40,37,0.1)]"
          />
          <div className="mt-6 rounded-2xl border border-[#E5DCD3] bg-white p-6">
            <Quote size={20} strokeWidth={1.5} className="text-[#BC472A] mb-3" />
            <p className="serif text-xl leading-snug">
              "Every chart carries a question and a gift. My work is to help you
              hear both clearly."
            </p>
            <p className="overline mt-4">— Shraddha</p>
          </div>
        </div>

        <div className="lg:col-span-7">
          <p className="overline mb-5">About the Astrologer</p>
          <h1 className="serif text-4xl md:text-5xl lg:text-6xl leading-[1.05] tracking-tight">
            A practice rooted in
            <br /> tradition, devoted to <span className="text-[#BC472A]">truth.</span>
          </h1>

          <div className="mt-8 space-y-5 text-[#3a342f] font-light leading-relaxed">
            <p>
              Shraddha has spent the last five years studying and practising
              classical Vedic astrology under the lineage of Jyotish Parishad,
              Pune. Her consultations are known for being unhurried,
              compassionate and refreshingly free of fear or upselling.
            </p>
            <p>
              She works with families across India and the diaspora — guiding
              them through marriage decisions, career transitions, health
              concerns and spiritual practice. Her remedies are simple, ethical
              and rooted in daily discipline rather than expensive rituals.
            </p>
          </div>

          <div className="mt-12 grid sm:grid-cols-2 gap-6">
            <div className="rounded-2xl border border-[#E5DCD3] bg-white p-6">
              <GraduationCap size={20} strokeWidth={1.5} className="text-[#BC472A] mb-4" />
              <p className="overline mb-3">Education</p>
              <ul className="space-y-4">
                {EDUCATION.map((e) => (
                  <li key={e.year}>
                    <p className="text-sm text-[#6E6864]">{e.year}</p>
                    <p className="serif text-lg">{e.title}</p>
                    <p className="text-sm text-[#6E6864]">{e.body}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border border-[#E5DCD3] bg-white p-6">
              <Award size={20} strokeWidth={1.5} className="text-[#BC472A] mb-4" />
              <p className="overline mb-3">Experience</p>
              <p className="serif text-3xl mb-1">5+ years</p>
              <p className="text-sm text-[#6E6864] mb-5">in active Vedic practice</p>
              <p className="serif text-3xl mb-1">10,000+</p>
              <p className="text-sm text-[#6E6864]">consultations completed</p>
            </div>
          </div>

          <div className="mt-10 rounded-2xl border border-[#E5DCD3] bg-[#F4EFE7] p-7">
            <div className="flex items-center gap-3 mb-5">
              <Sparkles size={20} strokeWidth={1.5} className="text-[#BC472A]" />
              <p className="overline">Specialties</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
              {SPECIALTIES.map((s) => (
                <div key={s} className="flex items-start gap-3">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#BC472A]" />
                  <p className="font-light">{s}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
