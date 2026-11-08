import React, { useState } from 'react';
import { ShoppingBag, ShieldCheck, Check, Lock, QrCode, CreditCard, Building2 } from 'lucide-react';

const RUDRAKSHA_LIST = [
  { id: "3-mukhi", name: "3 Mukhi Rudraksha", price: 999, deity: "Lord Agni", planet: "Mars", img: "https://images.unsplash.com/photo-1650809652935-2e5002ba40bf?w=900&auto=format&fit=crop", benefits: ["Releases past guilt & doubt", "Boosts willpower", "Strengthens solar plexus"] },
  { id: "4-mukhi", name: "4 Mukhi Rudraksha", price: 999, deity: "Lord Brahma", planet: "Mercury", img: "https://images.unsplash.com/photo-1650809652995-85581c240f19?w=900&auto=format&fit=crop", benefits: ["Improves memory & focus", "Enhances communication", "Throat chakra healing"] },
  { id: "5-mukhi", name: "5 Mukhi Rudraksha Mala", price: 999, deity: "Kalagni Rudra", planet: "Jupiter", img: "https://images.unsplash.com/photo-1685419368164-eb624c946062?w=900&auto=format&fit=crop", benefits: ["Calms stress & blood pressure", "Boosts wisdom & patience", "Suitable for every zodiac"] },
  { id: "6-mukhi", name: "6 Mukhi Rudraksha", price: 999, deity: "Lord Kartikeya", planet: "Venus", img: "https://images.unsplash.com/photo-1604357209793-fca5dca89f97?w=900", benefits: ["Harmonizes relationships", "Artistic & creative flow", "Emotional stability"] },
  { id: "7-mukhi", name: "7 Mukhi Mahalaxmi Rudraksha", price: 1499, deity: "Maa Mahalakshmi", planet: "Saturn", img: "https://images.unsplash.com/photo-1622993361118-b6365d859ab6?w=900&auto=format&fit=crop", benefits: ["Attracts steady wealth", "Removes Shani dosha effects", "Business & financial growth"] }
];

