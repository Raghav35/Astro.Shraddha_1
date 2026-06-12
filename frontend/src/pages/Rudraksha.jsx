import { useEffect, useState } from "react";
import { Sparkles, ShoppingBag, Loader2, ArrowUpRight, CheckCircle2, Truck, ShieldCheck, Minus, Plus } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { api, formatINR } from "@/lib/api";

function CheckoutDialog({ item, open, onClose }) {
  const [qty, setQty] = useState(1);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    pincode: "",
    notes: "",
  });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const reset = () => {
    setQty(1);
    setForm({
      full_name: "", email: "", phone: "", address_line1: "", address_line2: "",
      city: "", state: "", pincode: "", notes: "",
    });
    setDone(null);
  };

  const total = item ? item.price_paise * qty : 0;

  const validate = () => {
    if (!form.full_name.trim()) return "Full name is required.";
    if (!form.email.trim()) return "Email is required.";
    if (!/^\+?\d[\d\s-]{7,}$/.test(form.phone)) return "Enter a valid phone number.";
    if (!form.address_line1.trim()) return "Address is required.";
    if (!form.city.trim()) return "City is required.";
    if (!form.state.trim()) return "State is required.";
    if (!/^\d{6}$/.test(form.pincode)) return "Pincode must be 6 digits.";
    return null;
  };

  const launchRazorpay = (orderData, orderId) => {
    if (!window.Razorpay) {
      toast.error("Payment SDK could not load.");
      return;
    }
    const opts = {
      key: orderData.razorpay_key_id,
      amount: orderData.amount,
      currency: orderData.currency,
      order_id: orderData.razorpay_order_id,
      name: "Astro Shraddha",
      description: `${item.name} × ${qty}`,
      prefill: { name: form.full_name, email: form.email, contact: form.phone },
      theme: { color: "#BC472A" },
      handler: async (response) => {
        try {
          await api.post("/rudraksha-orders/verify-payment", {
            order_id: orderId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          setDone({ orderId, paid: true });
          toast.success("Payment received. We'll ship within 48 hours.");
        } catch {
          toast.error("Payment verification failed. We'll contact you on WhatsApp.");
        }
      },
      modal: {
        ondismiss: () =>
          toast.info("Payment cancelled. Your order is held as pending."),
      },
    };
    new window.Razorpay(opts).open();
  };

  const submit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    setBusy(true);
    try {
      const { data } = await api.post("/rudraksha-orders", {
        ...form,
        rudraksha_id: item.id,
        quantity: qty,
      });
      if (data.is_live && data.razorpay_order_id && data.razorpay_key_id) {
        launchRazorpay(data, data.booking_id);
      } else {
        await api.post(`/rudraksha-orders/${data.booking_id}/mark-manual`);
        setDone({ orderId: data.booking_id, paid: false });
        toast.success("Order placed! We'll confirm payment on WhatsApp.");
      }
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Could not place order.");
    } finally {
      setBusy(false);
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(reset, 300);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl p-0">
        <div className="grid lg:grid-cols-5">
          <div className="lg:col-span-2 bg-[#F4EFE7] p-7 lg:p-10">
            <p className="overline mb-3">Sacred bead</p>
            <DialogHeader>
              <DialogTitle className="serif text-3xl leading-tight">{item?.name}</DialogTitle>
              <DialogDescription className="sr-only">
                Order {item?.name} — fill in shipping details to proceed to payment.
              </DialogDescription>
            </DialogHeader>
            <div className="mt-5 aspect-square rounded-2xl overflow-hidden">
              <img src={item?.image} alt={item?.name} className="w-full h-full object-cover" />
            </div>
            <div className="mt-6 space-y-3 text-sm font-light text-[#3a342f]">
              <div className="flex items-center gap-2">
                <ShieldCheck size={14} strokeWidth={1.5} className="text-[#BC472A]" />
                100% authentic, energised bead
              </div>
              <div className="flex items-center gap-2">
                <Truck size={14} strokeWidth={1.5} className="text-[#BC472A]" />
                Free shipping across India · dispatched in 48 hrs
              </div>
            </div>
            <div className="mt-6 rounded-2xl bg-white border border-[#E5DCD3] p-4">
              <p className="overline mb-2">Quantity</p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    data-testid="qty-minus"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-full border border-[#E5DCD3] flex items-center justify-center hover:border-[#BC472A]"
                  >
                    <Minus size={14} strokeWidth={1.5} />
                  </button>
                  <span className="serif text-xl w-6 text-center">{qty}</span>
                  <button
                    type="button"
                    data-testid="qty-plus"
                    onClick={() => setQty((q) => Math.min(10, q + 1))}
                    className="w-8 h-8 rounded-full border border-[#E5DCD3] flex items-center justify-center hover:border-[#BC472A]"
                  >
                    <Plus size={14} strokeWidth={1.5} />
                  </button>
                </div>
                <p className="serif text-2xl text-[#BC472A]">{formatINR(total)}</p>
              </div>
            </div>
          </div>

          {done ? (
            <div className="lg:col-span-3 p-8 lg:p-12 flex flex-col items-start">
              <div className="w-14 h-14 rounded-full bg-[#F4EFE7] text-[#BC472A] flex items-center justify-center mb-6">
                <CheckCircle2 size={26} strokeWidth={1.5} />
              </div>
              <p className="overline mb-2">Order received</p>
              <h3 className="serif text-3xl leading-tight">
                {done.paid ? "Payment received." : "Order placed."}
              </h3>
              <p className="text-sm text-[#6E6864] mt-3 font-light leading-relaxed">
                {done.paid
                  ? "We'll ship your Rudraksha within 48 hours and share the tracking link on WhatsApp."
                  : "Our team will reach out on WhatsApp shortly to confirm your payment & shipping details."}
              </p>
              <p className="text-xs text-[#6E6864] mt-6">
                Order reference: <span className="font-mono">{done.orderId?.slice(0, 8)}</span>
              </p>
              <button
                data-testid="order-close"
                onClick={handleClose}
                className="btn-pill mt-8 bg-[#BC472A] text-[#FAF8F5] px-6 py-3 text-sm"
              >
                Close
              </button>
            </div>
          ) : (
            <form
              onSubmit={submit}
              data-testid="checkout-form"
              className="lg:col-span-3 p-7 lg:p-10 grid sm:grid-cols-2 gap-4"
            >
              <div className="sm:col-span-2">
                <p className="overline mb-1">Step 2</p>
                <h3 className="serif text-2xl leading-tight">Shipping details</h3>
              </div>
              <div>
                <Label className="overline">Full name</Label>
                <Input
                  data-testid="ship-name"
                  className="mt-2 h-11 rounded-xl"
                  value={form.full_name}
                  onChange={(e) => update("full_name", e.target.value)}
                />
              </div>
              <div>
                <Label className="overline">Phone (WhatsApp)</Label>
                <Input
                  data-testid="ship-phone"
                  className="mt-2 h-11 rounded-xl"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="+91 9XXXXXXXXX"
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="overline">Email</Label>
                <Input
                  data-testid="ship-email"
                  type="email"
                  className="mt-2 h-11 rounded-xl"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="overline">Address</Label>
                <Input
                  data-testid="ship-addr1"
                  className="mt-2 h-11 rounded-xl"
                  value={form.address_line1}
                  onChange={(e) => update("address_line1", e.target.value)}
                  placeholder="House / building / street"
                />
                <Input
                  className="mt-2 h-11 rounded-xl"
                  value={form.address_line2}
                  onChange={(e) => update("address_line2", e.target.value)}
                  placeholder="Apartment, landmark (optional)"
                />
              </div>
              <div>
                <Label className="overline">City</Label>
                <Input
                  data-testid="ship-city"
                  className="mt-2 h-11 rounded-xl"
                  value={form.city}
                  onChange={(e) => update("city", e.target.value)}
                />
              </div>
              <div>
                <Label className="overline">State</Label>
                <Input
                  data-testid="ship-state"
                  className="mt-2 h-11 rounded-xl"
                  value={form.state}
                  onChange={(e) => update("state", e.target.value)}
                />
              </div>
              <div>
                <Label className="overline">Pincode</Label>
                <Input
                  data-testid="ship-pin"
                  className="mt-2 h-11 rounded-xl"
                  value={form.pincode}
                  onChange={(e) => update("pincode", e.target.value)}
                  placeholder="6-digit"
                  maxLength={6}
                />
              </div>
              <div className="sm:col-span-2">
                <Label className="overline">Notes (optional)</Label>
                <Textarea
                  className="mt-2 min-h-[70px] rounded-xl"
                  value={form.notes}
                  onChange={(e) => update("notes", e.target.value)}
                  placeholder="Any specific instructions"
                />
              </div>
              <div className="sm:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <p className="text-xs text-[#6E6864] font-light max-w-xs">
                  You'll be taken to Razorpay for a secure UPI / card / netbanking payment.
                </p>
                <button
                  type="submit"
                  disabled={busy}
                  data-testid="checkout-submit"
                  className="btn-pill bg-[#BC472A] hover:bg-[#A03C23] disabled:opacity-60 text-[#FAF8F5] px-6 py-3 text-sm tracking-wide inline-flex items-center gap-2"
                >
                  {busy ? (
                    <>
                      <Loader2 size={14} className="animate-spin" /> Placing…
                    </>
                  ) : (
                    <>
                      Pay {formatINR(total)} <ArrowUpRight size={14} strokeWidth={1.5} />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function Rudraksha() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.get("/rudraksha").then((r) => {
      setItems(r.data);
      setLoading(false);
    });
  }, []);

  return (
    <div data-testid="rudraksha-page" className="max-w-7xl mx-auto px-6 lg:px-10 py-20 lg:py-28">
      <div className="grid lg:grid-cols-12 gap-10 mb-16">
        <div className="lg:col-span-7">
          <p className="overline mb-5">Sacred shop · 3 to 7 Mukhi</p>
          <h1 className="serif text-4xl md:text-5xl lg:text-6xl leading-[1.05] tracking-tight">
            Rudraksha — small <br />
            seeds, profound <span className="text-[#BC472A]">resonance.</span>
          </h1>
        </div>
        <div className="lg:col-span-5 flex items-end">
          <p className="text-[#6E6864] font-light leading-relaxed">
            Every Rudraksha is hand-selected and energised before dispatch.
            Each Mukhi (face) is governed by a deity and planet — choose the
            one aligned with your need, or message us if you're unsure which
            fits your chart.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center text-[#6E6864]">
          <Loader2 size={20} className="animate-spin inline" />
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-7">
          {items.map((r) => (
            <article
              key={r.id}
              data-testid={`rudraksha-card-${r.id}`}
              className="rounded-3xl overflow-hidden bg-white border border-[#E5DCD3] hover:-translate-y-1 transition-transform shadow-[0_8px_30px_rgba(45,40,37,0.05)] flex flex-col"
            >
              <div className="relative aspect-[4/3]">
                <img src={r.image} alt={r.name} className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute top-4 left-4 backdrop-blur bg-[#FAF8F5]/85 rounded-full px-3 py-1 text-xs tracking-wide">
                  {r.deity} · {r.planet}
                </div>
                {r.mukhi === 7 && (
                  <div className="absolute top-4 right-4 bg-[#D4AF37] text-[#2D2825] rounded-full px-3 py-1 text-[11px] tracking-wide font-medium">
                    Lakshmi bead
                  </div>
                )}
              </div>

              <div className="p-6 flex flex-col flex-1">
                <h3 className="serif text-2xl leading-tight mb-2">{r.name}</h3>
                <p className="text-sm font-light text-[#3a342f] leading-relaxed mb-5 flex-1">
                  {r.description}
                </p>

                <ul className="space-y-1.5 mb-6">
                  {r.benefits?.slice(0, 3).map((b) => (
                    <li key={b} className="flex items-start gap-2 text-xs text-[#6E6864]">
                      <Sparkles size={12} strokeWidth={1.5} className="mt-0.5 text-[#BC472A] shrink-0" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>

                <div className="flex items-end justify-between gap-3 pt-4 border-t border-[#E5DCD3]">
                  <div>
                    <p className="overline mb-0.5">Price</p>
                    <p className="serif text-2xl text-[#BC472A]">{formatINR(r.price_paise)}</p>
                  </div>
                  <button
                    data-testid={`buy-${r.id}`}
                    onClick={() => setSelected(r)}
                    className="btn-pill bg-[#BC472A] hover:bg-[#A03C23] text-[#FAF8F5] px-5 py-2.5 text-sm tracking-wide inline-flex items-center gap-2 transition-colors"
                  >
                    <ShoppingBag size={14} strokeWidth={1.5} /> Buy Now
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      <div className="mt-16 rounded-3xl bg-[#2D2825] text-[#FAF8F5] p-10 lg:p-14">
        <p className="overline mb-4" style={{ color: "#D4AF37" }}>A gentle reminder</p>
        <h2 className="serif text-3xl md:text-4xl leading-tight max-w-3xl">
          A Rudraksha is a companion, not a cure. Unsure which Mukhi suits your
          chart? Message us on WhatsApp — we'll guide you, no obligation.
        </h2>
      </div>

      <CheckoutDialog
        item={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
      />
    </div>
  );
}
