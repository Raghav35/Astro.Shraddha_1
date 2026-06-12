import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Sparkles } from "lucide-react";

export default function Rudraksha() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.get("/rudraksha").then((r) => setItems(r.data));
  }, []);

  return (
    <div data-testid="rudraksha-page" className="max-w-7xl mx-auto px-6 lg:px-10 py-20 lg:py-28">
      <div className="grid lg:grid-cols-12 gap-10 mb-16">
        <div className="lg:col-span-7">
          <p className="overline mb-5">The sacred bead</p>
          <h1 className="serif text-4xl md:text-5xl lg:text-6xl leading-[1.05] tracking-tight">
            Rudraksha — small seeds, <br /> profound resonance.
          </h1>
        </div>
        <div className="lg:col-span-5 flex items-end">
          <p className="text-[#6E6864] font-light leading-relaxed">
            Each mukhi (face) of a Rudraksha is governed by a deity and planet.
            When chosen correctly — in alignment with your chart — they support
            emotional balance, focus, and energetic protection. We recommend
            them only when truly indicated.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-7">
        {items.map((r, i) => (
          <article
            key={r.id}
            data-testid={`rudraksha-card-${r.id}`}
            className={`rounded-3xl overflow-hidden bg-white border border-[#E5DCD3] hover:-translate-y-1 transition-transform shadow-[0_8px_30px_rgba(45,40,37,0.05)] ${
              i % 5 === 0 ? "lg:col-span-2" : ""
            }`}
          >
            <div className={`relative ${i % 5 === 0 ? "aspect-[16/9]" : "aspect-[4/3]"}`}>
              <img src={r.image} alt={r.name} className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute top-4 left-4 backdrop-blur bg-[#FAF8F5]/85 rounded-full px-3 py-1 text-xs tracking-wide">
                {r.deity} · {r.planet}
              </div>
            </div>
            <div className="p-6">
              <h3 className="serif text-2xl leading-tight mb-3">{r.name}</h3>
              <ul className="space-y-2">
                {r.benefits.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm font-light text-[#3a342f]">
                    <Sparkles size={14} strokeWidth={1.5} className="mt-1 text-[#BC472A]" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-16 rounded-3xl bg-[#2D2825] text-[#FAF8F5] p-10 lg:p-14">
        <p className="overline mb-4" style={{ color: "#D4AF37" }}>A gentle reminder</p>
        <h2 className="serif text-3xl md:text-4xl leading-tight max-w-3xl">
          A rudraksha is a companion, not a cure. We help you find the right one for
          your chart — never sell what you don't need.
        </h2>
      </div>
    </div>
  );
}
