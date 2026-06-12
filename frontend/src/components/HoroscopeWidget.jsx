import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Heart, Briefcase, Activity, ArrowUpRight, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

const formatToday = (iso) => {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return iso;
  }
};

const ScoreBar = ({ value, label, Icon }) => (
  <div>
    <div className="flex items-center justify-between mb-1.5">
      <span className="flex items-center gap-1.5 text-xs text-[#6E6864]">
        <Icon size={13} strokeWidth={1.5} className="text-[#BC472A]" />
        {label}
      </span>
      <span className="text-xs font-medium text-[#2D2825]">{value}%</span>
    </div>
    <div className="h-1.5 rounded-full bg-[#E5DCD3] overflow-hidden">
      <div
        className="h-full bg-[#BC472A] rounded-full transition-[width] duration-500"
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);

export default function HoroscopeWidget() {
  const [signs, setSigns] = useState([]);
  const [active, setActive] = useState("aries");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.get("/horoscope").then((r) => {
      if (!mounted) return;
      setSigns(r.data.signs);
      const today = r.data.today;
      const initial = today.find((t) => t.id === active) || today[0];
      setData(initial);
      setLoading(false);
    });
    return () => {
      mounted = false;
    };
  }, []); // eslint-disable-line

  const handlePick = async (id) => {
    if (id === active) return;
    setActive(id);
    setLoading(true);
    try {
      const { data: d } = await api.get(`/horoscope/${id}`);
      setData(d);
    } finally {
      setLoading(false);
    }
  };

  const dateLabel = useMemo(
    () => (data?.date ? formatToday(data.date) : ""),
    [data]
  );

  return (
    <section
      data-testid="horoscope-widget"
      className="max-w-7xl mx-auto px-6 lg:px-10 py-24 lg:py-32"
    >
      <div className="grid lg:grid-cols-12 gap-10 mb-10">
        <div className="lg:col-span-7">
          <p className="overline mb-5 flex items-center gap-3">
            <span className="divider-dot" /> Daily horoscope · {dateLabel || "Today"}
          </p>
          <h2 className="serif text-4xl md:text-5xl lg:text-6xl leading-[1.05] tracking-tight">
            Your stars,
            <br /> read for today.
          </h2>
        </div>
        <div className="lg:col-span-5 flex items-end">
          <p className="text-[#6E6864] font-light leading-relaxed">
            A free, gentle nudge from the cosmos — refreshed each morning.
            For something deeply personal, your full Kundli is always a click away.
          </p>
        </div>
      </div>

      {/* Sign pills */}
      <div className="flex flex-wrap gap-2.5 mb-8">
        {signs.map((s) => {
          const isActive = s.id === active;
          return (
            <button
              key={s.id}
              data-testid={`horoscope-sign-${s.id}`}
              onClick={() => handlePick(s.id)}
              className={`btn-pill px-4 py-2.5 text-sm tracking-wide flex items-center gap-2 transition-all border ${
                isActive
                  ? "bg-[#BC472A] text-[#FAF8F5] border-[#BC472A]"
                  : "bg-white text-[#2D2825] border-[#E5DCD3] hover:border-[#BC472A] hover:text-[#BC472A]"
              }`}
            >
              <span className={`text-base ${isActive ? "text-[#D4AF37]" : ""}`}>
                {s.symbol}
              </span>
              {s.name}
            </button>
          );
        })}
      </div>

      {/* Content card */}
      <div className="rounded-3xl border border-[#E5DCD3] bg-white shadow-[0_8px_30px_rgba(45,40,37,0.05)] overflow-hidden grid lg:grid-cols-12">
        <div className="lg:col-span-5 bg-[#F4EFE7] p-8 lg:p-10 relative">
          <div className="flex items-center gap-4 mb-6">
            <span className="w-14 h-14 rounded-full bg-[#BC472A] text-[#D4AF37] flex items-center justify-center text-3xl">
              {data?.symbol || "✦"}
            </span>
            <div>
              <p className="overline mb-1">{data?.element} · {data?.dates}</p>
              <h3 className="serif text-3xl leading-tight">{data?.name || "Loading"}</h3>
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-[#E5DCD3] p-5 mb-5">
            <div className="flex items-baseline justify-between mb-2">
              <p className="overline">Overall vibe today</p>
              <p className="serif text-2xl text-[#BC472A]">{data?.overall_score ?? "—"}</p>
            </div>
            <div className="h-1.5 rounded-full bg-[#E5DCD3] overflow-hidden mb-1">
              <div
                className="h-full bg-gradient-to-r from-[#BC472A] to-[#D4AF37] rounded-full transition-[width] duration-500"
                style={{ width: `${data?.overall_score ?? 0}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="rounded-2xl bg-white border border-[#E5DCD3] p-4">
              <p className="overline mb-1 text-[10px]">Lucky no.</p>
              <p className="serif text-2xl">{data?.lucky_number ?? "—"}</p>
            </div>
            <div className="rounded-2xl bg-white border border-[#E5DCD3] p-4">
              <p className="overline mb-1 text-[10px]">Colour</p>
              <p className="serif text-base leading-snug">{data?.lucky_color || "—"}</p>
            </div>
            <div className="rounded-2xl bg-white border border-[#E5DCD3] p-4">
              <p className="overline mb-1 text-[10px]">Mood</p>
              <p className="serif text-base leading-snug">{data?.mood || "—"}</p>
            </div>
          </div>

          <div className="space-y-4">
            <ScoreBar value={data?.love_score ?? 0} label="Love & relationships" Icon={Heart} />
            <ScoreBar value={data?.career_score ?? 0} label="Career & money" Icon={Briefcase} />
            <ScoreBar value={data?.health_score ?? 0} label="Health & energy" Icon={Activity} />
          </div>
        </div>

        <div className="lg:col-span-7 p-8 lg:p-12 flex flex-col">
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-[#6E6864]">
              <Loader2 size={20} className="animate-spin" />
            </div>
          ) : (
            <>
              <p className="overline mb-3">Today's overview</p>
              <p
                data-testid="horoscope-overview"
                className="serif text-2xl md:text-3xl leading-snug text-[#2D2825] mb-8"
              >
                {data?.overview}
              </p>

              <div className="grid sm:grid-cols-3 gap-5 mb-10">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Heart size={14} strokeWidth={1.5} className="text-[#BC472A]" />
                    <p className="overline">Love</p>
                  </div>
                  <p className="text-sm font-light leading-relaxed text-[#3a342f]">
                    {data?.love}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Briefcase size={14} strokeWidth={1.5} className="text-[#BC472A]" />
                    <p className="overline">Career</p>
                  </div>
                  <p className="text-sm font-light leading-relaxed text-[#3a342f]">
                    {data?.career}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Activity size={14} strokeWidth={1.5} className="text-[#BC472A]" />
                    <p className="overline">Health</p>
                  </div>
                  <p className="text-sm font-light leading-relaxed text-[#3a342f]">
                    {data?.health}
                  </p>
                </div>
              </div>

              {/* Conversion CTA */}
              <div className="mt-auto rounded-2xl bg-[#2D2825] text-[#FAF8F5] p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
                <div className="flex items-start gap-3">
                  <Sparkles size={20} strokeWidth={1.5} className="text-[#D4AF37] mt-0.5 shrink-0" />
                  <div>
                    <p className="serif text-xl leading-snug">
                      Want a personal reading?
                    </p>
                    <p className="text-sm text-[#FAF8F5]/70 font-light">
                      Daily horoscopes are general. Your full Kundli is uniquely you.
                    </p>
                  </div>
                </div>
                <Link
                  data-testid="horoscope-cta-book"
                  to="/services"
                  className="btn-pill bg-[#D4AF37] hover:bg-[#c79e2c] text-[#2D2825] px-6 py-3 text-sm tracking-wide inline-flex items-center gap-2 transition-colors shrink-0"
                >
                  Book Kundli reading <ArrowUpRight size={16} strokeWidth={1.5} />
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
