export type UserRole = 'admin' | 'manager' | 'staff' | 'accountant' | 'customer';
export type OrderType = 'pos' | 'online';
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'completed' | 'cancelled' | 'returned';
export type PaymentMethod = 'cash' | 'bank_transfer' | 'vnpay' | 'momo' | 'cod' | 'card' | 'combined';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
export type MovementType = 'import' | 'export' | 'adjustment' | 'transfer' | 'return' | 'reserve' | 'release';
export type CustomerType = 'regular' | 'vip' | 'wholesale';
export type PromotionType = 'percentage' | 'fixed_amount' | 'free_shipping';
export type ProductStatus = 'active' | 'inactive' | 'draft' | 'discontinued';
export type PurchaseOrderStatus = 'draft' | 'pending' | 'approved' | 'received' | 'cancelled';

// User interfaces
export interface User {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  phone: string | null;
  full_name: string | null;
  role: UserRole;
  avatar: string | null;
  is_active: number;
  failed_login_attempts: number;
  locked_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: number;
  user_id: number;
  staff_code: string;
  position: string;
  hire_date: string;
  commission_rate: number;
  is_active: number;
}

// Category interfaces
export interface Category {
  id: number;
  parent_id: number | null;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  sort_order: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface Brand {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  description: string | null;
  is_active: number;
}

// Product interfaces
export interface Product {
  id: number;
  sku: string;
  name: string;
  slug: string;
  description: string | null;
  category_id: number;
  brand_id: number | null;
  cost_price: number;
  retail_price: number;
  wholesale_price: number;
  barcode: string | null;
  weight: number | null;
  images: string | null;
  status: ProductStatus;
  view_count: number;
  sold_count: number;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  sku: string;
  barcode: string | null;
  size: string | null;
  color: string | null;
  color_hex: string | null;
  price_override: number | null;
  status: string;
  created_at: string;
}

export interface Inventory {
  id: number;
  variant_id: number;
  quantity: number;
  reserved: number;
  min_stock_level: number;
  max_stock_level: number;
  updated_at: string;
}

export interface InventoryMovement {
  id: number;
  variant_id: number;
  movement_type: MovementType;
  quantity_change: number;
  quantity_before: number;
  quantity_after: number;
  reference_type: string | null;
  reference_id: number | null;
  reason: string | null;
  created_by: number | null;
  created_at: string;
}

// Customer interfaces
export interface Customer {
  id: number;
  user_id: number | null;
  full_name: string;
  phone: string;
  email: string | null;
  gender: string | null;
  date_of_birth: string | null;
  customer_type: CustomerType;
  total_spent: number;
  total_orders: number;
  loyalty_points: number;
  loyalty_tier: string;
  referral_code: string | null;
  created_at: string;
  updated_at: string;
}

// Order interfaces
export interface Order {
  id: number;
  order_number: string;
  customer_id: number | null;
  staff_id: number | null;
  order_type: OrderType;
  status: OrderStatus;
  subtotal: number;
  discount_amount: number;
  promotion_id: number | null;
  tax_amount: number;
  shipping_fee: number;
  total_amount: number;
  paid_amount: number;
  change_amount: number;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  shipping_full_name: string;
  shipping_phone: string;
  shipping_address: string;
  payment_transaction_id: string | null;
  note: string | null;
  ordered_at: string;
  confirmed_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  completed_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  store_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  variant_id: number;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  cost_price: number;
  discount_amount: number;
  line_total: number;
  returned_quantity: number;
}

// Promotion interfaces
export interface Promotion {
  id: number;
  code: string;
  name: string;
  type: PromotionType;
  value: number;
  max_discount: number | null;
  min_order_amount: number;
  max_uses: number;
  max_uses_per_customer: number;
  current_uses: number;
  start_date: string;
  end_date: string;
  applicable_type: string;
  applicable_ids: string | null;
  is_active: number;
  is_public: number;
  priority: number;
  created_at: string;
}

// Supplier interfaces
export interface Supplier {
  id: number;
  name: string;
  code: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  is_active: number;
  created_at: string;
}

export interface PurchaseOrder {
  id: number;
  po_number: string;
  supplier_id: number;
  status: PurchaseOrderStatus;
  subtotal: number;
  total_amount: number;
  note: string | null;
  approved_by: number | null;
  received_date: string | null;
  created_at: string;
}

export interface PurchaseOrderItem {
  id: number;
  purchase_order_id: number;
  product_id: number;
  variant_id: number | null;
  quantity: number;
  unit_cost: number;
  line_total: number;
}

// Payment interfaces
export interface Payment {
  id: number;
  order_id: number;
  payment_method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  transaction_id: string | null;
  paid_at: string | null;
  created_at: string;
}

// Review interfaces
export interface ProductReview {
  id: number;
  product_id: number;
  customer_id: number;
  order_id: number | null;
  rating: number;
  title: string | null;
  content: string | null;
  is_visible: number;
  created_at: string;
}

// Token interfaces
export interface RefreshToken {
  id: number;
  user_id: number;
  token: string;
  device_info: string | null;
  ip_address: string | null;
  expires_at: string;
  revoked_at: string | null;
  created_at: string;
}

// Audit log interfaces
export interface AuditLog {
  id: number;
  user_id: number | null;
  action: string;
  table_name: string | null;
  record_id: number | null;
  old_values: string | null;
  new_values: string | null;
  ip_address: string | null;
  created_at: string;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any[];
}

export interface PaginatedResponse<T = any> extends ApiResponse<T> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Auth types
export interface JWTPayload {
  id: number;
  username: string;
  role: UserRole;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  user: Omit<User, 'password_hash'>;
  accessToken: string;
  refreshToken: string;
}
