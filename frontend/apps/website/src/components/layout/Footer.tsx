'use client';

import { useState } from 'react';
import Link from 'next/link';

export function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  const shopLinks = [
    { href: '/products?category=running-shoes', label: 'Giày Chạy Bộ' },
    { href: '/products?category=casual-shoes', label: 'Giày Casual' },
    { href: '/products?category=sports-shoes', label: 'Giày Thể Thao' },
    { href: '/products?category=formal-shoes', label: 'Giày Lịch Lãm' },
    { href: '/products', label: 'Tất Cả Sản Phẩm' },
  ];

  const supportLinks = [
    { href: '#', label: 'Câu Hỏi Thường Gặp' },
    { href: '#', label: 'Thông Tin Vận Chuyển' },
    { href: '#', label: 'Chính Sách Đổi Trả' },
    { href: '#', label: 'Chính Sách Bảo Mật' },
    { href: '#', label: 'Điều Khoản Sử Dụng' },
  ];

  return (
    <footer className="bg-slate-900 text-white pt-16 pb-8 mt-auto">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          {/* Column 1: About & Newsletter */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-5 group">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/30">
                <span className="text-white text-lg font-black">S</span>
              </div>
              <span className="text-2xl font-extrabold text-white">ShopPro</span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              Điểm đến của bạn cho những đôi giày chất lượng cao. Guồng giày cho mọi bước chân trên hành trình của bạn.
            </p>
            
            {/* Newsletter Form */}
            <div className="mb-6">
              <h4 className="font-bold text-slate-200 mb-3 text-sm uppercase tracking-wider">Đăng Ký Nhận Tin</h4>
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email của bạn"
                  className="flex-1 bg-slate-800 border border-slate-700 text-white placeholder-slate-500 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <button
                  type="submit"
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2.5 rounded-xl font-semibold hover:shadow-lg hover:shadow-blue-600/30 transition-all duration-200 hover:-translate-y-0.5"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </form>
              {subscribed && (
                <p className="text-green-400 text-sm mt-2 animate-pulse">✓ Đăng ký thành công!</p>
              )}
            </div>

            {/* Social Icons */}
            <div className="flex items-center gap-3">
              <a href="#" className="w-10 h-10 bg-slate-800 hover:bg-blue-600 rounded-xl flex items-center justify-center transition-all duration-200 hover:-translate-y-1">
                <svg className="w-5 h-5 text-slate-400 hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </a>
              <a href="#" className="w-10 h-10 bg-slate-800 hover:bg-gradient-to-br hover:from-purple-600 hover:to-pink-500 rounded-xl flex items-center justify-center transition-all duration-200 hover:-translate-y-1">
                <svg className="w-5 h-5 text-slate-400 hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
              <a href="#" className="w-10 h-10 bg-slate-800 hover:bg-sky-500 rounded-xl flex items-center justify-center transition-all duration-200 hover:-translate-y-1">
                <svg className="w-5 h-5 text-slate-400 hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                </svg>
              </a>
              <a href="#" className="w-10 h-10 bg-slate-800 hover:bg-red-600 rounded-xl flex items-center justify-center transition-all duration-200 hover:-translate-y-1">
                <svg className="w-5 h-5 text-slate-400 hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Column 2: Shop Links */}
          <div>
            <h4 className="font-bold text-slate-200 mb-5 text-sm uppercase tracking-wider flex items-center gap-2">
              <span className="w-1 h-5 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></span>
              Cửa Hàng
            </h4>
            <ul className="space-y-3">
              {shopLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-slate-400 hover:text-white transition-colors duration-200 text-sm flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-slate-600 rounded-full group-hover:bg-blue-500 group-hover:w-2 transition-all"></span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Support Links */}
          <div>
            <h4 className="font-bold text-slate-200 mb-5 text-sm uppercase tracking-wider flex items-center gap-2">
              <span className="w-1 h-5 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></span>
              Hỗ Trợ
            </h4>
            <ul className="space-y-3">
              {supportLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-slate-400 hover:text-white transition-colors duration-200 text-sm flex items-center gap-2 group"
                  >
                    <span className="w-1 h-1 bg-slate-600 rounded-full group-hover:bg-blue-500 group-hover:w-2 transition-all"></span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact Info */}
          <div>
            <h4 className="font-bold text-slate-200 mb-5 text-sm uppercase tracking-wider flex items-center gap-2">
              <span className="w-1 h-5 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></span>
              Liên Hệ
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-base">📍</span>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">123 Đường Giày</p>
                  <p className="text-slate-400 text-sm">Quận 1, TP.HCM</p>
                </div>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-base">📞</span>
                </div>
                <p className="text-slate-400 text-sm">(028) 123-4567</p>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-base">✉️</span>
                </div>
                <p className="text-slate-400 text-sm">support@shoppro.com</p>
              </li>
              <li className="flex items-center gap-3">
                <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-base">⏰</span>
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Thứ 2 - Thứ 7: 8:00 - 20:00</p>
                  <p className="text-slate-400 text-sm">Chủ Nhật: 9:00 - 18:00</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <div className="text-slate-500 text-sm">
              © 2026 <span className="text-slate-400 font-semibold">ShopPro</span>. Tất cả quyền được bảo lưu.
            </div>

            {/* Payment Icons */}
            <div className="flex items-center gap-3">
              <div className="bg-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <span className="text-xs font-bold text-blue-400">VISA</span>
              </div>
              <div className="bg-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <span className="text-xs font-bold text-red-400">MC</span>
              </div>
              <div className="bg-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <span className="text-xs font-bold text-amber-400">AMEX</span>
              </div>
              <div className="bg-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <span className="text-xs font-bold text-green-400">COD</span>
              </div>
              <div className="bg-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-300">ATM</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
