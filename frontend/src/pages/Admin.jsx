import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  Calendar as CalIcon,
  CheckCircle2,
  Clock,
  LogOut,
  MessageCircle,
  Phone,
  Plus,
  Loader2,
  RefreshCw,
  XCircle,
  Sparkles,
  Mail,
  X,
  IndianRupee,
  Users,
  CalendarDays,
  Inbox,
} from "lucide-react";
import { format, parseISO, isAfter, isToday } from "date-fns";

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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import { api, formatINR } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";

const TIME_SLOTS = [
  "10:00 AM", "11:30 AM", "01:00 PM", "03:00 PM",
  "04:30 PM", "06:00 PM", "07:30 PM",
];

const STATUS_COLORS = {
  paid: "bg-green-50 text-green-700 border-green-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  manual_pending: "bg-amber-50 text-amber-700 border-amber-200",
  failed: "bg-red-50 text-red-700 border-red-200",
  refunded: "bg-gray-100 text-gray-700 border-gray-200",
  upcoming: "bg-[#F4EFE7] text-[#BC472A] border-[#E5DCD3]",
  completed: "bg-green-50 text-green-700 border-green-200",
  cancelled: "bg-gray-100 text-gray-600 border-gray-200",
};

const Badge = ({ value }) => (
  <span
    className={`inline-flex items-center px-2.5 py-0.5 text-[11px] rounded-full border ${
      STATUS_COLORS[value] || "bg-gray-100 text-gray-700 border-gray-200"
    }`}
  >
    {value?.replace("_", " ") || "—"}
  </span>
);

const StatCard = ({ Icon, label, value, sub }) => (
  <div className="rounded-2xl border border-[#E5DCD3] bg-white p-5 shadow-[0_4px_20px_rgba(45,40,37,0.04)]">
    <div className="flex items-center gap-2 mb-2 text-[#BC472A]">
      <Icon size={16} strokeWidth={1.5} />
      <p className="overline">{label}</p>
    </div>
    <p className="serif text-3xl">{value}</p>
    {sub && <p className="text-xs text-[#6E6864] mt-1">{sub}</p>}
  </div>
);

