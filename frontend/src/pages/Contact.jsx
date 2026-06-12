import { useState } from "react";
import { toast } from "sonner";
import { MessageCircle, Mail, Phone, Loader2, ArrowUpRight } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { api, WHATSAPP_NUMBER, EMAIL_ADDRESS } from "@/lib/api";

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error("Please fill name, email and message.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/contact", form);
      setSent(true);
      setForm({ name: "", email: "", phone: "", subject: "", message: "" });
      toast.success("Thank you — we'll reply within a day.");
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Could not send. Please try WhatsApp.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div data-testid="contact-page" className="max-w-7xl mx-auto px-6 lg:px-10 py-20 lg:py-28">
      <div className="grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-5">
          <p className="overline mb-5">Get in touch</p>
          <h1 className="serif text-4xl md:text-5xl lg:text-6xl leading-[1.05] tracking-tight">
            We'd love to <br /> hear from you.
          </h1>
          <p className="mt-6 text-[#6E6864] font-light leading-relaxed">
            For the fastest response, message us directly on WhatsApp. We reply
            personally — no auto-responders, no call centres.
          </p>

          <div className="mt-10 space-y-4">
            <a
              data-testid="contact-whatsapp"
              href={`https://wa.me/91${WHATSAPP_NUMBER}`}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-2xl border border-[#E5DCD3] bg-white p-5 hover:border-[#BC472A] transition-colors group"
            >
              <div className="flex items-center gap-4">
                <span className="w-12 h-12 rounded-full bg-[#BC472A]/10 text-[#BC472A] flex items-center justify-center">
                  <MessageCircle size={20} strokeWidth={1.5} />
                </span>
                <div>
                  <p className="overline">WhatsApp</p>
                  <p className="serif text-xl">+91 {WHATSAPP_NUMBER}</p>
                </div>
              </div>
              <ArrowUpRight size={20} strokeWidth={1.5} className="text-[#6E6864] group-hover:text-[#BC472A]" />
            </a>

            <a
              data-testid="contact-email-link"
              href={`mailto:${EMAIL_ADDRESS}`}
              className="flex items-center justify-between rounded-2xl border border-[#E5DCD3] bg-white p-5 hover:border-[#BC472A] transition-colors group"
            >
              <div className="flex items-center gap-4">
                <span className="w-12 h-12 rounded-full bg-[#BC472A]/10 text-[#BC472A] flex items-center justify-center">
                  <Mail size={20} strokeWidth={1.5} />
                </span>
                <div>
                  <p className="overline">Email</p>
                  <p className="serif text-xl">{EMAIL_ADDRESS}</p>
                </div>
              </div>
              <ArrowUpRight size={20} strokeWidth={1.5} className="text-[#6E6864] group-hover:text-[#BC472A]" />
            </a>

            <div className="flex items-center justify-between rounded-2xl border border-[#E5DCD3] bg-white p-5">
              <div className="flex items-center gap-4">
                <span className="w-12 h-12 rounded-full bg-[#BC472A]/10 text-[#BC472A] flex items-center justify-center">
                  <Phone size={20} strokeWidth={1.5} />
                </span>
                <div>
                  <p className="overline">Call</p>
                  <p className="serif text-xl">+91 {WHATSAPP_NUMBER}</p>
                </div>
              </div>
              <span className="text-xs text-[#6E6864]">Mon–Sat · 10 AM–7 PM</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <form
            data-testid="contact-form"
            onSubmit={submit}
            className="rounded-3xl border border-[#E5DCD3] bg-white p-8 lg:p-10 shadow-[0_8px_30px_rgba(45,40,37,0.04)] grid sm:grid-cols-2 gap-5"
          >
            <div>
              <Label className="overline">Name</Label>
              <Input
                data-testid="contact-input-name"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className="mt-2 rounded-xl h-12"
                placeholder="Your name"
              />
            </div>
            <div>
              <Label className="overline">Phone</Label>
              <Input
                data-testid="contact-input-phone"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                className="mt-2 rounded-xl h-12"
                placeholder="Optional"
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="overline">Email</Label>
              <Input
                data-testid="contact-input-email"
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                className="mt-2 rounded-xl h-12"
                placeholder="you@example.com"
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="overline">Subject</Label>
              <Input
                data-testid="contact-input-subject"
                value={form.subject}
                onChange={(e) => update("subject", e.target.value)}
                className="mt-2 rounded-xl h-12"
                placeholder="What is this about?"
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="overline">Your message</Label>
              <Textarea
                data-testid="contact-input-message"
                value={form.message}
                onChange={(e) => update("message", e.target.value)}
                className="mt-2 rounded-xl min-h-[140px]"
                placeholder="How can we help?"
              />
            </div>
            <div className="sm:col-span-2 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-2">
              {sent ? (
                <p data-testid="contact-success" className="text-sm text-[#BC472A]">
                  Thank you — your message has reached us.
                </p>
              ) : (
                <p className="text-xs text-[#6E6864] font-light">
                  We typically respond within a day. For urgent matters, WhatsApp is faster.
                </p>
              )}
              <button
                type="submit"
                disabled={submitting}
                data-testid="contact-submit-button"
                className="btn-pill bg-[#BC472A] hover:bg-[#A03C23] disabled:opacity-60 text-[#FAF8F5] px-7 py-4 text-sm tracking-wide inline-flex items-center gap-2 transition-colors"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Sending…
                  </>
                ) : (
                  <>
                    Send Message <ArrowUpRight size={16} strokeWidth={1.5} />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
