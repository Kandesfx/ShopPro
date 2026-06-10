'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { productsApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useCartStore } from '@/store/cartStore';
import { Button } from '@shoppro/ui';

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  retail_price: number;
  images: string | null;
  category_name: string;
  brand_name: string;
  variants: Variant[];
  rating: { average: number; count: number };
}

interface Variant {
  id: number;
  sku: string;
  size: string;
  color: string;
  color_hex: string;
  price_override: number | null;
  stock: number;
}

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [addedToCart, setAddedToCart] = useState(false);

  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await productsApi.getBySlug(slug);
        if (res.success) {
          setProduct(res.data);
          if (res.data.variants?.length > 0) {
            setSelectedVariant(res.data.variants[0]);
          }
        }
      } catch (error) {
        console.error('Error fetching product:', error);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchProduct();
    }
  }, [slug]);

  useEffect(() => {
    if (product?.variants && selectedSize && selectedColor) {
      const variant = product.variants.find(
        (v) => v.size === selectedSize && v.color === selectedColor
      );
      setSelectedVariant(variant || null);
    } else if (product?.variants?.length === 1) {
      setSelectedVariant(product.variants[0]);
    }
  }, [selectedSize, selectedColor, product]);

  const handleAddToCart = () => {
    if (!product || !selectedVariant) return;

    addItem({
      variantId: selectedVariant.id,
      productId: product.id,
      name: product.name,
      sku: selectedVariant.sku,
      size: selectedVariant.size || '',
      color: selectedVariant.color || '',
      price: selectedVariant.price_override || product.retail_price,
      quantity,
      image: product.images ? JSON.parse(product.images)[0] : undefined,
    });

    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <Link href="/products" className="text-blue-600 hover:underline">
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const images = product.images ? JSON.parse(product.images) : ['/placeholder.jpg'];
  const availableSizes = [...new Set(product.variants.map((v) => v.size))];
  const availableColors = [...new Set(product.variants.map((v) => v.color))];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              ShopPro
            </Link>
            <nav className="flex items-center gap-6">
              <Link href="/" className="text-gray-600 hover:text-gray-900">Home</Link>
              <Link href="/products" className="text-gray-600 hover:text-gray-900">Products</Link>
              <Link href="/cart" className="text-gray-600 hover:text-gray-900">Cart</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Images */}
          <div>
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
              <img
                src={images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Details */}
          <div>
            <div className="mb-4">
              <span className="text-sm text-gray-500">
                {product.brand_name} • {product.category_name}
              </span>
            </div>
            
            <h1 className="text-3xl font-bold mb-4">{product.name}</h1>

            {product.rating.count > 0 && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <span key={i}>
                      {i < Math.floor(product.rating.average) ? '★' : '☆'}
                    </span>
                  ))}
                </div>
                <span className="text-gray-600">
                  ({product.rating.count} reviews)
                </span>
              </div>
            )}

            <div className="text-3xl font-bold text-blue-600 mb-6">
              {formatCurrency(selectedVariant?.price_override || product.retail_price)}
            </div>

            {/* Size Selection */}
            {availableSizes.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Size</h3>
                <div className="flex flex-wrap gap-2">
                  {availableSizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 border rounded-lg ${
                        selectedSize === size
                          ? 'border-blue-600 bg-blue-50 text-blue-600'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selection */}
            {availableColors.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Color</h3>
                <div className="flex flex-wrap gap-2">
                  {availableColors.map((color) => {
                    const variant = product.variants.find((v) => v.color === color);
                    return (
                      <button
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`px-4 py-2 border rounded-lg flex items-center gap-2 ${
                          selectedColor === color
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        {variant?.color_hex && (
                          <span
                            className="w-4 h-4 rounded-full border"
                            style={{ backgroundColor: variant.color_hex }}
                          />
                        )}
                        {color}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Stock Status */}
            <div className="mb-6">
              {selectedVariant ? (
                selectedVariant.stock > 0 ? (
                  <span className="text-green-600 font-medium">
                    In Stock ({selectedVariant.stock} available)
                  </span>
                ) : (
                  <span className="text-red-600 font-medium">Out of Stock</span>
                )
              ) : (
                <span className="text-gray-600">Select options to check availability</span>
              )}
            </div>

            {/* Quantity */}
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Quantity</h3>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 border rounded-lg hover:bg-gray-100"
                >
                  -
                </button>
                <span className="text-xl font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 border rounded-lg hover:bg-gray-100"
                >
                  +
                </button>
              </div>
            </div>

            {/* Add to Cart */}
            <div className="flex gap-4">
              <Button
                onClick={handleAddToCart}
                disabled={!selectedVariant || selectedVariant.stock === 0}
                size="lg"
                className="flex-1"
              >
                {addedToCart ? 'Added to Cart!' : 'Add to Cart'}
              </Button>
              <Link href="/cart">
                <Button variant="outline" size="lg">
                  View Cart
                </Button>
              </Link>
            </div>

            {/* Description */}
            {product.description && (
              <div className="mt-8">
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-gray-600 whitespace-pre-line">{product.description}</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
