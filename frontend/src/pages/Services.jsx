import { useEffect, useState } from "react";
import { Calendar as CalendarIcon, Clock, CheckCircle2, ArrowUpRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { api, formatINR } from "@/lib/api";

const TIME_SLOTS = [
  "10:00 AM",
  "11:30 AM",
  "01:00 PM",
  "03:00 PM",
  "04:30 PM",
  "06:00 PM",
  "07:30 PM",
];

export default function Services() {
  const [services, setServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    date_of_birth: "",
    time_of_birth: "",
    place_of_birth: "",
    consultation_time: "",
    notes: "",
  });
  const [date, setDate] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState(null);

  useEffect(() => {
    api.get("/services").then((r) => setServices(r.data));
  }, []);

  const choose = (svc) => {
    setSelectedService(svc);
    setConfirmed(null);
    setTimeout(() => {
      document
        .getElementById("booking-form")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    if (!selectedService) return "Please choose a service.";
    if (!form.full_name.trim()) return "Full name is required.";
    if (!form.email.trim()) return "Email is required.";
    if (!/^\+?\d[\d\s-]{7,}$/.test(form.phone)) return "Enter a valid phone number.";
    if (!date) return "Pick a consultation date.";
    if (!form.consultation_time) return "Pick a time slot.";
    return null;
  };

  const launchRazorpay = (orderData, bookingId) => {
    if (!window.Razorpay) {
      toast.error("Payment SDK could not load. Please try again.");
      return;
    }
    const options = {
      key: orderData.razorpay_key_id,
      amount: orderData.amount,
      currency: orderData.currency,
      order_id: orderData.razorpay_order_id,
      name: "Astro Shraddha",
      description: selectedService.name,
      prefill: {
        name: form.full_name,
        email: form.email,
        contact: form.phone,
      },
      theme: { color: "#BC472A" },
      handler: async (response) => {
        try {
          await api.post("/payments/verify", {
            booking_id: bookingId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          setConfirmed({ bookingId, paid: true });
          toast.success("Payment received. Your consultation is confirmed.");
        } catch (e) {
          toast.error("Payment verification failed. We'll contact you on WhatsApp.");
        }
      },
      modal: {
        ondismiss: () => {
          toast.info("Payment cancelled. Your booking is held as pending.");
        },
      },
    };
    new window.Razorpay(options).open();
  };

  const submit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        service_id: selectedService.id,
        consultation_date: format(date, "yyyy-MM-dd"),
      };
      const { data } = await api.post("/bookings", payload);

      if (data.is_live && data.razorpay_order_id && data.razorpay_key_id) {
        launchRazorpay(data, data.booking_id);
      } else {
        // No Razorpay keys configured — fall back to manual confirmation
        await api.post(`/bookings/${data.booking_id}/mark-manual`);
        setConfirmed({ bookingId: data.booking_id, paid: false });
        toast.success(
          "Booking received! We'll confirm payment details on WhatsApp shortly."
        );
      }
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Could not create booking.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div data-testid="services-page" className="max-w-7xl mx-auto px-6 lg:px-10 py-20 lg:py-28">
      <div className="max-w-3xl">
        <p className="overline mb-5">Consultations</p>
        <h1 className="serif text-4xl md:text-5xl lg:text-6xl leading-[1.05] tracking-tight">
          Two services. Done thoroughly.
        </h1>
        <p className="mt-6 text-base md:text-lg font-light text-[#6E6864] leading-relaxed">
          Each session is one-to-one with Shraddha over a private video call.
          Charts are prepared in advance; you receive a recording and a
          remedies summary on WhatsApp afterwards.
        </p>
      </div>

      <div className="mt-14 grid lg:grid-cols-2 gap-7">
        {services.map((svc) => {
          const active = selectedService?.id === svc.id;
          return (
            <div
              key={svc.id}
              data-testid={`service-card-${svc.id}`}
              className={`rounded-3xl border bg-white p-8 lg:p-10 transition-all ${
                active
                  ? "border-[#BC472A] shadow-[0_12px_40px_rgba(188,71,42,0.15)]"
                  : "border-[#E5DCD3] hover:-translate-y-1 shadow-[0_8px_30px_rgba(45,40,37,0.04)]"
              }`}
            >
              <p className="overline mb-3">{svc.duration}</p>
              <h2 className="serif text-3xl lg:text-4xl mb-2 leading-tight">{svc.name}</h2>
              <p className="text-[#6E6864] font-light">{svc.tagline}</p>

              <ul className="mt-7 space-y-3">
                {svc.highlights.map((h) => (
                  <li key={h} className="flex items-start gap-3 text-sm font-light">
                    <CheckCircle2 size={16} strokeWidth={1.5} className="mt-1 text-[#BC472A]" />
                    <span>{h}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex items-end justify-between gap-4">
                <div>
                  <p className="overline mb-1">Investment</p>
                  <p className="serif text-3xl">{formatINR(svc.price_paise)}</p>
                </div>
                <button
                  data-testid={`book-${svc.id}-btn`}
                  onClick={() => choose(svc)}
                  className="btn-pill bg-[#BC472A] hover:bg-[#A03C23] text-[#FAF8F5] px-6 py-3 text-sm tracking-wide inline-flex items-center gap-2 transition-colors"
                >
                  Book this <ArrowUpRight size={16} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* BOOKING FORM */}
      <div
        id="booking-form"
        className="mt-20 rounded-3xl border border-[#E5DCD3] bg-white p-8 lg:p-12 shadow-[0_8px_30px_rgba(45,40,37,0.04)]"
      >
        <div className="grid lg:grid-cols-12 gap-8">
          <div className="lg:col-span-4">
            <p className="overline mb-4">Step 2</p>
            <h2 className="serif text-3xl lg:text-4xl leading-tight">
              Your booking details
            </h2>
            <p className="mt-4 text-[#6E6864] font-light leading-relaxed">
              Birth details help us prepare your chart before the call. They are
              never shared with anyone else.
            </p>
            {selectedService && (
              <div className="mt-8 rounded-2xl bg-[#F4EFE7] p-5">
                <p className="overline mb-1">Selected service</p>
                <p className="serif text-2xl">{selectedService.name}</p>
                <p className="text-sm text-[#6E6864] mt-1">
                  {selectedService.duration} · {formatINR(selectedService.price_paise)}
                </p>
              </div>
            )}
          </div>

          <form
            data-testid="booking-form"
            onSubmit={submit}
            className="lg:col-span-8 grid sm:grid-cols-2 gap-5"
          >
            <div className="sm:col-span-2">
              <Label className="overline">Service</Label>
              <Select
                value={selectedService?.id || ""}
                onValueChange={(id) =>
                  setSelectedService(services.find((s) => s.id === id))
                }
              >
                <SelectTrigger data-testid="service-select" className="mt-2 rounded-xl h-12">
                  <SelectValue placeholder="Choose a service" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id} data-testid={`service-option-${s.id}`}>
                      {s.name} — {formatINR(s.price_paise)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="overline">Full name</Label>
              <Input
                data-testid="input-fullname"
                className="mt-2 rounded-xl h-12"
                value={form.full_name}
                onChange={(e) => update("full_name", e.target.value)}
                placeholder="Your full name"
              />
            </div>
            <div>
              <Label className="overline">Phone (WhatsApp)</Label>
              <Input
                data-testid="input-phone"
                className="mt-2 rounded-xl h-12"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                placeholder="+91 9XXXXXXXXX"
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="overline">Email</Label>
              <Input
                data-testid="input-email"
                type="email"
                className="mt-2 rounded-xl h-12"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <Label className="overline">Date of birth</Label>
              <Input
                data-testid="input-dob"
                type="date"
                className="mt-2 rounded-xl h-12"
                value={form.date_of_birth}
                onChange={(e) => update("date_of_birth", e.target.value)}
              />
            </div>
            <div>
              <Label className="overline">Time of birth</Label>
              <Input
                data-testid="input-tob"
                type="time"
                className="mt-2 rounded-xl h-12"
                value={form.time_of_birth}
                onChange={(e) => update("time_of_birth", e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="overline">Place of birth</Label>
              <Input
                data-testid="input-pob"
                className="mt-2 rounded-xl h-12"
                value={form.place_of_birth}
                onChange={(e) => update("place_of_birth", e.target.value)}
                placeholder="City, State, Country"
              />
            </div>

            <div>
              <Label className="overline">Consultation date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    data-testid="date-picker-trigger"
                    className="mt-2 w-full h-12 rounded-xl border border-[#E5DCD3] bg-white px-4 text-left text-sm flex items-center justify-between hover:border-[#BC472A] transition-colors"
                  >
                    <span className={date ? "text-[#2D2825]" : "text-[#6E6864]"}>
                      {date ? format(date, "PPP") : "Pick a date"}
                    </span>
                    <CalendarIcon size={16} strokeWidth={1.5} className="text-[#6E6864]" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="p-0 rounded-2xl" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label className="overline">Time slot</Label>
              <Select
                value={form.consultation_time}
                onValueChange={(v) => update("consultation_time", v)}
              >
                <SelectTrigger data-testid="time-select" className="mt-2 rounded-xl h-12">
                  <SelectValue placeholder="Pick a slot" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_SLOTS.map((t) => (
                    <SelectItem key={t} value={t} data-testid={`time-option-${t}`}>
                      <Clock size={14} strokeWidth={1.5} className="inline mr-2" />
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="sm:col-span-2">
              <Label className="overline">Anything we should know? (optional)</Label>
              <Textarea
                data-testid="input-notes"
                className="mt-2 rounded-xl min-h-[100px]"
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                placeholder="Specific questions, family context, etc."
              />
            </div>

            <div className="sm:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-3">
              <p className="text-xs text-[#6E6864] font-light max-w-md">
                You'll be redirected to Razorpay for a secure UPI / card / netbanking
                payment. We confirm your slot on WhatsApp within 30 minutes.
              </p>
              <button
                type="submit"
                disabled={submitting}
                data-testid="booking-submit-button"
                className="btn-pill bg-[#BC472A] hover:bg-[#A03C23] disabled:opacity-60 text-[#FAF8F5] px-7 py-4 text-sm tracking-wide inline-flex items-center gap-2 transition-colors w-fit"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Processing…
                  </>
                ) : (
                  <>
                    Pay & Confirm Booking <ArrowUpRight size={16} strokeWidth={1.5} />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {confirmed && (
        <div
          data-testid="booking-confirmed"
          className="mt-8 rounded-2xl border border-[#BC472A]/30 bg-[#F4EFE7] p-7 flex items-start gap-4"
        >
          <CheckCircle2 className="text-[#BC472A] mt-1" strokeWidth={1.5} />
          <div>
            <p className="serif text-2xl">
              {confirmed.paid
                ? "Your consultation is confirmed."
                : "Booking received."}
            </p>
            <p className="text-sm text-[#6E6864] mt-1 font-light">
              Reference ID: <span className="font-medium">{confirmed.bookingId}</span>
              {!confirmed.paid && " — we'll reach out on WhatsApp with payment details shortly."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
