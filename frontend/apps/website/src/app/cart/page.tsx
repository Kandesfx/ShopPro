'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@shoppro/ui';

export default function CartPage() {
  const { items, updateQuantity, removeItem, getTotal } = useCartStore();
  const [promoCode, setPromoCode] = useState('');
  const [promoResult, setPromoResult] = useState<any>(null);

  const subtotal = getTotal();
  const shippingFee = subtotal >= 500000 ? 0 : 30000;
  const discount = promoResult?.discount_amount || 0;
  const total = subtotal + shippingFee - discount;

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    setPromoResult({ valid: true, discount_amount: 0 });
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b border-slate-100 shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <Link href="/" className="text-2xl font-extrabold text-blue-600">
              ShopPro
            </Link>
          </div>
        </header>
        <main className="container mx-auto px-4 py-20 text-center">
          <div className="w-20 h-20 mx-auto mb-6 bg-slate-100 rounded-full flex items-center justify-center">
            <span className="text-4xl">🛒</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-3">Giỏ Hàng Trống</h1>
          <p className="text-slate-500 mb-8">Bạn chưa thêm sản phẩm nào vào giỏ hàng.</p>
          <Link href="/products">
            <Button size="lg">Tiếp Tục Mua Sắm</Button>
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="text-2xl font-extrabold text-blue-600">
            ShopPro
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-8">Giỏ Hàng</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {items.map((item) => (
                <div
                  key={item.variantId}
                  className="flex gap-5 p-5 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 transition-colors"
                >
                  <div className="w-24 h-24 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
                        Không có ảnh
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.name.toLowerCase().replace(/\s+/g, '-')}`}
                      className="font-bold text-slate-900 hover:text-blue-600 transition-colors line-clamp-1 text-lg"
                    >
                      {item.name}
                    </Link>
                    <p className="text-sm text-slate-500 mt-0.5">
                      SKU: {item.sku} | Size: {item.size} | Màu: {item.color}
                    </p>
                    <p className="font-bold text-blue-600 mt-1 text-lg">
                      {formatCurrency(item.price)}
                    </p>
                  </div>

                  <div className="flex flex-col items-end justify-between">
                    <button
                      onClick={() => removeItem(item.variantId)}
                      className="text-slate-300 hover:text-red-500 transition-colors text-xl font-light"
                    >
                      ✕
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                        className="w-9 h-9 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors flex items-center justify-center font-bold text-slate-600"
                      >
                        -
                      </button>
                      <span className="w-8 text-center font-bold text-slate-800">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                        className="w-9 h-9 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors flex items-center justify-center font-bold text-slate-600"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5">
              <Link href="/products" className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1">
                ← Tiếp Tục Mua Sắm
              </Link>
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-white rounded-2xl shadow-sm p-6 sticky top-24">
              <h2 className="text-xl font-extrabold text-slate-900 mb-5">Tóm Tắt Đơn Hàng</h2>

              {/* Promo Code */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Mã Giảm Giá</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    placeholder="Nhập mã"
                    className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm"
                  />
                  <Button onClick={handleApplyPromo} variant="outline" size="sm">
                    Áp Dụng
                  </Button>
                </div>
              </div>

              <div className="space-y-3 border-t border-slate-100 pt-4">
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
                {discount > 0 && (
                  <div className="flex justify-between text-green-600 font-bold">
                    <span>Giảm Giá</span>
                    <span>-{formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-extrabold border-t border-slate-100 pt-3 text-slate-900">
                  <span>Tổng Cộng</span>
                  <span className="text-blue-600">{formatCurrency(total)}</span>
                </div>
              </div>

              <Link href="/checkout">
                <Button className="w-full mt-6" size="lg">
                  Tiến Hành Thanh Toán
                </Button>
              </Link>

              {subtotal < 500000 && (
                <p className="text-sm text-slate-500 mt-4 text-center">
                  Thêm {formatCurrency(500000 - subtotal)} nữa để được miễn phí vận chuyển!
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
