import React from 'react';

interface ReceiptProps {
  order: any;
  onClose: () => void;
}

export function Receipt({ order, onClose }: ReceiptProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
            <span className="text-3xl">✓</span>
          </div>
          <h2 className="text-2xl font-extrabold text-green-600 mb-2">Thanh Toán Thành Công!</h2>
          <p className="text-slate-600 font-medium">Đơn hàng #{order.order_number}</p>
        </div>

        <div className="p-6 border-t border-slate-200">
          <h3 className="font-bold text-slate-800 mb-3 text-sm uppercase tracking-wide">Hóa Đơn</h3>
          <div className="space-y-2 text-sm">
            {order.items?.map((item: any, index: number) => (
              <div key={index} className="flex justify-between text-slate-600">
                <span>
                  {item.product_name} × {item.quantity}
                </span>
                <span className="font-semibold text-slate-800">{formatCurrency(item.line_total)}đ</span>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-200 mt-4 pt-4 space-y-2">
            <div className="flex justify-between font-bold text-slate-900">
              <span>Tổng Cộng</span>
              <span>{formatCurrency(order.total_amount)}đ</span>
            </div>
            <div className="flex justify-between text-sm text-slate-500">
              <span>Tiền Khách Đưa</span>
              <span>{formatCurrency(order.amount_paid)}đ</span>
            </div>
            <div className="flex justify-between text-sm text-green-600 font-bold">
              <span>Tiền Thừa</span>
              <span>{formatCurrency(order.change)}đ</span>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
          <p className="text-center text-sm text-slate-500 mb-4">
            Cảm ơn quý khách đã mua hàng!
          </p>
          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
          >
            Đơn Hàng Mới
          </button>
        </div>
      </div>
    </div>
  );
}

export default Receipt;
