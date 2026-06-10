'use client';

import { useState, useEffect } from 'react';
import { productsApi } from '../api/client';
import { ProductSearch } from '../components/ProductSearch';
import { Cart } from '../components/Cart';
import { PaymentModal } from '../components/PaymentModal';
import { Receipt } from '../components/Receipt';
import { VariantSelector } from '../components/VariantSelector';

interface Product {
  id: number;
  name: string;
  slug: string;
  retail_price: number;
  images: string | null;
  variants: Variant[];
}

interface Variant {
  id: number;
  sku: string;
  size: string;
  color: string;
  color_hex: string;
  stock: number;
}

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

export function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showVariant, setShowVariant] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [lastOrder, setLastOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productsApi.getAll({ status: 'active', limit: 50 });
      if (response.data.success) {
        setProducts(response.data.data);
        setFilteredProducts(response.data.data);
      }
    } catch (error) {
      console.error('Lỗi khi tải sản phẩm:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.slug.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchQuery, products]);

  const handleProductClick = (product: Product) => {
    if (product.variants && product.variants.length > 1) {
      setSelectedProduct(product);
      setShowVariant(true);
    } else if (product.variants && product.variants.length === 1) {
      addToCart(product, product.variants[0]);
    } else if (product.variants?.length === 0) {
      const mockVariant: Variant = {
        id: 0, sku: '', size: '', color: '', color_hex: '', stock: 0,
      };
      addToCart(product, mockVariant);
    }
  };

  const addToCart = (product: Product, variant: Variant) => {
    const existingIndex = cart.findIndex((item) => item.variantId === variant.id);

    if (existingIndex >= 0) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      setCart(newCart);
    } else {
      setCart([
        ...cart,
        {
          variantId: variant.id,
          productId: product.id,
          productName: product.name,
          sku: variant.sku || '',
          size: variant.size || '',
          color: variant.color || '',
          price: product.retail_price,
          quantity: 1,
          image: product.images ? JSON.parse(product.images)[0] : undefined,
        },
      ]);
    }
  };

  const updateQuantity = (variantId: number, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter((item) => item.variantId !== variantId));
    } else {
      setCart(
        cart.map((item) =>
          item.variantId === variantId ? { ...item, quantity } : item
        )
      );
    }
  };

  const removeFromCart = (variantId: number) => {
    setCart(cart.filter((item) => item.variantId !== variantId));
  };

  const clearCart = () => {
    setCart([]);
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handlePaymentComplete = (order: any) => {
    setLastOrder(order);
    setShowPayment(false);
    setShowReceipt(true);
    setCart([]);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Left Panel - Products */}
      <div className="flex-1 p-6 overflow-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">ShopPro POS</h1>
              <p className="text-slate-500 text-sm mt-0.5">Điểm Bán Hàng</p>
            </div>
          </div>
          <ProductSearch
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={() => handleProductClick(product)}
            />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 bg-slate-200 rounded-full flex items-center justify-center">
              <span className="text-3xl">🔍</span>
            </div>
            <p className="text-slate-500 font-medium">Không tìm thấy sản phẩm nào</p>
          </div>
        )}
      </div>

      {/* Right Panel - Cart */}
      <div className="w-96 bg-white border-l border-slate-200 shadow-lg flex flex-col">
        <Cart
          items={cart}
          onUpdateQuantity={updateQuantity}
          onRemove={removeFromCart}
          onClear={clearCart}
          total={getTotal()}
          onCheckout={() => setShowPayment(true)}
        />
      </div>

      {/* Payment Modal */}
      {showPayment && (
        <PaymentModal
          cart={cart}
          total={getTotal()}
          onClose={() => setShowPayment(false)}
          onComplete={handlePaymentComplete}
        />
      )}

      {/* Receipt Modal */}
      {showReceipt && lastOrder && (
        <Receipt
          order={lastOrder}
          onClose={() => setShowReceipt(false)}
        />
      )}

      {/* Variant Selector */}
      {showVariant && selectedProduct && (
        <VariantSelector
          variants={selectedProduct.variants || []}
          onSelect={(variant) => {
            addToCart(selectedProduct, variant);
            setShowVariant(false);
          }}
          onClose={() => setShowVariant(false)}
        />
      )}
    </div>
  );
}

interface ProductCardProps {
  product: Product;
  onSelect: () => void;
}

function ProductCard({ product, onSelect }: ProductCardProps) {
  const images = product.images ? JSON.parse(product.images) : [];
  const firstVariant = product.variants?.[0];
  const totalStock = product.variants?.reduce((sum, v) => sum + v.stock, 0) || 0;

  return (
    <div
      className={`bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${
        totalStock === 0 ? 'opacity-50' : ''
      }`}
      onClick={() => totalStock > 0 && onSelect()}
    >
      <div className="aspect-square bg-slate-100">
        {images[0] ? (
          <img src={images[0]} alt={product.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400 text-sm">
            Không có ảnh
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-sm text-slate-900 line-clamp-2 mb-1 leading-snug">{product.name}</h3>
        <div className="flex justify-between items-center">
          <span className="text-base font-extrabold text-blue-600">
            {new Intl.NumberFormat('vi-VN').format(product.retail_price)}đ
          </span>
          <span className={`text-xs font-semibold ${
            totalStock > 5 ? 'text-green-600' : totalStock > 0 ? 'text-amber-600' : 'text-red-600'
          }`}>
            {totalStock} còn
          </span>
        </div>
      </div>
    </div>
  );
}

export default POSPage;
