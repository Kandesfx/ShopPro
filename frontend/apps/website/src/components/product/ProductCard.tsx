'use client';

import { useState } from 'react';
import Link from 'next/link';
import { formatCurrency } from '@/lib/utils';

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

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const productImages = product.images ? JSON.parse(product.images) : [];
  const imageUrl = productImages[0] || '/placeholder.jpg';

  const getStockStatus = () => {
    if (product.total_stock === 0) {
      return { label: 'Hết Hàng', color: 'bg-red-500 text-white', textColor: 'text-red-500' };
    }
    if (product.total_stock <= 5) {
      return { label: `Chỉ còn ${product.total_stock}`, color: 'bg-amber-500 text-white', textColor: 'text-amber-500' };
    }
    return { label: 'Còn Hàng', color: 'bg-green-500 text-white', textColor: 'text-green-500' };
  };

  const stockStatus = getStockStatus();

  return (
    <div className="group relative">
      <Link href={`/products/${product.slug}`} className="block">
        {/* Card Container */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          {/* Image Container */}
          <div className="aspect-square bg-slate-100 overflow-hidden relative">
            {/* Skeleton Loader */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-slate-200 animate-pulse" />
            )}
            
            {/* Product Image */}
            <img
              src={imageUrl}
              alt={product.name}
              onLoad={() => setImageLoaded(true)}
              className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
            />

            {/* Out of Stock Overlay */}
            {product.total_stock === 0 && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                <span className="bg-white text-slate-800 font-bold px-4 py-2 rounded-xl text-sm shadow-lg">
                  Hết Hàng
                </span>
              </div>
            )}

            {/* Stock Badge */}
            <div className="absolute top-3 left-3">
              <span className={`${stockStatus.color} text-xs font-bold px-2.5 py-1 rounded-lg shadow-sm`}>
                {stockStatus.label}
              </span>
            </div>

            {/* Wishlist Button */}
            <button
              onClick={(e) => {
                e.preventDefault();
                setIsWishlisted(!isWishlisted);
              }}
              className={`absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${
                isWishlisted
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/40 scale-110'
                  : 'bg-white/90 text-slate-400 hover:text-red-500 hover:bg-white shadow-sm hover:shadow-lg'
              }`}
            >
              <svg
                className="w-5 h-5"
                fill={isWishlisted ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>

            {/* Quick View Overlay on Hover */}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <span className="text-white text-sm font-semibold flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                Xem Chi Tiết
              </span>
            </div>
          </div>

          {/* Product Info */}
          <div className="p-4">
            {/* Brand */}
            <p className="text-xs text-slate-400 mb-1.5 font-semibold uppercase tracking-wider">
              {product.brand_name}
            </p>

            {/* Product Name */}
            <h3 className="font-bold text-slate-900 mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors duration-200 leading-snug min-h-[2.5rem]">
              {product.name}
            </h3>

            {/* Category Tag */}
            <p className="text-xs text-slate-400 mb-3">
              {product.category_name}
            </p>

            {/* Price & Stock */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xl font-extrabold text-blue-600">
                  {formatCurrency(product.retail_price)}
                </span>
              </div>
              {product.total_stock > 0 && product.total_stock <= 5 && (
                <span className="text-xs text-amber-600 font-semibold bg-amber-50 px-2 py-1 rounded-lg">
                  Sắp hết
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

export default ProductCard;
