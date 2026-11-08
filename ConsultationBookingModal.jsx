import React, { useState } from 'react';
import { X, CheckCircle, MessageCircle, Video, MapPin } from 'lucide-react';

export default function ConsultationBookingModal({ onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    dob: '',
    time: '',
    place: 'Pune',
    slot: 'Today, 4:00 PM IST',
    mode: 'Online (Google Meet)',
    topic: 'Kundli Reading & Life Forecast'
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const isOnline = formData.mode.includes('Online');

    // Compose complete WhatsApp message with customer details and meeting link addressed to Astrologer Shraddha (+91 74997 78268)
    const waText = 
      `🙏 Namaste Astrologer Shraddha Ji,\n\n` +
      `I would like to book a consultation with you:\n\n` +
      `👤 *Name:* ${formData.name}\n` +
      `📞 *My WhatsApp:* +91 ${formData.phone}\n` +
      `📅 *Slot:* ${formData.slot}\n` +
      `📍 *Mode:* ${formData.mode}\n` +
      `🔮 *Topic:* ${formData.topic}\n` +
      `📌 *Birth Details:* DOB: ${formData.dob || 'Not provided'} | Time: ${formData.time || 'Not provided'} | Place: ${formData.place || 'Pune'}\n\n` +
      `${isOnline ? '🔗 *Meeting Link:* https://meet.google.com/qtr-tjyz-sqg\n\n' : '🏢 *Office Visit:* Pune Office\n\n'}` +
      `Please confirm my appointment! Hari Om.`;

    const directWaUrl = `https://wa.me/917499778268?text=${encodeURIComponent(waText)}`;

    // AS SOON AS USER CLICKS CONFIRM BOOKING, IMMEDIATELY LAUNCH WHATSAPP
    window.open(directWaUrl, '_blank');

    setIsSubmitted(true);
  };

  const isOnline = formData.mode.includes('Online');
  const directWaUrl = `https://wa.me/917499778268?text=${encodeURIComponent(
    `🙏 Namaste Astrologer Shraddha Ji, I would like to book a consultation for ${formData.slot}. Name: ${formData.name}, Phone: +91 ${formData.phone}. Meeting Link: https://meet.google.com/qtr-tjyz-sqg`
  )}`;

  return (
    <div className="fixed inset-0 z-50 bg-[#3D000C]/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gold-400/30 relative">
        <button onClick={onClose} className="absolute top-5 right-5 text-gray-500 hover:text-black">
          <X className="w-6 h-6" />
        </button>

        {!isSubmitted ? (
          <div>
            <div className="text-center mb-6">
              <span className="bg-emerald-50 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200">
                Zero Upfront Payment Required
              </span>
              <h3 className="font-serif text-2xl font-bold text-[#3D000C] mt-2">Book Astrological Consultation</h3>
              <p className="text-xs text-gray-600">
                Fill your details below. Clicking Confirm Booking immediately opens WhatsApp with your message and session link.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Consultation Mode */}
              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1.5">Consultation Mode *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, mode: 'Online (Google Meet)' })}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition ${
                      isOnline
                        ? 'bg-[#720B22] text-[#E5B85A] border-[#720B22] shadow-sm'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Video className="w-4 h-4" />
                    <span>Online (Google Meet)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, mode: 'In-Person (Pune Office)' })}
                    className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition ${
                      !isOnline
                        ? 'bg-[#720B22] text-[#E5B85A] border-[#720B22] shadow-sm'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <MapPin className="w-4 h-4 text-rose-600" />
                    <span>In-Person (Pune Office)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">Full Name *</label>
                <input 
                  type="text" 
                  required 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  placeholder="e.g. Rahul Sharma" 
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 focus:outline-none focus:border-[#720B22]" 
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase mb-1">WhatsApp Mobile Number *</label>
                <div className="flex">
                  <span className="inline-flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-xl text-gray-600">+91</span>
                  <input 
                    type="tel" 
                    required 
                    pattern="[6-9][0-9]{9}" 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value})} 
                    placeholder="10-digit number" 
                    className="w-full px-3.5 py-2.5 rounded-r-xl border border-gray-300 focus:outline-none focus:border-[#720B22]" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Date of Birth</label>
                  <input type="date" value={formData.dob} onChange={e => setFormData({...formData, dob: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-gray-300" />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Preferred Slot</label>
                  <select value={formData.slot} onChange={e => setFormData({...formData, slot: e.target.value})} className="w-full px-3 py-2 rounded-xl border border-gray-300">
                    <option value="Today, 4:00 PM IST">Today, 4:00 PM IST</option>
                    <option value="Today, 6:00 PM IST">Today, 6:00 PM IST</option>
                    <option value="Tomorrow, 11:00 AM IST">Tomorrow, 11:00 AM IST</option>
                    <option value="Tomorrow, 5:00 PM IST">Tomorrow, 5:00 PM IST</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="w-full bg-[#720B22] hover:bg-[#560014] text-white font-bold py-3.5 rounded-xl transition flex items-center justify-center gap-2 mt-2">
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>Confirm Booking (Receive WhatsApp Invite)</span>
              </button>
            </form>
          </div>
        ) : (
          <div className="text-center space-y-4 py-2">
            <CheckCircle className="w-14 h-14 text-emerald-600 mx-auto ring-4 ring-emerald-50 rounded-full" />
            <h4 className="font-serif text-2xl font-bold text-[#3D000C]">Booking Confirmed!</h4>
            <p className="text-xs text-gray-600">
              Opening WhatsApp with your booking details for <strong>Astrologer Shraddha</strong>.
            </p>

            <a 
              href={directWaUrl} 
              target="_blank" 
              rel="noreferrer"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-md"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Send Details to Astrologer Shraddha on WhatsApp</span>
            </a>

            <div className="bg-[#F7F2E9] p-3 rounded-xl text-left text-xs space-y-1">
              <div className="flex justify-between text-[11px]">
                <span className="text-gray-500">Google Meet Link:</span>
                <span className="font-bold text-[#720B22]">meet.google.com/qtr-tjyz-sqg</span>
              </div>
            </div>

            <button onClick={onClose} className="text-xs text-gray-500 hover:text-black font-semibold pt-1">
              Back to Website
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
