'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { productsApi, categoriesApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProductCard } from '@/components/product/ProductCard';

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
  icon?: string;
}

const categoryIcons: Record<string, string> = {
  'running-shoes': '🏃',
  'casual-shoes': '👟',
  'sports-shoes': '⚽',
  'formal-shoes': '👞',
  'sneakers': '🎯',
  'sandals': '🩴',
};

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsRes, categoriesRes] = await Promise.all([
          productsApi.getFeatured(8),
          categoriesApi.getAll(),
        ]);

        if (productsRes.success) {
          setFeaturedProducts(productsRes.data);
        }
        if (categoriesRes.success) {
          setCategories(categoriesRes.data.slice(0, 6));
        }
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const stats = [
    { value: '10,000+', label: 'Tổng Sản Phẩm', icon: '👟' },
    { value: '50,000+', label: 'Khách Hàng', icon: '👥' },
    { value: '100,000+', label: 'Đơn Hàng', icon: '📦' },
    { value: '4.9/5', label: '5★ Đánh Giá', icon: '⭐' },
  ];

  const features = [
    {
      icon: '🚚',
      title: 'Miễn Phí Vận Chuyển',
      description: 'Cho đơn hàng từ 500K VND',
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'group-hover:from-blue-600 group-hover:to-blue-700',
    },
    {
      icon: '🔄',
      title: 'Đổi Trả Dễ Dàng',
      description: 'Chính sách đổi trả trong 30 ngày',
      gradient: 'from-green-500 to-emerald-600',
      bgGradient: 'group-hover:from-green-600 group-hover:to-emerald-700',
    },
    {
      icon: '🔒',
      title: 'Thanh Toán An Toàn',
      description: '100% bảo mật khi thanh toán',
      gradient: 'from-violet-500 to-purple-600',
      bgGradient: 'group-hover:from-violet-600 group-hover:to-purple-700',
    },
    {
      icon: '💬',
      title: 'Hỗ Trợ 24/7',
      description: 'Đội ngũ chăm sóc khách hàng tận tâm',
      gradient: 'from-orange-500 to-amber-600',
      bgGradient: 'group-hover:from-orange-600 group-hover:to-amber-700',
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      {/* Hero Section - Premium Full Width */}
      <section className="relative min-h-[90vh] flex items-center bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white overflow-hidden pt-20">
        {/* Animated Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/30 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-400/10 rounded-full blur-3xl"></div>
        </div>
        
        {/* Grid Pattern Overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-sm font-medium px-5 py-2 rounded-full mb-8 animate-fade-in">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Summer Sale - Giảm đến 30%
            </div>
            
            {/* Main Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight">
              Bước Chân
              <span className="block bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
                Phong Cách
              </span>
            </h1>
            
            {/* Subheadline */}
            <p className="text-lg md:text-xl text-blue-100/90 mb-12 max-w-2xl mx-auto leading-relaxed">
              Khám phá bộ sưu tập giày dép cao cấp cho mọi dịp. Từ chạy bộ đến dạo phố, chúng tôi luôn đồng hành cùng bạn.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-wrap justify-center gap-4 mb-16">
              <Link
                href="/products"
                className="group relative bg-white text-blue-900 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-blue-50 transition-all duration-300 shadow-2xl shadow-white/25 hover:shadow-white/40 hover:-translate-y-1"
              >
                <span className="relative z-10 flex items-center gap-2">
                  Mua Sắm Ngay
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </Link>
              <Link
                href="/products?category=running-shoes"
                className="group border-2 border-white/30 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white/10 hover:border-white/50 transition-all duration-300 backdrop-blur-sm hover:-translate-y-1"
              >
                <span className="flex items-center gap-2">
                  Giày Chạy Bộ
                  <span className="text-2xl group-hover:scale-110 transition-transform">🏃</span>
                </span>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap justify-center gap-6 text-sm text-blue-200/70">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Hàng chính hãng
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Bảo hành 12 tháng
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Giao hàng nhanh
              </div>
            </div>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Stats Bar - Premium Design */}
      <section className="relative -mt-12 z-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 p-6 md:p-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="text-center group"
                >
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl mb-3 group-hover:scale-110 transition-transform duration-300">
                    <span className="text-2xl">{stat.icon}</span>
                  </div>
                  <div className="text-2xl md:text-3xl font-black text-slate-900 mb-1">{stat.value}</div>
                  <div className="text-sm text-slate-500 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section - Premium Cards */}
      <section className="py-20 md:py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12">
            <span className="inline-block bg-blue-100 text-blue-700 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              Danh Mục
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
              Khám Phá Bộ Sưu Tập
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              Tìm kiếm đôi giày hoàn hảo cho phong cách của bạn
            </p>
          </div>

          {/* Category Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
            {categories.map((category, index) => (
              <Link
                key={category.id}
                href={`/products?category=${category.slug}`}
                className="group relative bg-white p-6 md:p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 text-center overflow-hidden"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Hover Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-700 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl"></div>
                
                <div className="relative z-10">
                  {/* Icon */}
                  <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 group-hover:bg-white/20 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                    <span className="text-3xl group-hover:scale-110 transition-transform">
                      {categoryIcons[category.slug] || '👟'}
                    </span>
                  </div>
                  
                  {/* Label */}
                  <h3 className="font-bold text-slate-800 group-hover:text-white transition-colors duration-300 mb-1">
                    {category.name}
                  </h3>
                  
                  {/* Arrow */}
                  <div className="flex justify-center mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Section - Premium Grid */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <span className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
                ⭐ Sản Phẩm Nổi Bật
              </span>
              <h2 className="text-3xl md:text-4xl font-black text-slate-900">
                Top Sản Phẩm Bán Chạy
              </h2>
              <p className="text-slate-500 mt-2">Những sản phẩm được khách hàng yêu thích nhất</p>
            </div>
            <Link
              href="/products"
              className="group inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-bold transition-colors"
            >
              Xem Tất Cả
              <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-slate-100 animate-pulse h-[400px] rounded-2xl"></div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Promo Banner Section - Vibrant Gradient */}
      <section className="py-16 md:py-20 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-violet-600 via-purple-600 to-rose-500"></div>
        
        {/* Decorative Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl"></div>
        </div>
        
        {/* Diagonal Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 35px,
              rgba(255,255,255,.3) 35px,
              rgba(255,255,255,.3) 70px
            )`
          }}></div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm text-white text-sm font-semibold px-5 py-2 rounded-full mb-6">
            <span className="text-lg">🔥</span>
            Ưu Đãi Có Hạn
          </div>

          {/* Headline */}
          <h2 className="text-4xl md:text-5xl font-black text-white mb-4">
            Khuyến Mãi Mùa Hè
          </h2>
          <p className="text-xl md:text-2xl text-white/90 mb-8">
            Giảm đến <span className="font-black text-yellow-300">30%</span> cho tất cả sản phẩm
          </p>

          {/* Promo Code Box */}
          <div className="inline-flex flex-col sm:flex-row items-center gap-4 mb-10">
            <div className="bg-white/20 backdrop-blur-sm border-2 border-dashed border-white/40 px-8 py-4 rounded-2xl">
              <span className="text-3xl md:text-4xl font-black text-white tracking-wider">SUMMER30</span>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText('SUMMER30');
              }}
              className="bg-white text-purple-700 px-6 py-4 rounded-2xl font-bold hover:bg-purple-50 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Sao Chép Mã
            </button>
          </div>

          {/* Countdown */}
          <div className="flex justify-center gap-4 mb-10">
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3 min-w-[70px]">
              <div className="text-2xl md:text-3xl font-black text-white">07</div>
              <div className="text-xs text-white/70 uppercase">Ngày</div>
            </div>
            <div className="text-white text-2xl font-bold">:</div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3 min-w-[70px]">
              <div className="text-2xl md:text-3xl font-black text-white">12</div>
              <div className="text-xs text-white/70 uppercase">Giờ</div>
            </div>
            <div className="text-white text-2xl font-bold">:</div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3 min-w-[70px]">
              <div className="text-2xl md:text-3xl font-black text-white">45</div>
              <div className="text-xs text-white/70 uppercase">Phút</div>
            </div>
            <div className="text-white text-2xl font-bold">:</div>
            <div className="bg-white/20 backdrop-blur-sm rounded-xl px-4 py-3 min-w-[70px]">
              <div className="text-2xl md:text-3xl font-black text-white">30</div>
              <div className="text-xs text-white/70 uppercase">Giây</div>
            </div>
          </div>

          {/* CTA */}
          <Link
            href="/products"
            className="inline-flex items-center gap-2 bg-white text-violet-700 px-10 py-4 rounded-2xl font-bold text-lg hover:bg-violet-50 transition-all duration-200 shadow-2xl hover:shadow-white/40 hover:-translate-y-1"
          >
            Mua Ngay
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Features Section - Premium Cards */}
      <section className="py-16 md:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-12">
            <span className="inline-block bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold px-4 py-1.5 rounded-full mb-4">
              Tại Sao Chọn ShopPro
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 mb-4">
              Dịch Vụ Hoàn Hảo
            </h2>
            <p className="text-slate-500 max-w-xl mx-auto">
              Cam kết mang đến trải nghiệm mua sắm tốt nhất cho khách hàng
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 text-center"
              >
                {/* Icon */}
                <div className={`w-16 h-16 mx-auto mb-6 bg-gradient-to-br ${feature.gradient} ${feature.bgGradient} rounded-2xl flex items-center justify-center shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                  <span className="text-3xl">{feature.icon}</span>
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-slate-900 mb-2">
                  {feature.title}
                </h3>

                {/* Description */}
                <p className="text-slate-500 text-sm">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-1/4 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"></div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          {/* Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>

          {/* Headline */}
          <h2 className="text-3xl md:text-4xl font-black mb-4">
            Đăng Ký Nhận Tin Khuyến Mãi
          </h2>
          <p className="text-blue-200 mb-8 max-w-xl mx-auto">
            Nhận thông tin về các sản phẩm mới và ưu đãi đặc biệt dành riêng cho bạn
          </p>

          {/* Newsletter Form */}
          <form className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto">
            <input
              type="email"
              placeholder="Nhập địa chỉ email của bạn"
              className="flex-1 bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder-blue-200/50 px-6 py-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all"
            />
            <button
              type="submit"
              className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-8 py-4 rounded-xl font-bold hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-200 hover:-translate-y-0.5 whitespace-nowrap"
            >
              Đăng Ký Ngay
            </button>
          </form>

          {/* Trust Text */}
          <p className="text-blue-200/60 text-sm mt-4">
            Cam kết không spam. Hủy đăng ký bất cứ lúc nào.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
