import crypto from 'crypto';

export const generateSKU = (prefix: string, id: number): string => {
  return `${prefix}-${String(id).padStart(6, '0')}`;
};

export const generateBarcode = (): string => {
  return crypto.randomBytes(6).toString('hex').toUpperCase();
};

export const generateOrderNumber = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `ORD-${timestamp}-${random}`;
};

export const generatePO_NUMBER = (): string => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `PO-${timestamp}-${random}`;
};

export const generateReferralCode = (): string => {
  return crypto.randomBytes(4).toString('hex').toUpperCase();
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN').format(amount) + ' VND';
};

export const formatCurrencyVND = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN').format(amount);
};

export const paginate = (page = 1, limit = 20) => {
  const take = Math.min(Math.max(limit, 1), 100);
  const skip = (Math.max(page, 1) - 1) * take;
  return { take, skip };
};

export const slugify = (text: string): string => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

export const generateSlug = (name: string, id: number): string => {
  const baseSlug = slugify(name);
  return `${baseSlug}-${id}`;
};

export const calculateDiscount = (
  amount: number,
  discountType: 'percentage' | 'fixed_amount',
  discountValue: number,
  maxDiscount?: number
): number => {
  if (discountType === 'percentage') {
    const discount = (amount * discountValue) / 100;
    return maxDiscount ? Math.min(discount, maxDiscount) : discount;
  }
  return Math.min(discountValue, amount);
};

export const getLoyaltyTier = (totalSpent: number): { tier: string; points: number } => {
  if (totalSpent >= 50000000) {
    return { tier: 'platinum', points: Math.floor(totalSpent / 100000) };
  } else if (totalSpent >= 20000000) {
    return { tier: 'gold', points: Math.floor(totalSpent / 150000) };
  } else if (totalSpent >= 5000000) {
    return { tier: 'silver', points: Math.floor(totalSpent / 200000) };
  }
  return { tier: 'bronze', points: Math.floor(totalSpent / 250000) };
};

export const addLoyaltyPoints = (currentPoints: number, orderAmount: number): number => {
  return currentPoints + Math.floor(orderAmount / 100000);
};

export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /(84|0)[0-9]{9,10}/;
  return phoneRegex.test(phone.replace(/\s+/g, ''));
};

export const formatPhone = (phone: string): string => {
  return phone.replace(/(\+84|84|0)/g, (match) => {
    if (match === '84' || match === '+84') return '0';
    return match;
  });
};

export const calculateTax = (amount: number, taxRate = 0.1): number => {
  return Math.round(amount * taxRate);
};

export const roundToTwoDecimals = (num: number): number => {
  return Math.round(num * 100) / 100;
};
