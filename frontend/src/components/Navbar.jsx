import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { Menu, X, Sparkles } from "lucide-react";

const links = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/services", label: "Services" },
  { to: "/rudraksha", label: "Rudraksha" },
  { to: "/testimonials", label: "Testimonials" },
  { to: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <header
      data-testid="site-navbar"
      className="sticky top-0 z-40 backdrop-blur-xl bg-[#FAF8F5]/80 border-b border-[#E5DCD3]"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-20 flex items-center justify-between">
        <Link
          to="/"
          data-testid="nav-logo"
          className="flex items-center gap-2 group"
        >
          <span className="w-9 h-9 rounded-full bg-[#BC472A] text-[#FAF8F5] flex items-center justify-center">
            <Sparkles size={16} strokeWidth={1.5} />
          </span>
          <span className="serif text-2xl tracking-tight">
            Astro <span className="text-[#BC472A]">Shraddha</span>
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-9">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.to === "/"}
              data-testid={`nav-link-${l.label.toLowerCase()}`}
              className={({ isActive }) =>
                `text-sm font-light tracking-wide transition-colors ${
                  isActive
                    ? "text-[#BC472A]"
                    : "text-[#2D2825] hover:text-[#BC472A]"
                }`
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden lg:block">
          <button
            data-testid="nav-cta-book"
            onClick={() => navigate("/services")}
            className="btn-pill bg-[#BC472A] hover:bg-[#A03C23] text-[#FAF8F5] px-5 py-2.5 text-sm tracking-wide transition-colors"
          >
            Book Consultation
          </button>
        </div>

        <button
          aria-label="Toggle menu"
          data-testid="nav-mobile-toggle"
          className="lg:hidden p-2 rounded-full hover:bg-[#E5DCD3]/60"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} strokeWidth={1.5} /> : <Menu size={22} strokeWidth={1.5} />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-[#E5DCD3] bg-[#FAF8F5]">
          <div className="px-6 py-6 flex flex-col gap-5">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                onClick={() => setOpen(false)}
                data-testid={`nav-mobile-link-${l.label.toLowerCase()}`}
                className={({ isActive }) =>
                  `text-base tracking-wide ${
                    isActive ? "text-[#BC472A]" : "text-[#2D2825]"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <button
              data-testid="nav-mobile-cta-book"
              onClick={() => {
                setOpen(false);
                navigate("/services");
              }}
              className="btn-pill bg-[#BC472A] text-[#FAF8F5] px-5 py-3 text-sm tracking-wide w-fit"
            >
              Book Consultation
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