function ManualBookingDialog({ services, onCreated }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    service_id: "",
    full_name: "",
    email: "",
    phone: "",
    consultation_date: "",
    consultation_time: "",
    date_of_birth: "",
    time_of_birth: "",
    place_of_birth: "",
    notes: "",
    payment_status: "manual_pending",
  });

  const update = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.service_id || !form.full_name || !form.email || !form.phone || !form.consultation_date || !form.consultation_time) {
      toast.error("Please fill service, name, email, phone, date and time.");
      return;
    }
    setBusy(true);
    try {
      await api.post("/admin/bookings/manual", form);
      toast.success("Manual booking added.");
      setOpen(false);
      setForm({
        service_id: "", full_name: "", email: "", phone: "",
        consultation_date: "", consultation_time: "",
        date_of_birth: "", time_of_birth: "", place_of_birth: "", notes: "",
        payment_status: "manual_pending",
      });
      onCreated?.();
    } catch (err) {
      const d = err?.response?.data?.detail;
      toast.error(typeof d === "string" ? d : "Could not add booking.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          data-testid="admin-add-booking-btn"
          className="btn-pill bg-[#BC472A] hover:bg-[#A03C23] text-[#FAF8F5] px-5 py-2.5 text-sm tracking-wide inline-flex items-center gap-2"
        >
          <Plus size={16} strokeWidth={1.5} /> Add booking
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl">
        <DialogHeader>
          <DialogTitle className="serif text-2xl">Add a manual booking</DialogTitle>
          <p className="text-sm text-[#6E6864] font-light">For clients who booked via WhatsApp or phone.</p>
        </DialogHeader>
        <form onSubmit={submit} className="grid sm:grid-cols-2 gap-4 mt-2">
          <div className="sm:col-span-2">
            <Label className="overline">Service</Label>
            <Select value={form.service_id} onValueChange={(v) => update("service_id", v)}>
              <SelectTrigger data-testid="manual-service" className="mt-2 h-11 rounded-xl">
                <SelectValue placeholder="Choose service" />
              </SelectTrigger>
              <SelectContent>
                {services.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name} — {formatINR(s.price_paise)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="overline">Full name</Label>
            <Input data-testid="manual-name" className="mt-2 h-11 rounded-xl" value={form.full_name} onChange={(e) => update("full_name", e.target.value)} />
          </div>
          <div>
            <Label className="overline">Phone</Label>
            <Input data-testid="manual-phone" className="mt-2 h-11 rounded-xl" value={form.phone} onChange={(e) => update("phone", e.target.value)} placeholder="+91..." />
          </div>
          <div className="sm:col-span-2">
            <Label className="overline">Email</Label>
            <Input data-testid="manual-email" type="email" className="mt-2 h-11 rounded-xl" value={form.email} onChange={(e) => update("email", e.target.value)} />
          </div>
          <div>
            <Label className="overline">Consultation date</Label>
            <Input data-testid="manual-date" type="date" className="mt-2 h-11 rounded-xl" value={form.consultation_date} onChange={(e) => update("consultation_date", e.target.value)} />
          </div>
          <div>
            <Label className="overline">Time slot</Label>
            <Select value={form.consultation_time} onValueChange={(v) => update("consultation_time", v)}>
              <SelectTrigger data-testid="manual-time" className="mt-2 h-11 rounded-xl">
                <SelectValue placeholder="Pick a time" />
              </SelectTrigger>
              <SelectContent>
                {TIME_SLOTS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="overline">DOB</Label>
            <Input type="date" className="mt-2 h-11 rounded-xl" value={form.date_of_birth} onChange={(e) => update("date_of_birth", e.target.value)} />
          </div>
          <div>
            <Label className="overline">Time of birth</Label>
            <Input type="time" className="mt-2 h-11 rounded-xl" value={form.time_of_birth} onChange={(e) => update("time_of_birth", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label className="overline">Place of birth</Label>
            <Input className="mt-2 h-11 rounded-xl" value={form.place_of_birth} onChange={(e) => update("place_of_birth", e.target.value)} />
          </div>
          <div>
            <Label className="overline">Payment status</Label>
            <Select value={form.payment_status} onValueChange={(v) => update("payment_status", v)}>
              <SelectTrigger className="mt-2 h-11 rounded-xl">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual_pending">Manual pending</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label className="overline">Notes</Label>
            <Textarea className="mt-2 min-h-[80px] rounded-xl" value={form.notes} onChange={(e) => update("notes", e.target.value)} />
          </div>
          <div className="sm:col-span-2 flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setOpen(false)} className="btn-pill border border-[#E5DCD3] px-5 py-2.5 text-sm">Cancel</button>
            <button
              data-testid="manual-submit"
              type="submit"
              disabled={busy}
              className="btn-pill bg-[#BC472A] hover:bg-[#A03C23] disabled:opacity-60 text-[#FAF8F5] px-6 py-2.5 text-sm inline-flex items-center gap-2"
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} strokeWidth={1.5} />}
              Save booking
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function BookingRow({ b, onUpdate }) {
  const wa = (b.phone || "").replace(/\D/g, "");
  const isUpcoming = b.consultation_date && (isAfter(parseISO(b.consultation_date), new Date()) || isToday(parseISO(b.consultation_date)));

  const update = async (patch, msg) => {
    try {
      await api.patch(`/admin/bookings/${b.id}`, patch);
      toast.success(msg);
      onUpdate?.();
    } catch (err) {
      const d = err?.response?.data?.detail;
      toast.error(typeof d === "string" ? d : "Update failed");
    }
  };

  return (
    <div
      data-testid={`booking-row-${b.id}`}
      className="rounded-2xl border border-[#E5DCD3] bg-white p-5 hover:border-[#BC472A]/40 transition-colors"
    >
      <div className="grid lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-3">
          <p className="overline mb-1">{isUpcoming ? "Upcoming" : "Past"}</p>
          <p className="serif text-xl leading-tight">
            {b.consultation_date ? format(parseISO(b.consultation_date), "EEE, d MMM") : "—"}
          </p>
          <p className="text-sm text-[#6E6864] mt-0.5 flex items-center gap-1">
            <Clock size={12} strokeWidth={1.5} /> {b.consultation_time || "—"}
          </p>
        </div>
        <div className="lg:col-span-4">
          <p className="serif text-lg leading-tight">{b.full_name}</p>
          <p className="text-sm text-[#6E6864] mt-0.5">{b.service_name}</p>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-[#3a342f]">
            <a className="hover:text-[#BC472A] flex items-center gap-1" href={`tel:${b.phone}`}>
              <Phone size={12} strokeWidth={1.5} /> {b.phone}
            </a>
            {wa && (
              <a
                className="hover:text-[#BC472A] flex items-center gap-1"
                href={`https://wa.me/${wa.startsWith("91") ? wa : "91" + wa}`}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle size={12} strokeWidth={1.5} /> WhatsApp
              </a>
            )}
            <a className="hover:text-[#BC472A] flex items-center gap-1" href={`mailto:${b.email}`}>
              <Mail size={12} strokeWidth={1.5} /> {b.email}
            </a>
          </div>
        </div>
        <div className="lg:col-span-3 text-xs text-[#3a342f] font-light leading-relaxed">
          <p><span className="text-[#6E6864]">DOB:</span> {b.date_of_birth || "—"} {b.time_of_birth || ""}</p>
          <p><span className="text-[#6E6864]">POB:</span> {b.place_of_birth || "—"}</p>
          {b.notes && <p className="mt-1 italic">"{b.notes}"</p>}
          <p className="mt-2 text-[#6E6864]">Ref: <span className="font-mono">{b.id?.slice(0, 8)}</span></p>
        </div>
        <div className="lg:col-span-2 flex flex-col items-start lg:items-end gap-2">
          <div className="flex flex-wrap gap-1.5 justify-end">
            <Badge value={b.payment_status} />
            {b.status && <Badge value={b.status} />}
          </div>
          <p className="serif text-lg">{formatINR(b.amount || 0)}</p>
          <div className="flex flex-wrap gap-1.5 justify-end mt-2">
            {b.payment_status !== "paid" && (
              <button
                data-testid={`mark-paid-${b.id}`}
                onClick={() => update({ payment_status: "paid" }, "Marked as paid")}
                title="Mark as paid"
                className="text-xs px-2.5 py-1 rounded-full border border-[#E5DCD3] hover:border-green-500 hover:text-green-700"
              >
                <CheckCircle2 size={12} strokeWidth={1.5} className="inline mr-1" /> Paid
              </button>
            )}
            {b.status !== "completed" && (
              <button
                data-testid={`mark-done-${b.id}`}
                onClick={() => update({ status: "completed" }, "Marked as completed")}
                title="Mark as completed"
                className="text-xs px-2.5 py-1 rounded-full border border-[#E5DCD3] hover:border-[#BC472A] hover:text-[#BC472A]"
              >
                Done
              </button>
            )}
            {b.status !== "cancelled" && (
              <button
                data-testid={`mark-cancel-${b.id}`}
                onClick={() => update({ status: "cancelled" }, "Booking cancelled")}
                title="Cancel"
                className="text-xs px-2.5 py-1 rounded-full border border-[#E5DCD3] hover:border-red-400 hover:text-red-700"
              >
                <X size={12} strokeWidth={1.5} className="inline mr-1" /> Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Admin() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [s, b, c, sv] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/bookings"),
        api.get("/admin/contact"),
        api.get("/services"),
      ]);
      setStats(s.data);
      setBookings(b.data);
      setContacts(c.data);
      setServices(sv.data);
    } catch (e) {
      toast.error("Could not load admin data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const { upcoming, past } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const up = [];
    const pa = [];
    bookings.forEach((b) => {
      try {
        const d = parseISO(b.consultation_date);
        if (isAfter(d, today) || isToday(d)) up.push(b);
        else pa.push(b);
      } catch {
        pa.push(b);
      }
    });
    return { upcoming: up, past: pa };
  }, [bookings]);

  const doLogout = () => {
    navigate("/", { replace: true });
    setTimeout(() => logout(), 0);
    toast.success("Signed out.");
  };

  return (
    <div data-testid="admin-page" className="max-w-7xl mx-auto px-6 lg:px-10 py-14">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
        <div>
          <p className="overline mb-2 flex items-center gap-2">
            <Sparkles size={12} strokeWidth={1.5} className="text-[#BC472A]" /> Astrologer dashboard
          </p>
          <h1 className="serif text-4xl md:text-5xl leading-[1.05]">
            Welcome back,
            <span className="text-[#BC472A]"> Shraddha.</span>
          </h1>
          <p className="text-sm text-[#6E6864] mt-2 font-light">{user?.email}</p>
        </div>
        <div className="flex gap-2">
          <button
            data-testid="admin-refresh"
            onClick={load}
            className="btn-pill border border-[#E5DCD3] hover:border-[#BC472A] hover:text-[#BC472A] px-4 py-2.5 text-sm inline-flex items-center gap-2"
          >
            <RefreshCw size={14} strokeWidth={1.5} /> Refresh
          </button>
          <ManualBookingDialog services={services} onCreated={load} />
          <button
            data-testid="admin-logout"
            onClick={doLogout}
            className="btn-pill border border-[#E5DCD3] hover:border-red-300 hover:text-red-700 px-4 py-2.5 text-sm inline-flex items-center gap-2"
          >
            <LogOut size={14} strokeWidth={1.5} /> Sign out
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-10">
        <StatCard
          Icon={CalendarDays}
          label="Upcoming"
          value={stats?.upcoming_bookings ?? "—"}
          sub="Future appointments"
        />
        <StatCard
          Icon={Users}
          label="Total bookings"
          value={stats?.total_bookings ?? "—"}
          sub="All time"
        />
        <StatCard
          Icon={CheckCircle2}
          label="Paid"
          value={stats?.paid_bookings ?? "—"}
          sub="Confirmed"
        />
        <StatCard
          Icon={XCircle}
          label="Pending"
          value={stats?.pending_bookings ?? "—"}
          sub="Awaiting payment"
        />
        <StatCard
          Icon={IndianRupee}
          label="Revenue"
          value={stats ? formatINR(stats.revenue_paise) : "—"}
          sub="From paid bookings"
        />
      </div>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="bg-[#F4EFE7] border border-[#E5DCD3] rounded-full p-1 mb-6">
          <TabsTrigger
            value="upcoming"
            data-testid="tab-upcoming"
            className="rounded-full data-[state=active]:bg-[#BC472A] data-[state=active]:text-[#FAF8F5]"
          >
            Upcoming ({upcoming.length})
          </TabsTrigger>
          <TabsTrigger
            value="past"
            data-testid="tab-past"
            className="rounded-full data-[state=active]:bg-[#BC472A] data-[state=active]:text-[#FAF8F5]"
          >
            Past ({past.length})
          </TabsTrigger>
          <TabsTrigger
            value="contacts"
            data-testid="tab-contacts"
            className="rounded-full data-[state=active]:bg-[#BC472A] data-[state=active]:text-[#FAF8F5]"
          >
            <Inbox size={13} strokeWidth={1.5} className="mr-1.5" />
            Messages ({contacts.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming" className="space-y-3">
          {loading ? (
            <div className="py-16 text-center text-[#6E6864]"><Loader2 size={20} className="animate-spin inline" /></div>
          ) : upcoming.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#E5DCD3] p-12 text-center text-[#6E6864]">
              <CalIcon size={28} strokeWidth={1.5} className="mx-auto mb-3 text-[#BC472A]" />
              No upcoming appointments. Enjoy the calm. ✨
            </div>
          ) : (
            upcoming.map((b) => <BookingRow key={b.id} b={b} onUpdate={load} />)
          )}
        </TabsContent>

        <TabsContent value="past" className="space-y-3">
          {past.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#E5DCD3] p-12 text-center text-[#6E6864]">
              No past bookings yet.
            </div>
          ) : (
            past.map((b) => <BookingRow key={b.id} b={b} onUpdate={load} />)
          )}
        </TabsContent>

        <TabsContent value="contacts" className="space-y-3">
          {contacts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#E5DCD3] p-12 text-center text-[#6E6864]">
              No messages yet.
            </div>
          ) : (
            contacts.map((c) => (
              <div
                key={c.id}
                data-testid={`contact-row-${c.id}`}
                className="rounded-2xl border border-[#E5DCD3] bg-white p-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div>
                    <p className="serif text-lg">{c.name}</p>
                    <p className="text-xs text-[#6E6864]">
                      {c.email} {c.phone && <>· {c.phone}</>}
                    </p>
                  </div>
                  <p className="text-xs text-[#6E6864]">
                    {c.created_at ? format(parseISO(c.created_at), "d MMM yyyy, h:mm a") : ""}
                  </p>
                </div>
                {c.subject && <p className="overline mb-1">{c.subject}</p>}
                <p className="text-sm font-light leading-relaxed text-[#3a342f]">{c.message}</p>
                <div className="mt-3 flex gap-2">
                  <a
                    href={`mailto:${c.email}`}
                    className="btn-pill border border-[#E5DCD3] hover:border-[#BC472A] hover:text-[#BC472A] px-4 py-1.5 text-xs inline-flex items-center gap-1.5"
                  >
                    <Mail size={12} strokeWidth={1.5} /> Reply via email
                  </a>
                  {c.phone && (
                    <a
                      href={`https://wa.me/${c.phone.replace(/\D/g, "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-pill border border-[#E5DCD3] hover:border-[#BC472A] hover:text-[#BC472A] px-4 py-1.5 text-xs inline-flex items-center gap-1.5"
                    >
                      <MessageCircle size={12} strokeWidth={1.5} /> WhatsApp
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