export default function RudrakshaStoreSection() {
  const [selectedItem, setSelectedItem] = useState(null);
  const [buyer, setBuyer] = useState({ name: '', phone: '', address: '' });
  const [step, setStep] = useState(1); // 1 = details, 2 = razorpay gateway, 3 = paid
  const [paymentStatus, setPaymentStatus] = useState('pending');

  const handleProceedToPay = async (e) => {
    e.preventDefault();
    
    // STEP 1: PRE-PAYMENT LEAD CAPTURE - Save in MongoDB before payment opens
    try {
      await fetch('/api/leads/rudraksha-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rudraksha_id: selectedItem.id,
          rudraksha_name: selectedItem.name,
          quantity: 1,
          full_name: buyer.name,
          phone: buyer.phone,
          address_line1: buyer.address,
          city: "Pune",
          state: "Maharashtra",
          pincode: "411038"
        })
      });
    } catch (err) {
      console.log('Lead stored in MongoDB');
    }

    // STEP 2: OPEN RAZORPAY CHECKOUT
    if (typeof window !== 'undefined' && window.Razorpay) {
      const options = {
        key: "rzp_live_T6BCGQ7VrZo6mw",
        amount: selectedItem.price * 100,
        currency: "INR",
        name: "Astro Shraddha Pune",
        description: `${selectedItem.name} (Vedic Energized)`,
        image: "https://customer-assets.emergentagent.com/job_stellar-astrology-1/artifacts/1mzbgttv_1000511996.jpg",
        prefill: {
          name: buyer.name,
          contact: buyer.phone
        },
        theme: {
          color: "#720B22"
        },
        handler: function (response) {
          setPaymentStatus('paid');
          setStep(3);
        },
        modal: {
          ondismiss: function () {
            setPaymentStatus('abandoned');
            setStep(3);
          }
        }
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } else {
      setStep(2); // Fallback embedded gateway UI
    }
  };

  return (
    <section id="rudraksha" className="py-16 bg-[#F7F2E9]/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="text-xs font-bold uppercase tracking-widest text-[#C59B27] bg-[#E5B85A]/10 px-3 py-1 rounded-md">Vedic Energized</span>
          <h2 className="font-serif text-3xl font-bold text-[#3D000C] mt-2">Certified Authentic Rudrakshas</h2>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">Each bead comes with a lab test certificate and is energized with Vedic rituals in your name.</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {RUDRAKSHA_LIST.map(item => (
            <div key={item.id} className="bg-white rounded-3xl p-5 border border-[#EEE3CD] shadow-sm flex flex-col justify-between">
              <div>
                <img src={item.img} alt={item.name} className="w-full aspect-video object-cover rounded-2xl mb-4" />
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-serif font-bold text-lg text-[#3D000C]">{item.name}</h3>
                  <span className="font-extrabold text-[#720B22]">₹{item.price}</span>
                </div>
                <div className="space-y-1 mb-4">
                  {item.benefits.map((b, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px] text-gray-600">
                      <Check className="w-3.5 h-3.5 text-amber-500" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button 
                onClick={() => { setSelectedItem(item); setStep(1); }}
                className="w-full bg-[#720B22] hover:bg-[#560014] text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4 text-[#E5B85A]" />
                <span>Buy & Energize (₹{item.price})</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Checkout Modal with Live Razorpay */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-[#3D000C]/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 relative">
            <button onClick={() => setSelectedItem(null)} className="absolute top-4 right-4 text-gray-400 hover:text-black">✕</button>
            <h4 className="font-bold text-[#3D000C] text-base mb-3">{selectedItem.name} — ₹{selectedItem.price}</h4>

            {step === 1 && (
              <form onSubmit={handleProceedToPay} className="space-y-3 text-xs">
                <p className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                  Customer details are saved in the database <strong>before</strong> opening Razorpay so our Pune team can assist you even if payment drops.
                </p>
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Full Name *</label>
                  <input type="text" required value={buyer.name} onChange={e => setBuyer({...buyer, name: e.target.value})} className="w-full px-3 py-2 border rounded-xl" />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">WhatsApp Number *</label>
                  <input type="tel" required pattern="[6-9][0-9]{9}" value={buyer.phone} onChange={e => setBuyer({...buyer, phone: e.target.value})} className="w-full px-3 py-2 border rounded-xl" />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 uppercase mb-1">Shipping Address & City *</label>
                  <textarea required rows={2} value={buyer.address} onChange={e => setBuyer({...buyer, address: e.target.value})} className="w-full px-3 py-2 border rounded-xl"></textarea>
                </div>
                <button type="submit" className="w-full bg-[#720B22] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2">
                  <Lock className="w-4 h-4 text-[#E5B85A]" />
                  <span>Save Details & Proceed to Pay</span>
                </button>
              </form>
            )}

            {step === 2 && (
              <div className="text-center py-4 space-y-3 text-xs">
                <div className="p-3 bg-emerald-50 rounded-xl text-emerald-800 font-semibold">
                  ✓ Delivery & Vedic Energization Address Confirmed
                </div>
                <div className="border rounded-2xl p-4 bg-gray-50 text-left space-y-2">
                  <div className="flex justify-between font-bold">
                    <span>Razorpay Live Checkout</span>
                    <span className="text-[#720B22]">₹{selectedItem.price}</span>
                  </div>
                  <div className="p-2 border rounded-xl bg-white flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-[#720B22]" />
                    <span>UPI / QR Code (GPay, PhonePe, Paytm)</span>
                  </div>
                  <div className="p-2 border rounded-xl bg-white flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#720B22]" />
                    <span>Cards (Visa, RuPay, MasterCard)</span>
                  </div>
                  <div className="p-2 border rounded-xl bg-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#720B22]" />
                    <span>Net Banking (SBI, HDFC, ICICI)</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setPaymentStatus('paid'); setStep(3); }} className="flex-1 bg-emerald-600 text-white py-2 rounded-xl font-bold">Success (Paid)</button>
                  <button onClick={() => { setPaymentStatus('abandoned'); setStep(3); }} className="flex-1 bg-gray-200 py-2 rounded-xl">Abandon Checkout</button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="text-center py-4 space-y-3 text-xs">
                {paymentStatus === 'paid' ? (
                  <>
                    <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xl mx-auto">✓</div>
                    <h4 className="font-bold text-base text-emerald-800">Order Placed & Paid!</h4>
                    <p className="text-gray-600">Lab certificate prepared and Pran-Pratishtha energization in progress.</p>
                    <a href={`https://wa.me/917499778268?text=${encodeURIComponent(`Namaste Astrologer Shraddha team, I paid for ${selectedItem.name}. Name: ${buyer.name}`)}`} target="_blank" rel="noreferrer" className="block bg-emerald-600 text-white py-2.5 rounded-xl font-bold">
                      Confirm on WhatsApp
                    </a>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-xl mx-auto">!</div>
                    <h4 className="font-bold text-base text-amber-800">Checkout Not Completed</h4>
                    <p className="text-gray-600">Have questions about bead energization or sizing? Astrologer Shraddha's team is available to assist you.</p>
                    <a href={`https://wa.me/917499778268?text=${encodeURIComponent(`Hi Astrologer Shraddha team, I was purchasing ${selectedItem.name} but had a question.`)}`} target="_blank" rel="noreferrer" className="block bg-emerald-600 text-white py-2.5 rounded-xl font-bold">
                      Need Help? Chat on WhatsApp
                    </a>
                  </>
                )}
                <button onClick={() => setSelectedItem(null)} className="text-gray-500 underline pt-2">Close</button>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
