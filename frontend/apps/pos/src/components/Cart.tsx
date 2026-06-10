import React from 'react';

interface CartItem {
  variantId: number;
  productId: number;
  productName: string;
  sku: string;
  size: string;
  color: string;
  price: number;
  quantity: number;
  image?: string;
}

interface CartProps {
  items: CartItem[];
  onUpdateQuantity: (variantId: number, quantity: number) => void;
  onRemove: (variantId: number) => void;
  onClear: () => void;
  total: number;
  onCheckout: () => void;
}

export function Cart({ items, onUpdateQuantity, onRemove, onClear, total, onCheckout }: CartProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-200">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-extrabold text-slate-900">Đơn Hàng Hiện Tại</h2>
          {items.length > 0 && (
            <button
              onClick={onClear}
              className="text-sm text-red-600 hover:text-red-700 font-semibold transition-colors"
            >
              Xóa Tất Cả
            </button>
          )}
        </div>
        <p className="text-sm text-slate-500 mt-0.5">{items.length} sản phẩm</p>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {items.length === 0 ? (
          <div className="text-center text-slate-400 py-12">
            <div className="w-14 h-14 mx-auto mb-3 bg-slate-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🛒</span>
            </div>
            <p className="font-medium">Chưa có sản phẩm</p>
            <p className="text-sm mt-1">Nhấn vào sản phẩm để thêm</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.variantId} className="bg-slate-50 rounded-xl p-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 min-w-0 mr-2">
                    <h4 className="font-semibold text-sm text-slate-900 line-clamp-1">{item.productName}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {item.size && `Size: ${item.size}`}
                      {item.size && item.color && ' | '}
                      {item.color && `Màu: ${item.color}`}
                    </p>
                  </div>
                  <button
                    onClick={() => onRemove(item.variantId)}
                    className="text-slate-300 hover:text-red-500 transition-colors text-lg font-light flex-shrink-0"
                  >
                    ✕
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onUpdateQuantity(item.variantId, item.quantity - 1)}
                      className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 flex items-center justify-center font-bold text-slate-700 transition-colors"
                    >
                      -
                    </button>
                    <span className="w-8 text-center font-bold text-slate-800">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateQuantity(item.variantId, item.quantity + 1)}
                      className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 flex items-center justify-center font-bold text-slate-700 transition-colors"
                    >
                      +
                    </button>
                  </div>
                  <span className="font-extrabold text-blue-600">
                    {formatCurrency(item.price * item.quantity)}đ
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 p-4 bg-slate-50">
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-bold text-slate-800">Tổng Cộng:</span>
          <span className="text-2xl font-extrabold text-blue-600">
            {formatCurrency(total)}đ
          </span>
        </div>
        <button
          onClick={onCheckout}
          disabled={items.length === 0}
          className="w-full bg-green-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          Thanh Toán
        </button>
      </div>
    </div>
  );
}

export default Cart;
