// Google Analytics / Google Ads tracking utility
const GA_MEASUREMENT_ID = 'G-5JYT6NT5ZS';
const ADS_ID = 'AW-17058967836';

// Send page view
export const trackPageView = (url, title) => {
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', 'page_view', {
    page_path: url,
    page_title: title,
    send_to: GA_MEASUREMENT_ID,
  });
};

// Track custom events (for GA4)
export const trackEvent = (eventName, params = {}) => {
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', eventName, params);
};

// Track Google Ads conversion
export const trackAdsConversion = (value, currency = 'RSD') => {
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', 'conversion', {
    send_to: 'AW-17058967836/TFZFCKfJ7OsbEJzirMY_',
    value: value,
    currency: currency,
  });
};

// Pre-defined events
export const trackAddToCart = (productName, price) => {
  trackEvent('add_to_cart', {
    currency: 'RSD',
    value: price,
    items: [{ item_name: productName, price: price }],
  });
};

export const trackBeginCheckout = (totalValue, itemCount) => {
  trackEvent('begin_checkout', {
    currency: 'RSD',
    value: totalValue,
    items_count: itemCount,
  });
};

export const trackPurchase = (orderNumber, totalValue, promoCode) => {
  trackEvent('purchase', {
    transaction_id: orderNumber,
    value: totalValue,
    currency: 'RSD',
    coupon: promoCode || undefined,
  });
};

export const trackPhotoUpload = (photoCount) => {
  trackEvent('photo_upload', {
    photo_count: photoCount,
  });
};

export const trackApplyPromoCode = (code, discountPercent) => {
  trackEvent('apply_promo_code', {
    coupon: code,
    discount_percent: discountPercent,
  });
};
