'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ordersApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Order {
  id: number;
  order_number: string;
  status: string;
  total_amount: number;
  payment_status: string;
  ordered_at: string;
  items: any[];
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Chờ Xác Nhận',
  confirmed: 'Đã Xác Nhận',
  processing: 'Đang Xử Lý',
  shipped: 'Đang Giao Hàng',
  delivered: 'Đã Giao Hàng',
  completed: 'Hoàn Thành',
  cancelled: 'Đã Hủy',
  returned: 'Trả Hàng',
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-amber-100 text-amber-800',
      confirmed: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      shipped: 'bg-indigo-100 text-indigo-800',
      delivered: 'bg-green-100 text-green-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      returned: 'bg-slate-100 text-slate-800',
    };
    return colors[status] || 'bg-slate-100 text-slate-800';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
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
        <h1 className="text-3xl font-extrabold text-slate-900 mb-8">Đơn Hàng Của Tôi</h1>

        {orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-6 bg-slate-100 rounded-full flex items-center justify-center">
              <span className="text-4xl">📦</span>
            </div>
            <p className="text-slate-500 mb-6 text-lg">Bạn chưa có đơn hàng nào.</p>
            <Link
              href="/products"
              className="inline-block bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
            >
              Bắt Đầu Mua Sắm
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl shadow-sm p-6 hover:shadow-card transition-shadow">
                <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                  <div>
                    <p className="font-bold text-slate-900 text-lg">Đơn hàng #{order.order_number}</p>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Ngày đặt: {formatDate(order.ordered_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span
                      className={`px-4 py-1.5 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}
                    >
                      {STATUS_LABELS[order.status] || order.status}
                    </span>
                    <span className="font-extrabold text-slate-900 text-lg">{formatCurrency(order.total_amount)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
