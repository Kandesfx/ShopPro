'use client';

import Link from 'next/link';

export function Navbar() {
  return (
    <nav className="bg-gray-900 text-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-12">
          <div className="flex items-center gap-8">
            <Link href="/" className="font-semibold hover:text-gray-300">
              Home
            </Link>
            <div className="relative group">
              <button className="flex items-center gap-1 hover:text-gray-300">
                Categories
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            <Link href="/products" className="hover:text-gray-300">
              All Products
            </Link>
            <Link href="/products?status=sale" className="text-red-400 hover:text-red-300">
              Sale
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/cart" className="hover:text-gray-300">
              Cart
            </Link>
            <Link href="/auth/login" className="hover:text-gray-300">
              Login
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
