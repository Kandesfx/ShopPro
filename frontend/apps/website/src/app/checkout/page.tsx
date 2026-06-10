'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { ordersApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@shoppro/ui';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotal, clearCart } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    shipping_full_name: user?.full_name || '',
    shipping_phone: '',
    shipping_address: '',
    payment_method: 'cod',
    note: '',
  });

  const subtotal = getTotal();
  const shippingFee = subtotal >= 500000 ? 0 : 30000;
  const total = subtotal + shippingFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const orderData = {
        order_type: 'online',
        items: items.map((item) => ({
          product_id: item.productId,
          variant_id: item.variantId,
          quantity: item.quantity,
          unit_price: item.price,
        })),
        shipping_full_name: formData.shipping_full_name,
        shipping_phone: formData.shipping_phone,
        shipping_address: formData.shipping_address,
        payment_method: formData.payment_method,
        note: formData.note,
      };

      const res = await ordersApi.create(orderData);

      if (res.success) {
        clearCart();
        router.push(`/orders?order=${res.data.order_number}`);
      }
    } catch (err: any) {
      setError(err.message || 'Tạo đơn hàng thất bại');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-slate-100 rounded-full flex items-center justify-center">
            <span className="text-4xl">🛒</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mb-4">Giỏ Hàng Trống</h1>
          <Link href="/products" className="text-blue-600 hover:text-blue-700 font-semibold">
            Tiếp Tục Mua Sắm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-100 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="text-2xl font-extrabold text-blue-600">
            ShopPro
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-8">Thanh Toán</h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Shipping Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm p-6">
              <h2 className="text-xl font-extrabold text-slate-900 mb-6">Thông Tin Giao Hàng</h2>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Họ và Tên *</label>
                  <input
                    type="text"
                    required
                    value={formData.shipping_full_name}
                    onChange={(e) =>
                      setFormData({ ...formData, shipping_full_name: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="Nhập họ và tên người nhận"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Số Điện Thoại *</label>
                  <input
                    type="tel"
                    required
                    value={formData.shipping_phone}
                    onChange={(e) =>
                      setFormData({ ...formData, shipping_phone: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="Nhập số điện thoại"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Địa Chỉ Giao Hàng *</label>
                  <textarea
                    required
                    rows={3}
                    value={formData.shipping_address}
                    onChange={(e) =>
                      setFormData({ ...formData, shipping_address: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="Địa chỉ cụ thể, Quận/Huyện, Thành phố..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Phương Thức Thanh Toán</label>
                  <select
                    value={formData.payment_method}
                    onChange={(e) =>
                      setFormData({ ...formData, payment_method: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  >
                    <option value="cod">Thanh toán khi nhận hàng (COD)</option>
                    <option value="vnpay">VNPay</option>
                    <option value="momo">MoMo</option>
                    <option value="bank_transfer">Chuyển khoản ngân hàng</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ghi Chú Đơn Hàng (Tùy Chọn)</label>
                  <textarea
                    rows={2}
                    value={formData.note}
                    onChange={(e) =>
                      setFormData({ ...formData, note: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    placeholder="Hướng dẫn giao hàng đặc biệt..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
              <h2 className="text-xl font-extrabold text-slate-900 mb-5">Tóm Tắt Đơn Hàng</h2>

              <div className="space-y-3 border-b border-slate-100 pb-4 mb-4">
                {items.map((item) => (
                  <div key={item.variantId} className="flex justify-between text-sm text-slate-600">
                    <span className="line-clamp-1 flex-1 pr-2">
                      {item.name} × {item.quantity}
                    </span>
                    <span className="font-medium whitespace-nowrap">{formatCurrency(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Tạm Tính</span>
                  <span className="font-medium">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Phí Vận Chuyển</span>
                  <span>
                    {shippingFee === 0 ? (
                      <span className="text-green-600 font-bold">Miễn Phí</span>
                    ) : (
                      formatCurrency(shippingFee)
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-xl font-extrabold border-t border-slate-100 pt-3 text-slate-900">
                  <span>Tổng Cộng</span>
                  <span className="text-blue-600">{formatCurrency(total)}</span>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full mt-6"
                size="lg"
                isLoading={loading}
              >
                Đặt Hàng
              </Button>

              <p className="text-xs text-slate-400 mt-4 text-center">
                Bằng việc đặt hàng, bạn đồng ý với Điều Khoản Dịch Vụ và Chính Sách Bảo Mật của chúng tôi
              </p>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}
