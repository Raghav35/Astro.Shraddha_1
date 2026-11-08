import React, { useEffect, useState } from "react";
import { api, formatINR } from "@/lib/api";
import { Bell, CheckCircle, Clock, MessageCircle, PhoneCall, RefreshCw, ShoppingBag, Users } from "lucide-react";

export default function Admin() {
  const [bookings, setBookings] = useState([]);
  const [orders, setOrders] = useState([]);
  const [leadFilter, setLeadFilter] = useState("all"); // all | paid | followup
  const [activeTab, setActiveTab] = useState("bookings");
  const [loading, setLoading] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [bRes, oRes] = await Promise.all([
        api.get("/admin/bookings"),
        api.get("/admin/rudraksha-orders"),
      ]);
      setBookings(bRes.data || []);
      setOrders(oRes.data || []);
    } catch (err) {
      console.error("Failed to load admin records", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const trigger30MinReminder = async (bookingId) => {
    try {
      const res = await api.post(`/admin/bookings/${bookingId}/send-reminder`);
      if (res.data?.details?.customer_wa_click_url) {
        window.open(res.data.details.customer_wa_click_url, "_blank");
      }
      fetchAll();
    } catch (err) {
      console.error("Reminder trigger failed", err);
    }
  };

  const markLeadContacted = async (orderId) => {
    try {
      await api.patch(`/admin/rudraksha-orders/${orderId}`, {
        lead_stage: "contacted",
        status: "contacted",
      });
      fetchAll();
    } catch (err) {
      console.error("Failed to update lead stage", err);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (leadFilter === "paid") return o.payment_status === "paid";
    if (leadFilter === "followup") return o.payment_status !== "paid";
    return true;
  });

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#EEE3CD] pb-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-[#3D000C]">
            Astro Shraddha — Admin & Lead Command Center
          </h1>
          <p className="text-xs text-gray-600">
            Manage Free Consultation Bookings, 30-Min WhatsApp Reminders, and Pre-Payment Rudraksha Leads
          </p>
        </div>
        <button
          onClick={fetchAll}
          className="bg-white border border-[#EEE3CD] px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-[#F7F2E9]"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          <span>Refresh Records</span>
        </button>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#EEE3CD] shadow-sm">
          <span className="text-xs text-gray-500 font-semibold">Total Consultations</span>
          <div className="text-2xl font-bold text-[#3D000C] mt-1">{bookings.length}</div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#EEE3CD] shadow-sm">
          <span className="text-xs text-gray-500 font-semibold">30-Min Reminders Sent</span>
          <div className="text-2xl font-bold text-emerald-700 mt-1">
            {bookings.filter((b) => b.reminder_sent).length}
          </div>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-[#EEE3CD] shadow-sm">
          <span className="text-xs text-gray-500 font-semibold">Rudraksha Paid Orders</span>
          <div className="text-2xl font-bold text-emerald-700 mt-1">
            {orders.filter((o) => o.payment_status === "paid").length}
          </div>
        </div>
        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 shadow-sm">
          <span className="text-xs text-amber-900 font-semibold">Pre-Payment Leads (Follow Up)</span>
          <div className="text-2xl font-bold text-amber-800 mt-1">
            {orders.filter((o) => o.payment_status !== "paid").length}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab("bookings")}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${
            activeTab === "bookings" ? "bg-[#720B22] text-[#E5B85A]" : "bg-white text-gray-700 border"
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Consultation Bookings ({bookings.length})</span>
        </button>
        <button
          onClick={() => setActiveTab("rudraksha")}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${
            activeTab === "rudraksha" ? "bg-[#720B22] text-[#E5B85A]" : "bg-white text-gray-700 border"
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Rudraksha Orders & Pre-Payment Leads ({orders.length})</span>
        </button>
      </div>

      {activeTab === "bookings" ? (
        <div className="bg-white rounded-2xl border border-[#EEE3CD] overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F7F2E9] text-[#3D000C] uppercase font-bold">
              <tr>
                <th className="p-3.5">Client & Birth Details</th>
                <th className="p-3.5">WhatsApp</th>
                <th className="p-3.5">Slot (IST)</th>
                <th className="p-3.5">30-Min Reminder</th>
                <th className="p-3.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F7F2E9]">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-[#FDFBF7]">
                  <td className="p-3.5">
                    <div className="font-bold text-[#3D000C]">{b.full_name}</div>
                    <div className="text-[11px] text-gray-500">
                      DOB: {b.date_of_birth || "-"} | Time: {b.time_of_birth || "-"} | Place: {b.place_of_birth || "-"}
                    </div>
                  </td>
                  <td className="p-3.5 font-semibold">+91 {b.phone}</td>
                  <td className="p-3.5 font-bold text-emerald-800">
                    {b.consultation_date} • {b.consultation_time}
                  </td>
                  <td className="p-3.5">
                    {b.reminder_sent ? (
                      <span className="bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Sent
                      </span>
                    ) : (
                      <span className="bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Scheduled (30m prior)
                      </span>
                    )}
                  </td>
                  <td className="p-3.5 flex items-center gap-2">
                    <a
                      href={b.whatsapp_invite_url || `https://wa.me/91${b.phone}`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg font-bold inline-flex items-center gap-1"
                    >
                      <MessageCircle className="w-3.5 h-3.5" /> Invite
                    </a>
                    <button
                      onClick={() => trigger30MinReminder(b.id)}
                      className="bg-[#720B22] hover:bg-[#560014] text-[#E5B85A] px-3 py-1.5 rounded-lg font-bold inline-flex items-center gap-1"
                    >
                      <Bell className="w-3.5 h-3.5" /> Send 30m Alert
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2">
            <button
              onClick={() => setLeadFilter("all")}
              className={`px-3 py-1 rounded-lg text-xs font-bold ${
                leadFilter === "all" ? "bg-[#3D000C] text-white" : "bg-white border"
              }`}
            >
              All Leads ({orders.length})
            </button>
            <button
              onClick={() => setLeadFilter("followup")}
              className={`px-3 py-1 rounded-lg text-xs font-bold ${
                leadFilter === "followup" ? "bg-amber-600 text-white" : "bg-white border"
              }`}
            >
              Needs Team Follow-Up ({orders.filter((o) => o.payment_status !== "paid").length})
            </button>
            <button
              onClick={() => setLeadFilter("paid")}
              className={`px-3 py-1 rounded-lg text-xs font-bold ${
                leadFilter === "paid" ? "bg-emerald-700 text-white" : "bg-white border"
              }`}
            >
              Paid Orders ({orders.filter((o) => o.payment_status === "paid").length})
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-[#EEE3CD] overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F2E9] text-[#3D000C] uppercase font-bold">
                <tr>
                  <th className="p-3.5">Buyer</th>
                  <th className="p-3.5">Rudraksha</th>
                  <th className="p-3.5">Amount</th>
                  <th className="p-3.5">Shipping Address</th>
                  <th className="p-3.5">Payment / Lead Status</th>
                  <th className="p-3.5">Team Guidance Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F7F2E9]">
                {filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-[#FDFBF7]">
                    <td className="p-3.5">
                      <div className="font-bold text-[#3D000C]">{o.full_name}</div>
                      <div className="text-[11px] text-gray-500">+91 {o.phone}</div>
                    </td>
                    <td className="p-3.5 font-semibold">{o.rudraksha_name} (x{o.quantity})</td>
                    <td className="p-3.5 font-bold text-[#720B22]">{formatINR(o.amount)}</td>
                    <td className="p-3.5 text-[11px] text-gray-600">
                      {o.address_line1}, {o.city}, {o.state} - {o.pincode}
                    </td>
                    <td className="p-3.5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          o.payment_status === "paid"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-amber-100 text-amber-900"
                        }`}
                      >
                        {o.payment_status} • {o.lead_stage}
                      </span>
                    </td>
                    <td className="p-3.5 flex items-center gap-2">
                      <a
                        href={o.team_whatsapp_url || `https://wa.me/91${o.phone}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => markLeadContacted(o.id)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg font-bold inline-flex items-center gap-1"
                      >
                        <PhoneCall className="w-3.5 h-3.5" /> Guide on WhatsApp
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
