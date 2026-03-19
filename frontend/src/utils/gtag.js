// Google Ads tracking utility
const ADS_ID = 'AW-17058967836';

// Track custom events
export const trackEvent = (eventName, params = {}) => {
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', eventName, params);
};

// Track Google Ads conversion (when order is completed)
export const trackAdsConversion = (value, currency = 'RSD') => {
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', 'conversion', {
    send_to: `${ADS_ID}/TFZFCKfJ7OsbEJzirMY_`,
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
