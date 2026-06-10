import React, { useState } from 'react';

interface CartItem {
  variantId: number;
  productId: number;
  productName: string;
  sku: string;
  size: string;
  color: string;
  price: number;
  quantity: number;
}

interface PaymentModalProps {
  cart: CartItem[];
  total: number;
  onClose: () => void;
  onComplete: (order: any) => void;
}

export function PaymentModal({ cart, total, onClose, onComplete }: PaymentModalProps) {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState(Math.ceil(total / 1000) * 1000);
  const [customerPhone, setCustomerPhone] = useState('');
  const [customer, setCustomer] = useState<any>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  const change = Math.max(0, amountPaid - total);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('posToken')}`,
        },
        body: JSON.stringify({
          order_type: 'pos',
          items: cart.map((item) => ({
            product_id: item.productId,
            variant_id: item.variantId,
            quantity: item.quantity,
            unit_price: item.price,
          })),
          payment_method: paymentMethod,
          shipping_full_name: customer?.full_name || 'Khách vãng lai',
          shipping_phone: customerPhone || 'N/A',
        }),
      });

      const data = await response.json();

      if (data.success) {
        onComplete({
          ...data.data,
          amount_paid: amountPaid,
          change: change,
        });
      } else {
        alert(data.message || 'Tạo đơn hàng thất bại');
      }
    } catch (error) {
      console.error('Lỗi khi tạo đơn hàng:', error);
      alert('Tạo đơn hàng thất bại. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const methodLabels: Record<string, string> = {
    cash: '💵 Tiền Mặt',
    bank_transfer: '🏦 Chuyển Khoản',
    vnpay: '💳 VNPay',
    momo: '📱 MoMo',
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-auto">
        <div className="p-5 border-b border-slate-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-extrabold text-slate-900">Thanh Toán</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 text-2xl font-light">
              ✕
            </button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Order Summary */}
          <div>
            <h3 className="font-bold text-slate-800 mb-2 text-sm uppercase tracking-wide">Tóm Tắt Đơn Hàng</h3>
            <div className="bg-slate-50 rounded-xl p-3 space-y-1 max-h-40 overflow-auto">
              {cart.map((item) => (
                <div key={item.variantId} className="flex justify-between text-sm">
                  <span className="text-slate-600">
                    {item.productName} × {item.quantity}
                  </span>
                  <span className="font-semibold text-slate-800">{formatCurrency(item.price * item.quantity)}đ</span>
                </div>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center text-xl font-extrabold">
            <span className="text-slate-800">Tổng Cộng</span>
            <span className="text-2xl text-blue-600">{formatCurrency(total)}đ</span>
          </div>

          {/* Payment Method */}
          <div>
            <h3 className="font-bold text-slate-800 mb-2 text-sm uppercase tracking-wide">Phương Thức Thanh Toán</h3>
            <div className="grid grid-cols-2 gap-2">
              {['cash', 'bank_transfer', 'vnpay', 'momo'].map((method) => (
                <button
                  key={method}
                  onClick={() => setPaymentMethod(method)}
                  className={`p-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                    paymentMethod === method
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {methodLabels[method]}
                </button>
              ))}
            </div>
          </div>

          {/* Amount Paid (for cash) */}
          {paymentMethod === 'cash' && (
            <div>
              <h3 className="font-bold text-slate-800 mb-2 text-sm uppercase tracking-wide">Tiền Khách Đưa</h3>
              <input
                type="number"
                value={amountPaid}
                onChange={(e) => setAmountPaid(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-xl font-bold focus:border-blue-500 outline-none transition-all"
              />
              <div className="flex justify-between mt-2 text-sm">
                <button
                  onClick={() => setAmountPaid(Math.ceil(total / 1000) * 1000)}
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Đúng số
                </button>
                <button
                  onClick={() => setAmountPaid(Math.ceil(total / 50000) * 50000)}
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                >
                  +50,000
                </button>
                <button
                  onClick={() => setAmountPaid(Math.ceil(total / 100000) * 100000)}
                  className="text-blue-600 hover:text-blue-700 font-semibold"
                >
                  +100,000
                </button>
              </div>
            </div>
          )}

          {/* Change */}
          {paymentMethod === 'cash' && (
            <div className="flex justify-between items-center text-xl font-extrabold p-4 bg-green-50 rounded-xl border-2 border-green-200">
              <span className="text-green-800">Tiền Thừa</span>
              <span className="text-green-600">{formatCurrency(change)}đ</span>
            </div>
          )}
        </div>

        <div className="p-5 border-t border-slate-200 bg-slate-50">
          <button
            onClick={handleSubmit}
            disabled={loading || (paymentMethod === 'cash' && amountPaid < total)}
            className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Đang xử lý...' : 'Hoàn Thanh Thanh Toán'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentModal;
