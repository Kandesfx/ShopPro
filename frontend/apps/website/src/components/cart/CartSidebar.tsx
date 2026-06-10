'use client';

import { useCartStore } from '@/store/cartStore';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@shoppro/ui';

export function CartSidebar() {
  const { items, getTotal, getItemCount } = useCartStore();
  const total = getTotal();
  const itemCount = getItemCount();

  if (items.length === 0) {
    return (
      <div className="p-4">
        <p className="text-gray-500 text-center">Your cart is empty</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold">Cart ({itemCount})</h3>
        <span className="text-blue-600 font-bold">{formatCurrency(total)}</span>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {items.map((item) => (
          <div key={item.variantId} className="flex gap-3">
            <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden">
              {item.image && (
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium line-clamp-1">{item.name}</p>
              <p className="text-xs text-gray-500">
                {item.size} / {item.color}
              </p>
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs">×{item.quantity}</span>
                <span className="text-sm font-medium">
                  {formatCurrency(item.price * item.quantity)}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Button className="w-full mt-4">Checkout</Button>
    </div>
  );
}

export default CartSidebar;
