/**
 * Phase 5: Meta (Instagram / Facebook) Pixel Helper for Astro Shraddha.
 * Tracks high-intent ad conversions:
 * 1. Free Consultation Booked -> fbq('track', 'Schedule') & fbq('track', 'Lead')
 * 2. Rudraksha Pre-Payment Lead -> fbq('track', 'InitiateCheckout')
 * 3. Rudraksha Payment Completed -> fbq('track', 'Purchase')
 */

export const initMetaPixel = (pixelId = process.env.REACT_APP_META_PIXEL_ID) => {
  if (!pixelId || typeof window === "undefined" || window.fbq) return;
  /* eslint-disable */
  !(function (f, b, e, v, n, t, s) {
    if (f.fbq) return;
    n = f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    };
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = !0;
    n.version = "2.0";
    n.queue = [];
    t = b.createElement(e);
    t.async = !0;
    t.src = v;
    s = b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  /* eslint-enable */
  window.fbq("init", pixelId);
  window.fbq("track", "PageView");
};

export const trackConsultationBooked = ({ name, slot, topic }) => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "Schedule", {
      content_name: topic || "1-on-1 Vedic Consultation",
      status: "confirmed_free",
      slot,
    });
  }
};

export const trackRudrakshaLeadCaptured = ({ rudrakshaName, priceInr }) => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "InitiateCheckout", {
      content_name: rudrakshaName,
      value: priceInr,
      currency: "INR",
    });
  }
};

export const trackRudrakshaPurchase = ({ rudrakshaName, priceInr, orderId }) => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "Purchase", {
      content_name: rudrakshaName,
      value: priceInr,
      currency: "INR",
      order_id: orderId,
    });
  }
};
