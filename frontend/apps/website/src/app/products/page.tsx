'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { productsApi, categoriesApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductFilter } from '@/components/product/ProductFilter';

interface Product {
  id: number;
  name: string;
  slug: string;
  retail_price: number;
  images: string | null;
  category_name: string;
  brand_name: string;
  total_stock: number;
}

interface Category {
  id: number;
  name: string;
  slug: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [filters, setFilters] = useState({
    category: '',
    brand: '',
    min_price: '',
    max_price: '',
    search: '',
    sort: 'created_at',
    order: 'desc',
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await categoriesApi.getAll();
        if (res.success) {
          setCategories(res.data);
        }
      } catch (error) {
        console.error('Lỗi khi tải danh mục:', error);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params: any = {
          page: pagination.page,
          limit: pagination.limit,
        };
        if (filters.category) params.category_id = filters.category;
        if (filters.search) params.search = filters.search;
        if (filters.sort) params.sort = filters.sort;
        if (filters.order) params.order = filters.order;

        const res = await productsApi.getAll(params);
        if (res.success) {
          setProducts(res.data);
          setPagination((prev) => ({
            ...prev,
            total: res.pagination.total,
          }));
        }
      } catch (error) {
        console.error('Lỗi khi tải sản phẩm:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [pagination.page, filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-100 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-extrabold text-blue-600">
              ShopPro
            </Link>
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">Trang Chủ</Link>
              <Link href="/products" className="text-slate-900 font-bold">Sản Phẩm</Link>
              <Link href="/cart" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">Giỏ Hàng</Link>
              <Link href="/orders" className="text-slate-600 hover:text-blue-600 font-medium transition-colors">Đơn Hàng</Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900">Sản Phẩm</h1>
          <p className="text-slate-500 mt-1">Khám phá bộ sưu tập giày dép của chúng tôi</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <ProductFilter
              categories={categories}
              filters={filters}
              onFilterChange={handleFilterChange}
            />
          </aside>

          {/* Products Grid */}
          <main className="flex-1">
            {/* Search Bar */}
            <div className="mb-6">
              <input
                type="text"
                placeholder="Tìm kiếm sản phẩm..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-slate-800 bg-white shadow-sm"
              />
            </div>

            {/* Sort & Results */}
            <div className="flex justify-between items-center mb-6">
              <p className="text-slate-600 font-medium">
                {loading ? 'Đang tải...' : `Tìm thấy ${pagination.total.toLocaleString('vi-VN')} sản phẩm`}
              </p>
              <select
                value={`${filters.sort}-${filters.order}`}
                onChange={(e) => {
                  const [sort, order] = e.target.value.split('-');
                  handleFilterChange('sort', sort);
                  handleFilterChange('order', order);
                }}
                className="px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 bg-white shadow-sm text-slate-700 font-medium"
              >
                <option value="created_at-desc">Mới Nhất</option>
                <option value="created_at-asc">Cũ Nhất</option>
                <option value="retail_price-asc">Giá: Thấp đến Cao</option>
                <option value="retail_price-desc">Giá: Cao đến Thấp</option>
                <option value="sold_count-desc">Bán Chạy Nhất</option>
              </select>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-slate-200 animate-pulse h-96 rounded-2xl"></div>
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {pagination.total > pagination.limit && (
                  <div className="flex justify-center mt-10 gap-2">
                    <button
                      onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                      disabled={pagination.page === 1}
                      className="px-5 py-2.5 border border-slate-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors font-medium text-slate-700 bg-white shadow-sm"
                    >
                      ← Trang Trước
                    </button>
                    <span className="px-5 py-2.5 text-slate-600 font-medium">
                      Trang {pagination.page} / {Math.ceil(pagination.total / pagination.limit)}
                    </span>
                    <button
                      onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                      disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
                      className="px-5 py-2.5 border border-slate-200 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors font-medium text-slate-700 bg-white shadow-sm"
                    >
                      Trang Sau →
                    </button>
                  </div>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
