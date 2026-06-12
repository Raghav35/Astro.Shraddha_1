import { useEffect, useState } from "react";
import Marquee from "react-fast-marquee";
import { Star, Play, Quote } from "lucide-react";
import { api } from "@/lib/api";

const Stars = ({ n }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: n }).map((_, i) => (
      <Star key={i} size={14} className="fill-[#D4AF37] text-[#D4AF37]" strokeWidth={1} />
    ))}
  </div>
);

export default function Testimonials() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.get("/testimonials").then((r) => setItems(r.data));
  }, []);

  const text = items.filter((t) => t.type === "text");
  const video = items.filter((t) => t.type === "video");

  return (
    <div data-testid="testimonials-page" className="py-20 lg:py-28">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-12 gap-10 mb-12">
          <div className="lg:col-span-7">
            <p className="overline mb-5">Voices of our seekers</p>
            <h1 className="serif text-4xl md:text-5xl lg:text-6xl leading-[1.05] tracking-tight">
              Real readings.
              <br /> Real lives, gently shifted.
            </h1>
          </div>
          <div className="lg:col-span-5 flex items-end">
            <p className="text-[#6E6864] font-light leading-relaxed">
              Below are honest words from families who came to us with
              questions — and left with quiet clarity. No reviews are
              paid for or scripted.
            </p>
          </div>
        </div>
      </div>

      <div className="my-12">
        <Marquee gradient gradientColor="#FAF8F5" speed={40} pauseOnHover>
          {text.concat(text).map((t, i) => (
            <article
              key={`${t.id}-${i}`}
              data-testid={`testimonial-text-${t.id}`}
              className="mx-4 w-[340px] rounded-3xl border border-[#E5DCD3] bg-white p-7 shadow-[0_8px_30px_rgba(45,40,37,0.04)]"
            >
              <Quote size={20} strokeWidth={1.5} className="text-[#BC472A] mb-3" />
              <p className="serif text-lg leading-snug mb-5">"{t.quote}"</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{t.name}</p>
                  <p className="text-xs text-[#6E6864]">{t.city}</p>
                </div>
                <Stars n={t.rating} />
              </div>
            </article>
          ))}
        </Marquee>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-10 mt-20">
        <p className="overline mb-5">Video reviews</p>
        <h2 className="serif text-3xl md:text-4xl mb-10">Hear it in their own voice.</h2>

        <div className="grid md:grid-cols-2 gap-7">
          {video.map((v) => (
            <article
              key={v.id}
              data-testid={`testimonial-video-${v.id}`}
              className="rounded-3xl overflow-hidden border border-[#E5DCD3] bg-white shadow-[0_8px_30px_rgba(45,40,37,0.04)]"
            >
              <div className="relative aspect-[16/10] bg-[#2D2825]">
                <img src={v.video_thumbnail} alt={v.name} className="absolute inset-0 w-full h-full object-cover opacity-90" />
                <button
                  data-testid={`play-video-${v.id}`}
                  className="absolute inset-0 flex items-center justify-center group"
                  aria-label={`Play video review by ${v.name}`}
                >
                  <span className="w-16 h-16 rounded-full bg-[#FAF8F5]/95 flex items-center justify-center group-hover:scale-105 transition-transform">
                    <Play size={22} strokeWidth={1.5} className="text-[#BC472A] ml-1" />
                  </span>
                </button>
              </div>
              <div className="p-6 flex items-start justify-between gap-4">
                <div>
                  <p className="serif text-xl mb-1">"{v.quote}"</p>
                  <p className="text-sm text-[#6E6864]">{v.name} · {v.city}</p>
                </div>
                <Stars n={v.rating} />
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}
